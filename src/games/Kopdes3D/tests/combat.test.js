import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCombat, prepareCombat, resolveCombat, hitEligible, combatSnapshot } from '../combat.js';
import { ANCHORS, CHECKPOINTS } from '../environment/config.js';

const command = (overrides = {}) => ({ keys: new Set(), yaw: 0, attack: false, dash: false, switchStance: false, ...overrides });
function step(sim, input = {}, canHit = () => true) {
  const movement = prepareCombat(sim, command(input), canHit);
  for (const name of ['player', 'guard']) {
    sim[name].position.x += movement[name].x;
    sim[name].position.z += movement[name].z;
  }
  resolveCombat(sim, canHit);
  return movement;
}
function ticks(sim, count, input = {}) { for (let i = 0; i < count; i++) step(sim, input); }
function duel() {
  const sim = createCombat();
  sim.player.position = { x: 0, y: 0.87, z: 0 };
  sim.player.yaw = 0;
  sim.guard.position = { x: 0, y: 0.87, z: -1 };
  return sim;
}

test('createCombat exposes independent mutable actors and compact plain snapshot', () => {
  const sim = createCombat();
  assert.equal(sim.tick, 0);
  assert.deepEqual(sim.player.position, { x: CHECKPOINTS.home.position[0], y: 0.87, z: CHECKPOINTS.home.position[2] });
  const spawn = ANCHORS.find(anchor => anchor.id === 'guard-spawn').position;
  assert.deepEqual(sim.guard.position, { x: spawn[0], y: spawn[1] + 0.87, z: spawn[2] });
  assert.equal(sim.player.id, 'owi');
  assert.equal(sim.guard.id, 'guard');
  assert.equal(sim.player.faction, 'player');
  assert.equal(sim.guard.faction, 'enemy');
  assert.equal(sim.player.maxHP, 100);
  assert.equal(sim.guard.maxHP, 50);
  for (const actor of [sim.player, sim.guard]) {
    assert.equal(actor.hp, actor.maxHP);
    assert.equal(actor.state, 'IDLE');
    assert.equal(actor.attack, null);
    assert.equal(actor.stunUntil, 0);
    assert.equal(actor.invulnerableUntil, 0);
    assert.equal(actor.flashUntil, 0);
  }
  assert.deepEqual(combatSnapshot(sim), {
    tick: 0, playerHP: 100, enemyHP: 50, stance: 'fist', pendingStance: null,
    playerState: 'IDLE', enemyState: 'IDLE', combo: 0, dashCooldown: 0,
    invulnerable: false, skills: { prison: { cooldown: 0, ready: true }, ultimate: { cooldown: 0, ready: true } }, cast: null,
    enemyStunRemaining: 0, skillFeedback: null, cleared: false, events: [],
  });
  assert.equal(typeof hitEligible, 'function');
  assert.notEqual(sim.player.position, createCombat().player.position);
  assert.deepEqual(step(sim), { player: { x: 0, y: 0, z: 0 }, guard: { x: 0, y: 0, z: 0 } });
  assert.equal(sim.tick, 1);
});

test('walking, sprint, analog and camera-relative diagonal movement stay finite and normalized', () => {
  for (const [keys, speed] of [[['KeyW'], 3.5], [['KeyW', 'KeyD'], 3.5], [['KeyD', 'ShiftLeft'], 6]]) {
    const sim = createCombat();
    const move = step(sim, { keys: new Set(keys) }).player;
    assert.ok(Math.abs(Math.hypot(move.x, move.z) - speed / 60) < 1e-12);
    assert.equal(sim.player.state, 'MOVE');
    step(sim);
    assert.equal(sim.player.state, 'IDLE');
  }
  const sim = createCombat();
  const move = step(sim, { yaw: Math.PI / 2, analog: { x: 0, y: 1 } }).player;
  assert.ok(move.x < 0 && Math.abs(move.z) < 1e-12);
  assert.equal(sim.player.yaw, Math.PI / 2);
  assert.deepEqual(step(sim, { yaw: NaN, analog: { x: Infinity, y: 1 } }).player, { x: 0, y: 0, z: 0 });
  assert.equal(sim.player.yaw, Math.PI / 2);
});

