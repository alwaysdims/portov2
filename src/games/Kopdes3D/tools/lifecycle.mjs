import assert from 'node:assert/strict';
import process from 'node:process';
import { connect, gameURL, rootExpression, wait, outputPath, save, errors, warnings } from './cdp.mjs';

// Separate run after benchmark. Same-document history routes, not reload-based cleanup.
// KOPDES_OUTPUT=/absolute/path/lifecycle.json node src/games/Kopdes3D/tools/lifecycle.mjs
// R3F React-fiber discovery is version-sensitive; fail closed if root/instances absent.
// Retained CDP handles inspect renderer disposal counters, not driver memory reclamation.
const output = outputPath('lifecycle');
const report = { kind: 'lifecycle', url: gameURL, node: process.version, retries: [], reentries: [], passed: false };
const origin = new URL(gameURL).origin;
const lobby = `${origin}/games`;
const game = `${origin}/games/kopdes-3d`;
const types = ['keydown', 'keyup', 'blur', 'mousedown', 'mousemove', 'pointerlockchange', 'pointerlockerror', 'visibilitychange'];
const expected = {
  window: { keydown: 1, keyup: 1, blur: 1 },
  document: { mousedown: 1, mousemove: 1, pointerlockchange: 1, pointerlockerror: 1, visibilitychange: 1 },
};
let c;
try {
  c = await connect();
  const { call, evaluate, state, until, release, activate, clickText } = c;
  report.browser = await call('Browser.getVersion');
  report.target = c.tab;
  async function listeners() {
    const counts = {};
    for (const target of ['window', 'document']) {
      const object = await call('Runtime.evaluate', { expression: target, objectGroup: 'kopdes-listeners' });
      if (!object.result.objectId) throw new Error(`Listener target missing: ${target}`);
      try {
        const result = await call('DOMDebugger.getEventListeners', { objectId: object.result.objectId });
        counts[target] = Object.fromEntries(types.map(type => [type, result.listeners.filter(l => l.type === type).length]));
      } finally { await call('Runtime.releaseObjectGroup', { objectGroup: 'kopdes-listeners' }); }
    }
    return counts;
  }
  async function counters() {
    return evaluate(`(()=>{const s=${rootExpression};if(!s)throw Error('R3F root missing');const instances=[];s.scene.traverse(o=>{if(o.isInstancedMesh)instances.push({uuid:o.uuid,version:o.instanceMatrix.version,count:o.count})});return{instances,memory:s.gl.info.memory,programs:s.gl.info.programs.length,heap:performance.memory?.usedJSHeapSize}})()`);
  }
  function resources(sample) { return { ...sample.memory, programs: sample.programs, instances: sample.instances.length }; }
  function mountedListeners(base, mounted) {
    for (const target of ['window', 'document']) {
      for (const type of types) assert.equal(mounted[target][type] - base[target][type], expected[target][type] || 0, `${target}.${type} exact mounted listener delta`);
    }
  }
  async function sameDocument(url) {
    await release();
    // Routing-only mutation: App listens to popstate; hash '#/games' is unsupported.
    await evaluate(`(()=>{history.pushState(null,'',${JSON.stringify(url)});dispatchEvent(new PopStateEvent('popstate'))})()`);
    await until(() => evaluate('location.href'), value => value === url, 'history navigation');
    assert.equal(await evaluate('performance.timeOrigin'), report.timeOrigin, 'History routing must not reload document');
  }
  async function healthy() {
    const s = await c.ready();
    assert.equal(s.visibility, 'visible'); assert.equal(s.focus, true);
    assert.equal(s.lost, false); assert(s.webgl);
    assert(s.dimensions[0] > 300 && s.dimensions[1] > 150, 'Canvas dimensions');
    return s;
  }
  async function staticUploads() {
    await activate(); await wait(500);
    const before = await counters();
    const hudBefore = (await state()).text.match(/Waktu (\d+) detik/)?.[1];
    assert(before.instances.length > 0, 'Instanced environment required; empty sample cannot pass');
    await wait(2000);
    const after = await counters();
    const hudAfter = (await state()).text.match(/Waktu (\d+) detik/)?.[1];
    assert(hudBefore !== undefined && Number(hudAfter) > Number(hudBefore), 'Live HUD clock must publish during static upload check');
    assert.deepEqual(after.instances, before.instances, 'HUD publication must not upload static environment matrices');
    assert.deepEqual(resources(after), resources(before), 'Idle GPU resources stable');
    await release();
    return { before, after };
  }
  // Establish exact listener baseline before first mount in same document.
  await release(); await call('Page.navigate', { url: lobby });
  await until(() => evaluate('location.href'), value => value === lobby, 'lobby document navigation');
  await wait(800);
  report.timeOrigin = await evaluate('performance.timeOrigin');
  await sameDocument(lobby);
  await until(() => evaluate('document.querySelectorAll("canvas").length'), count => count === 0, 'lobby canvas absent');
  await wait(800);
  report.baseListeners = await listeners();
  await sameDocument(game); await healthy(); await wait(1000);
  report.mountedListeners = await listeners();
  mountedListeners(report.baseListeners, report.mountedListeners);
  report.initial = await counters();
  assert(report.initial.instances.length > 0, 'Static instances present');
  for (let cycle = 0; cycle < 6; cycle++) {
    const sample = { cycle: cycle + 1 };
    report.retries.push(sample);
    sample.staticUploads = await staticUploads();
    sample.listenersBefore = await listeners();
    assert.deepEqual(sample.listenersBefore, report.mountedListeners);
    await clickText('Ulangi misi'); await wait(1000);
    sample.state = await healthy();
    assert.equal(sample.state.locked, false);
    assert.equal(sample.state.actors[0].z, -1, 'Retry player spawn');
    assert.equal(sample.state.actors.length, 2);
    assert(sample.state.text.includes('Gerbang: LOCKED'));
    assert(sample.state.text.includes('Keranjang kosong.'));
    assert.equal(sample.state.timeOrigin, report.timeOrigin);
    sample.skills = await evaluate(`Array.from(document.querySelectorAll('.kopdes-skills progress'),p=>({value:p.value,max:p.max}))`);
    assert.equal(sample.skills.length, 2, 'Both skill progress indicators present');
    for (const skill of sample.skills) assert.equal(skill.value, skill.max, 'Paused reset skills fully ready (label TERKUNCI)');
    await release(); await wait(300);
    sample.counters = await counters();
    sample.listenersAfter = await listeners();
    assert.deepEqual(sample.listenersAfter, report.mountedListeners, 'Retry must not duplicate listeners');
    assert.deepEqual(resources(sample.counters), resources(report.initial), 'Retry GPU resources bounded to initial counts');
    await save(output, report);
  }
  for (let cycle = 0; cycle < 5; cycle++) {
    const sample = { cycle: cycle + 1 };
    report.reentries.push(sample);
    await release();
    const retained = await call('Runtime.evaluate', { expression: rootExpression, objectGroup: 'kopdes-unmount' });
    if (!retained.result.objectId || retained.result.subtype === 'null') throw new Error('Cannot retain renderer for disposal proof');
    try {
      await sameDocument(lobby);
      await until(() => evaluate('document.querySelectorAll("canvas").length'), count => count === 0, 'unmount canvas absent', 10000);
      await wait(800);
      sample.unmountedListeners = await listeners();
      assert.deepEqual(sample.unmountedListeners, report.baseListeners, 'Unmount exact window/document listener cleanup');
      async function disposed() {
        const result = await call('Runtime.callFunctionOn', {
          objectId: retained.result.objectId, returnByValue: true,
          functionDeclaration: 'function(){return{memory:this.gl.info.memory,programs:this.gl.info.programs.length,contextLost:this.gl.getContext().isContextLost(),active:this.internal.active,children:this.scene.children.length}}',
        });
        if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
        sample.lastDisposal = result.result.value;
        return result.result.value;
      }
      // Lost contexts can retain renderer bookkeeping for internal textures/programs.
      // Record those counters; they are not proof of driver allocations or a leak.
      sample.disposed = await until(disposed, s => s.memory.geometries === 0 && s.contextLost && !s.active && s.children === 0, 'renderer inactive, scene cleared and context lost', 10000);
    } finally { await call('Runtime.releaseObjectGroup', { objectGroup: 'kopdes-unmount' }); }
    await sameDocument(game); sample.state = await healthy(); await wait(1000);
    sample.listeners = await listeners();
    assert.deepEqual(sample.listeners, report.mountedListeners, 'Reentry exact listener counts');
    sample.staticUploads = await staticUploads();
    sample.counters = await counters();
    assert.deepEqual(resources(sample.counters), resources(report.initial), 'Reentry GPU resources match initial counts');
    await save(output, report);
  }
  assert.equal(report.retries.length, 6); assert.equal(report.reentries.length, 5);
  report.errors = errors(c.events);
  assert.deepEqual(report.errors, [], 'Captured errors/network failures (warnings classified separately)');
  report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  process.exitCode = 1;
} finally {
  if (c) { await c.close(); report.events = c.events; report.errors = errors(c.events); report.warnings = warnings(c.events); }
  if (report.errors?.length) { report.passed = false; process.exitCode = 1; }
  await save(output, report);
  console.log(JSON.stringify({ passed: report.passed, warnings: report.warnings?.length || 0, output, failure: report.failure?.message }));
}
