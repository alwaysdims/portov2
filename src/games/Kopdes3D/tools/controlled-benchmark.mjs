import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { SKILLS } from '../combatConfig.js';

// Dedicated, already-running Chrome + production previews only; no builds or host probes.
// KOPDES_A_SHA=<commit> KOPDES_B_SHA=<commit> KOPDES_OUTPUT=<summary.json> node <this file>
// Defaults: A=:4175, B=:4176; 3 complete seven-scenario ABBA blocks; 5s warmup + 60s/run.
// KOPDES_BLOCKS=1 reduces to one complete ABBA block (28 runs). Invalid runs remain in report.
// KOPDES_SCENARIOS=movement,guard-combat selects validated scenario names; default remains all seven.
// --self-test exercises scheduling/statistics, never connects to Chrome.
const self = fileURLToPath(import.meta.url);
const scenarios = ['idle', 'movement', 'guard-combat', 'prison', 'ultimate', 'shopping', 'retry'];
const duration = 60000;
const warmup = 5000;
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
export function stats(values) {
  if (!values.length) return { n: 0, min: null, max: null, median: null, mean: null };
  assert(values.every(Number.isFinite), 'Non-finite statistical input');
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return { n: sorted.length, min: sorted[0], max: sorted.at(-1), median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2, mean: mean(values) };
}
function selectedScenarios(value) {
  if (value === undefined) return scenarios;
  const selected = value.split(',');
  assert(selected.length && selected.every(name => scenarios.includes(name)) && new Set(selected).size === selected.length, 'KOPDES_SCENARIOS must be comma-separated unique supported scenario names');
  return selected;
}
export function schedule(blocks, selected = scenarios) {
  assert(Number.isSafeInteger(blocks) && blocks >= 1, 'KOPDES_BLOCKS must be an integer >=1');
  assert(selected.length && selected.every(name => scenarios.includes(name)) && new Set(selected).size === selected.length, 'Invalid scenarios');
  return Array.from({ length: blocks }, (_, block) => selected.flatMap(scenario => ['A', 'B', 'B', 'A'].map((variant, slot) => ({ block: block + 1, scenario, variant, slot: slot + 1 })))).flat();
}

export function comparison(blocks) {
  // One independent observation per complete ABBA block, NOT per frame or adjacent pair.
  const logs = blocks.map(block => {
    assert(block.length === 4 && block.every(value => Number.isFinite(value) && value > 0), 'Four positive ABBA FPS values required');
    return (Math.log(block[1] / block[0]) + Math.log(block[2] / block[3])) / 2;
  });
  const estimate = logs.length ? mean(logs) : null;
  let ci95 = null;
  if (logs.length >= 2) {
    const df = logs.length - 1;
    const t = [null, 12.706205, 4.302653, 3.182446, 2.776446, 2.570582, 2.446912, 2.364624, 2.306005, 2.262157, 2.228139, 2.200985, 2.178813, 2.160369, 2.144787, 2.131450, 2.119905, 2.109816, 2.100922, 2.093024, 2.085964, 2.079614, 2.073873, 2.068658, 2.063899, 2.059539, 2.055529, 2.051831, 2.048407, 2.045230, 2.042273][Math.min(df, 30)];
    const variance = logs.reduce((sum, value) => sum + (value - estimate) ** 2, 0) / df;
    const margin = t * Math.sqrt(variance / logs.length);
    ci95 = [estimate - margin, estimate + margin].map(value => 100 * Math.expm1(value));
  }
  return { nBlocks: logs.length, blockLogRatios: logs, percentBvsA: estimate === null ? null : 100 * Math.expm1(estimate), ci95Percent: ci95,
    method: 'Mean of two paired log(B/A) FPS ratios per ABBA block; Student-t 95% interval across blocks (df>30 uses conservative df30).',
    caveat: logs.length < 2 ? 'NOT ESTIMABLE: fewer than two independent complete blocks.' : 'Small N; assumes independent approximately normal block log-ratios. Sequential host drift/autocorrelation may invalidate CI. Not frame-level replication.' };
}
function localURL(value) {
  const url = new URL(value);
  assert(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.username && !url.password, 'Local HTTP URL required');
  return url;
}
const failure = error => ({ message: error.message, stack: error.stack });
async function write(path, value) { await writeFile(path, `${JSON.stringify(value, null, 2)}\n`); }

