import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCombat, prepareCombat, resolveCombat } from '../combat.js';

// Planar, unobstructed core fixtures are reproducible policy checks, not human playtests.
function duel(strategy, distance = 1) {
  const sim = createCombat();
  sim.player.position = { x: 0, y: 0.87, z: 0 };
  sim.player.yaw = 0;
  sim.guard.position = { x: 0, y: 0.87, z: -distance };
  if (strategy === 'tray') sim.player.stance = 'tray';
  for (let tick = 0; tick < 1200 && sim.player.hp > 0 && sim.guard.hp > 0; tick++) {
    const command = {};
    if (strategy === 'fist' || strategy === 'tray') command.attack = true;
    if (strategy === 'ultimate' && tick === 0) command.ultimate = true;
    if (strategy === 'prison-ultimate') {
      if (tick === 0) command.prison = true;
      else if (!sim.player.cast && sim.guard.stunUntil > sim.tick) command.ultimate = true;
    }
    const movement = prepareCombat(sim, command, () => true);
    for (const name of ['player', 'guard']) {
      sim[name].position.x += movement[name].x;
      sim[name].position.z += movement[name].z;
    }
    resolveCombat(sim, () => true);
  }
  return sim;
}

test.each([['fist', 104], ['tray', 57], ['ultimate', 40], ['prison-ultimate', 78]])(
  '%s close-range policy retains measured kill timeline without incoming damage', (strategy, ticks) => {
    const sim = duel(strategy);
    assert.equal(sim.tick, ticks);
    assert.equal(sim.guard.hp, 0);
    assert.equal(sim.player.hp, 100);
  });

test('range and interruption risk remain distinct from nominal ultimate damage', () => {
  const missed = duel('ultimate', 4.5);
  assert.equal(missed.guard.hp, 50);
  assert.equal(missed.player.hp, 0);
  const idle = duel('no-action');
  assert.equal(idle.tick, 804);
  assert.equal(idle.player.hp, 0);
  const fist = duel('fist', 1.8);
  assert.equal(fist.guard.hp, 0);
  assert.equal(fist.player.hp, 70);
});
