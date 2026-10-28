import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { MathUtils } from 'three';
import { createCombat, prepareCombat, resolveCombat, combatSnapshot } from '../combat.js';
import { advanceObjectives, applyShoppingAction, CASHIER_TARGET, createObjectives, LEVELS, objectiveSnapshot } from '../objectives.js';
import { addToBasket } from '../shopping.js';

// Run installed Rapier callback, not a second implementation of its accumulator.
const rapierSource = readFileSync(new URL('../../../../node_modules/@react-three/rapier/dist/react-three-rapier.esm.js', import.meta.url), 'utf8');
const stepSource = rapierSource.split('const step = useCallback(dt => {')[1]?.split('}, [paused, timeStep, interpolate, worldProxy]);')[0];
const gameSource = readFileSync(new URL('../GameWorld.jsx', import.meta.url), 'utf8');
const frameSource = gameSource.match(/useFrame\(\(_, dt\) => \{([\s\S]*?)\}, -50\);/)?.[1];
if (!stepSource || !frameSource) throw new Error('Clock callback changed; review extraction before running regression.');
const compile = (bindings, body) => new Function(...Object.keys(bindings), `return (dt) => {${body}};`)(...Object.values(bindings));

beforeAll(async () => { await RAPIER.init(); });
const resources = [];
afterEach(() => { for (const resource of resources.splice(0)) resource.free(); });

function clock() {
  const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
  const eventQueue = new RAPIER.EventQueue(true);
  resources.push(eventQueue, world);
  const sim = createCombat();
  const objective = createObjectives();
  const input = { current: { locked: true } };
  const primed = { current: false };
  const steppingState = { accumulator: 0, previousState: {} };
  let physicalSteps = 0;
  let command = {};
  const blocked = () => Boolean(objective.dialogState) || ['CHECKOUT_COMPLETE', 'MISSION_COMPLETE', 'MISSION_FAILED'].includes(objective.stage) || sim.player.hp <= 0;
  const active = () => primed.current && input.current.locked && !blocked();
  const step = compile({
    worldProxy: world, timeStep: 1 / 60, paused: true, interpolate: false, steppingState,
    MathUtils, eventQueue, hooks: undefined,
    filterContactPairHooks: new Set(), filterIntersectionPairHooks: new Set(),
    rigidBodyStates: new Map(), rigidBodyEvents: new Map(), invalidate: () => {},
    beforeStepCallbacks: new Set([{ current: () => {
      if (!active()) return;
      const movement = prepareCombat(sim, command, () => false);
      for (const actor of ['player', 'guard']) {
        sim[actor].position.x += movement[actor].x;
        sim[actor].position.z += movement[actor].z;
      }
    } }]),
    afterStepCallbacks: new Set([{ current: () => {
      physicalSteps++;
      if (!active()) return;
      resolveCombat(sim, () => false);
      advanceObjectives(objective, { tick: sim.tick, player: sim.player, events: sim.events });
      if (blocked()) input.current.locked = false;
    } }]),
  }, stepSource);
  const frame = compile({ primed, input, blocked, step, playerBody: { current: true }, guardBody: { current: true } }, frameSource);
  return { sim, objective, input, frame, steppingState, world,
    setCommand: value => { command = value; }, physicalSteps: () => physicalSteps };
}

function prime(clock) {
  clock.frame(1 / 60);
  expect(clock.sim.tick).toBe(0);
  expect(clock.physicalSteps()).toBe(1);
}

function ready(clock) {
  const state = clock.objective;
  state.gate = 'OPEN';
  state.deadGuards.add('guard');
  state.stage = 'READY_FOR_CHECKOUT';
  clock.sim.player.position = { ...CASHIER_TARGET.position };
  for (const requirement of state.shopping.shoppingList) {
    expect(addToBasket(state.shopping, requirement.productId, requirement.quantity).ok).toBe(true);
  }
}

test('30 and 60 FPS produce same 60 combat ticks, movement and objective seconds', () => {
  const results = [30, 60].map(fps => {
    const c = clock(); prime(c);
    c.setCommand({ keys: new Set(['KeyW']), yaw: 0 });
    for (let frame = 0; frame < fps; frame++) c.frame(1 / fps);
    expect(c.sim.tick).toBe(60);
    expect(c.objective.tick).toBe(60);
    expect(objectiveSnapshot(c.objective).elapsedSeconds).toBe(59 / 60);
    return { combat: combatSnapshot(c.sim), position: c.sim.player.position };
  });
  expect(results[0]).toEqual(results[1]);
});

