import assert from 'node:assert/strict';
import process from 'node:process';
import { connect, gameURL, rootExpression, wait, outputPath, save, errors, warnings } from './cdp.mjs';

// Separate production run; never concurrent with benchmark. Node >=22, dedicated Chrome.
// KOPDES_STRESS_MS=600000 KOPDES_OUTPUT=/absolute/path/stress.json node src/games/Kopdes3D/tools/stress.mjs
// Lifecycle's exact listener/disposal checks reused below; importing lifecycle.mjs would RUN it.
// Read-only React/R3F discovery is version-sensitive: missing snapshots fail closed.
const output = outputPath('stress');
const started = Date.now(), duration = Number(process.env.KOPDES_STRESS_MS ?? 600000);
const lobby = new URL('/games', gameURL).href;
const types = ['keydown', 'keyup', 'blur', 'mousedown', 'mousemove', 'pointerlockchange', 'pointerlockerror', 'visibilitychange'];
const expected = { window: { keydown: 1, keyup: 1, blur: 1 }, document: { mousedown: 1, mousemove: 1, pointerlockchange: 1, pointerlockerror: 1, visibilitychange: 1 } };
const report = { kind: 'stress-3.1.2', url: gameURL, node: process.version, requestedMs: duration, started: new Date(started).toISOString(), retries: [], reentries: [], tail: [], modal: { status: 'NOTTESTED', reason: 'Native shopping-modal walkthrough belongs to separate parent acceptance; no synthetic modal substituted.' }, passed: false };
let c, blurTarget;
try {
  assert(Number.isSafeInteger(duration) && duration >= 600000, 'KOPDES_STRESS_MS must be integer >= 600000');
  c = await connect();
  const { call, evaluate, state, until, release, clickText, tap } = c;
  async function activate() { await c.activate(); await wait(350); }
  report.browser = await call('Browser.getVersion'); report.target = c.tab;
  async function listeners() {
    const counts = {};
    for (const target of ['window', 'document']) {
      const object = await call('Runtime.evaluate', { expression: target, objectGroup: 'kopdes-stress-listeners' });
      assert(object.result.objectId, `Missing listener target ${target}`);
      try {
        const result = await call('DOMDebugger.getEventListeners', { objectId: object.result.objectId });
        counts[target] = Object.fromEntries(types.map(type => [type, result.listeners.filter(l => l.type === type).length]));
      } finally { await call('Runtime.releaseObjectGroup', { objectGroup: 'kopdes-stress-listeners' }); }
    }
    return counts;
  }
  async function snapshot() {
    return evaluate(`(()=>{const e=document.querySelector('.kopdes-skills');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber'))],r=f;while(r?.return)r=r.return;if(r?.stateNode?.current&&r.stateNode.current!==r)f=f?.alternate;for(;f;f=f.return){const p=f.memoizedProps;if(p?.combat?.skills)return p.combat}throw Error('Published combat snapshot missing')})()`);
  }
  async function counters() {
    const scene = await evaluate(`(()=>{const s=${rootExpression};if(!s)throw Error('R3F root missing');let instances=0;s.scene.traverse(o=>{if(o.isInstancedMesh)instances++});return{...s.gl.info.memory,programs:s.gl.info.programs.length,instances,canvases:document.querySelectorAll('canvas').length,contextLost:s.gl.getContext().isContextLost(),active:s.internal.active}})()`);
    return { ...scene, heap: await call('Runtime.getHeapUsage'), dom: await call('Memory.getDOMCounters') };
  }
  const resources = s => Object.fromEntries(['geometries', 'textures', 'programs', 'instances', 'canvases', 'contextLost', 'active'].map(k => [k, s[k]]));
  async function healthy(reset = false) {
    const s = await c.ready();
    assert.equal(s.visibility, 'visible'); assert.equal(s.focus, true); assert.equal(s.lost, false); assert(s.webgl);
    assert(s.dimensions[0] > 300 && s.dimensions[1] > 150, 'Usable canvas');
    assert(!s.text.includes('Waktu misi habis'), 'Mission deadline must not expire');
    if (reset) {
      assert.equal(s.locked, false); assert.equal(s.actors[0].z, -1); assert.equal(s.timeOrigin, report.timeOrigin);
      for (const text of ['Gerbang: LOCKED', 'Keranjang kosong.', 'Kontrol dijeda', 'Penjara Ompreng', 'Pukulan Ompreng', 'TERKUNCI', 'Waktu 0 detik']) assert(s.text.includes(text), `Reset text: ${text}`);
      const b = await snapshot();
      assert.equal(b.tick, 0); assert.equal(b.playerHP, 100); assert.equal(b.enemyHP, 50); assert.equal(b.cast, null);
      assert.equal(b.skills.prison.cooldown, 0); assert.equal(b.skills.ultimate.cooldown, 0);
    }
    return s;
  }
  async function route(url) {
    await release();
    // Routing only: no simulation, timer, or renderer state writes.
    await evaluate(`history.pushState(null,'',${JSON.stringify(url)});dispatchEvent(new PopStateEvent('popstate'))`);
    await until(() => evaluate('location.href'), value => value === url, 'same-document route');
    assert.equal(await evaluate('performance.timeOrigin'), report.timeOrigin, 'Same-document reentry cannot reload');
  }
  async function sample(row) {
    row.state = await healthy(true); row.listeners = await listeners();
    assert.deepEqual(row.listeners, report.mountedListeners, 'Exact mounted listeners; no duplicates');
    // Skill hit numbers/cage create transient objects. Compare only settled RESET scenes, never active casts.
    await wait(1000);
    row.counters = await counters(); await wait(400);
    const settled = await counters(); assert.deepEqual(resources(settled), resources(row.counters), 'Reset resources settle');
    row.counters = settled;
    report.warmBaseline ??= settled;
    assert.deepEqual(resources(settled), resources(report.warmBaseline), 'Post-reset renderer resources bounded to warmed baseline');
    row.drift = Object.fromEntries(['geometries', 'textures', 'programs', 'instances'].map(k => [k, settled[k] - report.warmBaseline[k]]));
    row.drift.heapBytes = settled.heap.usedSize - report.warmBaseline.heap.usedSize;
    row.drift.dom = Object.fromEntries(Object.keys(settled.dom).map(k => [k, settled.dom[k] - report.warmBaseline.dom[k]]));
    row.wallMs = Date.now() - started; row.completed = true; await save(output, report);
  }
  async function pauseCheck() {
    await release(); await wait(200);
    const before = await snapshot(); await wait(600); const after = await snapshot();
    assert.equal(after.tick, before.tick, 'Pause freezes authoritative published ticks');
    assert.deepEqual(after.skills, before.skills, 'Pause freezes cooldowns');
    assert((await state()).text.includes('Kontrol dijeda'));
    await activate(); await until(snapshot, b => b.tick > after.tick, 'Resume advances ticks');
    return { before, after };
  }
  async function blurCheck() {
    // Real browser target focus switch, not dispatchEvent(blur). Disable CDP focus spoof first.
    await call('Emulation.setFocusEmulationEnabled', { enabled: false });
    blurTarget = (await call('Target.createTarget', { url: 'about:blank', background: true })).targetId;
    await call('Target.activateTarget', { targetId: blurTarget });
    await until(state, s => !s.focus && !s.locked, 'Native target switch blurs and unlocks');
    const before = await snapshot(); await wait(600); const after = await snapshot();
    assert.equal(after.tick, before.tick, 'Blur freezes ticks');
    await call('Target.activateTarget', { targetId: c.tab.id }); await call('Page.bringToFront');
    let nativeRestore;
    try {
      await until(state, s => s.focus && s.visibility === 'visible', 'Native focus returns', 5000);
      nativeRestore = { status: 'VERIFIED' };
    } catch (error) {
      nativeRestore = { status: 'NOT VERIFIED', failure: error.message };
    }
    assert.equal((await state()).locked, false, 'Focus cannot auto-relock');
    await call('Target.closeTarget', { targetId: blurTarget }); blurTarget = null;
    // Continue resource stress under explicit emulation; never report native restore as passed.
    await call('Emulation.setFocusEmulationEnabled', { enabled: true });
    await activate(); return { before, after, nativeRestore, continuation: 'CDP focus emulation', method: 'Target.activateTarget; blur measured with focus emulation disabled' };
  }
  async function resizeCheck() {
    const canvasRead = () => evaluate(`(()=>{const c=document.querySelector('canvas'),r=c.getBoundingClientRect(),p=c.parentElement.getBoundingClientRect();return{width:c.width,height:c.height,cssWidth:r.width,cssHeight:r.height,parentWidth:p.width,parentHeight:p.height,effectiveDpr:(${rootExpression}).gl.getPixelRatio()}})()`);
    const canvasFits = v => Number.isFinite(v.effectiveDpr) && Math.abs(v.cssWidth - v.parentWidth) <= 1 && Math.abs(v.cssHeight - v.parentHeight) <= 1 && Math.abs(v.width - v.cssWidth * v.effectiveDpr) <= 1 && Math.abs(v.height - v.cssHeight * v.effectiveDpr) <= 1;
    const original = await evaluate('({width:innerWidth,height:innerHeight,dpr:devicePixelRatio})');
    const canvasBefore = await canvasRead();
    const width = Math.max(640, original.width - 120), height = Math.max(480, original.height - 100);
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    const observed = await until(() => evaluate('({width:innerWidth,height:innerHeight})'), s => s.width === width && s.height === height, 'Resize viewport readback');
    const canvasResized = await until(canvasRead, v => canvasFits(v) && (v.width !== canvasBefore.width || v.height !== canvasBefore.height), 'Canvas follows resized container');
    await healthy(); await call('Emulation.clearDeviceMetricsOverride');
    await until(() => evaluate('({width:innerWidth,height:innerHeight})'), s => s.width === original.width && s.height === original.height, 'Viewport restored');
    const canvasRestored = await until(canvasRead, v => canvasFits(v) && v.width === canvasBefore.width && v.height === canvasBefore.height, 'Canvas restored');
    return { original, observed, canvasBefore, canvasResized, canvasRestored };
  }
  async function skills(row, probeCooldown = false) {
    await activate(); await c.down('ShiftLeft');
    try { await c.move('z', 7.8); } finally { await c.up('ShiftLeft'); }
    await until(state, s => Math.hypot(s.actors[1].x - s.actors[0].x, s.actors[1].z - s.actors[0].z) < 4.8, 'Guard approaches into valid R range');
    await tap('KeyR');
    row.prison = await until(snapshot, b => b.enemyState === 'STUNNED' && b.enemyStunRemaining > 0 && b.skills.prison.cooldown > 0, 'Valid R applies stun');
    await until(snapshot, b => !b.cast && b.playerState !== 'CAST', 'R recovery complete');
    await c.down('ShiftLeft');
    try {
      await c.down('KeyW');
      try { await until(state, s => Math.hypot(s.actors[1].x - s.actors[0].x, s.actors[1].z - s.actors[0].z) < 2.6, 'Approach stunned guard for F'); }
      finally { await c.up('KeyW'); }
    } finally { await c.up('ShiftLeft'); }
    await tap('KeyF');
    row.ultimate = await until(snapshot, b => b.cast?.kind === 'ultimate' && b.skills.ultimate.cooldown > 0, 'Valid F accepted');
    const readyTick = row.ultimate.tick + row.ultimate.skills.ultimate.cooldown;
    row.death = await until(snapshot, b => b.enemyHP === 0 && b.enemyState === 'DEAD', 'F kills guard');
    assert((await state()).text.includes('Penjaga tersisa: 0'), 'Direct HUD confirms kill');
    await until(snapshot, b => !b.cast && b.playerState !== 'CAST', 'F recovery complete');
    row.pause = await pauseCheck();
    if (probeCooldown) {
      row.cooldownQueries = [];
      // Same uninterrupted run: simulation-time 15/20/25 s after F, never reset to fake readiness.
      for (const seconds of [15, 20, 25]) {
        const b = await until(snapshot, v => v.tick >= readyTick - 1500 + seconds * 60, `F cooldown ${seconds}s`, 120000);
        const remaining = Math.max(0, readyTick - b.tick);
        assert.equal(b.skills.ultimate.cooldown, remaining);
        assert.equal(b.skills.ultimate.ready, remaining === 0);
        assert.equal(b.skills.prison.cooldown, 0, 'R ready by 15 simulation seconds without reset');
        const hud = await evaluate(`Array.from(document.querySelectorAll('.kopdes-skill'),e=>({text:e.innerText,value:e.querySelector('progress').value,max:e.querySelector('progress').max}))`);
        assert.equal(hud.length, 2); assert.equal(hud[1].max, 1500);
        assert(hud[1].value >= 1500 - remaining, 'Direct progress read agrees with advancing cooldown');
        if (seconds === 25) assert(hud[1].text.includes('READY'), 'F ready after 25 simulation seconds');
        row.cooldownQueries.push({ seconds, snapshot: b, hud });
      }
    }
  }
  await release(); await call('Page.navigate', { url: lobby });
  await until(() => evaluate('location.href'), url => url === lobby, 'Initial lobby document');
  await until(() => evaluate('document.querySelectorAll("canvas").length'), n => n === 0, 'Lobby canvas absent'); await wait(800);
  report.timeOrigin = await evaluate('performance.timeOrigin'); report.baseListeners = await listeners();
  await route(gameURL); await healthy(true); await wait(1000); report.mountedListeners = await listeners();
  for (const target of ['window', 'document']) for (const type of types) assert.equal(report.mountedListeners[target][type] - report.baseListeners[target][type], expected[target][type] ?? 0, `Exact ${target}.${type} listener delta`);
  report.initial = await counters(); assert(report.initial.instances > 0, 'Nonempty instanced scene required');
  report.validation = { mode: 'real CDP input and read-only published snapshots', heap: 'No forced GC; heap drift recorded, not asserted leak-free', contexts: 'Each live renderer healthy; each retained unmounted renderer must lose context' };
  for (let cycle = 1; cycle <= 20; cycle++) {
    const at = Date.now(), row = { cycle }; report.retries.push(row);
    await skills(row, cycle === 1);
    if (cycle === 1) { row.blur = await blurCheck(); row.resize = await resizeCheck(); }
    await release(); await wait(Math.max(0, duration * .03 - (Date.now() - at)));
    await clickText('Ulangi misi'); await sample(row);
  }
  for (let cycle = 1; cycle <= 10; cycle++) {
    const at = Date.now(), row = { cycle }; report.reentries.push(row);
    await activate(); row.pause = await pauseCheck(); await release();
    const retained = await call('Runtime.evaluate', { expression: rootExpression, objectGroup: 'kopdes-stress-unmount' });
    assert(retained.result.objectId && retained.result.subtype !== 'null', 'Retain renderer for disposal proof');
    try {
      await route(lobby); await until(() => evaluate('document.querySelectorAll("canvas").length'), n => n === 0, 'Unmount canvas absent'); await wait(800);
      row.unmountedListeners = await listeners(); assert.deepEqual(row.unmountedListeners, report.baseListeners, 'Exact listener cleanup');
      row.disposed = await until(async () => {
        const result = await call('Runtime.callFunctionOn', { objectId: retained.result.objectId, returnByValue: true, functionDeclaration: 'function(){return{memory:this.gl.info.memory,programs:this.gl.info.programs.length,contextLost:this.gl.getContext().isContextLost(),active:this.internal.active,children:this.scene.children.length}}' });
        assert(!result.exceptionDetails, 'Disposal read failed'); row.lastDisposal = result.result.value; return row.lastDisposal;
      }, s => s.memory.geometries === 0 && s.contextLost && !s.active && s.children === 0, 'Renderer disposed and context lost', 10000);
    } finally { await call('Runtime.releaseObjectGroup', { objectGroup: 'kopdes-stress-unmount' }); }
    await route(gameURL); await healthy(true);
    // New renderers need identical real skill warmup before baseline program comparisons.
    await skills(row); await release(); await clickText('Ulangi misi'); await sample(row);
    await wait(Math.max(0, duration * .025 - (Date.now() - at)));
  }
  // Full-document navigation is separate evidence AFTER ten same-document cleanup cycles.
  const before = report.timeOrigin;
  await call('Page.navigate', { url: lobby });
  await until(() => evaluate('performance.timeOrigin'), n => n !== before, 'Full document replaced');
  await until(() => evaluate('location.href'), url => url === lobby, 'Full navigation lobby');
  await c.fresh(gameURL); report.timeOrigin = await evaluate('performance.timeOrigin');
  report.fullNavigation = { before, after: report.timeOrigin }; assert.notEqual(before, report.timeOrigin);
  report.fullNavigation.resize = await resizeCheck();
  await healthy(true); await skills(report.fullNavigation); await release(); await clickText('Ulangi misi'); await sample(report.fullNavigation);
  report.staticUploadCheck = { status: 'NOTTESTED', reason: 'Active skill scene has dynamic effects; stress compares settled post-reset resources instead. Dedicated lifecycle tool owns static-upload assertion.' };
  while (Date.now() - started < duration) {
    await wait(Math.min(10000, duration - (Date.now() - started)));
    const row = {}; report.tail.push(row); await sample(row);
  }
  const rows = [...report.retries, ...report.reentries, report.fullNavigation, ...report.tail];
  const heaps = rows.map(r => r.counters.heap.usedSize), times = rows.map(r => r.wallMs / 1000);
  const mean = a => a.reduce((s, n) => s + n, 0) / a.length, mx = mean(times), my = mean(heaps);
  report.heapTrend = { samples: heaps.length, firstBytes: heaps[0], lastBytes: heaps.at(-1), minBytes: Math.min(...heaps), maxBytes: Math.max(...heaps), bytesPerSecond: times.reduce((s, x, i) => s + (x - mx) * (heaps[i] - my), 0) / times.reduce((s, x) => s + (x - mx) ** 2, 0), interpretation: 'Observed unforced-GC heap trend, not proof of retained heap/driver memory. Context evidence is mounted canvas plus retained disposed renderer, not global GPU context census.' };
  assert.equal(report.retries.length, 20); assert.equal(report.reentries.length, 10);
  assert(Date.now() - started >= duration, 'Configured minimum wall duration');
  report.errors = errors(c.events); assert.deepEqual(report.errors, [], 'No runtime/network errors'); report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack }; process.exitCode = 1;
} finally {
  if (c) {
    if (blurTarget) await c.call('Target.closeTarget', { targetId: blurTarget }).catch(() => {});
    await c.close(); report.events = c.events; report.errors = errors(c.events); report.warnings = warnings(c.events);
  }
  report.wallMs = Date.now() - started;
  if (report.errors?.length) { report.passed = false; process.exitCode = 1; }
  await save(output, report);
  console.log(JSON.stringify({ passed: report.passed, wallMs: report.wallMs, retries: { attempted: report.retries.length, completed: report.retries.filter(r => r.completed).length }, reentries: { attempted: report.reentries.length, completed: report.reentries.filter(r => r.completed).length }, modal: report.modal.status, warnings: report.warnings?.length ?? 0, output, failure: report.failure?.message }));
}
