import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { EventEmitter } from "node:events";
import { BOSS_ATTACKS, isPointInBreath } from "../config/bossAttackConfig.js";
import { NAGA_ANIMATIONS } from "../game/systems/ActorAnimator.js";

test("breath hitbox matches locked triangular telegraph in every direction", () => {
  const origin = { x: 120, y: 170 };
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2, 0.73]) {
    const hit = (forward, side) => isPointInBreath(
      origin.x + Math.cos(angle) * forward - Math.sin(angle) * side,
      origin.y + Math.sin(angle) * forward + Math.cos(angle) * side,
      origin.x, origin.y, angle, 300, 90,
    );
    assert.equal(hit(150, 0), true);
    assert.equal(hit(300, 90), true, "far corner included");
    assert.equal(hit(150, 45), true, "sloping edge included");
    assert.equal(hit(150, 46), false, "outside cone edge");
    assert.equal(hit(301, 0), false, "beyond range");
    assert.equal(hit(-1, 0), false, "behind mouth");
    assert.equal(hit(0, 0), true, "mouth included");
  }
});

test("breath rejects malformed geometry instead of damaging whole arena", () => {
  for (const range of [0, -1, NaN, Infinity]) {
    assert.equal(isPointInBreath(10, 0, 0, 0, 0, range, 90), false);
  }
  assert.equal(isPointInBreath(NaN, 0, 0, 0, 0, 300, 90), false);
  assert.equal(isPointInBreath(10, 0, 0, 0, 0, 300, -1), false);
});

test("all four patterns retain learnable reaction windows in both phases", () => {
  assert.deepEqual(Object.keys(BOSS_ATTACKS), ["breath", "slash", "spread", "summon"]);
  for (const attack of Object.values(BOSS_ATTACKS)) {
    assert.ok(attack.windupMs >= 850);
    assert.ok(attack.activeMs > 0);
  }
  assert.equal(BOSS_ATTACKS.summon.maxActive, 2);
});

// Execute real boss/base methods without loading browser-only Phaser.
function encounter(config = {}) {
  const graphic = () => new Proxy({ destroyed: false }, { get(obj, key) {
    if (key === "destroy") return () => { obj.destroyed = true; };
    return key in obj ? obj[key] : () => proxy;
  } });
  const proxy = new Proxy({}, { get: () => () => proxy });
  class Sprite {
    constructor(scene, x, y, key) { Object.assign(this, { scene, x, y, active: true, texture: { key }, frame: { name: 0 }, body: { enable: true, velocity: {}, setSize() {}, setOffset() {} } }); }
    setVelocity(x, y) { this.body.velocity = { x, y }; return this; }
    setTexture(key) { this.texture.key = key; return this; }
    setScale() { return this; } setDepth() { return this; } setCollideWorldBounds() { return this; }
    setFlipX() { return this; } setTint() { return this; } setTintFill() { return this; } setTintMode() { return this; } clearTint() { return this; }
    setFrame(name) { this.frame.name = name; return this; }
    preUpdate() {} destroy() { this.active = false; }
  }
  const calls = { damage: [], drops: [], timers: [], kills: [], defeated: [], status: [] };
  const enemies = [];
  const bullets = [];
  const scene = {
    events: new EventEmitter(), stats: { isAlive: () => true },
    sys: { isActive: () => true }, textures: { exists: () => true },
    add: { existing() {}, graphics: graphic, text: () => proxy },
    physics: { add: { existing() {} }, world: { bounds: { x: 0, y: 0, width: 2400, height: 2400 } } },
    time: { delayedCall: (...args) => { calls.timers.push(args); return { remove() {} }; } }, tweens: { add() {} },
    takeDamage: (damage) => calls.damage.push(damage),
    pickupSystem: { spawnItem: (...args) => calls.drops.push(args) },
    enemySpawner: { enemies: { getChildren: () => enemies } },
    spawnNagaKecilMinion(x, y) { const minion = { x, y, active: true, enemyId: "naga_kecil" }; enemies.push(minion); return minion; },
    projectileSystem: {
      bossProjectiles: { getChildren: () => bullets },
      fireBossPaperSpread(x, y, tx, ty, count) { for (let i = 0; i < count; i++) bullets.push({ active: true }); },
      recycleProjectile(bullet) { bullet.active = false; },
    },
  };
  for (const [event, key] of [["enemy-killed", "kills"], ["boss-defeated", "defeated"], ["boss-status", "status"]]) scene.events.on(event, data => calls[key].push(data));
  const context = vm.createContext({ Phaser: { TintModes: { FILL: 1, MULTIPLY: 0 }, Physics: { Arcade: { Sprite } }, Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)), Distance: { Between: (x, y, tx, ty) => Math.hypot(x - tx, y - ty) } } }, BOSS_ATTACKS, isPointInBreath, NAGA_ANIMATIONS, ASSET_KEYS: {}, ITEM_TYPES: { SUARA: "xp", DANA: "coin", HEALTH: "health", MANA: "mana", FAJAR_ENERGY: "energy" }, audioManager: new Proxy({}, { get: () => () => {} }) });
  for (const file of ["EnemyBase", "NagaFajarBoss"]) {
    const source = readFileSync(new URL(`../entities/enemies/${file}.js`, import.meta.url), "utf8").replace(/^import .*;\r?\n/gm, "").replace("export class", "class");
    vm.runInContext(`${source}\nglobalThis.${file} = ${file};`, context);
  }
  const boss = new context.NagaFajarBoss(scene, 300, 300, { id: "raja_hoaks", hp: 100, ...config });
  const target = { x: 450, y: 300, active: true };
  return { boss, scene, target, calls, bullets, enemies };
}