async function navigate(url) {
  // cdp.connect() matches its module-fixed origin. Navigate single dedicated tab FIRST.
  const endpoint = localURL(process.env.KOPDES_CDP || 'http://127.0.0.1:9231');
  const response = await fetch(new URL('/json/list', endpoint), { signal: AbortSignal.timeout(5000) });
  assert(response.ok, `CDP discovery HTTP ${response.status}`);
  const pages = (await response.json()).filter(page => page.type === 'page');
  assert.equal(pages.length, 1, 'Exactly one dedicated Chrome page required');
  const wsURL = new URL(pages[0].webSocketDebuggerUrl);
  assert(wsURL.protocol === 'ws:' && ['localhost', '127.0.0.1', '[::1]'].includes(wsURL.hostname) && !wsURL.username && !wsURL.password, 'Local websocket required');
  const ws = new WebSocket(wsURL);
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Navigation websocket timeout')), 5000);
      ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      ws.addEventListener('error', () => { clearTimeout(timer); reject(Error('Navigation websocket failed')); }, { once: true });
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(Error('Page.navigate timeout')), 10000);
      ws.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id !== 1) return;
        clearTimeout(timer);
        if (message.error || message.result.errorText) reject(Error(JSON.stringify(message))); else resolve();
      });
      ws.send(JSON.stringify({ id: 1, method: 'Page.navigate', params: { url } }));
    });
    const end = Date.now() + 20000;
    while (Date.now() < end) {
      const result = await fetch(new URL('/json/list', endpoint), { signal: AbortSignal.timeout(5000) });
      assert(result.ok, `CDP discovery HTTP ${result.status}`);
      if ((await result.json()).some(page => page.id === pages[0].id && page.url === url)) return;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw Error('Target URL did not settle before child launch');
  } finally { ws.close(); }
}