test('fist attack uses exact 8/4/10 timeline, post-physics hit, one target per swing', () => {
  const sim = duel();
  const move = step(sim, { attack: true, keys: new Set(['KeyW']) });
  assert.deepEqual(move.player, { x: 0, y: 0, z: 0 });
  assert.equal(sim.player.state, 'ATTACK');
  assert.equal(sim.player.attack.age, 0);
  assert.equal(sim.player.attack.index, 0);
  assert.equal(sim.player.attack.stance, 'fist');
  assert.ok(sim.player.attack.hitTargets instanceof Set);
  const id = sim.player.attack.id;
  ticks(sim, 7);
  assert.equal(sim.guard.hp, 50);
  // Resolve must read current body pose, not pre-step transform.
  prepareCombat(sim, command());
  sim.guard.position.z = -1.2;
  resolveCombat(sim, () => true);
  assert.equal(sim.guard.hp, 40);
  assert.equal(sim.player.attack.id, id);
  assert.deepEqual([...sim.player.attack.hitTargets], ['guard']);
  ticks(sim, 13);
  assert.equal(sim.guard.hp, 40);
  assert.equal(sim.player.state, 'ATTACK');
  assert.equal(sim.player.attack.age, 21);
  step(sim);
  assert.equal(sim.player.attack, null);
  assert.equal(sim.player.state, 'IDLE');
  assert.equal(sim.events.length, 1);
});

test('fist and tray combo order, damage, timing, and last-ten recovery buffer', () => {
  for (const [stance, expected] of [
    ['fist', [[10, 8, 4, 10, 1.2, 35], [12, 7, 4, 10, 1.2, 35], [16, 10, 5, 16, 1.3, 40]]],
    ['tray', [[22, 14, 6, 18, 1.8, 60], [28, 18, 6, 24, 1.9, 65]]],
  ]) {
    const sim = duel();
    sim.guard.hp = sim.guard.maxHP = 500;
    sim.player.stance = stance;
    step(sim, { attack: true });
    for (let index = 0; index < expected.length; index++) {
      const [damage, windup, active, recovery, range, halfAngle] = expected[index];
      const attack = sim.player.attack;
      assert.equal(attack.index, index);
      assert.equal(attack.stance, stance);
      for (const [name, value] of Object.entries({ damage, windup, active, recovery, range, halfAngle })) assert.equal(attack.spec[name], value);
      ticks(sim, windup);
      assert.equal(sim.guard.hp, 500 - expected.slice(0, index + 1).reduce((sum, spec) => sum + spec[0], 0));
      while (sim.player.attack.age < windup + active + recovery - 10) step(sim);
      if (index < expected.length - 1) step(sim, { attack: true });
      while (sim.player.attack?.id === attack.id) step(sim);
    }
    assert.equal(sim.player.attack, null);
    assert.deepEqual(sim.events.map(event => event.damage), expected.map(spec => spec[0]));
  }
});

test('early clicks do not buffer, edge commands do not auto-repeat, spam cannot shorten timeline', () => {
  const sim = duel();
  step(sim, { attack: true });
  const first = sim.player.attack.id;
  for (let age = 1; age <= 11; age++) {
    step(sim, { attack: true });
    assert.equal(sim.player.attack.id, first);
    assert.equal(sim.player.attack.age, age);
  }
  ticks(sim, 11);
  assert.equal(sim.player.attack, null);
  ticks(sim, 30);
  assert.equal(sim.events.length, 1);
  const other = duel();
  step(other, { attack: true });
  for (let age = 1; age <= 21; age++) step(other, { attack: true });
  assert.equal(other.player.attack.id, first);
  step(other);
  assert.equal(other.player.attack.index, 1);
  assert.notEqual(other.player.attack.id, first);
});

