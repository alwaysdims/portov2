import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { skillShake } from '../combatVisuals.js';

// Execute the production camera block, not a second implementation of smoothing.
const source = readFileSync(new URL('../GameWorld.jsx', import.meta.url), 'utf8');
const start = source.indexOf('    const alpha = controls.cameraReady');
const end = source.indexOf('    controls.cameraReady = true;', start);
const update = new Function('cameraBase', 'camera', 'controls', 'desired', 'dt', 'simulation', 'reducedMotion', 'input', 'cameraPosition', 'skillShake', 'world', 'rapier', 'playerBody', 'target', source.slice(start, end));

test('actual camera integration never accumulates shake at30/60/120/240 FPS, pause or reduced motion', () => {
  for (const fps of [30, 60, 120, 240]) {
    const base = { current: null };
    const desired = { x: 0, y: 2, z: 5 };
    const camera = { position: { set(x, y, z) { Object.assign(this, { x, y, z }); } }, lookAt() {} };
    const sim = { tick: 100, player: { id: 'owi', hp: 100, state: 'CAST' }, events: [{ type: 'skill-impact', targetId: 'owi', tick: 100 }] };
    const input = { current: { locked: true } };
    const frame = reduced => update(base, camera, { cameraReady: true }, desired, 1 / fps, { current: sim }, reduced, input,
      (_world, _rapier, _body, _target, candidate) => ({ ...candidate }), skillShake, null, null, { current: null }, desired);
    for (let i = 0; i < fps; i++) {
      sim.tick = 100 + Math.floor(i * 60 / fps);
      frame(false);
      expect(Math.hypot(camera.position.x, camera.position.y - 2, camera.position.z - 5)).toBeLessThan(.025);
      expect(base.current).toEqual(desired);
    }
    sim.tick = 101;
    for (let i = 0; i < 10; i++) frame(false);
    const offset = skillShake(sim);
    expect(camera.position.x).toBeCloseTo(offset.x, 12);
    frame(true);
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(2);
    input.current.locked = false;
    frame(false);
    expect(camera.position.x).toBe(0);
    expect(camera.position.y).toBe(2);
  }
});