async function parent() {
  const blocks = Number(process.env.KOPDES_BLOCKS ?? 3);
  const selected = selectedScenarios(process.env.KOPDES_SCENARIOS);
  const plan = schedule(blocks, selected);
  const variants = Object.fromEntries(['A', 'B'].map(label => {
    const sha = process.env[`KOPDES_${label}_SHA`] || process.env[`${label}_SHA`];
    assert(sha && /^[a-f\d]{7,40}$/i.test(sha), `Explicit KOPDES_${label}_SHA (or ${label}_SHA) required; 7-40 hex characters`);
    const url = localURL(process.env[`KOPDES_${label}_URL`] || `http://127.0.0.1:${label === 'A' ? 4175 : 4176}/games/kopdes-3d`).href;
    return [label, { sha, url, provenance: 'Caller-supplied commit identity; harness cannot attest served bundle SHA.' }];
  }));
  assert.notEqual(variants.A.url, variants.B.url, 'A and B must be distinct URLs');
  assert(process.env.KOPDES_OUTPUT || process.env.TMPDIR, 'Set KOPDES_OUTPUT or TMPDIR');
  const output = resolve(process.env.KOPDES_OUTPUT || join(process.env.TMPDIR, `kopdes-controlled-${Date.now()}.json`));
  const artifacts = `${output}.runs`;
  await mkdir(dirname(output), { recursive: true });
  // Exclusive directory prevents accidental overwrite/resume with mismatched metadata.
  await mkdir(artifacts);
  const report = { kind: 'controlled-production-ABBA', started: new Date().toISOString(), node: process.version, variants, blocks, scenarios: selected, duration, warmup, viewport: [1280, 800], dpr: 1,
    method: 'Scenario-major ABBA within each block; complete selected scenarios before next block. Fresh document every run. UI-only workloads; skill/combat samples include resets/approaches, not isolated skill costs.',
    focus: 'CDP focus emulation enabled; real foreground/occlusion NOT VERIFIED', host: 'CPU/memory recorded separately by caller; do not run builds/tests/other tabs concurrently.', plannedRuns: plan.length, plan, runs: [], summaries: {}, passed: false };
  await write(output, report);
  for (const [index, run] of plan.entries()) {
    const stem = `${String(index + 1).padStart(3, '0')}-block${run.block}-${run.scenario}-${run.slot}${run.variant}`;
    const entry = { ...run, ...variants[run.variant], started: new Date().toISOString(), artifact: join(artifacts, `${stem}.json`), stdout: join(artifacts, `${stem}.stdout.log`), stderr: join(artifacts, `${stem}.stderr.log`), valid: false };
    report.runs.push(entry);
    await write(output, report);
    try {
      await navigate(entry.url);
      const child = await new Promise(resolve => {
        const stdout = [], stderr = [];
        const child = spawn(process.execPath, [self, '--run'], { env: { ...process.env, KOPDES_URL: entry.url, KOPDES_OUTPUT: entry.artifact, KOPDES_SCENARIO: run.scenario, KOPDES_RUN_SHA: entry.sha, KOPDES_RUN_VARIANT: run.variant, KOPDES_RUN_BLOCK: String(run.block), KOPDES_RUN_SLOT: String(run.slot) }, stdio: ['ignore', 'pipe', 'pipe'] });
        child.stdout.on('data', data => stdout.push(data));
        child.stderr.on('data', data => stderr.push(data));
        let spawnError;
        child.on('error', error => { spawnError = failure(error); });
        child.on('close', (code, signal) => resolve({ code, signal, spawnError, stdout: Buffer.concat(stdout).toString(), stderr: Buffer.concat(stderr).toString() }));
      });
      await writeFile(entry.stdout, child.stdout);
      await writeFile(entry.stderr, child.stderr);
      entry.exitCode = child.code; entry.signal = child.signal; entry.spawnError = child.spawnError;
      const raw = JSON.parse(await readFile(entry.artifact, 'utf8'));
      entry.valid = child.code === 0 && raw.passed === true && Number.isFinite(raw.sample?.fps) && raw.sample.fps > 0;
      entry.fps = raw.sample?.fps ?? null;
      entry.p95 = raw.sample?.p95 ?? null;
      entry.failure = raw.failure;
      if (!entry.valid && !entry.failure) entry.failure = { message: 'Invalid child report or unsuccessful exit; inspect raw artifact/stdout/stderr' };
    } catch (error) {
      entry.failure = failure(error);
      // Navigation/spawn failure still has a persistent per-run artifact.
      await writeFile(entry.artifact, `${JSON.stringify({ ...entry, passed: false, kind: 'controlled-run-launch-failure' }, null, 2)}\n`, { flag: 'wx' }).catch(error => { if (error.code !== 'EEXIST') throw error; });
      await writeFile(entry.stdout, '', { flag: 'a' }); await writeFile(entry.stderr, `${error.stack}\n`, { flag: 'a' });
    }
    entry.finished = new Date().toISOString();
    for (const scenario of selected) {
      const runs = report.runs.filter(run => run.scenario === scenario);
      const valid = runs.filter(run => run.valid);
      const complete = Array.from({ length: blocks }, (_, i) => runs.filter(run => run.block === i + 1)).filter(group => group.length === 4 && group.every(run => run.valid));
      const excluded = runs.filter(run => !run.valid).map(run => ({ block: run.block, slot: run.slot, variant: run.variant, artifact: run.artifact, failure: run.failure }));
      report.summaries[scenario] = { status: excluded.length ? 'INVALID: failures retained; partial statistics descriptive only' : runs.length === blocks * 4 ? 'COMPLETE' : 'INCOMPLETE', attempted: runs.length, valid: valid.length, invalid: excluded,
        A: stats(valid.filter(run => run.variant === 'A').map(run => run.fps)), B: stats(valid.filter(run => run.variant === 'B').map(run => run.fps)), comparison: comparison(complete.map(group => group.map(run => run.fps))) };
    }
    await write(output, report);
    console.log(JSON.stringify({ run: index + 1, total: plan.length, ...run, valid: entry.valid, fps: entry.fps, output }));
  }
  report.finished = new Date().toISOString();
  report.passed = report.runs.length === plan.length && report.runs.every(run => run.valid);
  await write(output, report);
  if (!report.passed) process.exitCode = 1;
  console.log(JSON.stringify({ passed: report.passed, output, artifacts }));
}

function readCombatSnapshot() {
  const element = document.querySelector('.kopdes-skills') || document.querySelector('.kopdes-hud');
  if (!element) return null; // UI retry temporarily clears published combat/HUD.
  let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber'))], root = fiber;
  while (root?.return) root = root.return;
  if (root?.stateNode?.current && root.stateNode.current !== root) fiber = fiber?.alternate;
  for (; fiber; fiber = fiber.return) {
    if (fiber.memoizedProps?.combat?.skills) return fiber.memoizedProps.combat;
    // Shopping hides SkillHUD; Kopdes3D still owns the same published combat state.
    for (let hook = fiber.memoizedState; hook; hook = hook.next) {
      if (hook.memoizedState?.skills && Number.isFinite(hook.memoizedState.tick)) return hook.memoizedState;
    }
  }
  throw Error('Published combat snapshot missing');
}

