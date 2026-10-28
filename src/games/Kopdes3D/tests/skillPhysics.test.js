import { afterEach, beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { createCombat, prepareCombat, resolveCombat } from '../combat.js';
import { combatContact } from '../combatPhysics.js';
import { createController, stepMotion } from '../gameLogic.js';

beforeAll(async () => { await RAPIER.init(); });
let world;
afterEach(() => { world?.free(); world = null; });
function duel({ wall = false } = {}) {
  world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  world.createCollider(RAPIER.ColliderDesc.cuboid(10, .1, 10).setTranslation(0, -.1, 0));
  if (wall) world.createCollider(RAPIER.ColliderDesc.cuboid(3, 2, .1).setTranslation(0, 1, -2.4));
  const sim = createCombat();
  sim.player.yaw = 0;
  const controllers = [], motions = [];
  for (const [index, actor] of [sim.player, sim.guard].entries()) {
    actor.body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, .88, index ? -1.4 : 0));
    world.createCollider(RAPIER.ColliderDesc.capsule(.5, .35), actor.body);
    controllers.push(createController(world)); motions.push({ verticalSpeed: 0 });
    actor.position = actor.body.translation();
  }
  sim.guard.hp = sim.guard.maxHP = 200;
  world.step();
  const contact = (a, b, spec) => combatContact(world, RAPIER, a, b, spec);
  function tick(command = {}) {
    for (const actor of [sim.player, sim.guard]) actor.position = actor.body.translation();
    const movement = prepareCombat(sim, command, contact);
    for (const [i, actor] of [sim.player, sim.guard].entries()) {
      stepMotion(world, RAPIER, actor.body, controllers[i], i ? movement.guard : movement.player, motions[i]);
    }
    world.step();
    for (const actor of [sim.player, sim.guard]) actor.position = actor.body.translation();
    resolveCombat(sim, contact);
  }
  return { sim, tick, contact };
}

test('ultimate knockback goes through production character controller and stops at wall', () => {
  const { sim, tick } = duel({ wall: true });
  tick({ prison: true });
  for (let i = 0; i < 38; i++) tick();
  expect(sim.guard.state).toBe('STUNNED');
  tick({ ultimate: true });
  for (let i = 0; i < 39; i++) tick();
  expect(sim.guard.hp).toBe(134);
  const before = sim.guard.position.z;
  for (let i = 0; i < 14; i++) tick();
  expect(sim.guard.position.z).toBeLessThan(before - .1);
  expect(sim.guard.position.z).toBeGreaterThan(-1.96);
  expect(sim.guard.position.y).toBeGreaterThan(.8);
  expect(sim.events.filter(event => event.type === 'hit' && event.targetId === 'guard')).toHaveLength(1);
});

test('static occlusion rejects prison at acceptance and ultimate active damage', () => {
  const { sim, tick, contact } = duel();
  world.createCollider(RAPIER.ColliderDesc.cuboid(3, 2, .1).setTranslation(0, 1, -.7));
  world.step();
  expect(contact(sim.player, sim.guard, { range: 5 })).toBe(false);
  tick({ prison: true });
  expect(sim.player.cast).toBeNull();
  tick({ ultimate: true });
  for (let i = 0; i < 43; i++) tick();
  expect(sim.guard.hp).toBe(200);
  expect(sim.guard.stunUntil).toBe(0);
});