test('stance switches queue one choice without resetting attack timeline or hit dedupe', () => {
  const sim = duel();
  step(sim, { switchStance: true });
  assert.equal(sim.player.stance, 'tray');
  step(sim, { switchStance: true, attack: true });
  const attack = sim.player.attack;
  assert.equal(attack.stance, 'fist');
  step(sim, { switchStance: true });
  assert.equal(sim.player.stance, 'fist');
  assert.equal(sim.player.pendingStance, 'tray');
  assert.equal(sim.player.attack, attack);
  assert.equal(attack.age, 1);
  step(sim, { switchStance: true });
  assert.equal(sim.player.pendingStance, 'fist');
  step(sim, { switchStance: true });
  while (sim.player.attack) step(sim);
  assert.equal(sim.player.stance, 'tray');
  assert.equal(sim.player.pendingStance, null);
  assert.equal(sim.guard.hp, 40);
});

test('dash eight directions travels 2.8m in 12 ticks, locks direction, cooldown and iframe edges', () => {
  const directions = [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]];
  for (const [x, y] of directions) {
    const sim = createCombat();
    const start = { ...sim.player.position };
    const keys = new Set([...(x > 0 ? ['KeyD'] : x < 0 ? ['KeyA'] : []), ...(y > 0 ? ['KeyW'] : y < 0 ? ['KeyS'] : [])]);
    step(sim, { dash: true, keys });
    assert.equal(sim.player.state, 'DASH');
    const locked = { ...sim.player.dash.direction };
    for (let age = 1; age <= 12; age++) {
      if (age > 1) step(sim, { dash: true, yaw: 2, analog: { x: -x, y: -y }, switchStance: age === 3 });
      assert.equal(sim.player.dash.age, age);
      assert.deepEqual(sim.player.dash.direction, locked);
      assert.equal(combatSnapshot(sim).invulnerable, age >= 2 && age <= 8);
      assert.equal(sim.player.stance, 'fist');
    }
    assert.ok(Math.abs(Math.hypot(sim.player.position.x - start.x, sim.player.position.z - start.z) - 2.8) < 1e-12);
    assert.equal(sim.player.dashReadyTick, 121);
    step(sim, { dash: true });
    assert.equal(sim.player.dash, null);
    assert.equal(sim.player.stance, 'tray');
    assert.equal(combatSnapshot(sim).dashCooldown, 108);
    ticks(sim, 107);
    assert.equal(sim.tick, 120);
    step(sim, { dash: true });
    assert.equal(sim.player.state, 'DASH');
    assert.equal(sim.player.dashReadyTick, 241);
  }
});

test('dash analog matches keys; no input uses actor facing; physics can block without compensation', () => {
  const keyboard = createCombat(), analog = createCombat();
  step(keyboard, { dash: true, keys: new Set(['KeyW', 'KeyD']), yaw: 0.8 });
  step(analog, { dash: true, analog: { x: 0.5, y: 0.5 }, yaw: 0.8 });
  assert.deepEqual(keyboard.player.dash, analog.player.dash);
  const sim = createCombat();
  sim.player.yaw = Math.PI / 2;
  const move = prepareCombat(sim, command({ dash: true }));
  assert.ok(move.player.x < 0 && Math.abs(move.player.z) < 1e-12);
  const start = { ...sim.player.position };
  resolveCombat(sim, () => true); // Caller physics blocked first displacement.
  ticks(sim, 11);
  assert.ok(Math.abs(Math.hypot(sim.player.position.x - start.x, sim.player.position.z - start.z) - 2.8 * 11 / 12) < 1e-12);
});

test('dash only cancels final six recovery ticks, never windup or active', () => {
  for (const age of [1, 7, 8, 11, 12, 15, 16, 20, 21]) {
    const sim = duel();
    step(sim, { attack: true });
    ticks(sim, age - 1);
    const attack = sim.player.attack;
    step(sim, { dash: true });
    if (age >= 16) {
      assert.equal(sim.player.attack, null);
      assert.equal(sim.player.state, 'DASH');
    } else {
      assert.equal(sim.player.attack, attack);
      assert.equal(sim.player.dash, null);
      assert.equal(sim.player.dashReadyTick, 0);
    }
  }
});