// Published snapshots are refreshed at most every six simulation ticks, plus events.
// Read current committed HUD each rAF; never retain a simulation ref across remounts.
function sampler(root, duration, readSnapshot, skillSpecs, control) {
  return new Promise((resolve, reject) => {
    const intervals = [], frames = [], phases = [], longTasks = [], invalid = [], renderWall = [];
    const originals = [], hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    const commits = { status: typeof hook?.onCommitFiberRoot === 'function' ? 'OBSERVED' : 'NOTTESTED', events: [] };
    let start, last, observer, raf, watchdog, previousTick, epoch = 0, stopped = false;
    function wrap(object, name, callback) {
      const original = object[name], own = Object.getOwnPropertyDescriptor(object, name);
      const wrapped = function (...args) { return callback.call(this, original, args); };
      object[name] = wrapped;
      originals.push(() => { if (object[name] === wrapped) { if (own) Object.defineProperty(object, name, own); else delete object[name]; } });
    }
    function cleanup() {
      stopped = true; cancelAnimationFrame(raf); clearTimeout(watchdog); observer?.disconnect();
      for (const restore of originals.reverse()) restore();
    }
    function finish(error) {
      if (stopped) return;
      if (observer) for (const item of observer.takeRecords()) if (item.startTime >= start) longTasks.push({ start: item.startTime, duration: item.duration });
      cleanup();
      const sorted = [...intervals].sort((a, b) => a - b), sum = intervals.reduce((a, b) => a + b, 0);
      const quantile = p => sorted[Math.max(0, Math.ceil(sorted.length * p) - 1)] ?? null;
      resolve({ failure: error?.message, frames: intervals.length, elapsed: sum, fps: intervals.length ? 1000 * intervals.length / sum : null,
        mean: intervals.length ? sum / intervals.length : null, median: quantile(.5), p95: quantile(.95), p99: quantile(.99),
        longFrames33_3: intervals.filter(value => value > 33.3).length, longFrames50: intervals.filter(value => value > 50).length, longFrames100: intervals.filter(value => value > 100).length,
        intervals, frameSamples: frames, phaseSamples: phases, longTasks, longTasksSupported: !!observer, invalid, commits,
        renderWall, renderWallMeaning: 'Synchronous JS gl.render wall duration, includes instrumentation overhead; NOT GPU completion time.',
        instrumentationRestored: true, dpr: devicePixelRatio, viewport: [innerWidth, innerHeight], canvas: [root.gl.domElement.width, root.gl.domElement.height] });
    }
    try {
      wrap(root.gl, 'render', function (original, args) {
        const t = performance.now();
        try { return original.apply(this, args); } finally { if (start !== undefined && !stopped) renderWall.push({ t, ms: performance.now() - t }); }
      });
      if (commits.status === 'OBSERVED') wrap(hook, 'onCommitFiberRoot', function (original, args) {
        if (start !== undefined && !stopped) commits.events.push({ t: performance.now(), renderer: args[0] });
        return original.apply(this, args);
      });
      if (globalThis.PerformanceObserver?.supportedEntryTypes.includes('longtask')) {
        observer = new PerformanceObserver(list => { for (const item of list.getEntries()) if (item.startTime >= start) longTasks.push({ start: item.startTime, duration: item.duration }); });
        observer.observe({ type: 'longtask', buffered: false });
      }
      const frame = t => {
        try {
          if (start === undefined) { start = t; control.started = t; }
          if (last !== undefined) intervals.push(t - last);
          last = t;
          if (document.visibilityState !== 'visible' || !document.hasFocus() || root.gl.getContext().isContextLost() || !(Math.abs(devicePixelRatio - 1) <= 1e-6) || innerWidth !== 1280 || innerHeight !== 800) invalid.push({ t, visibility: document.visibilityState, focus: document.hasFocus(), dpr: devicePixelRatio });
          frames.push({ t, calls: root.gl.info.render.calls, triangles: root.gl.info.render.triangles, ...root.gl.info.memory, heap: performance.memory?.usedJSHeapSize });
          const sim = readSnapshot();
          if (!sim) {
            frames.at(-1).combatSnapshotMissing = true;
            phases.push({ t, workloadPhase: control.label, mixed: true, combatSnapshotMissing: true });
            if (t - start >= duration) finish(); else raf = requestAnimationFrame(frame);
            return;
          }
          if (!Number.isFinite(sim.tick)) throw Error('Published combat tick invalid');
          if (previousTick !== undefined && sim.tick < previousTick) epoch++;
          previousTick = sim.tick;
          const cast = sim.cast, spec = cast && skillSpecs[cast.kind];
          if (cast && !spec) throw Error('Published cast kind unsupported');
          const phase = !cast ? null : cast.age < spec.windup ? 'windup' : cast.age < spec.windup + spec.active ? 'active' : 'recovery';
          const workloadPhase = cast ? `skill-${phase}` : ['reset', 'travel', 'movement', 'combat'].includes(control.label) ? control.label : Object.values(sim.skills).some(skill => skill.cooldown > 0) ? 'cooldown' : 'idle';
          phases.push({ t, epoch, workloadPhase, inputPhase: control.label, mixed: true, skills: sim.skills, tick: sim.tick, publishedTick: sim.tick, playerHP: sim.playerHP, guardHP: sim.enemyHP, playerState: sim.playerState, guardState: sim.enemyState,
            cast: cast ? { ...cast, phase, windup: spec.windup, active: spec.active, recovery: spec.recovery } : null,
            feedback: sim.skillFeedback, stunUntil: sim.tick + sim.enemyStunRemaining,
            hits: sim.events.filter(event => event.type === 'hit').map(event => ({ id: event.id, tick: event.tick, targetId: event.targetId })),
            impact: sim.events.filter(event => event.type === 'skill-impact').map(event => ({ id: event.id, tick: event.tick })) });
          if (t - start >= duration) finish(); else raf = requestAnimationFrame(frame);
        } catch (error) { finish(error); }
      };
      watchdog = setTimeout(() => finish(Error('Sampler wall-clock watchdog expired')), duration + 20000);
      raf = requestAnimationFrame(frame);
    } catch (error) { cleanup(); reject(error); }
  });
}

