import { afterEach, beforeAll, expect, test } from 'vitest';
import RAPIER from '@dimforge/rapier3d-compat';
import { Box3, ConeGeometry, Group, Mesh } from 'three';
import { cameraPosition, createController, stepPlayer } from '../gameLogic.js';
import { ANCHORS, ARENA_BOUNDS, CHECKPOINTS, ENVIRONMENT_COLLIDERS, EXTERIOR_BOXES, INTERIOR_BOXES, NAVIGATION_ROUTE, PLAYER_HALF_HEIGHT, ROOFS, SHELVES, VILLAGE_BOXES } from '../environment/config.js';

beforeAll(async () => { await RAPIER.init(); });
let world;
afterEach(() => { world?.free(); world = null; });
function scene(floor = CHECKPOINTS.home.position) {
  world = new RAPIER.World({ x: 0, y: -20, z: 0 });
  world.timestep = 1 / 60;
  for (const { position, size } of ENVIRONMENT_COLLIDERS) {
    world.createCollider(RAPIER.ColliderDesc.cuboid(...size.map(n => n / 2)).setTranslation(...position));
  }
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(floor[0], floor[1] + PLAYER_HALF_HEIGHT + 0.04, floor[2]));
  world.createCollider(RAPIER.ColliderDesc.capsule(0.5, 0.35), body);
  const controller = createController(world);
  const state = { verticalSpeed: 0 };
  world.step();
  function ticks(n, keys = new Set(), yaw = 0) {
    for (let i = 0; i < n; i++) {
      stepPlayer(world, RAPIER, body, controller, keys, yaw, state);
      world.step();
    }
    return body.translation();
  }
  function travel(point) {
    for (let i = 0; i < 1000; i++) {
      const p = body.translation();
      if (Math.hypot(point[0] - p.x, point[2] - p.z) < 0.09) return;
      ticks(1, new Set(['KeyW']), Math.atan2(p.x - point[0], p.z - point[2]));
      expect(body.translation().y).toBeGreaterThan(0.84);
    }
    throw new Error(`Route blocked before ${point}; player ${JSON.stringify(body.translation())}`);
  }
  ticks(60);
  return { body, ticks, travel };
}

function clearFloorPoint([x, y, z]) {
  return ENVIRONMENT_COLLIDERS.every(box => {
    const [bx, by, bz] = box.position;
    const [w, h, d] = box.size;
    // Entire upright capsule plus controller skin; ignore only surfaces below feet.
    return by + h / 2 <= y + 0.04 || by - h / 2 >= y + 1.78 ||
      Math.abs(x - bx) > w / 2 + 0.37 || Math.abs(z - bz) > d / 2 + 0.37;
  });
}

test('configuration has stable unique IDs, finite transforms and positive box sizes', () => {
  const boxes = [...VILLAGE_BOXES, ...EXTERIOR_BOXES, ...INTERIOR_BOXES];
  expect(new Set(boxes.map(box => box.id)).size).toBe(boxes.length);
  expect(new Set(ANCHORS.map(anchor => anchor.id)).size).toBe(ANCHORS.length);
  for (const box of boxes) {
    expect(box.position).toHaveLength(3);
    expect(box.position.every(Number.isFinite)).toBe(true);
    expect(box.size.every(n => Number.isFinite(n) && n > 0)).toBe(true);
    expect(typeof box.solid).toBe('boolean');
  }
  expect(ENVIRONMENT_COLLIDERS.every(box => box.solid)).toBe(true);
});

test('all required anchors, checkpoints and shelf approach points are unobstructed', () => {
  for (const id of ['player-spawn', 'npc-ibu', 'guard-spawn', 'boss-spawn', 'combat-arena', 'kopdes-gate', 'cashier-npc', 'checkout-trigger', 'level-exit']) {
    expect(ANCHORS.some(anchor => anchor.id === id)).toBe(true);
  }
  for (const anchor of ANCHORS) expect(clearFloorPoint(anchor.position), anchor.id).toBe(true);
  for (const checkpoint of Object.values(CHECKPOINTS)) expect(clearFloorPoint(checkpoint.position)).toBe(true);
  for (const shelf of SHELVES) {
    expect(ANCHORS.some(anchor => anchor.shelfId === shelf.id)).toBe(true);
    expect(Math.hypot(...shelf.facing)).toBe(1);
    // Surface distance remains within Phase 1's 1.8 m interaction limit.
    const dx = Math.max(0, Math.abs(shelf.interaction[0] - shelf.position[0]) - shelf.size[0] / 2);
    const dz = Math.max(0, Math.abs(shelf.interaction[2] - shelf.position[2]) - shelf.size[2] / 2);
    expect(Math.hypot(dx, dz)).toBeLessThanOrEqual(1.8);
  }
});

