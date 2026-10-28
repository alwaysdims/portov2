import { afterEach, beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { cameraPosition, createController, stepMotion } from '../gameLogic.js';
import { combatContact } from '../combatPhysics.js';
import { createCombat, prepareCombat, resolveCombat } from '../combat.js';
import { ENVIRONMENT_COLLIDERS } from '../environment/config.js';

beforeAll(async () => { await RAPIER.init(); });
let world;
afterEach(() => { world?.free(); world = null; });
function setup() {
  world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  world.timestep = 1 / 60;
  for (const { position, size } of ENVIRONMENT_COLLIDERS) world.createCollider(RAPIER.ColliderDesc.cuboid(...size.map(n => n / 2)).setTranslation(...position));
  function actor(id, x, z) {
    const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, 0.88, z));
    world.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.35), body);
    return { id, body, position: body.translation() };
  }
  return { actor };
}

test('initial query priming clamps home camera without advancing combat', () => {
  const { actor } = setup();
  const player = actor('owi', 0, -1);
  const sim = createCombat();
  world.step(); // Same physics-only priming step used before controls are activated.
  const safe = cameraPosition(world,RAPIER,player.body,{x:0,y:1.32,z:-1},{x:0,y:3,z:-5.7});
  expect(safe.z).toBeGreaterThan(-4.7);
  expect(sim.tick).toBe(0);
});

test('broadphase contact finds target but static wall blocks damage and detection', () => {
  const { actor } = setup();
  const a = actor('owi', 0, 16);
  const b = actor('guard', 0, 17);
  world.step();
  expect(combatContact(world, RAPIER, a, b, { range: 1.2 })).toBe(true);
  expect(combatContact(world, RAPIER, a, b, { range: 0.2 })).toBe(false);
  world.createCollider(RAPIER.ColliderDesc.cuboid(1, 2, 0.1).setTranslation(0, 1, 16.5));
  world.step();
  expect(combatContact(world, RAPIER, a, b, { range: 1.2 })).toBe(false);
  expect(combatContact(world, RAPIER, a, b)).toBe(false);
});

test('production combat resolves post-physics overlaps once per swing and never through walls', () => {
  const { actor } = setup();
  const sim = createCombat();
  sim.player.body = actor('owi', 0, 16).body;
  sim.guard.body = actor('guard', 0, 17).body;
  sim.player.yaw = Math.PI;
  sim.guard.stunUntil = 1000;
  const controller = createController(world);
  const motion = { verticalSpeed: 0 };
  const contact = (a,b,spec) => combatContact(world,RAPIER,a,b,spec);
  function tick(attack = false) {
    sim.player.position = sim.player.body.translation(); sim.guard.position = sim.guard.body.translation();
    const delta = prepareCombat(sim,{attack},contact);
    stepMotion(world,RAPIER,sim.player.body,controller,delta.player,motion);
    world.step();
    sim.player.position = sim.player.body.translation(); sim.guard.position = sim.guard.body.translation();
    resolveCombat(sim,contact);
  }
  world.step();tick(true);for(let i=0;i<22;i++)tick();
  expect(sim.guard.hp).toBe(40);
  expect(sim.events.filter(e=>e.type==='hit')).toHaveLength(1);
  world.createCollider(RAPIER.ColliderDesc.cuboid(1,2,0.1).setTranslation(0,1,16.5));world.step();
  tick(true);for(let i=0;i<22;i++)tick();
  expect(sim.guard.hp).toBe(40);
});

test('interaction sensors never block line of sight', () => {
  const { actor } = setup();
  const a = actor('owi', 0, 16);
  const b = actor('guard', 0, 17);
  world.createCollider(RAPIER.ColliderDesc.cuboid(1, 2, 0.1).setTranslation(0, 1, 16.5).setSensor(true));
  world.step();
  expect(combatContact(world, RAPIER, a, b, { range: 1.2 })).toBe(true);
});

test.each([[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]])('dash displacement uses production controller without crossing perimeter (%s,%s)', (x,z) => {
  const { actor } = setup();
  const a = actor('owi', x * 10.8, z > 0 ? 41.8 : z < 0 ? -6.8 : 8);
  const controller = createController(world);
  const state = { verticalSpeed: 0 };
  world.step();
  const length = Math.hypot(x,z);
  for (let i=0;i<12;i++) {
    stepMotion(world,RAPIER,a.body,controller,{ x:x/length*2.8/12,y:0,z:z/length*2.8/12 },state);
    world.step();
  }
  const p = a.body.translation();
  expect(p.x).toBeGreaterThan(-11.3);
  expect(p.x).toBeLessThan(11.3);
  expect(p.z).toBeGreaterThan(-7.3);
  expect(p.z).toBeLessThan(42.3);
  expect(p.y).toBeGreaterThan(0.84);
});
