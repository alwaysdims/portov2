import assert from 'node:assert/strict';
import test from 'node:test';
import { install, preload, summarize } from './profiling.mjs';

// Pure checks only; no CDP/browser connection. Run after benchmark isolation ends.
test('profiling statistics and React hook lifecycle', () => {
assert.deepEqual(summarize([]), { frames: 0, elapsed: 0, fps: null, mean: null, median: null, p95: null, p99: null, longFrames33_3: 0, longFrames50: 0, longFrames100: 0 });
const samples = [10, 20, 70, 110], stats = summarize(samples);
assert.equal(stats.elapsed, 210);
assert.equal(stats.fps, 4000 / 210);
assert.equal(stats.median, 20);
assert.equal(stats.p95, 110);
assert.equal(stats.longFrames33_3, 2);
assert.equal(summarize([33.3, 33.4]).longFrames33_3, 1);
assert.equal(stats.longFrames50, 2);
assert.equal(stats.longFrames100, 1);
assert.deepEqual(samples, [10, 20, 70, 110]);
globalThis.window = {};
try {
  preload();
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  assert.equal(hook.supportsFiber, true);
  const dom = hook.inject({ rendererPackageName: 'react-dom' });
  const r3f = hook.inject({ rendererPackageName: '@react-three/fiber' });
  const root = { current: { memoizedState: { element: {} } } };
  hook.onCommitFiberRoot(dom, root);
  hook.onCommitFiberRoot(r3f, root);
  assert.equal(hook.getFiberRoots(dom).size, 1);
  assert.deepEqual(window.__KOPDES_DEVTOOLS__.commits, { DOM: 1, R3F: 1, other: 0 });
  root.current.memoizedState.element = null;
  hook.onCommitFiberRoot(dom, root);
  assert.equal(hook.getFiberRoots(dom).size, 0);
} finally { delete globalThis.window; }
console.log('profiling stats/preload checks passed');
});

function mockProfile(run) {
  const names = ['window', 'document', 'performance', 'PerformanceObserver', 'requestAnimationFrame', 'cancelAnimationFrame', 'setInterval', 'clearInterval'];
  const saved = names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  const frames = new Map(), timers = new Map(); let clock = 0, next = 0, worldsCreated = 0, retiredReads = 0, disconnected = false;
  class World { step() {} castRay() {} castShape() {} }
  function lazyWorld() {
    let world, retired = false;
    const get = () => { if (retired) retiredReads++; return world ||= (worldsCreated++, new World()); };
    return { proxy: new Proxy({}, { get: (_, key) => get()[key], set: (_, key, value) => { get()[key] = value; return true; } }), retire() { retired = true; world = undefined; } };
  }
  const actor = () => ({ hp: 100, state: 'IDLE', position: { x: 0, y: 0, z: 0 } });
  const sim = { tick: 0, player: actor(), guard: actor() }, controller = { computeColliderMovement() {} };
  const originalController = controller.computeColliderMovement, originalStep = World.prototype.step, originalRay = World.prototype.castRay, originalShape = World.prototype.castShape;
  let lazy = lazyWorld(); lazy.proxy.step();
  const context = { rapier: { World }, world: lazy.proxy };
  const subscriber = () => {};
  const store = { gl: { domElement: {}, info: { render: {}, memory: {} }, render() {}, getContext: () => ({ isContextLost: () => false }) }, internal: { subscribers: Array.from({ length: 6 }, () => ({ priority: -50, ref: { current: subscriber } })) } };
  const originalRender = store.gl.render;
  const root = { current: { memoizedProps: { value: context }, memoizedState: { memoizedState: { current: sim }, next: { memoizedState: { current: [controller] } } } } };
  const env = { store, sim, World, context, frames, timers, controller, subscriber, originalRender, originalController, originalStep, originalRay, originalShape,
    sampleError: null, disconnectError: null, observerError: null,
    reset() { lazy.retire(); lazy = lazyWorld(); context.world = lazy.proxy; },
    frame() { const [id, callback] = frames.entries().next().value; frames.delete(id); clock += 16; sim.tick++; callback(clock); },
    get worldsCreated() { return worldsCreated; }, get retiredReads() { return retiredReads; }, get disconnected() { return disconnected; },
    restored() {
      assert.equal(World.prototype.step, originalStep); assert.equal(World.prototype.castRay, originalRay); assert.equal(World.prototype.castShape, originalShape);
      assert.equal(controller.computeColliderMovement, originalController); assert.equal(store.gl.render, originalRender);
      assert.equal(frames.size, 0); assert.equal(timers.size, 0); assert.equal(disconnected, true);
    },
  };
  const globals = {
    window: {}, document: { pointerLockElement: store.gl.domElement, visibilityState: 'visible', hasFocus: () => true },
    performance: { now: () => clock, getEntriesByType() { if (env.sampleError) throw env.sampleError; return []; } },
    PerformanceObserver: class {
      static supportedEntryTypes = ['longtask'];
      constructor(callback) { env.observerCallback = callback; }
      observe() {} takeRecords() { return []; }
      disconnect() { disconnected = true; if (env.disconnectError) throw env.disconnectError; }
    },
    requestAnimationFrame: callback => { const id = ++next; frames.set(id, callback); return id; }, cancelAnimationFrame: id => frames.delete(id),
    setInterval: callback => { const id = ++next; timers.set(id, callback); return id; }, clearInterval: id => timers.delete(id),
  };
  for (const [name, value] of Object.entries(globals)) Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  preload(); const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__, renderer = hook.inject({ rendererPackageName: '@react-three/fiber' });
  hook.onCommitFiberRoot(renderer, root);
  return Promise.resolve().then(() => run(env)).finally(() => {
    for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  });
}