test('short stun cannot erase an existing hurt deadline', () => {
  const sim = duel();
  ticks(sim, 48);
  assert.equal(sim.player.state, 'HURT');
  const until = sim.player._hurtUntil;
  sim.player.stunUntil = sim.tick + 2;
  step(sim, { attack: true });
  assert.equal(sim.player.state, 'STUNNED');
  while (sim.tick < until - 1) {
    step(sim, { attack: true });
    assert.equal(sim.player.attack, null);
  }
  step(sim, { attack: true });
  assert.equal(sim.player.state, 'ATTACK');
});

test('guard abandons chase after 180 unseen ticks and must detect again', () => {
  const sim = duel();
  sim.guard.position.z = -8;
  ticks(sim, 12);
  assert.equal(sim.guard.state, 'CHASE');
  for (let i=0;i<180;i++) step(sim, {}, () => false);
  assert.equal(sim.guard.state, 'CHASE');
  const movement = step(sim, {}, () => false);
  assert.equal(sim.guard.state, 'IDLE');
  assert.deepEqual(movement.guard, {x:0,y:0,z:0});
  step(sim);
  assert.equal(sim.guard.state, 'DETECT');
});

test('guard requires 12 consecutive visible ticks within 8m then chases at 2.4m/s', () => {
  const sim = duel();
  sim.guard.position.z = -8;
  ticks(sim, 11);
  assert.equal(sim.guard.state, 'DETECT');
  assert.equal(sim.guard.position.z, -8);
  step(sim, {}, () => false);
  assert.equal(sim.guard.state, 'IDLE');
  ticks(sim, 11);
  assert.equal(sim.guard.state, 'DETECT');
  const move = step(sim).guard;
  assert.equal(sim.guard.state, 'CHASE');
  assert.ok(Math.abs(Math.hypot(move.x, move.z) - 2.4 / 60) < 1e-12);
  const far = duel();
  far.guard.position.z = -8.001;
  ticks(far, 30);
  assert.equal(far.guard.state, 'IDLE');
});

test('guard locks facing at windup, attacks 36/6/42, damage10 once and full recovery', () => {
  const sim = duel();
  ticks(sim, 12);
  assert.equal(sim.guard.state, 'ATTACK');
  const attack = sim.guard.attack;
  assert.equal(attack.age, 0);
  assert.deepEqual({ ...attack.spec }, { damage: 10, windup: 36, active: 6, recovery: 42, range: 1.3, halfAngle: 45, heightTolerance: 1 });
  const yaw = sim.guard.yaw;
  ticks(sim, 35);
  assert.equal(sim.player.hp, 100);
  step(sim);
  assert.equal(sim.player.hp, 90);
  assert.equal(sim.player.state, 'HURT');
  sim.player.position.x = 0.2;
  ticks(sim, 47);
  assert.equal(sim.guard.yaw, yaw);
  assert.equal(sim.guard.attack, attack);
  assert.equal(sim.player.hp, 90);
  step(sim);
  assert.equal(sim.guard.attack.age, 0);
  assert.notEqual(sim.guard.attack.id, attack.id);
});

test('hurt cancels attacks, holds 12 ticks, player iframes expire exactly after 24 ticks', () => {
  const sim = duel();
  ticks(sim, 47);
  step(sim, { attack: true }); // Guard lands before player marker.
  const hitTick = sim.tick;
  assert.equal(sim.player.hp, 90);
  assert.equal(sim.player.attack, null);
  assert.equal(sim.player.invulnerableUntil, hitTick + 24);
  step(sim, { attack: true, dash: true, switchStance: true, keys: new Set(['KeyW']) });
  assert.equal(sim.player.state, 'HURT');
  assert.equal(sim.player.pendingStance, 'tray');
  assert.equal(sim.player.stance, 'fist');
  ticks(sim, 10);
  assert.equal(sim.player.state, 'HURT');
  step(sim);
  assert.equal(sim.player.state, 'IDLE');
  assert.equal(sim.player.stance, 'tray');
  assert.equal(sim.player.attack, null);
  ticks(sim, 11);
  assert.equal(combatSnapshot(sim).invulnerable, true);
  step(sim);
  assert.equal(combatSnapshot(sim).invulnerable, false);
  assert.equal(sim.player.hp, 90);
});

