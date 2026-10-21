import assert from "node:assert/strict";
import { test } from "node:test";
import { AchievementService } from "../services/AchievementService.js";
import { EventEmitter } from "node:events";
import { ObjectiveSystem } from "../game/systems/ObjectiveSystem.js";
import { RunDirector } from "../game/systems/RunDirector.js";
import { OBJECTIVE_TYPES } from "../config/objectiveConfig.js";
import { registerHooks } from "node:module";

// Only engine shell is mocked; production spawner, ranged AI and config execute unchanged.
const engine = `export default { Physics: { Arcade: { Sprite: class {
  constructor(scene, x, y) { this.scene = scene; this.x = x; this.y = y; this.active = true; this.body = { setSize() {}, setOffset() {} }; }
  setDepth() { return this; } setCollideWorldBounds() { return this; }
  setVelocity() { return this; } setFlipX() { return this; }
  destroy() { this.active = false; }
} } }, Math: { Between: (a, b) => a + Math.random() * (b - a), Clamp: (n, a, b) => Math.max(a, Math.min(b, n)) } };`;
const hooks = registerHooks({ resolve(specifier, context, nextResolve) {
  return specifier === "phaser" ? { url: `data:text/javascript,${encodeURIComponent(engine)}`, shortCircuit: true } : nextResolve(specifier, context);
} });
const { EnemySpawner } = await import("../entities/enemies/EnemySpawner.js");
await import("../entities/enemies/RangedEnemy.js"); // comment: Ensure module is loaded while engine hook is installed.
hooks.deregister();

function achievementService() {
  const service = new AchievementService();
  service.state = structuredClone({ unlocked: {}, stats: { hoaksKillsCumulative: 0, maxSurvivalTime: 0, maxCombo: 0, bossesDefeated: [], evolutionsUnlocked: [], objectivesCompleted: [] } });
  return service;
}

test("achievement survival persists once per whole second and rejects non-finite input", () => {
  const service = achievementService();
  let writes = 0;
  service.saveState = () => writes++;
  for (let frame = 0; frame < 180; frame++) service.recordSurvivalTime(frame / 60);
  assert.equal(writes, 2);
  for (const invalid of [NaN, Infinity, -Infinity, -1, "300"]) service.recordSurvivalTime(invalid);
  assert.equal(writes, 2);
  assert.equal(service.state.stats.maxSurvivalTime, 2);
  assert.equal(service.isUnlocked("tak_terkalahkan"), false);
});

function sceneFixture() {
  const scene = {
    events: new EventEmitter(), survivalTime: 80, player: { x: 1200, y: 1200, active: true },
    stats: { status: "alive", isAlive() { return this.status !== "dead"; }, xp: 0, addXp(n) { this.xp += n; return {}; }, addEnergy() {} },
    score: 0, addScore(n) { this.score += n; }, time: { now: 1000 },
    pendingBossLevels: [], gameEvents: { onObjectiveStatus() {}, onArenaEvent() {} },
    arenaSystem: { width: 2400, height: 2400, isPositionBlocked: () => false },
    enemySpawner: { ensureObjectiveSupply: () => true, spawnSingleEnemy() {}, setPacing() {} },
    add: { graphics() { return { scene: true, setDepth() { return this; }, clear() {}, destroy() {}, lineStyle() {}, lineBetween() {}, strokeCircle() {}, fillStyle() {}, fillCircle() {}, beginPath() {}, arc() {}, strokePath() {} }; } },
  };
  scene.objectiveSystem = new ObjectiveSystem(scene);
  return scene;
}

test("zone rejects blocked full radius without fallback", () => {
  const scene = sceneFixture();
  const radii = [];
  scene.arenaSystem.isPositionBlocked = (_x, _y, radius) => { radii.push(radius); return radius >= 90; };
  assert.equal(scene.objectiveSystem.startObjective(OBJECTIVE_TYPES.AMANKAN_KOTAK), null);
  assert.ok(radii.length > 0);
  assert.ok(radii.every((radius) => radius >= 90));
  assert.equal(scene.objectiveSystem.zoneGraphics, null);
});

