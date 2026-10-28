import { ANCHORS, CHECKPOINTS } from './environment/config.js';

const WEAPONS = {
  fist: [[10, 8, 4, 10, 1.2, 35], [12, 7, 4, 10, 1.2, 35], [16, 10, 5, 16, 1.3, 40]],
  tray: [[22, 14, 6, 18, 1.8, 60], [28, 18, 6, 24, 1.9, 65]],
};
for (const stance of Object.keys(WEAPONS)) WEAPONS[stance] = WEAPONS[stance].map(
  ([damage, windup, active, recovery, range, halfAngle]) => Object.freeze({ damage, windup, active, recovery, range, halfAngle, heightTolerance: 1 }));
const duration = spec => spec.windup + spec.active + spec.recovery;

function startAttack(sim, actor, stance, index, spec = WEAPONS[stance][index]) {
  actor.state = 'ATTACK';
  actor.attack = { id: ++sim._attackId, index, stance, age: 0, spec, hitTargets: new Set() };
  if (actor === sim.player) actor.comboIndex = index + 1;
}

function applyStance(player) {
  if (player.pendingStance !== null) {
    player.stance = player.pendingStance;
    player.pendingStance = null;
    player.comboIndex = 0;
  }
}

function actor(id, faction, maxHP, floor, yaw) {
  return { id, faction, hp: maxHP, maxHP,
    position: { x: floor[0], y: floor[1] + 0.87, z: floor[2] }, yaw,
    state: 'IDLE', attack: null, stunUntil: 0, invulnerableUntil: 0, flashUntil: 0 };
}

export function createCombat() {
  return { tick: 0,
    player: { ...actor('owi', 'player', 100, CHECKPOINTS.home.position, CHECKPOINTS.home.yaw),
      stance: 'fist', pendingStance: null, dash: null, dashReadyTick: 0, comboIndex: 0 },
    guard: actor('guard', 'enemy', 50, ANCHORS.find(anchor => anchor.id === 'guard-spawn').position, 0),
    cleared: false, events: [], _attackId: 0, _eventId: 0 };
}

// Camera yaw zero looks along -Z; analog Y is forward, X is right.
function direction(command, fallbackYaw) {
  const keys = command.keys instanceof Set ? command.keys : new Set();
  let x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  let y = Number(keys.has('KeyW')) - Number(keys.has('KeyS'));
  if (command.analog !== undefined) {
    if (!Number.isFinite(command.analog?.x) || !Number.isFinite(command.analog?.y)) return { x: 0, z: 0 };
    x = command.analog.x; y = command.analog.y;
  }
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length === 0) return { x: 0, z: 0 };
  const yaw = Number.isFinite(command.yaw) ? command.yaw : fallbackYaw;
  return { x: (x / length) * Math.cos(yaw) - (y / length) * Math.sin(yaw),
    z: -(x / length) * Math.sin(yaw) - (y / length) * Math.cos(yaw) };
}

const GUARD_ATTACK = Object.freeze({ damage: 10, windup: 36, active: 6, recovery: 42, range: 1.3, halfAngle: 45, heightTolerance: 1 });
const DETECTION = Object.freeze({ range: 8, halfAngle: 180, heightTolerance: 2 });

function stopActor(actor) {
  actor.attack = null;
  actor._comboBuffered = false;
  if ('dash' in actor) { actor.dash = null; actor.comboIndex = 0; }
}

function die(sim, actor) {
  if (actor.state === 'DEAD') return;
  actor.hp = 0;
  actor.state = 'DEAD';
  stopActor(actor);
  if ('pendingStance' in actor) actor.pendingStance = null;
  emit(sim, 'death', actor, 0);
  if (actor === sim.guard) sim.cleared = true;
}

function locked(sim, actor) {
  if (actor.hp <= 0 || actor.state === 'DEAD') { die(sim, actor); return true; }
  if (actor.stunUntil > sim.tick) {
    stopActor(actor);
    actor.state = 'STUNNED';
    return true;
  }
  if (actor._hurtUntil > sim.tick) { actor.state = 'HURT'; return true; }
  if (actor.state === 'HURT' || actor.state === 'STUNNED') actor.state = 'IDLE';
  return false;
}

