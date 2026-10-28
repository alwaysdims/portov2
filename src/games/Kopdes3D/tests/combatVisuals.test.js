import { expect, test } from 'vitest';
import { Vector3 } from 'three';
import { attackExtension, castPose, cagePhase, impactProgress, skillShake } from '../combatVisuals.js';

const ultimate = { kind: 'ultimate', spec: { windup: 39, active: 3, recovery: 36, range: 3 } };
const impactSim = () => ({ tick: 100, player: { id: 'owi', hp: 100, state: 'CAST' }, events: [
  { id: 1, tick: 100, type: 'skill-impact', targetId: 'owi', position: { x: 1, y: 2, z: 3 } },
] });

test('cage phases follow 120 stun ticks and a bounded 12 tick break tail', () => {
  expect(cagePhase(99, 220)).toBe('hidden');
  expect(cagePhase(100, 220)).toBe('grow');
  expect(cagePhase(107, 220)).toBe('grow');
  expect(cagePhase(108, 220)).toBe('hold');
  expect(cagePhase(207, 220)).toBe('hold');
  expect(cagePhase(208, 220)).toBe('break');
  expect(cagePhase(220, 220)).toBe('break');
  expect(cagePhase(231, 220)).toBe('break');
  expect(cagePhase(232, 220)).toBe('hidden');
  expect(cagePhase(0, 0)).toBe('hidden');
});

test('ultimate impact uses player-center event only and expires exactly at tick 24', () => {
  const sim = impactSim();
  expect(impactProgress(sim)).toBe(0);
  sim.events.push({ id: 2, tick: 100, type: 'skill-impact', targetId: 'guard' });
  sim.tick = 123;
  expect(impactProgress(sim)).toBe(23 / 24);
  sim.tick = 124;
  expect(impactProgress(sim)).toBe(-1);
  sim.tick = 99;
  expect(impactProgress(sim)).toBe(-1);
  sim.tick = 100;
  sim.player.hp = 0;
  expect(impactProgress(sim)).toBe(-1);
  sim.player.hp = 100;
  sim.player.state = 'DEAD';
  expect(impactProgress(sim)).toBe(-1);
  sim.player.state = 'IDLE';
  sim.events.shift();
  expect(impactProgress(sim)).toBe(-1);
});

test('skill shake deterministic, bounded to .025m and off at 12 ticks, death or reduced motion', () => {
  const sim = impactSim();
  const zero = { x: 0, y: 0, z: 0 };
  for (let age = 0; age < 12; age++) {
    sim.tick = 100 + age;
    const shake = skillShake(sim);
    expect(shake).toEqual(skillShake(sim));
    expect(Math.hypot(shake.x, shake.y, shake.z)).toBeLessThanOrEqual(0.025);
    expect(shake).not.toEqual(zero);
  }
  sim.tick = 112;
  expect(skillShake(sim)).toEqual(zero);
  sim.tick = 100;
  expect(skillShake(sim, true)).toEqual(zero);
  sim.player.hp = 0;
  expect(skillShake(sim)).toEqual(zero);
  sim.player.hp = 100;
  sim.player.state = 'DEAD';
  expect(skillShake(sim)).toEqual(zero);
  sim.player.state = 'IDLE';
  sim.events = [];
  expect(skillShake(sim)).toEqual(zero);
});

test('ultimate raises tray during windup, slams at active marker, retracts in recovery', () => {
  expect(castPose(null)).toBe(0);
  expect(castPose({ ...ultimate, age: 0 })).toBe(0);
  expect(castPose({ ...ultimate, age: 38 })).toBeCloseTo(-38 / 39);
  expect(castPose({ ...ultimate, age: 39 })).toBe(1);
  expect(castPose({ ...ultimate, age: 41 })).toBe(1);
  expect(castPose({ ...ultimate, age: 42 })).toBe(1);
  expect(castPose({ ...ultimate, age: 60 })).toBe(0.5);
  expect(castPose({ ...ultimate, age: 78 })).toBe(0);
  expect(castPose({ ...ultimate, kind: 'prison', age: 39 })).toBe(1);
});

test('punch extends forward at damage window and retracts only in recovery', () => {
  expect(attackExtension(null)).toBe(0);
  for (const spec of [{ windup:8,active:4,recovery:10 },{windup:36,active:6,recovery:42}]) {
    const attack={spec,age:0};
    expect(attackExtension(attack)).toBe(0);
    for(let age=spec.windup;age<spec.windup+spec.active;age++) {
      attack.age=age;expect(attackExtension(attack)).toBe(1);
      const hand=new Vector3(0,-0.4,0).applyAxisAngle(new Vector3(1,0,0),attackExtension(attack)*2);
      expect(hand.z).toBeLessThan(0);
    }
    attack.age=spec.windup+spec.active+spec.recovery;
    expect(attackExtension(attack)).toBe(0);
  }
});
