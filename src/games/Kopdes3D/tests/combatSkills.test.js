import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createCombat, prepareCombat, resolveCombat, combatSnapshot } from '../combat.js';
import { BALANCE, SKILLS } from '../combatConfig.js';
import { createObjectives, advanceObjectives } from '../objectives.js';

function duel(distance = 4) {
  const sim = createCombat();
  sim.player.position = { x: 0, y: 0.87, z: 0 };
  sim.player.yaw = 0;
  sim.guard.position = { x: 0, y: 0.87, z: -distance };
  return sim;
}
function step(sim, command = {}, canHit = () => true, flags) {
  const movement = prepareCombat(sim, command, canHit, flags);
  for (const actor of [sim.player, ...new Set([sim.guard, ...(sim.enemies ?? [])])]) {
    const move = actor === sim.player ? movement.player : actor === sim.guard ? movement.guard : movement.enemies[actor.id];
    actor.position.x += move.x;
    actor.position.z += move.z;
  }
  resolveCombat(sim, canHit);
  return movement;
}
function ticks(sim, count, command = {}, canHit) {
  for (let i = 0; i < count; i++) step(sim, command, canHit);
}

function enemy(id, x, z) {
  return { ...createCombat().guard, id, position: { x, y: 0.87, z } };
}

test('prison accepts CAST, pays cooldown immediately and stuns only post-physics at age18', () => {
  const sim = duel();
  assert.equal(sim.player.cast, null);
  step(sim, { prison: true });
  assert.equal(sim.player.state, 'CAST');
  assert.equal(sim.player.cast.kind, 'prison');
  assert.equal(sim.player.cast.age, 0);
  assert.equal(sim.player.cast.targetId, 'guard');
  assert.equal(sim.player.prisonReadyTick, 721);
  ticks(sim, 17);
  assert.equal(sim.guard.stunUntil, 0);
  prepareCombat(sim);
  assert.equal(sim.player.cast.age, 18);
  assert.equal(sim.guard.stunUntil, 0);
  resolveCombat(sim);
  assert.equal(sim.guard.stunUntil, sim.tick + 120);
  assert.equal(sim.guard.state, 'STUNNED');
  assert.equal(sim.guard.hp, 50);
  assert.equal(combatSnapshot(sim).enemyStunRemaining, 120);
});

test('prison selects deterministic nearest valid enemy; explicit valid choice wins, invalid IDs reject', () => {
  const sim = duel();
  const b = enemy('b', 1, -3), a = enemy('a', -1, -3);
  sim.enemies = [b, sim.guard, a];
  step(sim, { prison: true });
  assert.equal(sim.player.cast.targetId, 'a');
  const explicit = duel();
  explicit.enemies = [enemy('near', 0, -2)];
  step(explicit, { prison: true, targetId: 'guard' });
  assert.equal(explicit.player.cast.targetId, 'guard');
  for (const targetId of ['', 7, null, {}, 'missing', '__proto__']) {
    const invalid = duel();
    step(invalid, { prison: true, targetId });
    assert.equal(invalid.player.cast, null);
    assert.equal(invalid.player.prisonReadyTick, 0);
    assert.equal(invalid.skillFeedback, 'prison:invalid-target');
  }
});

test('prison rejects blocked, far, behind, high, dead targets; locked target revalidated after physics', () => {
  for (const position of [{ x: 0, y: 0.87, z: -5.01 }, { x: 0, y: 0.87, z: 2 }, { x: 0, y: 2, z: -2 }]) {
    const sim = duel(); sim.guard.position = position;
    step(sim, { prison: true });
    assert.equal(sim.player.cast, null);
    assert.equal(sim.skillFeedback, 'prison:no-target');
  }
  const dead = duel(); dead.guard.hp = 0;
  step(dead, { prison: true });
  assert.equal(dead.player.cast, null);
  const wall = duel();
  step(wall, { prison: true }, () => false);
  assert.equal(wall.player.cast, null);
  for (const change of ['range', 'wall', 'dead']) {
    const sim = duel();
    step(sim, { prison: true }); ticks(sim, 17);
    prepareCombat(sim);
    if (change === 'range') sim.guard.position.z = -6;
    if (change === 'dead') sim.guard.hp = 0;
    resolveCombat(sim, () => change !== 'wall');
    assert.equal(sim.guard.stunUntil, 0);
    assert.equal(sim.player.prisonReadyTick, 721);
  }
});