function prepareGuard(sim, movement, canHit) {
  const guard = sim.guard, player = sim.player;
  if (locked(sim, guard)) return;
  if (guard.attack) {
    if (++guard.attack.age < duration(guard.attack.spec)) return;
    guard.attack = null;
    guard.state = 'CHASE';
  }
  if (player.state === 'DEAD') { guard.state = 'IDLE'; guard._detectTicks = 0; return; }
  const dx = player.position.x - guard.position.x, dz = player.position.z - guard.position.z;
  const distance = Math.hypot(dx, dz);
  const visible = Number.isFinite(distance) && distance <= 8 && canHit(guard, player, DETECTION);
  guard._unseenTicks = visible ? 0 : (guard._unseenTicks ?? 0) + 1;
  if (guard.state === 'CHASE' && guard._unseenTicks > 180) {
    guard.state = 'IDLE'; guard._detectTicks = 0; return;
  }
  if (guard.state !== 'CHASE') {
    guard._detectTicks = visible ? (guard._detectTicks ?? 0) + 1 : 0;
    guard.state = guard._detectTicks >= 12 ? 'CHASE' : visible ? 'DETECT' : 'IDLE';
    if (guard.state !== 'CHASE') return;
  }
  if (distance > 14 || !Number.isFinite(distance)) { guard.state = 'IDLE'; guard._detectTicks = 0; return; }
  guard.yaw = Math.atan2(-dx, -dz);
  if (distance <= 1.3) {
    if (canHit(guard, player, GUARD_ATTACK)) startAttack(sim, guard, 'guard', 0, GUARD_ATTACK);
  } else {
    const amount = Math.min(2.4 / 60, distance - 1.3);
    movement.x = dx / distance * amount;
    movement.z = dz / distance * amount;
  }
}

export function prepareCombat(sim, command = {}, canHit = () => true) {
  sim.tick++;
  // Invalid commands are ignored; existing timelines still advance normally.
  if (!command || (command.yaw !== undefined && !Number.isFinite(command.yaw)) ||
    (command.analog !== undefined && (!Number.isFinite(command.analog?.x) || !Number.isFinite(command.analog?.y)))) command = {};
  sim.player._tick = sim.guard._tick = sim.tick;
  const movement = { player: { x: 0, y: 0, z: 0 }, guard: { x: 0, y: 0, z: 0 } };
  const player = sim.player;
  const playerLocked = locked(sim, player);
  prepareGuard(sim, movement.guard, canHit);
  if (player.state === 'DEAD') return movement;
  if (playerLocked) {
    if (command.switchStance) player.pendingStance = (player.pendingStance ?? player.stance) === 'fist' ? 'tray' : 'fist';
    return movement;
  }
  if (!player.attack && !player.dash) applyStance(player);
  if (player.attack) {
    const attack = player.attack;
    attack.age++;
    if (attack.age >= duration(attack.spec)) {
      player.attack = null;
      player.state = 'IDLE';
      applyStance(player);
      if (player._comboBuffered && player.stance === attack.stance && attack.index + 1 < WEAPONS[player.stance].length) {
        startAttack(sim, player, player.stance, attack.index + 1);
      } else player.comboIndex = 0;
      player._comboBuffered = false;
    }
  }
  if (command.switchStance) {
    const next = (player.pendingStance ?? player.stance) === 'fist' ? 'tray' : 'fist';
    if (player.state === 'IDLE' || player.state === 'MOVE') player.stance = next;
    else player.pendingStance = next;
  }
  if (player.dash) {
    player.dash.age++;
    if (player.dash.age > 12) {
      player.dash = null;
      player.state = 'IDLE';
      applyStance(player);
    }
  }
  const canCancel = !player.attack || player.attack.age >= Math.max(
    player.attack.spec.windup + player.attack.spec.active, duration(player.attack.spec) - 6);
  if (command.dash && !player.dash && canCancel && sim.tick >= player.dashReadyTick) {
    let forward = direction(command, player.yaw);
    if (!forward.x && !forward.z) forward = { x: -Math.sin(player.yaw), z: -Math.cos(player.yaw) };
    player.dash = { age: 1, direction: forward };
    player.yaw = Math.atan2(-forward.x, -forward.z);
    player.dashReadyTick = sim.tick + 120;
    player.attack = null;
    player._comboBuffered = false;
    player.comboIndex = 0;
    player.state = 'DASH';
  }
  if (player.dash) {
    movement.player.x = player.dash.direction.x * 2.8 / 12;
    movement.player.z = player.dash.direction.z * 2.8 / 12;
    return movement;
  }
  if (command.attack) {
    if (!player.attack) startAttack(sim, player, player.stance, 0);
    else if (player.attack.age >= Math.max(player.attack.spec.windup + player.attack.spec.active, duration(player.attack.spec) - 10)) player._comboBuffered = true;
  }
  if (player.attack) return movement;
  const move = direction(command, player.yaw);
  const speed = command.keys?.has('ShiftLeft') || command.keys?.has('ShiftRight') ? 6 : 3.5;
  movement.player.x = move.x * speed / 60;
  movement.player.z = move.z * speed / 60;
  player.state = move.x || move.z ? 'MOVE' : 'IDLE';
  if (move.x || move.z) player.yaw = Math.atan2(-move.x, -move.z);
  return movement;
}

