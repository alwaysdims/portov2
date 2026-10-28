import { afterEach, beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { movementDelta, createController, stepPlayer, cameraPosition, WORLD_BOXES } from '../gameLogic.js';

beforeAll(async () => { await RAPIER.init(); });
let world;
afterEach(() => world?.free());

function scene() {
  world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  world.timestep = 1 / 60;
  for (const { position, size } of WORLD_BOXES) {
    world.createCollider(RAPIER.ColliderDesc.cuboid(...size.map(n => n / 2)).setTranslation(...position));
  }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 2, 0));
  world.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.35), body);
  const controller = createController(world);
  const state = { verticalSpeed: 0 };
  world.step();
  function ticks(count, keys = new Set(), yaw = 0) {
    for (let i = 0; i < count; i++) {
      stepPlayer(world, RAPIER, body, controller, keys, yaw, state);
      world.step();
    }
    return body.translation();
  }
  return { body, state, ticks };
}

test('diagonal movement keeps walking speed and sprint increases it', () => {
  const straight = movementDelta(new Set(['KeyW']), 0, 1);
  const diagonal = movementDelta(new Set(['KeyW', 'KeyD']), 0, 1);
  expect(straight.z).toBe(-3.5);
  expect(Math.hypot(diagonal.x, diagonal.z)).toBeCloseTo(3.5);
  expect(movementDelta(new Set(['KeyW', 'ShiftLeft']), 0, 1).z).toBe(-6);
});

test('W follows camera yaw, opposing keys cancel, time partitions preserve distance', () => {
  expect(movementDelta(new Set(['KeyW']), Math.PI / 2, 1).x).toBeCloseTo(-3.5);
  expect(movementDelta(new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD']), 0, 1)).toEqual({ x: 0, y: 0, z: 0 });
  const tick = movementDelta(new Set(['KeyD']), 0, 1 / 60);
  expect(tick.x * 60).toBeCloseTo(3.5);
  expect(movementDelta(new Set(), 0, 1)).toEqual({ x: 0, y: 0, z: 0 });
});

test('Owi settles above ground and remains grounded without drift', () => {
  const { ticks, state } = scene();
  const settled = ticks(180);
  expect(settled.y).toBeGreaterThan(0.85);
  expect(settled.y).toBeLessThan(0.9);
  expect(ticks(600).y).toBeCloseTo(settled.y, 4);
  expect(state.verticalSpeed).toBe(0);
});

test('walking and sprint stop at perimeter walls, including diagonal corners', () => {
  const { ticks } = scene();
  ticks(120);
  const north = ticks(300, new Set(['KeyW', 'ShiftLeft']));
  expect(north.z).toBeGreaterThan(-11.5);
  expect(north.z).toBeLessThan(-10.5);
  const corner = ticks(400, new Set(['KeyW', 'KeyD', 'ShiftRight']));
  expect(corner.x).toBeGreaterThan(10.5);
  expect(corner.x).toBeLessThan(11.5);
  expect(corner.z).toBeGreaterThan(-11.5);
});

test('Owi passes through the house doorway', () => {
  const { ticks, body } = scene();
  ticks(120);
  body.setTranslation({ x: -4, y: 0.88, z: -2 }, true);
  world.step();
  const door = ticks(55, new Set(['KeyW']));
  expect(door.z).toBeLessThan(-4.8);
  expect(door.y).toBeGreaterThan(0.85);
});

test('camera sphere stays in front of wall and excludes player body', () => {
  const { ticks, body } = scene();
  ticks(120);
  const target = { x: 0, y: 1.4, z: 0 };
  expect(cameraPosition(world, RAPIER, body, target, { x: 0, y: 2, z: 5 }).z).toBeCloseTo(5);
  const blocked = cameraPosition(world, RAPIER, body, target, { x: 0, y: 1.4, z: 15 });
  expect(blocked.z).toBeGreaterThan(10);
  expect(blocked.z).toBeLessThan(11.5);
});

test('camera obstruction query ignores interaction sensors', () => {
  const { ticks, body } = scene();
  world.createCollider(RAPIER.ColliderDesc.cuboid(1, 2, 0.1).setTranslation(0, 1, 2).setSensor(true));
  ticks(2);
  expect(cameraPosition(world, RAPIER, body, { x: 0, y: 1.4, z: 0 }, { x: 0, y: 1.4, z: 5 }).z).toBeCloseTo(5);
});