test("Hoaks objective requires full guaranteed supply before starting countdown", () => {
  const scene = sceneFixture();
  scene.enemySpawner.ensureObjectiveSupply = (required) => { assert.equal(required, 5); return false; };
  assert.equal(scene.objectiveSystem.startObjective(), null);
});

test("objective pause freezes timer; unique kill IDs grant reward exactly once", () => {
  const scene = sceneFixture();
  const system = scene.objectiveSystem;
  system.startObjective();
  scene.isPaused = true;
  system.update(100);
  assert.equal(system.activeObjective.timeRemaining, 35);
  system.handleEnemyKilled({ id: "paused", enemyType: "penyebar_hoaks" });
  assert.equal(system.activeObjective.progress, 0);
  scene.isPaused = false;
  scene.isLevelUpPaused = true;
  system.update(100);
  assert.equal(system.activeObjective.timeRemaining, 35);
  scene.isLevelUpPaused = false;
  system.handleEnemyKilled({ enemyType: "penyebar_hoaks" });
  assert.equal(system.activeObjective.progress, 0);
  for (let i = 0; i < 5; i++) {
    for (let duplicate = 0; duplicate < 2; duplicate++) system.handleEnemyKilled({ id: `hoaks_${i}`, enemyType: "penyebar_hoaks" });
    assert.equal(system.activeObjective.progress, i + 1);
  }
  system.completeObjective();
  assert.equal(scene.stats.xp, 300);
  assert.equal(scene.score, 500);
  assert.equal(system.completedCount, 1);
  assert.equal(system.activeObjective.status, "completed");
  scene.isPaused = true;
  system.update(10);
  assert.ok(system.activeObjective);
  scene.isPaused = false;
  system.update(3.5);
  assert.equal(system.activeObjective, null);
});

test("death clears completed objective feedback and restart cannot retain old reward", () => {
  const scene = sceneFixture();
  const system = scene.objectiveSystem;
  system.startObjective();
  system.completeObjective();
  scene.stats.status = "dead";
  system.update(0.016);
  assert.equal(system.activeObjective, null);
  scene.stats.status = "alive";
  system.reset();
  assert.ok(system.startObjective());
  system.update(0.016);
  assert.equal(system.activeObjective.status, "active");
  assert.equal(scene.stats.xp, 300);
  system.destroy();
  assert.doesNotThrow(() => system.update(10));
});

test("pending boss blocks new objective and director but permits existing objective to finish", () => {
  const scene = sceneFixture();
  const system = scene.objectiveSystem;
  scene.pendingBossLevels = [3];
  assert.equal(system.startObjective(), null);
  scene.pendingBossLevels = [];
  assert.ok(system.startObjective());
  scene.pendingBossLevels = [3];
  const director = new RunDirector(scene);
  director.nextAt = 80;
  director.update(1, 80);
  assert.equal(director.active, null);
  assert.equal(director.warning, false);
  system.update(35);
  assert.equal(system.activeObjective.status, "failed");
  system.update(3.5);
  assert.equal(system.activeObjective, null);
  system.update(1);
  assert.equal(system.activeObjective, null);
});

function spawnerFixture(cap = 5) {
  const scene = sceneFixture();
  const enemies = [];
  scene.add.existing = () => {};
  scene.physics = { add: { existing() {}, group() { return { getChildren: () => enemies, add(enemy) { enemies.push(enemy); }, clear() { enemies.length = 0; } }; } } };
  scene.enemySpawner = new EnemySpawner(scene, { maxActiveEnemies: cap });
  return scene;
}

test("spawnSingleEnemy enforces hard cap, valid distance and obstacle clearance", () => {
  const scene = spawnerFixture();
  const spawner = scene.enemySpawner;
  for (let i = 0; i < 10; i++) spawner.spawnSingleEnemy("penyebar_hoaks");
  assert.equal(spawner.getActiveCount(), 5);
  for (const enemy of spawner.enemies.getChildren()) {
    const distance = Math.hypot(enemy.x - scene.player.x, enemy.y - scene.player.y);
    assert.ok(distance >= spawner.minDist && distance <= spawner.maxDist + 0.001);
  }
  const blocked = spawnerFixture();
  blocked.arenaSystem.isPositionBlocked = () => true;
  assert.equal(blocked.enemySpawner.spawnSingleEnemy(), null);
  assert.equal(blocked.enemySpawner.getActiveCount(), 0);
  scene.isPaused = true;
  assert.equal(spawner.spawnSingleEnemy(), null);
});