function emit(sim, type, target, damage) {
  sim.events.push({ id: ++sim._eventId, tick: sim.tick, type, targetId: target.id, damage, position: { ...target.position } });
  if (sim.events.length > 12) sim.events.shift();
}

export function resolveCombat(sim, canHit = () => true) {
  for (const [attacker, target] of [[sim.guard, sim.player], [sim.player, sim.guard]]) {
    const attack = attacker.attack;
    if (!attack || attack.age < attack.spec.windup || attack.age >= attack.spec.windup + attack.spec.active ||
      attack.hitTargets.has(target.id) || !hitEligible(attacker, target, attack.spec) || !canHit(attacker, target, attack.spec)) continue;
    attack.hitTargets.add(target.id);
    target.hp = Math.max(0, Math.min(target.maxHP, target.hp - attack.spec.damage));
    emit(sim, 'hit', target, attack.spec.damage);
    stopActor(target);
    target.flashUntil = sim.tick + 6;
    if (target.hp === 0) die(sim, target);
    else {
      target.state = 'HURT';
      target._hurtUntil = sim.tick + 12;
      if (target === sim.player) target.invulnerableUntil = sim.tick + 24;
    }
  }
}

function invulnerable(actor) {
  return actor.invulnerableUntil > (actor._tick ?? 0) ||
    (actor.dash !== null && actor.dash !== undefined && actor.dash.age >= 2 && actor.dash.age <= 8);
}

export function hitEligible(attacker, target, spec) {
  if (attacker.id === target.id || attacker.faction === target.faction ||
    attacker.state === 'DEAD' || target.state === 'DEAD' || attacker.hp <= 0 || target.hp <= 0 || invulnerable(target) ||
    attacker.attack?.hitTargets.has(target.id)) return false;
  const a = attacker.position, b = target.position;
  if (![a.x, a.y, a.z, b.x, b.y, b.z, attacker.yaw, spec.range, spec.halfAngle].every(Number.isFinite)) return false;
  const dx = b.x - a.x, dz = b.z - a.z;
  const distance = Math.hypot(dx, dz);
  const epsilon = 0.0001;
  if (distance > spec.range + epsilon || Math.abs(b.y - a.y) > (spec.heightTolerance ?? 1) + epsilon) return false;
  return distance <= epsilon || (-Math.sin(attacker.yaw) * dx - Math.cos(attacker.yaw) * dz) / distance >=
    Math.cos(spec.halfAngle * Math.PI / 180) - epsilon;
}

export function combatSnapshot(sim) {
  return { tick: sim.tick, playerHP: sim.player.hp, enemyHP: sim.guard.hp,
    stance: sim.player.stance, pendingStance: sim.player.pendingStance,
    playerState: sim.player.state, enemyState: sim.guard.state, combo: sim.player.comboIndex,
    dashCooldown: Math.max(0, sim.player.dashReadyTick - sim.tick), invulnerable: invulnerable(sim.player),
    cleared: sim.cleared, events: sim.events.map(event => ({ ...event, position: { ...event.position } })) };
}
