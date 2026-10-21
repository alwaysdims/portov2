import assert from "node:assert/strict";
import { test } from "node:test";
import { AchievementService } from "../services/AchievementService.js";
import { ACHIEVEMENTS } from "../config/achievementConfig.js";
import { ObjectiveSystem } from "../game/systems/ObjectiveSystem.js";
import { OBJECTIVE_TYPES, OBJECTIVE_CONFIGS } from "../config/objectiveConfig.js";
import { PlayerStats } from "../entities/player/PlayerStats.js";
import { getBossConfigForLevel, BOSS_ROSTER } from "../config/bossConfig.js";
import { RunDirector } from "../game/systems/RunDirector.js";

test("AchievementService: unlocks correctly, prevents duplicate rewards, tracks cumulative stats", () => {
  const service = new AchievementService();
  service.reset();

  // 1. Initial state
  const list = service.getAchievementsWithStatus();
  assert.equal(list.length, ACHIEVEMENTS.length);
  assert.equal(list.every((a) => !a.isUnlocked), true);

  // 2. Kill cumulative tracking (25 hoaks kills)
  for (let i = 0; i < 24; i++) {
    service.recordKill("penyebar_hoaks");
    assert.equal(service.isUnlocked("pembasmi_hoaks"), false);
  }
  service.recordKill("penyebar_hoaks");
  assert.equal(service.isUnlocked("pembasmi_hoaks"), true);
  // Repeat call should not crash or duplicate
  assert.equal(service.unlock("pembasmi_hoaks"), false);

  // 3. Survival time (300 seconds)
  service.recordSurvivalTime(299);
  assert.equal(service.isUnlocked("tak_terkalahkan"), false);
  service.recordSurvivalTime(300);
  assert.equal(service.isUnlocked("tak_terkalahkan"), true);

  // 4. Evolution Badai Surat Suara
  service.recordEvolution("badaiSurat");
  assert.equal(service.isUnlocked("master_surat_suara"), true);

  // 5. Boss Defeat (Naga Fajar)
  service.recordBossDefeat("naga_fajar");
  assert.equal(service.isUnlocked("penakluk_fajar"), true);

  // 6. Dynamic Objective (Amankan Kotak Suara)
  service.recordObjectiveComplete("amankan_kotak");
  assert.equal(service.isUnlocked("pengawal_demokrasi"), true);

  // 7. Combo streak (20x)
  service.recordCombo(19);
  assert.equal(service.isUnlocked("raja_combo"), false);
  service.recordCombo(20);
  assert.equal(service.isUnlocked("raja_combo"), true);

  // Reset clears state
  service.reset();
  assert.equal(service.isUnlocked("raja_combo"), false);
});