test('guard hurt interrupts pre-active markers without immunity; terminal deaths emit once and clamp HP', () => {
  const sim = duel();
  ticks(sim, 12);
  const interrupted = sim.guard.attack.id;
  step(sim, { attack: true });
  ticks(sim, 8);
  assert.equal(sim.guard.hp, 40);
  assert.equal(sim.guard.state, 'HURT');
  assert.equal(sim.guard.attack, null);
  assert.equal(sim.guard.invulnerableUntil, 0);
  ticks(sim, 11);
  assert.equal(sim.guard.state, 'HURT');
  step(sim);
  assert.notEqual(sim.guard.attack?.id, interrupted);
  assert.equal(sim.player.hp, 100);
  sim.guard.hp = 1;
  while (sim.player.attack) step(sim);
  step(sim, { attack: true });
  ticks(sim, 8);
  assert.equal(sim.guard.hp, 0);
  assert.equal(sim.guard.state, 'DEAD');
  assert.equal(sim.guard.attack, null);
  assert.equal(sim.cleared, true);
  const event = sim.events.find(event => event.type === 'death');
  assert.equal(event.targetId, 'guard');
  ticks(sim, 200, { attack: true });
  assert.equal(sim.events.filter(item => item.type === 'death').length, 1);
  assert.equal(sim.player.hp, 100);
  assert.equal(sim.guard.hp, 0);
});

test('dead player ignores all commands and clears queued stance, combo and dash', () => {
  const sim = duel();
  sim.player.hp = 1;
  ticks(sim, 47);
  step(sim, { attack: true, switchStance: true });
  assert.equal(sim.player.hp, 0);
  assert.equal(sim.player.state, 'DEAD');
  assert.equal(sim.player.attack, null);
  assert.equal(sim.player.pendingStance, null);
  assert.equal(sim.player.dash, null);
  const stance = sim.player.stance;
  const position = { ...sim.player.position };
  ticks(sim, 100, { attack: true, dash: true, switchStance: true, keys: new Set(['KeyW']) });
  assert.deepEqual(sim.player.position, position);
  assert.equal(sim.player.stance, stance);
  assert.equal(sim.player.state, 'DEAD');
  assert.equal(sim.events.filter(event => event.type === 'death').length, 1);
});

test('LOS rejects active hits without consuming target dedupe; geometry still rejects callback positives', () => {
  const sim = duel();
  step(sim, { attack: true });
  for (let i = 0; i < 8; i++) step(sim, {}, () => false);
  assert.equal(sim.guard.hp, 50);
  assert.equal(sim.player.attack.hitTargets.size, 0);
  step(sim);
  assert.equal(sim.guard.hp, 40);
  assert.equal(hitEligible(sim.player, sim.guard, sim.player.attack.spec), false);
  for (const position of [{ x: 0, y: 0.87, z: 1 }, { x: 0, y: 3, z: -1 }, { x: 0, y: 0.87, z: -2 }]) {
    const other = duel();
    step(other, { attack: true });
    other.guard.position = position;
    ticks(other, 12);
    assert.equal(other.guard.hp, 50);
  }
});

test('non-finite yaw or analog reject new actions without poisoning simulation', () => {
  for (const invalid of [{ yaw: NaN }, { yaw: Infinity }, { analog: { x: NaN, y: 1 } }, { analog: { x: 1, y: -Infinity } }, { analog: null }]) {
    const sim = createCombat();
    const move = step(sim, { ...invalid, attack: true, dash: true, switchStance: true, keys: new Set(['KeyW']) });
    assert.deepEqual(move.player, { x: 0, y: 0, z: 0 });
    assert.equal(sim.player.attack, null);
    assert.equal(sim.player.dash, null);
    assert.equal(sim.player.stance, 'fist');
    assert.ok(Number.isFinite(sim.player.yaw));
  }
});