test('roof group scales after mesh rotation and collider covers complete roof bounds', () => {
  for (const roof of ROOFS) {
    const geometry = new ConeGeometry(1, roof.height, 4);
    const mesh = new Mesh(geometry);
    mesh.rotation.y = Math.PI / 4;
    const group = new Group();
    group.position.set(...roof.position);
    group.scale.set(roof.width / Math.SQRT2, 1, roof.depth / Math.SQRT2);
    group.add(mesh);
    group.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(group, true);
    const proxy = ENVIRONMENT_COLLIDERS.find(box => box.id === roof.id);
    for (const [index, axis] of ['x', 'y', 'z'].entries()) {
      expect(bounds.max[axis] - bounds.min[axis]).toBeCloseTo(proxy.size[index], 5);
      expect((bounds.max[axis] + bounds.min[axis]) / 2).toBeCloseTo(proxy.position[index], 5);
    }
    geometry.dispose();
    mesh.material.dispose();
  }
});

test('camera beside home cannot overlap pitched roof at maximum pitch', () => {
  const { body } = scene([4.5, 0, -2]);
  const target = { x: 4.5, y: 1.32, z: -2 };
  const desired = { x: 4.5 - Math.cos(1.05) * 5, y: target.y + Math.sin(1.05) * 5, z: -2 };
  const safe = cameraPosition(world, RAPIER, body, target, desired);
  const roof = ENVIRONMENT_COLLIDERS.find(box => box.id === 'home-roof');
  expect(Math.abs(safe.x) > roof.size[0] / 2 || safe.y < roof.position[1] - roof.size[1] / 2 - 0.2).toBe(true);
});

test('14 x 14 m arena stays clear with room for future dash/dodge', () => {
  expect(ARENA_BOUNDS.max[0] - ARENA_BOUNDS.min[0]).toBe(14);
  expect(ARENA_BOUNDS.max[2] - ARENA_BOUNDS.min[2]).toBe(14);
  for (let x = -6.5; x <= 6.5; x += 0.5) for (let z = 9.5; z <= 22.5; z += 0.5) {
    expect(clearFloorPoint([x, 0, z])).toBe(true);
  }
});

test('real existing controller traverses home, road, arena, gate, entrance and cashier, then returns', () => {
  const { body, travel, ticks } = scene();
  for (const point of NAVIGATION_ROUTE) travel(point);
  expect(body.translation().z).toBeCloseTo(36, 0);
  for (const point of [...NAVIGATION_ROUTE].reverse()) travel(point);
  expect(body.translation().z).toBeCloseTo(-1, 0);
  const y = body.translation().y;
  expect(ticks(600).y).toBeCloseTo(y, 4);
});

test.each(SHELVES.map(shelf => [shelf.id, shelf]))('shelf %s is reachable; sprint cannot cross fixture', (_, shelf) => {
  const { body, travel, ticks } = scene(CHECKPOINTS.shop.position);
  travel([0, 0, shelf.interaction[2]]);
  travel(shelf.interaction);
  const p = body.translation();
  ticks(180, new Set(['KeyW', 'ShiftLeft']), Math.atan2(p.x - shelf.position[0], p.z - shelf.position[2]));
  const stopped = body.translation();
  const dx = Math.abs(stopped.x - shelf.position[0]) - shelf.size[0] / 2;
  const dz = Math.abs(stopped.z - shelf.position[2]) - shelf.size[2] / 2;
  expect(Math.max(dx, dz)).toBeGreaterThan(0.34);
});

test.each([
  ['home-left', [0, 0, -2], ['KeyA'], 0, 'x', -2.5, -2.3],
  ['shop-left', [0, 0, 30], ['KeyA'], 0, 'x', -7.6, -7.3],
  ['shop-back', [-1.8, 0, 38], ['KeyW'], Math.PI, 'z', 39.3, 39.6],
  ['perimeter-east', [0, 0, 7], ['KeyD'], 0, 'x', 11.1, 11.4],
])('%s blocks sprint', (_, floor, codes, yaw, axis, min, max) => {
  const { ticks } = scene(floor);
  const p = ticks(240, new Set([...codes, 'ShiftLeft']), yaw);
  expect(p[axis]).toBeGreaterThan(min);
  expect(p[axis]).toBeLessThan(max);
});

test.each([
  ['home wall', [0, 0, -2], { x: 0, y: 1.4, z: -2 }, { x: -6, y: 1.4, z: -2 }],
  ['shop wall', [0, 0, 30], { x: 0, y: 1.4, z: 30 }, { x: 12, y: 1.4, z: 30 }],
  ['shelf', [0, 0, 33], { x: 0, y: 1.4, z: 33 }, { x: -7, y: 1.4, z: 33 }],
  ['ceiling', [0, 0, 32], { x: 0, y: 1.4, z: 32 }, { x: 0, y: 7, z: 32 }],
])('camera sphere cannot cross %s', (_, floor, target, desired) => {
  const { body } = scene(floor);
  const safe = cameraPosition(world, RAPIER, body, target, desired);
  expect(Math.hypot(safe.x - target.x, safe.y - target.y, safe.z - target.z)).toBeLessThan(
    Math.hypot(desired.x - target.x, desired.y - target.y, desired.z - target.z) - 0.2);
  expect(world.intersectionWithShape(safe, { x: 0, y: 0, z: 0, w: 1 }, new RAPIER.Ball(0.2), RAPIER.QueryFilterFlags.EXCLUDE_SENSORS, undefined, undefined, body)).toBeNull();
});