test("death disables body, emits real IDs, grants rewards once and reaches base cleanup", () => {
  const { boss, calls } = encounter();
  boss.die(); boss.die();
  assert.equal(boss.body.enable, false);
  assert.equal(calls.kills.length, 1);
  assert.equal(calls.defeated.length, 1);
  assert.equal(calls.defeated[0].enemyId, "raja_hoaks");
  assert.equal(calls.defeated[0].instanceId, boss.instanceId);
  assert.equal(calls.status.at(-1).instanceId, boss.instanceId);
  assert.equal(calls.drops.length, 17);
  assert.equal(boss.visualState, "death");
});

test("breath freezes during both pause modes, locks aim, hits once then recovers", () => {
  const { boss, scene, target, calls } = encounter();
  boss.executeAttackPattern(target);
  assert.equal(boss.attackState.type, "breath");
  const attack = boss.attackState;
  boss.updateAI(0, 849, target);
  for (const flag of ["isPaused", "isLevelUpPaused"]) {
    scene[flag] = true; boss.updateAI(999999, 5000, target); scene[flag] = false;
    assert.equal(attack.elapsed, 849);
  }
  assert.equal(calls.damage.length, 0);
  boss.updateAI(0, 151, target);
  assert.equal(boss.visualState, "breath");
  assert.equal(calls.damage.length, 1);
  target.y += 500;
  assert.equal(attack.angle, 0);
  boss.updateAI(0, 100, target);
  assert.equal(calls.damage.length, 1);
  boss.updateAI(0, 550, target);
  assert.equal(boss.attackState, null);
  assert.equal(boss.visualState, "idle");
  assert.equal(boss.attackCooldownTimer, boss.attackInterval);
  assert.equal(calls.timers.length, 0, "no attack callbacks scheduled");
});

test("paper waits for warning, tags only own bullets and death recycles them", () => {
  const { boss, target, calls, bullets } = encounter();
  bullets.push({ active: true, ownerInstanceId: "other" });
  boss.patternStep = 2;
  boss.executeAttackPattern(target);
  assert.equal(bullets.length, 1);
  boss.updateAI(0, 899, target);
  assert.equal(bullets.length, 1);
  boss.updateAI(0, 1, target);
  assert.equal(bullets.length, 4);
  assert.ok(bullets.slice(1).every(bullet => bullet.ownerInstanceId === boss.instanceId));
  boss.die();
  assert.equal(bullets[0].active, true);
  assert.ok(bullets.slice(1).every(bullet => !bullet.active));
  assert.equal(calls.defeated.length, 1);
});

test("summon cap rechecked after telegraph; circle damage uses locked center", () => {
  const { boss, target, enemies, calls } = encounter();
  boss.patternStep = 3; boss.executeAttackPattern(target);
  assert.equal(enemies.length, 0);
  enemies.push({ active: true, enemyId: "naga_kecil" }, { active: true, enemyId: "naga_kecil" });
  boss.updateAI(0, 1000, target);
  assert.equal(enemies.length, 2);
  boss.cancelAttacks(); boss.patternStep = 1; boss.executeAttackPattern(target);
  target.x += 200;
  boss.updateAI(0, 850, target);
  assert.equal(calls.damage.length, 0);
});

test("summons use warned points, owner tag, arena bounds and two-minion cap", () => {
  const { boss, target, enemies } = encounter();
  boss.patternStep = 3;
  boss.executeAttackPattern(target);
  const point = boss.attackState.points[0];
  boss.updateAI(0, 1000, target);
  assert.equal(enemies.length, 1);
  assert.equal(enemies[0].x, point.x);
  assert.equal(enemies[0].y, point.y);
  assert.equal(enemies[0].ownerInstanceId, boss.instanceId);
  boss.cancelAttacks(); boss.patternStep = 3;
  boss.executeAttackPattern(target); boss.updateAI(0, 1000, target);
  assert.equal(enemies.length, 2);
});

test("rage interrupts windup, keeps four-pattern order and never shortens warnings", () => {
  const { boss, target, calls } = encounter();
  boss.executeAttackPattern(target);
  boss.takeDamage(60);
  assert.equal(boss.isRage, true);
  assert.equal(boss.attackState, null);
  assert.equal(boss.visualState, "phase");
  boss.updateAI(0, 699, target);
  assert.equal(boss.visualState, "phase");
  boss.updateAI(0, 1, target);
  for (const [index, type] of Object.keys(BOSS_ATTACKS).entries()) {
    boss.patternStep = index;
    boss.executeAttackPattern(target);
    assert.equal(boss.attackState.type, type);
    assert.ok(boss.attackState.windupMs >= 850);
    boss.cancelAttacks();
  }
  boss.takeDamage(1000);
  const statusCount = calls.status.length;
  assert.equal(calls.status.at(-1).active, false);
  boss.takeDamage(1000);
  assert.equal(calls.status.length, statusCount, "dead boss cannot overwrite next HUD");
});

test("gameover and shutdown cancel windup and owned bullets without rewards", () => {
  for (const reason of ["gameover", "shutdown"]) {
    const { boss, scene, target, calls, bullets } = encounter();
    boss.executeAttackPattern(target);
    bullets.push({ active: true, ownerInstanceId: boss.instanceId });
    if (reason === "gameover") { scene.isGameOver = true; boss.preUpdate(0, 1000); }
    else scene.events.emit("shutdown");
    assert.equal(boss.attackState, null);
    assert.equal(bullets[0].active, false);
    boss.updateAI(0, 5000, target);
    assert.equal(calls.damage.length, 0);
    assert.equal(calls.drops.length, 0);
  }
});