test('profiling cleanup never reads retired lazy worlds; retry worlds stay instrumented', () => mockProfile(async env => {
  install(() => env.store, 1000, 'idle'); env.frame();
  env.context.world.step(); env.context.world.castRay(); env.context.world.castShape();
  env.reset(); window.__KOPDES_PROFILE__.refresh();
  env.context.world.step(); env.context.world.castRay(); env.context.world.castShape();
  window.__KOPDES_PROFILE__.stop(); const sample = await window.__KOPDES_PROFILE__.result;
  assert.equal(env.worldsCreated, 2); assert.equal(env.retiredReads, 0);
  assert.equal(sample.timings['rapier.step'].count, 2);
  assert.equal(sample.timings['rapier.query.castRay'].count, 2); assert.equal(sample.timings['rapier.query.castShape'].count, 2);
  env.restored();
}));

test('profiling stop settles and restores every wrapper when final sampling and cleanup throw', () => mockProfile(async env => {
  install(() => env.store, 1000, 'idle'); env.frame();
  env.sampleError = Error('sampling failed'); env.disconnectError = Error('disconnect failed');
  assert.doesNotThrow(() => window.__KOPDES_PROFILE__.stop());
  const sample = await window.__KOPDES_PROFILE__.result;
  assert.match(sample.reason, /sampling failed/); assert.equal(sample.workload.accepted, false);
  env.restored();
  assert.doesNotThrow(() => window.__KOPDES_PROFILE__.stop());
}));

for (const phase of ['initial frame', 'interval', 'frame', 'observer']) {
  test(`profiling ${phase} errors stop sampling and settle result`, () => mockProfile(async env => {
    install(() => env.store, 1000, 'idle');
    if (phase !== 'initial frame') env.frame();
    const error = Error(`${phase} failed`);
    if (phase === 'initial frame' || phase === 'interval') env.sampleError = error;
    else if (phase === 'frame') env.store.gl.getContext = () => { throw error; };
    const invoke = phase === 'interval' ? [...env.timers.values()][0] : phase === 'observer' ? () => env.observerCallback({ getEntries() { throw error; } }) : () => env.frame();
    assert.doesNotThrow(invoke);
    const sample = await window.__KOPDES_PROFILE__.result;
    assert.match(sample.reason, new RegExp(`${phase} failed`)); assert.equal(sample.workload.accepted, false);
    env.restored();
  }));
}

test('profiling restores replacement subscribers without overwriting unrelated replacements', () => mockProfile(async env => {
  install(() => env.store, 1000, 'idle'); env.frame();
  let calls = 0; const replacement = () => { calls++; };
  const ref = env.store.internal.subscribers[0].ref; ref.current = replacement;
  env.frame(); assert.notEqual(ref.current, replacement); ref.current();
  const externalRender = () => {}; env.store.gl.render = externalRender;
  window.__KOPDES_PROFILE__.stop(); const sample = await window.__KOPDES_PROFILE__.result;
  assert.equal(calls, 1); assert.equal(sample.timings['subscriber.0.rapier-paused-frame-stepper'].count, 1);
  assert.equal(ref.current, replacement); assert.equal(env.store.gl.render, externalRender);
  for (const entry of env.store.internal.subscribers.slice(1)) assert.equal(entry.ref.current, env.subscriber);
  env.store.gl.render = env.originalRender; env.restored();
}));