test('event ring stays 12 entries, monotonic IDs, copied positions and detached HUD snapshot', () => {
  const sim = duel();
  sim.guard.hp = sim.guard.maxHP = 10000;
  for (let i = 0; i < 15; i++) {
    step(sim, { attack: true });
    ticks(sim, 22);
  }
  assert.equal(sim.events.length, 12);
  assert.deepEqual(sim.events.map(event => event.id), Array.from({ length: 12 }, (_, i) => i + 4));
  const snapshot = combatSnapshot(sim);
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot);
  const eventPosition = { ...sim.events[0].position };
  sim.guard.position.x = 99;
  assert.deepEqual(sim.events[0].position, eventPosition);
  snapshot.events[0].position.x = 123;
  snapshot.events.pop();
  assert.equal(sim.events.length, 12);
  assert.deepEqual(sim.events[0].position, eventPosition);
  for (const event of sim.events) assert.deepEqual(Object.keys(event), ['id', 'tick', 'type', 'targetId', 'damage', 'position']);
});

test('fixed-tick replay identical across 30/60/120Hz render partitions', () => {
  function replay(pattern) {
    const sim = duel();
    sim.guard.hp = sim.guard.maxHP = 500;
    let frame = 0;
    while (sim.tick < 360) {
      const count = pattern[frame++ % pattern.length];
      for (let i = 0; i < count && sim.tick < 360; i++) {
        const tick = sim.tick + 1;
        step(sim, {
          attack: [1, 14, 36, 80, 115, 160, 230, 280].includes(tick),
          dash: [60, 190, 320].includes(tick),
          switchStance: [20, 70, 140, 200, 240].includes(tick),
          analog: tick > 120 && tick < 150 ? { x: 0, y: 1 } : { x: 0, y: 0 },
        }, (attacker, target, spec) => !(sim.tick >= 90 && sim.tick < 100) && spec.range > 0);
      }
    }
    return { snapshot: combatSnapshot(sim), player: sim.player, guard: sim.guard };
  }
  assert.deepEqual(replay([2]), replay([1]));
  assert.deepEqual(replay([0, 1]), replay([1]));
  assert.deepEqual(replay([0, 3, 1, 5]), replay([1]));
});

test('dash damage immunity includes ages 2 through 8 only', () => {
  for (let age = 1; age <= 12; age++) {
    const sim = duel();
    sim.player.dash = { age, direction: { x: 0, z: -1 } };
    sim.player.state = 'DASH';
    const spec = { damage: 10, windup: 36, active: 6, recovery: 42, range: 1.3, halfAngle: 45 };
    sim.guard.yaw = Math.PI;
    sim.guard.attack = { id: 1, index: 0, stance: 'guard', age: 36, spec, hitTargets: new Set() };
    resolveCombat(sim, () => true);
    assert.equal(sim.player.hp, age >= 2 && age <= 8 ? 100 : 90);
    assert.equal(sim.guard.attack.hitTargets.has('owi'), !(age >= 2 && age <= 8));
  }
});

test('all active ticks hit but adjacent windup/recovery ticks cannot hit', () => {
  for (const [stance, windup, active, recovery] of [['fist', 8, 4, 10], ['tray', 14, 6, 18]]) {
    for (const age of [windup - 1, windup, windup + active - 1, windup + active]) {
      const sim = duel();
      sim.player.stance = stance;
      step(sim, { attack: true });
      sim.player.attack.age = age;
      resolveCombat(sim, () => true);
      assert.equal(sim.guard.hp < 50, age >= windup && age < windup + active);
      assert.equal(sim.player.attack.spec.recovery, recovery);
    }
  }
});

