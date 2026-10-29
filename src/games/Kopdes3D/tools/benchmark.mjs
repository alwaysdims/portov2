import assert from 'node:assert/strict';
import process from 'node:process';
import { connect, gameURL, rootExpression, wait, outputPath, save, errors, warnings } from './cdp.mjs';

// Run separately, never alongside lifecycle.mjs/builds/other tabs. ~8+ minutes.
// KOPDES_CDP=http://127.0.0.1:9231 KOPDES_URL=http://127.0.0.1:4173/games/kopdes-3d
// KOPDES_OUTPUT=/absolute/path/benchmark.json node src/games/Kopdes3D/tools/benchmark.mjs
const output = outputPath('benchmark');
const supported = ['idle', 'movement', 'guard-combat', 'prison', 'ultimate', 'shopping', 'retry'];
const scenarios = process.env.KOPDES_SCENARIOS?.split(',') || supported;
assert(scenarios.length && scenarios.every(scenario => supported.includes(scenario)), 'Unknown benchmark scenario');
const duration = 60000;
const report = { kind: 'benchmark', url: gameURL, node: process.version, method: '5s warmup;60s contiguous rAF;fps=1000*N/sum(intervals);DPR1;1280x800;UI input only', workloadValidation: 'LEGACY: passed validates sampling health, NOT accepted casts/hits. Use controlled-benchmark.mjs for observed skill workload evidence.', results: [], passed: false };
let c;
try {
  c = await connect();
  const { call, evaluate, fresh, state, clickText, tap, down, up, move, release, activate } = c;
  report.browser = await call('Browser.getVersion');
  report.target = c.tab;
  const { windowId } = await call('Browser.getWindowForTarget');
  await call('Browser.setWindowBounds', { windowId, bounds: { width: 1280, height: 900, windowState: 'normal' } });
  await call('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  async function reset() {
    await release(); await clickText('Ulangi misi'); await wait(600);
    const s = await c.ready();
    assert.equal(s.actors[0].z, -1, 'Retry spawn');
    assert(s.text.includes('Gerbang: LOCKED') && s.text.includes('Keranjang kosong.'), 'Retry state');
    await activate(); await wait(200);
  }
  async function approach() {
    await down('ShiftLeft');
    try { await move('z', 7.8); } finally { await up('ShiftLeft'); }
  }
  async function kill() {
    await tap('KeyQ'); await approach();
    for (let i = 0; i < 20; i++) {
      await tap('KeyJ'); await wait(450);
      if ((await state()).text.includes('Penjaga tersisa: 0')) return;
    }
    throw new Error('Guard not defeated');
  }
  function valid(s) {
    return s.visibility === 'visible' && s.focus && !s.lost && !!s.webgl &&
      s.dimensions?.[0] > 300 && s.dimensions?.[1] > 150 && s.actors.length === 2 && s.memory?.geometries > 0;
  }
  // Promise owns sampler state; no globals, simulation writes, or injected app hooks.
  // Raw intervals retained; observer only records tasks starting inside sample window.
  function sample() {
    return evaluate(`new Promise(resolve=>{const s=${rootExpression};if(!s)throw Error('R3F root missing');const intervals=[],calls=[],geometries=[],textures=[],longTasks=[],invalid=[];let last,start,observer;const valid=()=>document.visibilityState==='visible'&&document.hasFocus()&&!s.gl.getContext().isContextLost();if(PerformanceObserver.supportedEntryTypes.includes('longtask')){observer=new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.startTime>=start)longTasks.push({start:e.startTime,duration:e.duration})});observer.observe({type:'longtask',buffered:false})}function frame(t){if(start===undefined)start=t;if(last!==undefined){intervals.push(t-last);calls.push(s.gl.info.render.calls);geometries.push(s.gl.info.memory.geometries);textures.push(s.gl.info.memory.textures)}last=t;if(!valid())invalid.push(t);if(t-start<${duration}){requestAnimationFrame(frame);return}if(observer){for(const e of observer.takeRecords())if(e.startTime>=start)longTasks.push({start:e.startTime,duration:e.duration});observer.disconnect()}const sorted=[...intervals].sort((a,b)=>a-b),sum=intervals.reduce((a,b)=>a+b,0),q=p=>sorted[Math.ceil(sorted.length*p)-1],range=a=>({min:Math.min(...a),max:Math.max(...a)});resolve({frames:intervals.length,elapsed:sum,fps:1000*intervals.length/sum,mean:sum/intervals.length,median:q(.5),p95:q(.95),p99:q(.99),longFrames50:intervals.filter(x=>x>50).length,longFrames100:intervals.filter(x=>x>100).length,longTasks,longTasksSupported:!!observer,drawCalls:{...range(calls),mean:calls.reduce((a,b)=>a+b,0)/calls.length},geometries:range(geometries),textures:range(textures),heap:performance.memory?.usedJSHeapSize,invalid,visibility:document.visibilityState,focus:document.hasFocus(),dpr:devicePixelRatio,viewport:[innerWidth,innerHeight],canvas:[s.gl.domElement.width,s.gl.domElement.height],intervals})}requestAnimationFrame(frame)})`);
  }
  for (const scenario of scenarios) {
    const result = { scenario, cycles: 0, checks: {} };
    report.results.push(result);
    const eventStart = c.events.length;
    await fresh(); await activate(); await wait(350);
    if (scenario === 'shopping') { await kill(); await move('z', 30); await move('x', -2.7); await move('z', 32); }
    await wait(5000);
    if (['guard-combat', 'prison', 'ultimate'].includes(scenario)) { await reset(); await approach(); }
    result.before = await state();
    result.checks.beforeValid = valid(result.before);
    assert(result.checks.beforeValid, 'Visible healthy focused WebGL scene required');
    assert(result.before.locked, 'Controls must be active');
    if (scenario === 'shopping') assert(result.before.text.includes('Penjaga tersisa: 0'), 'Shopping guard cleared');
    const sampling = sample();
    // Attach rejection handler now; UI action failure must not leave rejected promises.
    sampling.catch(() => {});
    const start = Date.now();
    let actionError;
    try {
      if (scenario === 'idle' || scenario === 'shopping') await wait(duration + 500);
      if (scenario === 'movement') {
        while (Date.now() - start < duration) {
          await down('KeyW'); await wait(900); await up('KeyW');
          await down('KeyS'); await wait(900); await up('KeyS');
        }
      }
      if (['guard-combat', 'prison', 'ultimate'].includes(scenario)) {
        while (Date.now() - start < duration) {
          if (scenario === 'prison') await tap('KeyR');
          else if (scenario === 'ultimate') { await tap('KeyR'); await wait(750); await tap('KeyF'); }
          else { await tap('KeyQ'); for (let i = 0; i < 8; i++) { await tap('KeyJ'); await wait(350); } }
          await wait(3000); result.cycles++;
          if (Date.now() - start < duration - 4000) { await reset(); await approach(); }
        }
      }
      if (scenario === 'retry') {
        while (Date.now() - start < duration) { await reset(); result.cycles++; await wait(1500); }
      }
    } catch (error) { actionError = error; }
    Object.assign(result, await sampling);
    result.after = await state();
    result.events = c.events.slice(eventStart);
    result.errors = errors(result.events);
    result.warnings = warnings(result.events);
    result.checks.afterValid = valid(result.after);
    result.checks.sampleValid = result.invalid.length === 0 && result.elapsed >= duration && result.frames > 0;
    result.checks.cleanEvents = result.errors.length === 0;
    await save(output, report);
    if (actionError) throw actionError;
    assert(result.checks.afterValid && result.checks.sampleValid, 'Sample invalid: visibility/focus/context/duration');
    assert(result.checks.cleanEvents, 'Captured errors/network failures; inspect JSON (warnings classified separately)');
    console.log(JSON.stringify({ scenario, fps: result.fps, p95: result.p95, output }));
  }
  report.passed = true;
} catch (error) {
  report.failure = { message: error.message, stack: error.stack };
  // Destroy the dedicated test document on failure, including a stalled rAF sampler
  // whose Runtime.evaluate request timed out. Disconnecting CDP alone leaves it alive.
  if (c) {
    await c.release().catch(releaseError => { report.failure.releaseError = releaseError.message; });
    try {
      await c.call('Page.navigate', { url: `${new URL(gameURL).origin}/games` });
      await c.until(() => c.evaluate('document.readyState === "complete" && location.pathname === "/games" && !document.querySelector("canvas")'), Boolean, 'failed sampler document teardown');
      report.failure.documentTeardown = true;
    } catch (cleanupError) { report.failure.cleanupError = cleanupError.message; }
  }
  process.exitCode = 1;
} finally {
  if (c) { await c.close(); report.events = c.events; report.errors = errors(c.events); report.warnings = warnings(c.events); }
  if (report.errors?.length) { report.passed = false; process.exitCode = 1; }
  await save(output, report);
  console.log(JSON.stringify({ passed: report.passed, warnings: report.warnings?.length || 0, output, failure: report.failure?.message }));
}
