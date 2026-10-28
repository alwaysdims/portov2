import { expect, test } from 'vitest';
import { Vector3 } from 'three';
import { attackExtension } from '../combatVisuals.js';

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