async function run() {
  const { connect, gameURL, rootExpression, wait, errors, warnings } = await import('./cdp.mjs');
  const scenario = process.env.KOPDES_SCENARIO;
  assert(scenarios.includes(scenario), 'Exactly one supported scenario per child');
  const output = process.env.KOPDES_OUTPUT;
  const report = { kind: 'controlled-individual-run', scenario, url: gameURL, sha: process.env.KOPDES_RUN_SHA, variant: process.env.KOPDES_RUN_VARIANT, block: process.env.KOPDES_RUN_BLOCK, slot: process.env.KOPDES_RUN_SLOT, duration, warmup, started: new Date().toISOString(), node: process.version, passed: false,
    workload: ['guard-combat', 'prison', 'ultimate', 'retry'].includes(scenario) ? 'MIXED: fixed start slots; contiguous sample includes UI reset, travel, combat/skill, cooldown and idle; cast phases describe published snapshot, not isolated skill cost' : scenario,
    plannedCycles: ['guard-combat', 'prison', 'ultimate'].includes(scenario) ? 4 : scenario === 'retry' ? 20 : null,
    startSlots: ['guard-combat', 'prison', 'ultimate'].includes(scenario) ? [0, 15000, 30000, 45000] : scenario === 'retry' ? Array.from({ length: 20 }, (_, i) => i * 3000) : null,
    focus: 'CDP emulated; real foreground/occlusion NOT VERIFIED', cycles: 0, actions: [] };
  let c, sampling;
  try {
    c = await connect();
    const { call, evaluate, state, tap, down, up, move, release, activate, clickText } = c;
    const harnessKey = `__kopdesControlledHarness_${report.variant}_${report.block}_${report.slot}`;
    const control = `globalThis[${JSON.stringify(harnessKey)}]`;
    const label = async value => { await evaluate(`${control}.label=${JSON.stringify(value)}`); };

    report.browser = await call('Browser.getVersion'); report.target = c.tab;
    const { windowId } = await call('Browser.getWindowForTarget');
    await call('Browser.setWindowBounds', { windowId, bounds: { width: 1280, height: 900, windowState: 'normal' } });
    await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
    async function reset() {
      await label('reset');
      await release(); await clickText('Ulangi misi'); await wait(600);
      const s = await c.ready();
      assert.equal(s.actors[0].z, -1, 'Retry spawn');
      assert(s.text.includes('Gerbang: LOCKED') && s.text.includes('Keranjang kosong.'), 'Retry state');
      await activate(); await wait(200);
    }
    async function approach() { await label('travel'); await down('ShiftLeft'); try { if ((await state()).actors[0].z < 7.68) await move('z', 7.8); } finally { await up('ShiftLeft'); } }
    await c.fresh();
    await evaluate(`${control}={label:'idle',started:null}`);
    await activate(); await wait(350);
    if (scenario === 'shopping') {
      await tap('KeyQ'); await approach();
      for (let i = 0; i < 20 && !(await state()).text.includes('Penjaga tersisa: 0'); i++) { await tap('KeyJ'); await wait(450); }
      assert((await state()).text.includes('Penjaga tersisa: 0'), 'Shopping guard cleared');
      await move('z', 30); await move('x', -2.7); await move('z', 32);
    }
    // Warmup precedes ALL timing; mixed setup below intentionally excluded and labelled.
    await wait(warmup);
    if (['guard-combat', 'prison', 'ultimate'].includes(scenario)) { await reset(); await approach(); }
    report.before = await state();
    assert(report.before.locked && report.before.visibility === 'visible' && report.before.focus && !report.before.lost && report.before.webgl, 'Healthy active visible WebGL scene required');
    report.simulationObservation = 'Current committed HUD combat snapshot read each rAF; publication every six ticks or event; epochs on tick regression. Same DOM traversal/allocation overhead for A/B. Cast hitTargets unavailable; ultimate hits use published guard damage events within cast timeline.';
    report.phaseMeaning = 'MIXED workload: inputPhase labels harness movement/travel/reset/combat/idle; workloadPhase prioritizes published cast windup/active/recovery, then input phase, published nonzero skill cooldown, idle. Snapshot missing during reset is explicit. No isolated phase-cost claim.';
    report.slotTiming = 'Browser performance.now relative to sampler first rAF; start dispatch tolerance 750ms; each cycle must finish before next slot and final 60000ms deadline. First combat/skill cycle prepared before sample; later resets and approaches included.';
    await label(scenario === 'movement' ? 'movement' : 'idle');
    sampling = call('Runtime.evaluate', { expression: `(${sampler.toString()})(${rootExpression},${duration},${readCombatSnapshot.toString()},${JSON.stringify(SKILLS)},${control})`, awaitPromise: true, returnByValue: true });
    sampling.catch(() => {});
    // Separate evaluate can run while sampler's awaitPromise remains pending.
    const sampleStart = await c.until(() => evaluate(`${control}.started`), Number.isFinite, 'sampler first rAF', 5000);
    const elapsed = () => evaluate(`performance.now()-${sampleStart}`);
    const snapshot = () => evaluate(`(${readCombatSnapshot.toString()})()`);
    let deadline = duration;
    async function checkTime() { assert(await elapsed() < deadline, 'Fixed workload slot overrun'); }
    async function waitObserved(accept, description) {
      return c.until(async () => { await checkTime(); return snapshot(); }, value => value && accept(value), description, Math.max(1, deadline - await elapsed()));
    }
    async function recover(kind) {
      await label('cooldown');
      await waitObserved(s => s.cast?.kind !== kind && s.playerState !== 'CAST', `${kind} recovery complete`);
    }
    async function prison() {
      await label('combat'); await tap('KeyR');
      await waitObserved(s => s.skills.prison.cooldown > 0 && s.enemyState === 'STUNNED' && s.enemyStunRemaining > 0, 'prison accepted and guard stunned');
      await recover('prison');
    }
    async function slot(at, end) {
      const now = await elapsed();
      assert(now <= at + 750, `Missed fixed start slot ${at}ms`);
      if (now < at) await wait(at - now);
      deadline = end;
      await checkTime();
    }
    let actionError;
    try {
      if (scenario === 'movement') while (await elapsed() < duration) {
        for (const z of [2, -1]) {
          if (await elapsed() >= duration) break;
          await move('z', z);
        }
        report.cycles++;
      }
      if (['guard-combat', 'prison', 'ultimate'].includes(scenario)) for (const [cycle, at] of report.startSlots.entries()) {
        await slot(at, at + 15000);
        const action = { cycle: cycle + 1, scheduledAt: at, at: await elapsed(), action: scenario };
        report.actions.push(action);
        if (cycle) { await reset(); await checkTime(); await approach(); await checkTime(); }
        if (scenario === 'prison' || scenario === 'ultimate') await prison();
        if (scenario === 'ultimate') {
          const s = await state(), player = s.actors[0], guard = s.actors[1];
          assert(player && guard, 'Ultimate actors missing');
          // c.move never called with a target behind current position: avoid overshoot/reversal.
          if (guard.z - player.z > 2) { await label('travel'); await move('z', guard.z - 1.8); await checkTime(); }
          await label('combat'); await tap('KeyF');
          await waitObserved(s => s.skills.ultimate.cooldown > 0 && s.cast?.kind === 'ultimate', 'ultimate accepted');
          await waitObserved(s => s.enemyHP === 0, 'ultimate guard killed');
          await recover('ultimate');
        }
        if (scenario === 'guard-combat') {
          await label('combat'); await tap('KeyQ');
          for (let i = 0; i < 8; i++) { await checkTime(); await tap('KeyJ'); await wait(350); }
          await waitObserved(s => s.enemyHP < 50, 'combat guard damaged');
        }
        await checkTime(); action.completedAt = await elapsed(); report.cycles++;
        await label('idle');
      }
      if (scenario === 'retry') for (const at of report.startSlots) {
        await slot(at, at + 3000);
        const action = { cycle: report.cycles + 1, scheduledAt: at, at: await elapsed(), action: 'reset' };
        report.actions.push(action); await reset(); await checkTime();
        action.completedAt = await elapsed(); report.cycles++; await label('idle');
      }
      if (report.plannedCycles !== null) assert.equal(report.cycles, report.plannedCycles, 'Fixed cycle count required');
    } catch (error) { actionError = error; }
    const sampled = await sampling;
    assert(!sampled.exceptionDetails, JSON.stringify(sampled.exceptionDetails));
    report.sample = sampled.result.value;
    report.after = await state();
    const observed = report.sample.phaseSamples;
    report.castValidation = {};
    for (const kind of scenario === 'ultimate' ? ['prison', 'ultimate'] : scenario === 'prison' ? ['prison'] : []) {
      const casts = [...new Set(observed.filter(frame => frame.cast?.kind === kind).map(frame => `${frame.epoch}:${frame.cast.id}`))];
      const phases = Object.fromEntries(['windup', 'active', 'recovery'].map(phase => [phase, observed.filter(frame => frame.cast?.kind === kind && frame.cast.phase === phase).map(frame => ({ t: frame.t, epoch: frame.epoch, id: frame.cast.id, tick: frame.tick, age: frame.cast.age }))]));
      const hitEpochs = [...new Set(observed.filter(frame => kind === 'prison' ? frame.stunUntil > frame.tick : frame.cast?.kind === kind && frame.hits.some(hit => hit.targetId === 'guard' && hit.tick >= frame.tick - frame.cast.age)).map(frame => frame.epoch))];
      const hit = hitEpochs.length >= report.cycles && report.cycles > 0;
      report.castValidation[kind] = { observedCasts: casts.length, attemptedCycles: report.cycles, phases, hitEpochs, hit, note: 'rAF observations; phase transitions bracketed by sample timestamps, not exact physics boundaries. Epoch advances on published tick regression after UI remount. Published snapshots can lag by six ticks; phases may be missed. Prison hit can be proven by live guard stun even if one-tick active phase is not sampled.' };
    }
    report.events = c.events; report.errors = errors(c.events); report.warnings = warnings(c.events);
    await write(output, report);
    if (actionError) throw actionError;
    assert(!report.sample.failure, report.sample.failure);
    assert(report.sample.frames > 0 && report.sample.elapsed >= duration && report.sample.invalid.length === 0, 'Sample duration/visibility/focus/context invalid');
    assert.deepEqual(report.sample.viewport, [1280, 800]); assert(Math.abs(report.sample.dpr - 1) <= 1e-6, 'DPR outside 1e-6 tolerance');
    assert(observed.some((frame, i) => i > 0 && frame.epoch === observed[i - 1].epoch && frame.tick > observed[i - 1].tick), 'Published combat tick never advanced');
    assert(report.after.visibility === 'visible' && report.after.focus && !report.after.lost && report.after.webgl, 'After-state unhealthy');
    if (scenario === 'movement') assert(report.after.locked && observed.every(frame => frame.playerHP === 100), 'Movement must stay alive and avoid combat');

    assert.equal(report.errors.length, 0, 'Captured errors/network failures; inspect diagnostics');
    for (const [kind, validation] of Object.entries(report.castValidation)) {
      assert(validation.observedCasts >= report.cycles && report.cycles > 0, `${kind}: every attempted cycle must have an observed accepted cast`);
      assert(validation.hit, `${kind}: no observed valid guard hit`);
      assert(validation.phases.windup.length && validation.phases.recovery.length, `${kind}: incomplete observed cast phases`);
      // One-tick prison active phase can fall between rAF callbacks: report missing, never invent.
    }
    if (scenario === 'guard-combat') assert(observed.some(frame => frame.guardHP < 50), 'Combat workload must damage guard');
    report.passed = true;
  } catch (error) {
    report.failure = failure(error); process.exitCode = 1;
    if (c) {
      await c.release().catch(() => {});
      try {
        await c.call('Page.navigate', { url: `${new URL(gameURL).origin}/games` });
        await c.until(() => c.evaluate('location.pathname === "/games" && document.readyState === "complete" && !document.querySelector("canvas")'), Boolean, 'failed sampler document teardown');
        report.documentTeardown = true;
      }
      catch (error) { report.cleanupFailure = failure(error); }
    }
  } finally {
    if (c) {
      await c.call('Runtime.releaseObjectGroup', { objectGroup: 'controlled-hooks' }).catch(() => {});
      await c.close(); report.events = c.events; report.errors = errors(c.events); report.warnings = warnings(c.events);
      if (report.errors.length) { report.passed = false; process.exitCode = 1; }
    }
    report.finished = new Date().toISOString();
    await write(output, report);
    console.log(JSON.stringify({ scenario, passed: report.passed, fps: report.sample?.fps, failure: report.failure?.message, output }));
  }
}

