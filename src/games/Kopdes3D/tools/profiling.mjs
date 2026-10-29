import assert from 'node:assert/strict';
import process from 'node:process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { connect, gameURL, rootExpression, wait, outputPath, save, errors, warnings } from './cdp.mjs';

// Instrumented diagnostic ONLY; never compare its timings with uninstrumented A/B.
// KOPDES_PROFILE_SCENARIO=idle|movement|guard-combat KOPDES_PROFILE_DURATION=60000
// KOPDES_OUTPUT=<absolute JSON path> node src/games/Kopdes3D/tools/profiling.mjs
export function summarize(intervals) {
  const a = [...intervals].sort((x, y) => x - y), elapsed = intervals.reduce((x, y) => x + y, 0);
  const q = p => a[Math.ceil(a.length * p) - 1] ?? null;
  return { frames: a.length, elapsed, fps: elapsed ? 1000 * a.length / elapsed : null, mean: a.length ? elapsed / a.length : null,
    median: q(.5), p95: q(.95), p99: q(.99), longFrames33_3: a.filter(x => x > 33.3).length, longFrames50: a.filter(x => x > 50).length, longFrames100: a.filter(x => x > 100).length };
}
export function preload() {
  const roots = new Map(), renderers = new Map(); let id = 0;
  window.__KOPDES_DEVTOOLS__ = { roots, renderers, commits: { DOM: 0, R3F: 0, other: 0 } };
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true, renderers, inject(renderer) { renderers.set(++id, renderer); roots.set(id, new Set()); return id; },
    getFiberRoots(renderer) { return roots.get(renderer); }, onCommitFiberUnmount() {}, onPostCommitFiberRoot() {},
    onCommitFiberRoot(renderer, root) {
      const set = roots.get(renderer); if (!set) return;
      if (root.current?.memoizedState?.element == null) set.delete(root); else set.add(root);
      const name = renderers.get(renderer)?.rendererPackageName || '';
      window.__KOPDES_DEVTOOLS__.commits[name.includes('react-dom') ? 'DOM' : /fiber|three/.test(name) ? 'R3F' : 'other']++;
    },
  };
}
export function install(getStore, duration, scenario) {
  const hook = window.__KOPDES_DEVTOOLS__; if (!hook?.renderers.size) throw Error('Devtools preload missed React initialization');
  const s = getStore(); if (!s?.gl) throw Error('Scene store missing');
  // Names verified against installed @dimforge/rapier3d-compat/pipeline/world.d.ts.
  const queries = ['castRay', 'castRayAndGetNormal', 'intersectionsWithRay', 'castShape', 'intersectionWithShape', 'intersectionsWithShape', 'projectPoint', 'projectPointAndGetFeature', 'intersectionsWithPoint', 'collidersWithAabbIntersectingAabb', 'contactPair', 'contactPairsWith', 'intersectionPair', 'intersectionPairsWith'];
  const timings = {}, undo = [], worlds = new WeakSet(), controllers = new WeakSet(), refs = new WeakMap(), intervals = [], seconds = [], longTasks = [], invalid = [], skillStates = [];
  let sim, active = false, start, last, raf, timer, observer, completed = false, previousCommits = { ...hook.commits }, previousSecond = 0;
  const now = () => performance.now();
  const workload = { accepted: false, rejectionReasons: [], damage: { player: 0, guard: 0 }, advancedTicks: 0 };
  let previousActors, previousTick, lastTickAt;
  function reject(reason) { if (!workload.rejectionReasons.includes(reason)) workload.rejectionReasons.push(reason); }
  function checkWorkload(t) {
    if (!sim) { reject('Simulation missing'); return; }
    if (document.pointerLockElement !== s.gl.domElement) reject('Controls paused or pointer lock lost');
    if (sim.player.hp <= 0 || sim.player.state === 'DEAD') reject('Player died');
    if (scenario !== 'guard-combat' && sim.player.hp !== 100) reject('Safe workload requires player HP 100');
    const p = sim.player.position;
    if (scenario === 'movement' && !(Math.abs(p.x) <= 1 && p.z >= -2 && p.z <= 3)) reject('Movement left safe corridor: |x| <= 1, -2 <= z <= 3');
    if (previousActors) for (const key of ['player', 'guard']) workload.damage[key] += Math.max(0, previousActors[key] - sim[key].hp);
    previousActors = { player: sim.player.hp, guard: sim.guard.hp };
    if (previousTick === undefined || sim.tick !== previousTick) {
      if (previousTick !== undefined) workload.advancedTicks += Math.max(0, sim.tick - previousTick);
      previousTick = sim.tick; lastTickAt = t;
    } else if (t - lastTickAt >= 1000) reject('Simulation tick stalled for >= 1000 ms');
  }
  function wrap(object, key, label, metadata = {}) {
    const original = object[key]; if (typeof original !== 'function') throw Error(`Missing method ${key}`);
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    const stat = timings[label] ||= { count: 0, cpuMs: 0, maxCpuMs: 0, ...metadata };
    function wrapped(...args) {
      if (!active) return original.apply(this, args);
      const t = now(); try { return original.apply(this, args); } finally { const ms = now() - t; stat.count++; stat.cpuMs += ms; stat.maxCpuMs = Math.max(stat.maxCpuMs, ms); }
    }
    object[key] = wrapped;
    undo.push(() => { if (object[key] === wrapped) { if (descriptor) Object.defineProperty(object, key, descriptor); else { object[key] = original; if (Object.hasOwn(object, key)) delete object[key]; } } });
    return wrapped;
  }
  function discover() {
    sim = undefined; const seen = new Set(), stack = [...hook.roots.values()].flatMap(set => [...set].map(root => root.current));
    while (stack.length) {
      const f = stack.pop(); if (!f || seen.has(f)) continue; seen.add(f); stack.push(f.child, f.sibling);
      const values = [f.memoizedProps?.value];
      for (let d = f.dependencies?.firstContext; d; d = d.next) values.push(d.memoizedValue);
      for (let h = f.memoizedState; h; h = h.next) {
        const v = h.memoizedState?.current; if (v?.player && v?.guard && Number.isFinite(v.tick)) sim = v;
        if (Array.isArray(v)) for (const controller of v) if (controller && typeof controller.computeColliderMovement === 'function' && !controllers.has(controller)) {
          wrap(controller, 'computeColliderMovement', 'rapier.controller.computeColliderMovement'); controllers.add(controller);
        }
      }
      for (const v of values) {
        // Rapier's lazy world proxy recreates a freed World on get/set, even during undo.
        // Wrap the module's concrete prototype instead; retry worlds inherit these methods too.
        const prototype = v?.rapier?.World?.prototype;
        if (prototype && !worlds.has(prototype)) {
          wrap(prototype, 'step', 'rapier.step', { measurement: 'synchronous CPU wall time, including WASM; excludes callbacks outside world.step' });
          for (const key of queries) if (typeof prototype[key] === 'function') wrap(prototype, key, `rapier.query.${key}`);
          worlds.add(prototype);
        }
      }
    }
  }
  function subscribers() {
    s.internal.subscribers.forEach((entry, index) => {
      const ref = entry.ref; if (refs.get(ref) === ref.current) return;
      const source = Function.prototype.toString.call(ref.current);
      const name = index === 0 && entry.priority === -50 ? 'rapier-paused-frame-stepper' : index === 1 && entry.priority === -50 ? 'simulation-fixed-clock' : index === 2 || index === 3 ? `actor-${index - 2}` : index === 4 ? 'skill-effects' : index === 5 ? 'camera' : `dynamic-${index}`;
      refs.set(ref, wrap(ref, 'current', `subscriber.${index}.${name}`, { index, priority: entry.priority, name, source, inclusive: true }));
    });
  }
  function resources(t) {
    discover(); const commits = Object.fromEntries(Object.keys(hook.commits).map(k => [k, hook.commits[k] - previousCommits[k]]));
    const span = t - previousSecond; previousSecond = t; previousCommits = { ...hook.commits };
    seconds.push({ elapsedMs: t - start, spanMs: span, commits, commitsPerSecond: Object.fromEntries(Object.entries(commits).map(([k, v]) => [k, span > 0 ? v * 1000 / span : null])),
      heap: performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize, limit: performance.memory.jsHeapSizeLimit } : null,
      render: { ...s.gl.info.render }, memory: { ...s.gl.info.memory }, subscribers: s.internal.subscribers.length, resourceEntries: performance.getEntriesByType('resource').length });
    if (sim) skillStates.push({ elapsedMs: t - start, tick: sim.tick, ...Object.fromEntries(['player', 'guard'].map(k => { const a = sim[k]; return [k, { state: a.state, hp: a.hp, stance: a.stance, cast: a.cast ? { kind: a.cast.kind, age: a.cast.age, phase: a.cast.age < a.cast.spec.windup ? 'windup' : a.cast.age < a.cast.spec.windup + a.cast.spec.active ? 'active' : 'recovery', targetId: a.cast.targetId } : null, attacking: !!a.attack, position: { ...a.position } }]; })) });
  }
  function cleanup(onError = () => {}) {
    active = false;
    const restoreAll = [() => cancelAnimationFrame(raf), () => clearInterval(timer), () => observer?.disconnect(), ...undo.splice(0).reverse()];
    for (const restore of restoreAll) { try { restore(); } catch (error) { onError(error); } }
  }
  try {
    assertScene(); discover(); subscribers(); wrap(s.gl, 'render', 'gl.render', { measurement: 'CPU submission wall time; NOT GPU completion time' });
    if (!timings['rapier.step']) throw Error('Rapier context world not found');
  } catch (error) { cleanup(); throw error; }
  function assertScene() { if (s.internal.subscribers.length !== 6) throw Error(`Expected six initial subscribers, got ${s.internal.subscribers.length}`); }
  let finish;
  const result = new Promise(resolve => { finish = resolve; });
  function stop(reason = null) {
    if (completed) return; completed = true;
    const end = now(); if (observer) for (const e of observer.takeRecords()) if (e.startTime >= start && e.startTime <= end) longTasks.push({ start: e.startTime - start, duration: e.duration });
    resources(end); checkWorkload(end); cleanup();
    if (!workload.advancedTicks) reject('Simulation ticks did not advance');
    if (scenario === 'guard-combat' && workload.damage.player + workload.damage.guard < 20) reject('Too little combat: measured damage < 20 HP');
    workload.accepted = workload.rejectionReasons.length === 0;
    finish({ reason, start, wallElapsedMs: end - start, intervals, seconds, skillStates, skillStatesIdentified: skillStates.length > 0, timings, longTasks,
      longTasksSupported: PerformanceObserver.supportedEntryTypes.includes('longtask'), invalid, workload, gpuTime: 'NOT_AVAILABLE: no GPU timer queries measured',
      renderers: [...hook.renderers].map(([id, r]) => ({ id, package: r.rendererPackageName, version: r.version })) });
  }
  window.__KOPDES_PROFILE__ = { result, stop, refresh: discover };
  raf = requestAnimationFrame(t => {
    start = last = t; previousSecond = t; previousCommits = { ...hook.commits }; active = true;
    if (PerformanceObserver.supportedEntryTypes.includes('longtask')) { observer = new PerformanceObserver(list => { for (const e of list.getEntries()) if (e.startTime >= start) longTasks.push({ start: e.startTime - start, duration: e.duration }); }); observer.observe({ type: 'longtask', buffered: false }); }
    function frame(t) {
      intervals.push(t - last); last = t;
      if (document.visibilityState !== 'visible' || !document.hasFocus() || s.gl.getContext().isContextLost()) invalid.push(t - start);
      checkWorkload(t); subscribers(); if (t - start >= duration) stop(); else raf = requestAnimationFrame(frame);
    }
    resources(t); checkWorkload(t); timer = setInterval(() => resources(now()), 1000); raf = requestAnimationFrame(frame);
  });
  return { started: true, initialSubscribers: s.internal.subscribers.length };
}
async function main() {
  const scenario = process.env.KOPDES_PROFILE_SCENARIO || 'idle', duration = Number(process.env.KOPDES_PROFILE_DURATION || 60000);
  assert(['idle', 'movement', 'guard-combat'].includes(scenario), 'Unknown profile scenario');
  assert(Number.isFinite(duration) && duration >= 1000 && duration <= 90000, 'Duration must be 1000..90000 ms (CDP timeout ceiling)');
  const output = outputPath('profiling'), report = { kind: 'instrumented-profiling', scenario, duration, url: gameURL, node: process.version, passed: false,
    method: 'Separate diagnostic run; 5s warmup before wrapping; inclusive CPU wall timings overlap; instrumentation adds overhead; no GPU time or host CPU utilization measured', phases: [] };
  let c, preloadId;
  try {
    c = await connect(); report.browser = await c.call('Browser.getVersion'); report.target = c.tab;
    ({ identifier: preloadId } = await c.call('Page.addScriptToEvaluateOnNewDocument', { source: `(${preload.toString()})()` }));
    await c.call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    await c.fresh(); await c.activate(); await wait(5000);
    if (scenario === 'guard-combat') await c.move('z', 8);
    report.before = await c.state(); assert(report.before.locked && report.before.focus && report.before.visibility === 'visible' && !report.before.lost, 'Focused active scene required');
    report.installation = await c.evaluate(`(${install.toString()})(()=>${rootExpression},${duration},${JSON.stringify(scenario)})`);
    const sampling = c.evaluate('window.__KOPDES_PROFILE__.result'); sampling.catch(() => {});
    let done = false; const watched = sampling.finally(() => { done = true; }); watched.catch(() => {});
    const started = Date.now();
    const pause = async ms => wait(Math.max(0, Math.min(ms, duration - (Date.now() - started))));
    if (scenario === 'idle') await watched;
    while (!done && Date.now() - started < duration && scenario !== 'idle') {
      if (scenario === 'movement') {
        // Position feedback prevents timed W/S drift under host lag; input cost remains measured.
        await c.move('z', 2);
        if (!done && Date.now() - started < duration) await c.move('z', -1);
      } else {
        report.phases.push({ elapsedMs: Date.now() - started, phase: 'combat' });
        for (let i = 0; i < 8 && !done && Date.now() - started < duration; i++) { await c.tap('KeyJ'); await pause(350); }
        if (!done && Date.now() - started < duration - 4000) {
          report.phases.push({ elapsedMs: Date.now() - started, phase: 'UI-reset-and-approach' });
          await c.release(); await c.clickText('Ulangi misi'); await wait(600); await c.ready(); await c.activate(); await c.move('z', 8);
          await c.evaluate('window.__KOPDES_PROFILE__.refresh()');
        }
      }
    }
    report.sample = await watched; report.stats = summarize(report.sample.intervals); report.after = await c.state();
    report.workload = report.sample.workload;
    report.passed = !report.sample.reason && report.sample.invalid.length === 0 && report.stats.frames > 0 && report.stats.elapsed >= duration && report.sample.timings['rapier.step'].count > 0 && report.workload.accepted;
    assert(report.before.locked && report.after.locked, 'Before/after pointer lock required');
    assert(report.workload.advancedTicks > 0, 'Simulation ticks must advance');
    if (scenario !== 'guard-combat') assert.equal(report.sample.skillStates.at(-1)?.player.hp, 100, 'Safe workload must end with player HP 100');
    else assert(report.workload.damage.player + report.workload.damage.guard >= 20, 'Too little combat: measured damage < 20 HP');
    assert(report.workload.accepted, `Workload rejected: ${report.workload.rejectionReasons.join('; ')}`);
  } catch (error) { report.passed = false; report.failure = { message: error.message, stack: error.stack }; process.exitCode = 1; }
  finally {
    if (c) {
      // Navigation destroys timed-out page promises/observers too; socket close alone cannot.
      try {
        for (const key of ['KeyW', 'KeyS']) await c.up(key).catch(() => {});
        await c.evaluate('window.__KOPDES_PROFILE__?.stop("cleanup")').catch(() => {}); await c.release().catch(() => {});
        await c.call('Page.navigate', { url: `${new URL(gameURL).origin}/games` });
        await c.until(() => c.evaluate('location.pathname === "/games" && document.readyState === "complete" && !document.querySelector("canvas")'), Boolean, 'profile document teardown');
        await c.evaluate('delete window.__KOPDES_PROFILE__; delete window.__KOPDES_DEVTOOLS__; delete window.__REACT_DEVTOOLS_GLOBAL_HOOK__; true');
        report.documentTeardown = true;
      } catch (error) { report.cleanupError = error.message; report.passed = false; }
      if (preloadId) await c.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: preloadId }).catch(error => { report.cleanupError = error.message; report.passed = false; });
      await c.close(); report.events = c.events; report.errors = errors(c.events); report.warnings = warnings(c.events);
      if (report.errors.length) report.passed = false;
    }
    if (!report.passed) process.exitCode = 1;
    await save(output, report); console.log(JSON.stringify({ passed: report.passed, output, failure: report.failure?.message, cleanupError: report.cleanupError }));
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