test("spawner cap option can lower but never exceed Medium hard limit", () => {
  const over = spawnerFixture(100);
  assert.equal(over.enemySpawner.maxActiveEnemies, 35);
  const zero = spawnerFixture(0);
  assert.equal(zero.enemySpawner.spawnSingleEnemy(), null);
  assert.equal(zero.enemySpawner.getActiveCount(), 0);
});

test("objective supplies five live targets within cap before 35-second timer starts", () => {
  const scene = spawnerFixture();
  const system = scene.objectiveSystem;
  assert.ok(system.startObjective());
  assert.equal(scene.enemySpawner.getActiveCount(), 5);
  assert.equal(system.activeObjective.timeRemaining, 35);
  for (const enemy of scene.enemySpawner.enemies.getChildren()) {
    assert.equal(enemy.enemyId, "penyebar_hoaks");
    scene.events.emit("enemy-killed", { id: enemy.instanceId, enemyType: enemy.enemyId });
  }
  assert.equal(system.activeObjective.status, "completed");
  const full = spawnerFixture();
  for (let i = 0; i < 5; i++) full.enemySpawner.spawnSingleEnemy("tim_amplop");
  assert.equal(full.objectiveSystem.startObjective(), null);
  assert.equal(full.enemySpawner.getActiveCount(), 5);
});

test("spawner energy and kill count dedupe by instance ID", () => {
  const scene = spawnerFixture();
  let energy = 0;
  scene.stats.addEnergy = (n) => energy += n;
  for (let i = 0; i < 3; i++) scene.events.emit("enemy-killed", { id: "same", enemyType: "tim_amplop" });
  scene.events.emit("enemy-killed", { id: "different", enemyType: "tim_amplop" });
  assert.equal(scene.enemySpawner.totalKilled, 2);
  assert.equal(energy, 4);
});

test("Medium default preserves 1x stats, pacing boundaries and three-level boss milestones", async () => {
  const { DIFFICULTY_CONFIG, DEFAULT_DIFFICULTY } = await import("../config/difficultyConfig.js");
  assert.equal(DEFAULT_DIFFICULTY, "medium");
  assert.equal(DIFFICULTY_CONFIG.id, "medium");
  assert.equal(DIFFICULTY_CONFIG.label, "Medium");
  assert.deepEqual(DIFFICULTY_CONFIG.multipliers, { hp: 1, damage: 1, speed: 1, xp: 1 });
  assert.equal(DIFFICULTY_CONFIG.bossMilestoneEvery, 3);
  const scene = sceneFixture();
  let pace;
  scene.enemySpawner.setPacing = (value) => pace = value;
  const director = new RunDirector(scene);
  director.nextAt = Infinity;
  for (const [seconds, expected] of [[0, 1], [179.99, 1], [180, 1.3], [299.99, 1.3], [300, 1.6]]) {
    director.update(0.016, seconds);
    assert.equal(pace, expected);
  }
});