function selfTest() {
  assert.equal(schedule(1).length, 28); assert.equal(schedule(3).length, 84);
  assert.deepEqual(selectedScenarios(undefined), scenarios);
  assert.equal(schedule(2, selectedScenarios('movement,guard-combat')).length, 16);
  for (const value of ['', 'movement,movement', 'unknown', 'movement, idle']) assert.throws(() => selectedScenarios(value));
  for (const value of [0, -1, 1.5, NaN, Infinity]) assert.throws(() => schedule(value));
  const plan = schedule(2);
  for (let i = 0; i < plan.length; i += 4) { assert.deepEqual(plan.slice(i, i + 4).map(run => run.variant), ['A', 'B', 'B', 'A']); assert.equal(new Set(plan.slice(i, i + 4).map(run => run.scenario)).size, 1); }
  assert.deepEqual(stats([4, 1, 3, 2]), { n: 4, min: 1, max: 4, median: 2.5, mean: 2.5 });
  assert.equal(stats([]).median, null); assert.throws(() => stats([NaN]));
  assert.equal(comparison([]).percentBvsA, null);
  assert.equal(comparison([[100, 110, 110, 100]]).ci95Percent, null);
  const equal = comparison([[100, 110, 110, 100], [50, 55, 55, 50], [200, 220, 220, 200]]);
  assert(Math.abs(equal.percentBvsA - 10) < 1e-10); assert(equal.ci95Percent.every(value => Math.abs(value - 10) < 1e-10));
  const noise = comparison([[100, 90, 90, 100], [100, 110, 110, 100], [100, 100, 100, 100]]);
  assert(noise.ci95Percent[0] < 0 && noise.ci95Percent[1] > 0);
  assert.throws(() => comparison([[1, 0, 1, 1]]));
  // Compile browser-injected sampler separately; no browser calls or fake performance data.
  assert.equal(typeof new Function(`return (${sampler.toString()})`)(), 'function');
  assert.equal(typeof new Function(`return (${readCombatSnapshot.toString()})`)(), 'function');
  assert(Math.abs(1.0000000298023224 - 1) <= 1e-6);
  assert(!(Math.abs(1.00001 - 1) <= 1e-6));
  const savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  try {
    const current = { tick: 240, skills: {} }, stale = { tick: 180, skills: {} };
    const liveRoot = {}, oldRoot = { stateNode: { current: liveRoot } };
    const live = { memoizedProps: { combat: current }, return: liveRoot };
    const old = { memoizedProps: { combat: stale }, return: oldRoot, alternate: live };
    const element = { __reactFiber_test: old };
    Object.defineProperty(globalThis, 'document', { configurable: true, value: { querySelector: () => element } });
    assert.equal(readCombatSnapshot(), current, 'Ignore stale alternate');
    live.memoizedProps = {};
    live.memoizedState = { memoizedState: current, next: null };
    assert.equal(readCombatSnapshot(), current, 'Shopping published state fallback');
    document.querySelector = () => null;
    assert.equal(readCombatSnapshot(), null, 'Retry HUD gap');
  } finally {
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument); else delete globalThis.document;
  }
  console.log('controlled-benchmark self-test: PASS (schedule, validation, statistics, sampler syntax, DPR tolerance, committed HUD selection)');
}
if (resolve(process.argv[1] || '') === self) {
  if (process.argv.includes('--self-test')) selfTest();
  else if (process.argv.includes('--run')) await run();
  else await parent();
}