test('stun exact120 ticks, does not refresh, persists through basic hurt and AI resumes without old damage', () => {
  const sim = duel(1);
  step(sim, { prison: true }); ticks(sim, 18);
  const until = sim.guard.stunUntil;
  assert.equal(sim.guard.attack, null);
  resolveCombat(sim);
  assert.equal(sim.guard.stunUntil, until);
  while (sim.player.cast) step(sim);
  step(sim, { attack: true }); ticks(sim, 8);
  assert.equal(sim.guard.hp, 40);
  assert.equal(sim.guard.state, 'STUNNED');
  assert.equal(sim.guard.stunUntil, until);
  // Reapply another accepted prison while existing stun remains: no extension.
  while (sim.player.attack) step(sim);
  sim.player.prisonReadyTick = sim.tick;
  step(sim, { prison: true }); ticks(sim, 18);
  assert.equal(sim.guard.stunUntil, until);
  while (sim.tick < until - 1) {
    step(sim); assert.equal(sim.guard.state, 'STUNNED');
    assert.equal(sim.player.hp, 100);
  }
  step(sim);
  assert.notEqual(sim.guard.state, 'STUNNED');
  ticks(sim, 11);
  assert.equal(sim.guard.attack.age, 0);
  ticks(sim, 35); assert.equal(sim.player.hp, 100);
  step(sim); assert.equal(sim.player.hp, 90);
});

test('prison reports failed marker, immunity and existing stun once without extending duration', () => {
  for (const reason of ['missed', 'resisted', 'target-stunned']) {
    const sim = duel(); step(sim, { prison: true }); ticks(sim, 17);
    if (reason === 'missed') sim.guard.position.z = -10;
    if (reason === 'resisted') sim.guard.stunResistance = 1;
    if (reason === 'target-stunned') sim.guard.stunUntil = sim.tick + 100;
    step(sim);
    assert.equal(sim.skillFeedback, `prison:${reason}`);
    const until = sim.guard.stunUntil;
    resolveCombat(sim);
    assert.equal(sim.guard.stunUntil, until);
  }
});

test('stunResistance scales finite duration, clamps invalid values, immunity cannot lock AI forever', () => {
  for (const [resistance, duration] of [[0, 120], [0.5, 60], [1, 0], [-3, 120], [3, 0], [NaN, 120], [Infinity, 120]]) {
    const sim = duel(1); sim.guard.stunResistance = resistance;
    step(sim, { prison: true }); ticks(sim, 18);
    assert.equal(Math.max(0, sim.guard.stunUntil - sim.tick), duration);
    assert.ok(sim.guard.stunResistance >= 0 && sim.guard.stunResistance <= 1);
    ticks(sim, duration + 100);
    assert.notEqual(sim.guard.state, 'STUNNED');
  }
});

test('ultimate39/3/36 dedup multi-target and one center impact; basic swings support optional enemies', () => {
  const sim = duel(2.9);
  const b = enemy('b', 2, 0), c = enemy('c', 0, 2.9), far = enemy('far', 4, 0);
  sim.enemies = [c, b, sim.guard, far, b];
  for (const target of [sim.guard, b, c, far]) target.hp = target.maxHP = 200;
  step(sim, { ultimate: true });
  assert.equal(sim.player.ultimateReadyTick, 1501);
  ticks(sim, 38, {}, a => a === sim.player);
  assert.equal(sim.guard.hp, 200);
  const center = { ...sim.player.position };
  step(sim, {}, (a, target) => a === sim.player && target !== b);
  assert.equal(sim.guard.hp, 134); assert.equal(c.hp, 134);
  assert.equal(b.hp, 200); assert.equal(far.hp, 200);
  step(sim, {}, a => a === sim.player);
  assert.equal(b.hp, 134);
  resolveCombat(sim);
  ticks(sim, 38, {}, a => a === sim.player);
  assert.equal(sim.player.cast, null);
  assert.deepEqual([sim.guard.hp, b.hp, c.hp, far.hp], [134, 134, 134, 200]);
  const impacts = sim.events.filter(event => event.type === 'skill-impact');
  assert.equal(impacts.length, 1);
  assert.deepEqual(impacts[0].position, center);
  assert.equal(impacts[0].targetId, 'owi');
  for (const event of sim.events) assert.deepEqual(Object.keys(event), ['id', 'tick', 'type', 'targetId', 'damage', 'position']);
  const basic = duel(1);
  const extra = enemy('extra', 0.2, -1);
  basic.enemies = [extra];
  step(basic, { attack: true }); ticks(basic, 8);
  assert.deepEqual([basic.guard.hp, extra.hp], [40, 40]);
});