test('30 and 60 FPS keep attack ages and dash cooldown on same tick timeline', () => {
  for (const command of [{ attack: true }, { dash: true }]) {
    const results = [30, 60].map(fps => {
      const c = clock(); prime(c); c.setCommand(command);
      for (let frame = 0; frame < fps; frame++) c.frame(1 / fps);
      return { combat: combatSnapshot(c.sim), attackAge: c.sim.player.attack?.age,
        dash: c.sim.player.dash, position: c.sim.player.position };
    });
    expect(results[0]).toEqual(results[1]);
    expect(results[0].combat.tick).toBe(60);
    if (command.dash) expect(results[0].combat.dashCooldown).toBe(61);
  }
});

test('stall capped at five ticks with fractional carry; dropped wall time never catches up', () => {
  const c = clock(); prime(c);
  c.frame(1 / 120);
  expect(c.sim.tick).toBe(0);
  const before = c.physicalSteps();
  c.frame(10);
  expect(c.sim.tick).toBe(5);
  expect(c.physicalSteps() - before).toBe(5);
  c.frame(1 / 120);
  expect(c.sim.tick).toBe(6);
  c.frame(0);
  expect(c.sim.tick).toBe(6);
});

test('unlock and dialog pause preserve fraction but discard paused frame time', () => {
  const c = clock(); prime(c);
  c.frame(1 / 120);
  const remainder = c.steppingState.accumulator;
  for (const mode of ['unlock', 'dialog']) {
    if (mode === 'unlock') c.input.current.locked = false;
    else c.objective.dialogState = 'greeting';
    c.frame(30);
    expect(c.steppingState.accumulator).toBe(remainder);
    expect(c.physicalSteps()).toBe(1);
    expect(c.objective.shopping.timerStart).toBeNull();
    c.input.current.locked = true;
    c.objective.dialogState = null;
  }
  c.frame(1 / 120);
  expect(c.sim.tick).toBe(1);
  expect(c.objective.shopping.timerStart).toBe(1);
});

test('retry keyed Physics creates independent accumulator and fresh simulation', () => {
  const source = readFileSync(new URL('../Kopdes3D.jsx', import.meta.url), 'utf8');
  expect(source).toMatch(/<Physics key=\{attempt\} paused timeStep=\{1 \/ 60\}/);
  expect(source).toContain('setAttempt(value => value + 1)');
  const previous = clock(); prime(previous); previous.frame(1 / 120);
  const next = clock(); prime(next); next.frame(1 / 120);
  expect(previous.steppingState.accumulator).toBe(1 / 120);
  expect(next.sim.tick).toBe(0);
  expect(next.objective.shopping.timerStart).toBeNull();
  next.frame(1 / 120);
  expect(next.sim.tick).toBe(1);
  expect(next.objective.runId).not.toBe(previous.objective.runId);
});

test('deadline uses active simulation ticks, rejects checkout exactly at limit and freezes', () => {
  const c = clock(); prime(c); ready(c);
  c.frame(1 / 60);
  const seconds = LEVELS.find(level => level.id === c.objective.shopping.levelId).timerSeconds;
  const deadline = c.objective.shopping.timerStart + seconds * 60;
  // Reach the boundary through installed fixed-step loop, without changing sim.tick.
  for (let tick = 1; tick < deadline - 1; tick++) c.frame(1 / 60);
  expect(c.sim.tick).toBe(deadline - 1);
  expect(c.objective.stage).toBe('READY_FOR_CHECKOUT');
  c.frame(10);
  expect(c.sim.tick).toBe(deadline);
  expect(c.objective.stage).toBe('MISSION_FAILED');
  expect(c.objective.shopping.timerEnd).toBe(deadline);
  expect(objectiveSnapshot(c.objective).elapsedSeconds).toBe(seconds);
  expect(applyShoppingAction(c.objective, { type: 'CHECKOUT' }, { player: c.sim.player }).reason).toBe('TIME_EXPIRED');
  c.frame(10);
  expect(c.sim.tick).toBe(deadline);
  expect(c.objective.shopping.receipt).toBeNull();
});

test('receipt records absolute simulation tick, not wall clock or elapsed mission seconds', () => {
  const c = clock(); prime(c); ready(c);
  for (let tick = 0; tick < 121; tick++) c.frame(1 / 60);
  c.input.current.locked = false;
  c.frame(600);
  const result = applyShoppingAction(c.objective, { type: 'CHECKOUT' }, { player: c.sim.player });
  expect(result.ok).toBe(true);
  expect(result.receipt.simTick).toBe(121);
  expect(result.receipt.timestamp).toBe('Tick 121 (simulasi)');
  expect(c.objective.shopping.timerEnd).toBe(121);
  expect(objectiveSnapshot(c.objective).elapsedSeconds).toBe(2);
  c.frame(600);
  expect(objectiveSnapshot(c.objective).elapsedSeconds).toBe(2);
});