test('tray early recovery click rejected, exact last-ten boundary accepted', () => {
  for (const [age, buffered] of [[27, false], [28, true]]) {
    const sim = duel();
    sim.guard.hp = sim.guard.maxHP = 500;
    sim.player.stance = 'tray';
    step(sim, { attack: true });
    ticks(sim, age - 1);
    step(sim, { attack: true });
    ticks(sim, 38 - age);
    assert.equal(sim.player.attack?.index ?? null, buffered ? 1 : null);
  }
});

test('simultaneous lethal markers resolve guard before owi, cancelled swing cannot retaliate', () => {
  const sim = duel();
  ticks(sim, 47);
  sim.player.hp = 10;
  sim.guard.hp = 10;
  step(sim, { attack: true }, () => false);
  sim.player.attack.age = 8;
  resolveCombat(sim, () => true);
  assert.equal(sim.player.state, 'DEAD');
  assert.equal(sim.guard.hp, 10);
  assert.deepEqual(sim.events.map(event => [event.type, event.targetId]), [['hit', 'owi'], ['death', 'owi']]);
  resolveCombat(sim, () => true);
  assert.equal(sim.events.length, 2);
});

test('stunUntil interrupts pending markers and releases exactly on deadline', () => {
  const sim = duel();
  ticks(sim, 12);
  step(sim, { attack: true });
  sim.player.stunUntil = sim.guard.stunUntil = sim.tick + 4;
  for (let i = 0; i < 3; i++) {
    const move = step(sim, { attack: true, dash: true });
    assert.deepEqual(move, { player: { x: 0, y: 0, z: 0 }, guard: { x: 0, y: 0, z: 0 } });
    assert.equal(sim.player.state, 'STUNNED');
    assert.equal(sim.guard.state, 'STUNNED');
    assert.equal(sim.player.attack, null);
    assert.equal(sim.guard.attack, null);
  }
  step(sim);
  assert.equal(sim.player.state, 'IDLE');
  assert.notEqual(sim.guard.state, 'STUNNED');
  assert.equal(sim.player.hp, 100);
  assert.equal(sim.guard.hp, 50);
});

test('invalid input cannot freeze existing attack timeline or rotate locked windup', () => {
  const sim = duel();
  step(sim, { attack: true });
  const yaw = sim.player.yaw;
  step(sim, { yaw: Math.PI, keys: new Set(['KeyD']) });
  assert.equal(sim.player.yaw, yaw);
  step(sim, { yaw: NaN, attack: true, switchStance: true, dash: true });
  assert.equal(sim.player.attack.age, 2);
  assert.equal(sim.player.pendingStance, null);
  ticks(sim, 6);
  assert.equal(sim.guard.hp, 40);
});

test('hitEligible includes sector/range/height boundaries and rejects invalid targets', () => {
  const sim = duel();
  const a = sim.player, b = sim.guard;
  const spec = { range: 1.2, halfAngle: 35, heightTolerance: 1 };
  assert.equal(hitEligible(a, b, spec), true);
  const radians = 35 * Math.PI / 180;
  b.position = { x: Math.sin(radians) * 1.2, y: 1.87, z: -Math.cos(radians) * 1.2 };
  assert.equal(hitEligible(a, b, spec), true);
  for (const position of [{ x: 0, y: 0.87, z: 1 }, { x: 0, y: 0.87, z: -1.201 },
    { x: 0, y: 1.871, z: -1 }, { x: 1, y: 0.87, z: -0.1 }, { x: NaN, y: 0.87, z: -1 }]) {
    b.position = position;
    assert.equal(hitEligible(a, b, spec), false);
  }
  b.position = { x: 0, y: 0.87, z: -1 };
  b.faction = 'player'; assert.equal(hitEligible(a, b, spec), false);
  b.faction = 'enemy'; b.state = 'DEAD'; assert.equal(hitEligible(a, b, spec), false);
  b.state = 'IDLE'; b.hp = 0; assert.equal(hitEligible(a, b, spec), false);
  b.hp = 50; b.invulnerableUntil = 10; assert.equal(hitEligible(a, b, spec), false);
  b.invulnerableUntil = 0; a.state = 'DEAD'; assert.equal(hitEligible(a, b, spec), false);
});