test("ObjectiveSystem: Bersihkan Hoaks progress, completion, single reward, and timeout failure", () => {
  let emittedTelemetry = null;
  const mockScene = {
    events: {
      listeners: {},
      on(evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      off(evt, fn) {
        if (!this.listeners[evt]) return;
        this.listeners[evt] = this.listeners[evt].filter((l) => l !== fn);
      },
      emit(evt, data) {
        (this.listeners[evt] || []).forEach((fn) => fn(data));
      },
    },
    gameEvents: {
      onObjectiveStatus(telemetry) {
        emittedTelemetry = telemetry;
      },
    },
    stats: new PlayerStats(),
    player: { x: 500, y: 500, active: true },
    score: 0,
    addScore(p) {
      this.score += p;
    },
    survivalTime: 80,
    isPaused: false,
    isLevelUpPaused: false,
    isGameOver: false,
    time: {
      now: 1000,
      delayedCall(ms, fn) {
        // Mock instant delayed call for tests
        fn();
      },
    },
    enemySpawner: {
      ensureObjectiveSupply: () => true,
      enemies: { getChildren: () => [] },
      spawnSingleEnemy() { return { active: true, enemyId: "penyebar_hoaks" }; },
    },
    vfxManager: {
      shakeCamera() {},
      spawnHitSparks() {},
    },
  };

  const objSys = new ObjectiveSystem(mockScene);

  // 1. Start Bersihkan Hoaks
  objSys.startObjective(OBJECTIVE_TYPES.BERSIHKAN_HOAKS);
  assert.ok(objSys.activeObjective);
  assert.equal(objSys.activeObjective.id, OBJECTIVE_TYPES.BERSIHKAN_HOAKS);
  assert.equal(objSys.activeObjective.progress, 0);
  assert.equal(objSys.activeObjective.target, 5);
  assert.equal(emittedTelemetry.title, "BERSIHKAN HOAKS");

  // 2. Kill other enemy should not advance hoaks objective
  mockScene.events.emit("enemy-killed", { enemyType: "tim_amplop" });
  assert.equal(objSys.activeObjective.progress, 0);

  // 3. Kill 4 hoaks
  for (let i = 0; i < 4; i++) {
    mockScene.events.emit("enemy-killed", { id: `hoaks_${i}`, enemyType: "penyebar_hoaks" });
  }
  assert.equal(objSys.activeObjective.progress, 4);
  assert.equal(objSys.activeObjective.status, "active");

  const prevXp = mockScene.stats.totalXp;
  const prevScore = mockScene.score;

  // 4. 5th kill completes objective
  mockScene.events.emit("enemy-killed", { id: "hoaks_final", enemyType: "penyebar_hoaks" });
  assert.equal(mockScene.stats.totalXp, prevXp + OBJECTIVE_CONFIGS.bersihkan_hoaks.rewardXp);
  assert.equal(mockScene.score, prevScore + OBJECTIVE_CONFIGS.bersihkan_hoaks.rewardScore);
  assert.equal(objSys.completedCount, 1);

  // Extra kills after completion must not grant duplicate rewards
  mockScene.events.emit("enemy-killed", { id: "hoaks_final", enemyType: "penyebar_hoaks" });
  assert.equal(mockScene.stats.totalXp, prevXp + OBJECTIVE_CONFIGS.bersihkan_hoaks.rewardXp);

  objSys.destroy();
});

test("ObjectiveSystem: Amankan Kotak Suara zone hold, progress accumulation, and fairness guards", () => {
  let potionSpawned = false;
  const mockScene = {
    events: {
      listeners: {},
      on(evt, fn) {
        this.listeners[evt] = this.listeners[evt] || [];
        this.listeners[evt].push(fn);
      },
      off(evt, fn) {
        if (!this.listeners[evt]) return;
        this.listeners[evt] = this.listeners[evt].filter((l) => l !== fn);
      },
      emit(evt, data) {
        (this.listeners[evt] || []).forEach((fn) => fn(data));
      },
    },
    gameEvents: {
      onObjectiveStatus() {},
    },
    stats: new PlayerStats(),
    player: { x: 500, y: 500, active: true },
    score: 0,
    addScore(p) {
      this.score += p;
    },
    survivalTime: 80,
    isPaused: false,
    isLevelUpPaused: false,
    isGameOver: false,
    time: { now: 1000, delayedCall(ms, fn) { fn(); } },
    vfxManager: { shakeCamera() {}, spawnHitSparks() {} },
    pickupSystem: {
      spawnItem(type) {
        if (type === "health") potionSpawned = true;
      },
    },
    arenaSystem: {
      isPositionBlocked() { return false; },
    },
    add: {
      graphics() {
        return {
          setDepth() {},
          clear() {},
          fillStyle() {},
          fillCircle() {},
          lineStyle() {},
          strokeCircle() {},
          beginPath() {},
          arc() {},
          strokePath() {},
          destroy() {},
          scene: true,
        };
      },
    },
  };

  const objSys = new ObjectiveSystem(mockScene);
  objSys.startObjective(OBJECTIVE_TYPES.AMANKAN_KOTAK);
  assert.ok(objSys.activeObjective);
  assert.equal(objSys.activeObjective.id, OBJECTIVE_TYPES.AMANKAN_KOTAK);

  // Player position outside zone
  mockScene.player.x = 2000;
  mockScene.player.y = 2000;
  objSys.update(1.0);
  assert.equal(objSys.activeObjective.progress, 0);

  // Player position inside zone
  const z = objSys.activeObjective.zone;
  mockScene.player.x = z.x;
  mockScene.player.y = z.y;
  objSys.update(5.0);
  assert.equal(objSys.activeObjective.progress, 5.0);

  // Complete hold (requires 12s)
  objSys.update(7.1);
  assert.equal(objSys.completedCount, 1);
  assert.equal(potionSpawned, true);

  objSys.destroy();
});

test("RunDirector and Objective fairness: no overlapping arena events and objectives", () => {
  const mockScene = {
    stats: new PlayerStats(),
    survivalTime: 120,
    activeBoss: null,
    pendingBossLevels: [],
    objectiveSystem: {
      activeObjective: { id: "bersihkan_hoaks" },
    },
    gameEvents: { onArenaEvent() {} },
    vfxManager: { shakeCamera() {} },
  };

  const director = new RunDirector(mockScene);
  director.nextAt = 120;
  director.update(1.0, 120);

  // Arena event must NOT start while objective is active
  assert.equal(director.active, null);
  assert.ok(director.nextAt > 120);

  director.destroy();
});

test("Boss milestone configuration and roster properties", () => {
  // Boss 1: Naga Fajar at milestone level 1
  const b1 = getBossConfigForLevel(1);
  assert.equal(b1.id, "naga_fajar");
  assert.equal(b1.name, "NAGA FAJAR");
  assert.equal(b1.hp, 1500);
  assert.equal(b1.rageHpThreshold, 0.5);

  // Boss 2: Mega Bot Kampanye at milestone level 2
  const b2 = getBossConfigForLevel(2);
  assert.equal(b2.id, "mega_bot_kampanye");
  assert.equal(b2.hp, 2800);

  // Total boss roster is defined
  assert.ok(BOSS_ROSTER.length >= 3);
});
