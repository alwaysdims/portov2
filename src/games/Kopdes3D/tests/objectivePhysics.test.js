import { afterEach, beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { createController, stepMotion } from '../gameLogic.js';
import { interactionVisible } from '../combatPhysics.js';
import { advanceObjectives, createObjectives, GATE, gatePose, nearestInteraction, PRODUCT } from '../objectives.js';
import { ENVIRONMENT_COLLIDERS } from '../environment/config.js';

beforeAll(async () => { await RAPIER.init(); });
let world;
afterEach(() => { world?.free(); world = null; });
function setup(x = 0, z = 23) {
  world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  for (const { position, size } of ENVIRONMENT_COLLIDERS) world.createCollider(RAPIER.ColliderDesc.cuboid(...size.map(n => n / 2)).setTranslation(...position));
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, 0.88, z));
  world.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.35), body);
  const gate = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(...GATE.position));
  world.createCollider(RAPIER.ColliderDesc.cuboid(...GATE.size.map(n => n / 2)), gate);
  const controller = createController(world), motion = { verticalSpeed: 0 };
  const state = createObjectives();
  function tick(extra = {}, move = { x: 0, y: 0, z: 0.1 }) {
    stepMotion(world, RAPIER, body, controller, move, motion); world.step();
    advanceObjectives(state, { tick: state.tick + 1, player: { hp: 100, state: 'MOVE', position: body.translation() }, ...extra });
    const pose = gatePose(state); gate.setTranslation(pose, true); world.propagateModifiedBodyPositionsToColliders();
    for (const axis of ['x', 'y', 'z']) expect(gate.collider(0).translation()[axis]).toBeCloseTo(pose[axis], 5);
  }
  world.step();
  return { body, gate, state, tick };
}

test.each([-11, -8.5, -7.8, -7.5, -7.2, -6, 0, 6, 7.2, 7.5, 7.8, 8.5, 11])('actual sprint cannot bypass LOCKED gate at x=%s', x => {
  const { body, state, tick } = setup(x);
  for (let i = 0; i < 100; i++) tick();
  expect(body.translation().z).toBeLessThan(24.51); expect(state.gate).toBe('LOCKED');
});

test('actual gate blocks entire UNLOCKING then permits walk through OPEN portal', () => {
  const { body, state, tick } = setup();
  for (let i = 0; i < 40; i++) tick();
  tick({ events: [{ id: 1, type: 'death', targetId: 'guard' }] });
  for (let i = 0; i < GATE.duration - 1; i++) { tick(); expect(body.translation().z).toBeLessThan(24.51); }
  expect(state.gate).toBe('UNLOCKING'); tick(); expect(state.gate).toBe('OPEN');
  for (let i = 0; i < 80; i++) tick();
  expect(body.translation().z).toBeGreaterThan(30); expect(['INTERACT_WITH_PRODUCT', 'SHOPPING_ACTIVE'].includes(state.stage)).toBe(true);
});

test('production Rapier LOS ignores actor/sensor but rejects wall between shelf anchor and player', () => {
  const { body } = setup(0, 36);
  const actor = { position: body.translation() };
  const visible = (from, to) => interactionVisible(world, RAPIER, from, to);
  world.createCollider(RAPIER.ColliderDesc.cuboid(1, 2, 0.05).setTranslation(0, 1, 36.6).setSensor(true)); world.step();
  expect(nearestInteraction(actor, [PRODUCT], visible)?.id).toBe('BR');
  const wall = world.createCollider(RAPIER.ColliderDesc.cuboid(1, 2, 0.05).setTranslation(0, 1, 36.6)); world.step();
  expect(nearestInteraction(actor, [PRODUCT], visible)).toBe(null);
  world.removeCollider(wall, true); world.step();
  expect(nearestInteraction(actor, [PRODUCT], visible)?.id).toBe('BR');
});
