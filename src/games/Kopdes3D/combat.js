import { ANCHORS, CHECKPOINTS } from './environment/config.js';
import { BALANCE, SKILLS } from './combatConfig.js';

const WEAPONS = BALANCE.weapons;
const duration = spec => spec.windup + spec.active + spec.recovery;
const blocked = new WeakSet();

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
    state: 'IDLE', attack: null, stunUntil: 0, stunResistance: 0, knockback: null, invulnerableUntil: 0, flashUntil: 0 };
}

export function createCombat() {
  return { tick: 0,
    player: { ...actor('owi', 'player', BALANCE.playerHP, CHECKPOINTS.home.position, CHECKPOINTS.home.yaw),
      stance: 'fist', pendingStance: null, dash: null, dashReadyTick: 0, comboIndex: 0,
      cast: null, prisonReadyTick: 0, ultimateReadyTick: 0 },
    guard: actor('guard', 'enemy', BALANCE.enemyHP, ANCHORS.find(anchor => anchor.id === 'guard-spawn').position, 0),
    cleared: false, skillFeedback: null, skillFeedbackUntil: 0, events: [], _attackId: 0, _eventId: 0 };
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

const GUARD_ATTACK = BALANCE.enemy.attack;
const DETECTION = BALANCE.enemy.detection;

function feedback(sim, kind, reason) {
  sim.skillFeedback = `${kind}:${reason}`;
  sim.skillFeedbackUntil = sim.tick + BALANCE.feedbackTicks;
}

// Guard stays runtime default; optional actors are supplied by core callers only.
function enemies(sim) {
  const actors = new Map([[sim.guard.id, sim.guard]]);
  for (const enemy of sim.enemies ?? []) if (enemy && typeof enemy.id === 'string' && enemy.id &&
    enemy.faction === 'enemy' && !actors.has(enemy.id)) actors.set(enemy.id, enemy);
  return [...actors.values()].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

function startCast(sim, kind, command, canHit) {
  const player = sim.player, spec = SKILLS[kind];
  if (player.attack || player.dash || player.cast) { feedback(sim, kind, 'busy'); return; }
  if (sim.tick < player[`${kind}ReadyTick`]) { feedback(sim, kind, 'cooldown'); return; }
  let target = null;
  const candidates = enemies(sim);
  const valid = enemy => hitEligible(player, enemy, spec) && canHit(player, enemy, spec);
  if (command.targetId !== undefined) {
    target = typeof command.targetId === 'string' && command.targetId ? candidates.find(enemy => enemy.id === command.targetId) : null;
    if (!target || !valid(target)) { feedback(sim, kind, 'invalid-target'); return; }
  } else if (kind === 'prison') {
    let distance = Infinity;
    for (const enemy of candidates) {
      if (!valid(enemy)) continue;
      const next = Math.hypot(enemy.position.x - player.position.x, enemy.position.z - player.position.z);
      if (next < distance) { target = enemy; distance = next; }
    }
  }
  if (kind === 'prison' && !target) { feedback(sim, kind, 'no-target'); return; }
  player.cast = { id: ++sim._attackId, kind, age: 0, spec, targetId: kind === 'prison' ? target.id : null, hitTargets: new Set() };
  player[`${kind}ReadyTick`] = sim.tick + spec.cooldown;
  player.state = 'CAST';
  feedback(sim, kind, 'accepted');
}

function stopActor(actor) {
  actor.attack = null;
  if ('cast' in actor) actor.cast = null;
  actor.knockback = null;
  actor._comboBuffered = false;
  if ('dash' in actor) { actor.dash = null; actor.comboIndex = 0; }
}

function die(sim, actor) {
  if (actor.state === 'DEAD') return;
  actor.hp = 0;
  actor.state = 'DEAD';
  stopActor(actor);
  actor.stunUntil = 0;
  if ('pendingStance' in actor) actor.pendingStance = null;
  emit(sim, 'death', actor, 0);
  sim.cleared = enemies(sim).every(enemy => enemy.hp <= 0 || enemy.state === 'DEAD');
}

function locked(sim, actor) {
  if (actor.hp <= 0 || actor.state === 'DEAD') { die(sim, actor); return true; }
  if (actor.stunUntil > sim.tick) {
    if (actor.attack || actor.cast || actor.dash) stopActor(actor);
    actor.state = 'STUNNED';
    return true;
  }
  if (actor._hurtUntil > sim.tick) { actor.state = 'HURT'; return true; }
  if (actor.state === 'HURT' || actor.state === 'STUNNED') actor.state = 'IDLE';
  return false;
}

function prepareGuard(sim, guard, movement, canHit) {
  const player = sim.player;
  if (locked(sim, guard)) return;
  if (guard.attack) {
    if (++guard.attack.age < duration(guard.attack.spec)) return;
    guard.attack = null;
    guard.state = 'CHASE';
  }
  if (player.state === 'DEAD') { guard.state = 'IDLE'; guard._detectTicks = 0; return; }
  const dx = player.position.x - guard.position.x, dz = player.position.z - guard.position.z;
  const distance = Math.hypot(dx, dz);
  const visible = Number.isFinite(distance) && distance <= DETECTION.range && canHit(guard, player, DETECTION);
  guard._unseenTicks = visible ? 0 : (guard._unseenTicks ?? 0) + 1;
  if (guard.state === 'CHASE' && guard._unseenTicks > BALANCE.enemy.unseenTicks) {
    guard.state = 'IDLE'; guard._detectTicks = 0; return;
  }
  if (guard.state !== 'CHASE') {
    guard._detectTicks = visible ? (guard._detectTicks ?? 0) + 1 : 0;
    guard.state = guard._detectTicks >= BALANCE.enemy.detectTicks ? 'CHASE' : visible ? 'DETECT' : 'IDLE';
    if (guard.state !== 'CHASE') return;
  }
  if (distance > BALANCE.enemy.leashRange || !Number.isFinite(distance)) { guard.state = 'IDLE'; guard._detectTicks = 0; return; }
  guard.yaw = Math.atan2(-dx, -dz);
  if (distance <= GUARD_ATTACK.range) {
    if (canHit(guard, player, GUARD_ATTACK)) startAttack(sim, guard, 'guard', 0, GUARD_ATTACK);
  } else {
    const amount = Math.min(BALANCE.enemy.speed / 60, distance - GUARD_ATTACK.range);
    movement.x = dx / distance * amount;
    movement.z = dz / distance * amount;
  }
}

export function prepareCombat(sim, command = {}, canHit = () => true, flags = {}) {
  const movement = { player: { x: 0, y: 0, z: 0 }, guard: { x: 0, y: 0, z: 0 } };
  const targets = enemies(sim);
  if (sim.enemies) {
    movement.enemies = Object.create(null);
    for (const enemy of targets) movement.enemies[enemy.id] = enemy === sim.guard ? movement.guard : { x: 0, y: 0, z: 0 };
  }
  if (flags?.paused || flags?.modal || command?.paused || command?.modal) { blocked.add(sim); return movement; }
  blocked.delete(sim);
  sim.tick++;
  if (sim.tick >= sim.skillFeedbackUntil) sim.skillFeedback = null;
  // Invalid commands are ignored; existing timelines still advance normally.
  if (!command || typeof command !== 'object' || Array.isArray(command) ||
    ['attack', 'dash', 'switchStance', 'prison', 'ultimate'].some(key => command[key] !== undefined && typeof command[key] !== 'boolean') ||
    (command.keys !== undefined && !(command.keys instanceof Set)) ||
    (command.yaw !== undefined && !Number.isFinite(command.yaw)) ||
    (command.analog !== undefined && (!Number.isFinite(command.analog?.x) || !Number.isFinite(command.analog?.y)))) command = {};
  sim.player._tick = sim.tick;
  const player = sim.player;
  const playerLocked = locked(sim, player);
  for (const enemy of targets) {
    enemy._tick = sim.tick;
    const move = enemy === sim.guard ? movement.guard : { x: 0, y: 0, z: 0 };
    if (movement.enemies) movement.enemies[enemy.id] = move;
    prepareGuard(sim, enemy, move, canHit);
    if (enemy.knockback && enemy.state !== 'DEAD') {
      move.x = enemy.knockback.x;
      move.z = enemy.knockback.z;
      if (--enemy.knockback.remaining <= 0) enemy.knockback = null;
    }
  }
  const requestedSkill = command.prison ? 'prison' : command.ultimate ? 'ultimate' : null;
  if (player.state === 'DEAD') {
    if (requestedSkill) feedback(sim, requestedSkill, 'busy');
    return movement;
  }
  if (playerLocked) {
    if (requestedSkill) feedback(sim, requestedSkill, 'busy');
    if (command.switchStance) player.pendingStance = (player.pendingStance ?? player.stance) === 'fist' ? 'tray' : 'fist';
    return movement;
  }
  if (!player.attack && !player.dash && !player.cast) applyStance(player);
  if (player.cast && ++player.cast.age >= duration(player.cast.spec)) {
    player.cast = null;
    player.state = 'IDLE';
    applyStance(player);
  }
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
  if (command.prison || command.ultimate) startCast(sim, command.prison ? 'prison' : 'ultimate', command, canHit);
  if (player.cast) return movement;
  if (player.dash) {
    player.dash.age++;
    if (player.dash.age > BALANCE.dash.ticks) {
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
    player.dashReadyTick = sim.tick + BALANCE.dash.cooldown;
    player.attack = null;
    player._comboBuffered = false;
    player.comboIndex = 0;
    player.state = 'DASH';
  }
  if (player.dash) {
    movement.player.x = player.dash.direction.x * BALANCE.dash.distance / BALANCE.dash.ticks;
    movement.player.z = player.dash.direction.z * BALANCE.dash.distance / BALANCE.dash.ticks;
    return movement;
  }
  if (command.attack) {
    if (!player.attack) startAttack(sim, player, player.stance, 0);
    else if (player.attack.age >= Math.max(player.attack.spec.windup + player.attack.spec.active, duration(player.attack.spec) - 10)) player._comboBuffered = true;
  }
  if (player.attack) return movement;
  const move = direction(command, player.yaw);
  const speed = command.keys?.has('ShiftLeft') || command.keys?.has('ShiftRight') ? BALANCE.sprintSpeed : BALANCE.walkSpeed;
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
  if (blocked.has(sim)) return;
  const targets = enemies(sim);
  for (const actor of [sim.player, ...targets]) locked(sim, actor);
  for (const [attacker, target] of [...targets.map(enemy => [enemy, sim.player]), ...targets.map(enemy => [sim.player, enemy])]) {
    const attack = attacker.attack;
    if (!attack || attack.age < attack.spec.windup || attack.age >= attack.spec.windup + attack.spec.active ||
      attack.hitTargets.has(target.id) || !hitEligible(attacker, target, attack.spec) || !canHit(attacker, target, attack.spec)) continue;
    attack.hitTargets.add(target.id);
    damage(sim, target, attack.spec.damage);
  }
  const cast = sim.player.cast;
  const target = cast && targets.find(enemy => enemy.id === cast.targetId);
  if (cast?.kind === 'prison' && cast.age >= cast.spec.windup && cast.age < cast.spec.windup + cast.spec.active && !cast._resolved) {
    cast._resolved = true;
    if (!target || !hitEligible(sim.player, target, cast.spec) || !canHit(sim.player, target, cast.spec)) feedback(sim, 'prison', 'missed');
    else {
      cast.hitTargets.add(target.id);
      target.stunResistance = Number.isFinite(target.stunResistance) ? Math.max(0, Math.min(1, target.stunResistance)) : 0;
      const ticks = Math.round(cast.spec.stunTicks * (1 - target.stunResistance));
      if (target.stunUntil > sim.tick) feedback(sim, 'prison', 'target-stunned');
      else if (ticks === 0) feedback(sim, 'prison', 'resisted');
      else {
        stopActor(target);
        target._detectTicks = 0;
        target.stunUntil = sim.tick + ticks;
        target.state = 'STUNNED';
      }
    }
  }
  if (cast?.kind === 'ultimate' && cast.age >= cast.spec.windup && cast.age < cast.spec.windup + cast.spec.active) {
    if (!cast._impactEmitted) {
      cast._impactEmitted = true;
      emit(sim, 'skill-impact', sim.player, 0);
    }
    for (const enemy of targets) {
      if (cast.hitTargets.has(enemy.id) || !hitEligible(sim.player, enemy, cast.spec) || !canHit(sim.player, enemy, cast.spec)) continue;
      cast.hitTargets.add(enemy.id);
      damage(sim, enemy, cast.spec.damage);
      if (enemy.state === 'DEAD') continue;
      const dx = enemy.position.x - sim.player.position.x, dz = enemy.position.z - sim.player.position.z;
      const distance = Math.hypot(dx, dz), amount = cast.spec.knockback / cast.spec.knockbackTicks;
      enemy.knockback = { x: (distance ? dx / distance : -Math.sin(sim.player.yaw)) * amount,
        z: (distance ? dz / distance : -Math.cos(sim.player.yaw)) * amount, remaining: cast.spec.knockbackTicks };
    }
    if (cast.age === cast.spec.windup + cast.spec.active - 1 && cast.hitTargets.size === 0) feedback(sim, 'ultimate', 'missed');
  }
}

function damage(sim, target, amount) {
  target.hp = Math.max(0, Math.min(target.maxHP, target.hp - amount));
  emit(sim, 'hit', target, amount);
  if (target === sim.player && target.cast) feedback(sim, target.cast.kind, 'interrupted');
  stopActor(target);
  target.flashUntil = sim.tick + BALANCE.flashTicks;
  if (target.hp === 0) die(sim, target);
  else {
    target.state = target.stunUntil > sim.tick ? 'STUNNED' : 'HURT';
    target._hurtUntil = sim.tick + BALANCE.hurtTicks;
    if (target === sim.player) target.invulnerableUntil = sim.tick + BALANCE.invulnerableTicks;
  }
}

function invulnerable(actor) {
  return actor.invulnerableUntil > (actor._tick ?? 0) ||
    (actor.dash !== null && actor.dash !== undefined && actor.dash.age >= BALANCE.dash.iframeStart && actor.dash.age <= BALANCE.dash.iframeEnd);
}

export function hitEligible(attacker, target, spec) {
  if (!attacker?.position || !target?.position || !spec) return false;
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
    skills: Object.fromEntries(Object.keys(SKILLS).map(kind => [kind, {
      cooldown: Math.max(0, sim.player[`${kind}ReadyTick`] - sim.tick),
      ready: sim.tick >= sim.player[`${kind}ReadyTick`],
    }])),
    cast: sim.player.cast ? { id: sim.player.cast.id, kind: sim.player.cast.kind, age: sim.player.cast.age,
      targetId: sim.player.cast.targetId } : null,
    enemyStunRemaining: Math.max(0, sim.guard.stunUntil - sim.tick),
    skillFeedback: sim.skillFeedback,
    cleared: sim.cleared, events: sim.events.map(event => ({ ...event, position: { ...event.position } })) };
}