test('ultimate knockback requests1.2m over12 ticks; controller can block; hurt and death clear pending movement', () => {
  const sim = duel(2);
  sim.guard.hp = sim.guard.maxHP = 200;
  step(sim, { ultimate: true }); ticks(sim, 39, {}, a => a === sim.player);
  const start = { ...sim.guard.position };
  for (let i = 0; i < 12; i++) {
    const movement = prepareCombat(sim, {}, a => a === sim.player);
    assert.ok(Math.abs(Math.hypot(movement.guard.x, movement.guard.z) - 0.1) < 1e-12);
    if (i !== 0) { sim.guard.position.x += movement.guard.x; sim.guard.position.z += movement.guard.z; }
    resolveCombat(sim, a => a === sim.player);
  }
  assert.ok(Math.abs(Math.hypot(sim.guard.position.x - start.x, sim.guard.position.z - start.z) - 1.1) < 1e-12);
  assert.equal(sim.guard.knockback, null);
  sim.player.cast = null; sim.player.state = 'IDLE'; sim.guard.position.z = -1;
  step(sim, { attack: true });
  sim.player.attack.age = 8;
  sim.guard.knockback = { x: 0, z: -0.1, remaining: 8 };
  const hp = sim.guard.hp;
  resolveCombat(sim);
  assert.equal(sim.guard.hp, hp - 10);
  assert.equal(sim.guard.knockback, null);
  sim.guard.knockback = { x: 0, z: -0.1, remaining: 8 }; sim.guard.hp = 0;
  step(sim); assert.equal(sim.guard.knockback, null);
});

test('CAST blocks attack dash movement, queues stance, and paid cooldown survives interruption', () => {
  for (const kind of ['prison', 'ultimate']) {
    const sim = duel(1);
    step(sim, { [kind]: true, attack: true, dash: true });
    const cast = sim.player.cast;
    const ready = sim.player[`${kind}ReadyTick`];
    step(sim, { attack: true, dash: true, switchStance: true, prison: true, keys: new Set(['KeyW']) });
    assert.equal(sim.player.cast, cast);
    assert.equal(sim.player.state, 'CAST');
    assert.equal(sim.player.attack, null); assert.equal(sim.player.dash, null);
    assert.equal(sim.player.pendingStance, 'tray');
    assert.equal(sim.skillFeedback, 'prison:busy');
    // Existing guard marker interrupts before cast active, never refunds.
    sim.guard.yaw = Math.PI;
    sim.guard.state = 'ATTACK';
    sim.guard.attack = { id: 99, age: 36, spec: BALANCE.enemy.attack, hitTargets: new Set() };
    sim.player.knockback = { x: 0.1, z: 0, remaining: 3 };
    resolveCombat(sim);
    assert.equal(sim.player.cast, null); assert.equal(sim.player.knockback, null);
    assert.equal(sim.skillFeedback, `${kind}:interrupted`);
    assert.equal(sim.player[`${kind}ReadyTick`], ready);
    ticks(sim, 12);
    assert.equal(sim.player.stance, 'tray');
    assert.equal(sim.guard.hp, 50); assert.equal(sim.guard.stunUntil, 0);
    step(sim, { [kind]: true });
    assert.equal(sim.skillFeedback, `${kind}:cooldown`);
  }
});

test('cooldown exact deadline and completed CAST queued stance never shorten recovery', () => {
  for (const kind of ['prison', 'ultimate']) {
    const sim = duel(4);
    step(sim, { [kind]: true });
    const total = SKILLS[kind].windup + SKILLS[kind].active + SKILLS[kind].recovery;
    for (let age = 1; age < total; age++) {
      step(sim, { switchStance: age === 1, attack: true, dash: true }, () => false);
      assert.equal(sim.player.cast.age, age);
      assert.equal(sim.player.stance, 'fist');
    }
    step(sim, {}, () => false);
    assert.equal(sim.player.cast, null); assert.equal(sim.player.stance, 'tray');
    const ready = sim.player[`${kind}ReadyTick`];
    ticks(sim, ready - sim.tick - 2, {}, () => false);
    step(sim, { [kind]: true }, kind === 'prison' ? a => a === sim.player : () => false);
    assert.equal(sim.player.cast, null); assert.equal(sim.skillFeedback, `${kind}:cooldown`);
    sim.guard.position = { x: 0, y: 0.87, z: -4 };
    step(sim, { [kind]: true });
    assert.equal(sim.player.cast.kind, kind);
    assert.equal(sim.tick, ready);
  }
});

