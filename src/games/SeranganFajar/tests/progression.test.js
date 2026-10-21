import assert from "node:assert/strict";
import { test } from "node:test";
import { PlayerStats } from "../entities/player/PlayerStats.js";
import { UpgradeSystem } from "../game/systems/UpgradeSystem.js";
import { eligibleUpgrades, UPGRADE_DEFINITIONS } from "../config/upgradeConfig.js";
import { RunDirector } from "../game/systems/RunDirector.js";
import { EVENT_BALANCE } from "../config/eventConfig.js";
import { readLeaderboard, LEADERBOARD_STORAGE_KEY } from "../services/LeaderboardService.js";

test("XP threshold, overflow, multiple cards, death and restart", () => {
  const stats = new PlayerStats();
  stats.addXp(45);
  assert.equal(stats.getSnapshot().xpPercent, 90);
  assert.equal(stats.getSnapshot().totalXp, 45);
  assert.equal(stats.addXp(5).levelsGained, 1);
  assert.equal(stats.totalXp, 50);
  assert.equal(stats.level, 2);
  assert.equal(stats.xp, 0);
  stats.addXp(160);
  assert.equal(stats.level, 3);
  assert.equal(stats.xp, 19);
  assert.equal(stats.totalXp, 210);
  stats.addXp(1000);
  assert.equal(stats.totalXp, 1210);
  assert.ok(stats.queuedLevelUps > 1);
  while (stats.queuedLevelUps) assert.equal(stats.consumeQueuedLevelUp(), true);
  assert.equal(stats.queuedLevelUps, 0);
  stats.takeDamage(10000);
  assert.equal(stats.addXp(30).levelsGained, 0);
  stats.reset();
  assert.deepEqual([stats.xp, stats.totalXp, stats.level, stats.queuedLevelUps], [0, 0, 1, 0]);
  assert.equal(stats.addXp(Infinity).levelsGained, 0);
});

test("choices: deterministic, unique, eligibility and selected card validation", () => {
  const stats = new PlayerStats();
  const system = new UpgradeSystem({ stats }, () => 0.5);
  const baseline = system.getUpgradeChoices({}, 3);
  assert.deepEqual(baseline, system.getUpgradeChoices({}, 3));
  assert.equal(new Set(baseline.map(c => c.id)).size, 3);
  assert.equal(eligibleUpgrades({}).some(c => c.id === "badaiSurat"), false);
  assert.equal(system.applyUpgrade("badaiSurat"), false);
  assert.equal(system.applyUpgrade("suratPecah"), true);
  assert.equal(system.applyUpgrade("suratPecah"), false);
  assert.equal(system.applyUpgrade("tembusBarisan"), true);
  assert.ok(system.getUpgradeChoices({ ...stats.upgradeLevels, ...stats.behaviorUpgrades }).some(c => c.id === "badaiSurat"));
  assert.equal(system.applyUpgrade("badaiSurat"), true);
  assert.equal(system.applyUpgrade("badaiSurat"), false);
  stats.reset();
  assert.equal(stats.behaviorUpgrades.badaiSurat, undefined);
});

test("eligibility: one/two cards, all maxed, invalid and capped applications", () => {
  const stats = new PlayerStats();
  const system = new UpgradeSystem({ stats }, () => 0.25);
  const allMax = Object.fromEntries(UPGRADE_DEFINITIONS.map(({ id, maxStacks }) => [id, maxStacks]));
  assert.deepEqual(system.getUpgradeChoices(allMax), []);
  for (const def of UPGRADE_DEFINITIONS) {
    if (def.maxStacks === 1) stats.behaviorUpgrades[def.id] = 1;
    else stats.upgradeLevels[def.id] = def.maxStacks;
  }
  assert.equal(system.applyUpgrade("damage"), false);
  assert.equal(stats.applyUpgrade("damage"), false);
  assert.equal(system.applyUpgrade("bogus"), false);
  assert.equal(system.getUpgradeChoices({ ...allMax, damage: 4 }).length, 1);
  assert.equal(system.getUpgradeChoices({ ...allMax, damage: 4, speed: 4 }).length, 2);
  assert.equal(eligibleUpgrades({}).some(({ id }) => id === "fajarBangkit"), false);
});

test("leaderboard lama tetap dibaca tanpa mengubah votesCollected historis", () => {
  const prior = globalThis.localStorage;
  globalThis.localStorage = { getItem: (key) => key === LEADERBOARD_STORAGE_KEY ?
    JSON.stringify([{ id: "old", playerName: "WOWO", score: 10, votesCollected: 0, survivalTime: 1 }]) : null };
  try {
    assert.equal(readLeaderboard()[0].votesCollected, 0);
  } finally {
    globalThis.localStorage = prior;
  }
});

test("director: warning, event, cooldown, pause, boss, death dan cleanup", () => {
  const calls = [];
  const scene = {
    stats: { isAlive: () => true }, isPaused: false, isLevelUpPaused: false, isGameOver: false,
    survivalTime: 0, pendingBossLevels: [], activeBoss: null,
    gameEvents: { onArenaEvent: (event) => calls.push(event) },
    enemySpawner: { maxActiveEnemies: 35, getActiveCount: () => 0, spawnSingleEnemy: () => calls.push("spawn"), setPacing: () => {} },
    player: { x: 1200, y: 1200 },
    arenaSystem: { isPositionBlocked: () => false },
    pickupSystem: { spawnItem: () => null, recycleItem: () => {} },
    vfxManager: { shakeCamera: () => {} },
  };
  const director = new RunDirector(scene);
  scene.isPaused = true;
  director.update(1, EVENT_BALANCE.firstAt);
  assert.equal(director.active, null);
  scene.isPaused = false;
  director.update(1, EVENT_BALANCE.firstAt - EVENT_BALANCE.warningSeconds);
  assert.equal(calls.filter((x) => x?.warning).length, 1);
  director.update(1, EVENT_BALANCE.firstAt - EVENT_BALANCE.warningSeconds + 1);
  assert.equal(calls.filter((x) => x?.warning).length, 1);
  director.update(1, EVENT_BALANCE.firstAt);
  assert.equal(director.active, "Serbuan Tim Kampanye");
  scene.isLevelUpPaused = true;
  director.update(10, EVENT_BALANCE.firstAt + 10);
  assert.equal(director.elapsed, 1);
  scene.isLevelUpPaused = false;
  director.update(3, EVENT_BALANCE.firstAt + 4);
  assert.equal(calls.filter((x) => x === "spawn").length, 1);
  scene.activeBoss = { active: true };
  director.update(1, EVENT_BALANCE.firstAt + 5);
  assert.equal(director.active, null);
  scene.activeBoss = null;
  scene.isGameOver = true;
  director.update(99, EVENT_BALANCE.firstAt + 1000);
  assert.equal(director.active, null);
  director.destroy();
  assert.equal(director.scene, null);
});

test("benteng fajar: emergency shield rescues fatal hit", () => {
  const stats = new PlayerStats();
  stats.hp = 50;
  stats.behaviorUpgrades.bentengFajar = 1;
  const res = stats.takeDamage(60);
  assert.equal(res.died, false);
  assert.equal(stats.isAlive(), true);
  assert.equal(stats.hp, 50);
  assert.equal(stats.shield, 90);
});