test("late ranged burst waits visible 900ms, freezes on pause, locks aim and bounds spread", () => {
  const scene = spawnerFixture();
  scene.survivalTime = 180;
  const enemy = scene.enemySpawner.spawnSingleEnemy("penyebar_hoaks");
  enemy.x = 1000; enemy.y = 1200;
  const shots = [];
  const projectiles = { fireHoaxBullet(...args) { shots.push(args); } };
  enemy.updateAI(10000, 2000, scene.player, projectiles);
  assert.equal(shots.length, 0);
  assert.ok(enemy.telegraphGraphics);
  scene.isPaused = true;
  enemy.updateAI(20000, 10000, scene.player, projectiles);
  scene.isPaused = false;
  scene.isLevelUpPaused = true;
  enemy.updateAI(30000, 10000, scene.player, projectiles);
  scene.isLevelUpPaused = false;
  scene.player.y += 200;
  enemy.updateAI(40000, 899, scene.player, projectiles);
  assert.equal(shots.length, 0);
  enemy.updateAI(40001, 1, scene.player, projectiles);
  assert.equal(shots.length, 3);
  const angles = shots.map(([x, y, tx, ty]) => Math.atan2(ty - y, tx - x));
  assert.ok(Math.abs(angles[1]) < 0.00001, "aim remains pre-windup target direction");
  assert.ok(angles.every((angle) => Math.abs(angle) <= 0.121));
  assert.ok(shots.every((args) => args[4] === 10 && args[5] === 220));
  enemy.updateAI(50000, 2000, scene.player, projectiles);
  assert.ok(enemy.telegraphGraphics);
  enemy.isDead = true;
  enemy.updateAI(60000, 1000, scene.player, projectiles);
  assert.equal(shots.length, 3);
  assert.equal(enemy.telegraphGraphics, null);
});

test("early ranged shot remains one baseline projectile and cooldown ignores wall clock", () => {
  const scene = spawnerFixture();
  scene.survivalTime = 179;
  const enemy = scene.enemySpawner.spawnSingleEnemy("penyebar_hoaks");
  enemy.x = 1000; enemy.y = 1200;
  const shots = [];
  const projectiles = { fireHoaxBullet(...args) { shots.push(args); } };
  enemy.updateAI(999999, 16, scene.player, projectiles);
  assert.equal(shots.length, 0);
  enemy.updateAI(9999999, 1984, scene.player, projectiles);
  assert.equal(shots.length, 1);
  assert.equal(shots[0][4], 10);
});

test("survival recorder writes real storage once per second without erasing unrelated keys", () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const store = new Map([["unrelated", "keep"]]);
  let writes = 0;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem(key) { return store.get(key) ?? null; },
    setItem(key, value) { writes++; store.set(key, value); },
  } });
  try {
    const service = achievementService();
    for (let frame = 0; frame < 180; frame++) service.recordSurvivalTime(frame / 60);
    assert.equal(writes, 2);
    assert.equal(JSON.parse(store.get("seranganFajarAchievements")).stats.maxSurvivalTime, 2);
    assert.equal(store.get("unrelated"), "keep");
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
});

test("objective retry waits for cap room and never advances alternate objective on failed start", () => {
  const scene = spawnerFixture(5);
  for (let i = 0; i < 5; i++) scene.enemySpawner.spawnSingleEnemy("tim_amplop");
  scene.objectiveSystem.update(0.016);
  assert.equal(scene.objectiveSystem.activeObjective, null);
  assert.equal(scene.objectiveSystem.objectiveIndex, 0);
  assert.equal(scene.enemySpawner.getActiveCount(), 5);
  for (const enemy of scene.enemySpawner.enemies.getChildren()) enemy.isDead = true;
  scene.survivalTime += 2;
  scene.objectiveSystem.update(0.016);
  assert.equal(scene.objectiveSystem.activeObjective.id, "bersihkan_hoaks");
  assert.equal(scene.enemySpawner.getActiveCount(), 5);
});

test("zone radius stays inside border even when player hugs corner", () => {
  const scene = sceneFixture();
  scene.player.x = 65; scene.player.y = 65;
  assert.ok(scene.objectiveSystem.startObjective(OBJECTIVE_TYPES.AMANKAN_KOTAK));
  const zone = scene.objectiveSystem.activeObjective.zone;
  assert.ok(zone.x - zone.radius >= 64 && zone.y - zone.radius >= 64);
  assert.ok(zone.x + zone.radius <= 2336 && zone.y + zone.radius <= 2336);
});

test("unknown boss never unlocks Naga achievement", () => {
  const service = achievementService();
  service.saveState = () => {};
  for (const id of [undefined, null, "", "unknown"]) service.recordBossDefeat(id);
  assert.equal(service.isUnlocked("penakluk_fajar"), false);
  assert.deepEqual(service.state.stats.bossesDefeated, []);
  service.recordBossDefeat("naga_fajar");
  assert.equal(service.isUnlocked("penakluk_fajar"), true);
});