test('paused/modal calls preserve full sim, active markers, movement and cooldown', () => {
  for (const flags of [{ paused: true }, { modal: true }]) {
    const sim = duel(); step(sim, { prison: true }); ticks(sim, 17);
    const before = structuredClone(sim);
    for (let i = 0; i < 50; i++) {
      const move = step(sim, { ultimate: true, attack: true, switchStance: true }, () => true, flags);
      assert.deepEqual(move.player, { x: 0, y: 0, z: 0 });
      assert.deepEqual(move.guard, { x: 0, y: 0, z: 0 });
    }
    assert.deepEqual(sim, before);
    step(sim);
    assert.equal(sim.guard.stunUntil, sim.tick + 120);
  }
});

test('defensive commands reject malformed inputs; dead/stunned player cannot cast or leave delayed markers', () => {
  for (const command of [null, 1, [], 'prison', { prison: 'yes' }, { ultimate: 1 }, { keys: {} }, { targetId: {} }, { yaw: NaN }, { analog: null }]) {
    const sim = duel();
    assert.doesNotThrow(() => step(sim, command));
    assert.equal(sim.player.cast, null);
    assert.equal(sim.player.prisonReadyTick, 0);
    assert.equal(sim.player.ultimateReadyTick, 0);
  }
  for (const state of ['DEAD', 'STUNNED']) {
    const sim = duel(); step(sim, { ultimate: true });
    if (state === 'DEAD') sim.player.hp = 0;
    else sim.player.stunUntil = sim.tick + 120;
    step(sim, { prison: true, ultimate: true });
    assert.equal(sim.player.cast, null);
    ticks(sim, 80, { prison: true, ultimate: true });
    assert.equal(sim.guard.hp, 50);
    assert.equal(sim.guard.stunUntil, 0);
  }
});

test('all-enemy death clears once, objective gate consumes deaths idempotently, retry resets combat', () => {
  const sim = duel(2.9), extra = enemy('extra', 2.9, 0);
  sim.enemies = [extra];
  extra.hp = extra.maxHP = 100;
  const objective = createObjectives(['guard', 'extra']);
  step(sim, { ultimate: true }); ticks(sim, 39, {}, a => a === sim.player);
  assert.equal(sim.guard.state, 'DEAD'); assert.equal(extra.hp, 34); assert.equal(sim.cleared, false);
  advanceObjectives(objective, { tick: sim.tick, player: sim.player, events: sim.events });
  assert.equal(objective.gate, 'LOCKED');
  sim.player.cast = null; sim.player.state = 'IDLE'; sim.player.ultimateReadyTick = sim.tick;
  extra.knockback = null;
  extra.position = { x: 2.9, y: 0.87, z: 0 };
  step(sim, { ultimate: true }); ticks(sim, 39, {}, a => a === sim.player);
  assert.equal(extra.state, 'DEAD'); assert.equal(sim.cleared, true);
  const events = structuredClone(sim.events);
  for (let i = 0; i < 70; i++) {
    resolveCombat(sim);
    advanceObjectives(objective, { tick: sim.tick + i, player: sim.player, events: sim.events });
  }
  assert.deepEqual(sim.events, events);
  assert.equal(objective.clearCount, 1); assert.equal(objective.gate, 'OPEN');
  assert.equal(sim.events.filter(e => e.type === 'death').length, 2);
  const retry = createCombat();
  assert.equal(retry.player.cast, null); assert.equal(retry.skillFeedback, null);
  assert.equal(retry.player.prisonReadyTick, 0); assert.equal(retry.player.ultimateReadyTick, 0);
  assert.equal(retry.guard.stunUntil, 0); assert.equal(retry.guard.stunResistance, 0);
  assert.equal(retry.guard.knockback, null); assert.equal(retry.cleared, false);
  assert.equal(retry.events.length, 0);
});

test('skills deterministic30/60 render partitions including interruption, pause and reset', () => {
  function replay(pattern) {
    const sim = duel(2.9);
    sim.guard.hp = sim.guard.maxHP = 1000;
    let frame = 0;
    while (sim.tick < 1800) {
      for (let i = 0, count = pattern[frame++ % pattern.length]; i < count && sim.tick < 1800; i++) {
        const tick = sim.tick + 1;
        if (tick === 220) sim.player.stunUntil = tick + 12;
        if ([300, 700].includes(tick)) step(sim, { prison: true }, () => false, { paused: true });
        step(sim, { prison: [1, 721, 1441].includes(tick), ultimate: [200, 1700].includes(tick),
          switchStance: [20, 210].includes(tick), attack: [180, 900].includes(tick) }, a => a === sim.player);
      }
    }
    return { sim, snapshot: combatSnapshot(sim), retry: combatSnapshot(createCombat()) };
  }
  assert.deepEqual(replay([2]), replay([1]));
  assert.deepEqual(replay([0, 1]), replay([1]));
});

test('skill feedback expires after120 active ticks and freezes on pause', () => {
  const sim = duel(8);
  step(sim, { prison: true });
  assert.equal(sim.skillFeedback, 'prison:no-target');
  ticks(sim, 119, {}, () => false);
  assert.equal(sim.skillFeedback, 'prison:no-target');
  for (let i = 0; i < 200; i++) step(sim, {}, () => false, { paused: true });
  assert.equal(sim.skillFeedback, 'prison:no-target');
  step(sim, {}, () => false);
  assert.equal(combatSnapshot(sim).skillFeedback, null);
});

test('ultimate miss feedback waits until final active tick', () => {
  const sim = duel(5);
  step(sim, { ultimate: true }); ticks(sim, 40, {}, () => false);
  assert.equal(sim.skillFeedback, 'ultimate:accepted');
  step(sim, {}, () => false);
  assert.equal(sim.skillFeedback, 'ultimate:missed');
});

test('ultimate active boundaries use finite post-physics geometry and LOS, no empty-pulse damage loop', () => {
  for (const age of [38, 39, 41, 42]) {
    const sim = duel(4);
    step(sim, { ultimate: true });
    sim.player.cast.age = age;
    sim.guard.position.z = -3;
    resolveCombat(sim);
    assert.equal(sim.guard.hp, age >= 39 && age < 42 ? 0 : 50);
  }
  for (const position of [{ x: 0, y: 0.87, z: -3.001 }, { x: 0, y: 1.871, z: -1 }, { x: NaN, y: 0.87, z: -1 }]) {
    const sim = duel(4); step(sim, { ultimate: true });
    sim.player.cast.age = 39; sim.guard.position = position;
    for (let i = 0; i < 50; i++) resolveCombat(sim);
    assert.equal(sim.guard.hp, 50);
    assert.equal(sim.events.length, 1);
    assert.equal(sim.events[0].type, 'skill-impact');
  }
  const wall = duel(4); step(wall, { ultimate: true });
  wall.player.cast.age = 39; wall.guard.position.z = -2;
  resolveCombat(wall, () => false);
  assert.equal(wall.guard.hp, 50);
  assert.equal(wall.player.cast.hitTargets.size, 0);
  resolveCombat(wall);
  assert.equal(wall.guard.hp, 0);
  assert.equal(wall.events.filter(event => event.type === 'skill-impact').length, 1);
});

test('death before active blocks ultimate even direct resolve; successful prison owns finite target deadline', () => {
  const sim = duel(2);
  step(sim, { ultimate: true });
  sim.player.cast.age = 39; sim.player.hp = 0;
  resolveCombat(sim);
  assert.equal(sim.player.cast, null);
  assert.equal(sim.guard.hp, 50);
  assert.deepEqual(sim.events.map(event => event.type), ['death']);
  const prison = duel(2);
  step(prison, { prison: true }); ticks(prison, 18);
  const until = prison.guard.stunUntil;
  prison.player.hp = 0; resolveCombat(prison);
  assert.equal(prison.player.cast, null);
  assert.equal(prison.guard.stunUntil, until);
  prison.guard.hp = 0; resolveCombat(prison);
  assert.equal(prison.guard.stunUntil, 0);
});

test('snapshot skill records detached and JSON-safe while CAST is active', () => {
  const sim = duel(); step(sim, { prison: true });
  const snapshot = combatSnapshot(sim);
  assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot);
  snapshot.skills.prison.cooldown = 0;
  snapshot.cast.age = 999;
  assert.equal(combatSnapshot(sim).skills.prison.cooldown, 720);
  assert.equal(sim.player.cast.age, 0);
});

test('central balance and skills deeply frozen with exact checkpoint3.1 values', () => {
  function frozen(value) {
    assert.ok(Object.isFrozen(value));
    for (const child of Object.values(value)) if (child && typeof child === 'object') frozen(child);
  }
  frozen(BALANCE); frozen(SKILLS);
  assert.equal(BALANCE.playerHP, 100); assert.equal(BALANCE.enemyHP, 50);
  assert.equal(BALANCE.enemy.attack.damage, 10);
  assert.deepEqual(SKILLS.prison, { windup: 18, active: 1, recovery: 18, cooldown: 720,
    range: 5, halfAngle: 75, heightTolerance: 1, stunTicks: 120 });
  assert.deepEqual(SKILLS.ultimate, { windup: 39, active: 3, recovery: 36, cooldown: 1500,
    damage: 66, range: 3, halfAngle: 180, heightTolerance: 1, knockback: 1.2, knockbackTicks: 12 });
});
