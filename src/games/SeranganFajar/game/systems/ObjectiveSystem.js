// ObjectiveSystem.js — Dynamic In-Game Objectives for Serangan Fajar: The Last Stand
// PRD Tahap 19: Dynamic objectives (Bersihkan Hoaks & Amankan Kotak Suara) with fairness checks and RunDirector synchronization.

import { OBJECTIVE_TIMING, OBJECTIVE_TYPES, OBJECTIVE_CONFIGS } from "../../config/objectiveConfig.js";
import { ITEM_TYPES } from "./PickupSystem.js";
import { audioManager } from "../audio/AudioManager.js";
import { achievementService } from "../../services/AchievementService.js";

export class ObjectiveSystem {
  constructor(scene) {
    this.scene = scene;
    this.activeObjective = null;
    this.nextObjectiveAt = OBJECTIVE_TIMING.firstAt;
    this.cooldownSeconds = OBJECTIVE_TIMING.cooldown;
    this.feedbackRemaining = 0;
    this.processedKillIds = new Set();
    this.objectiveIndex = 0; // Alternates between 0 (Hoaks) and 1 (Kotak Suara)
    this.completedCount = 0;
    this.zoneGraphics = null;

    // Listen for enemy kill events
    this.onEnemyKilled = (data) => {
      this.handleEnemyKilled(data);
    };
    this.scene.events.on("enemy-killed", this.onEnemyKilled);
  }

  startObjective(type = OBJECTIVE_TYPES.BERSIHKAN_HOAKS) {
    if (this.activeObjective || !this.scene || this.scene.isGameOver || this.scene.isPaused || this.scene.isLevelUpPaused || !this.scene.stats?.isAlive()) return null;
    if (this.scene.activeBoss?.active || this.scene.pendingBossLevels?.length || this.scene.runDirector?.active || this.scene.runDirector?.warning) return null;

    const config = OBJECTIVE_CONFIGS[type];
    if (!config) return null;

    let zone = null;
    if (type === OBJECTIVE_TYPES.AMANKAN_KOTAK) {
      const p = this.scene.player;
      const arena = this.scene.arenaSystem;
      if (!p?.active || !arena?.isPositionBlocked) return null;
      const radius = config.zoneRadius;
      const margin = 64 + radius + 4; // Include visible pulse and entire hold area.
      for (let attempt = 0; attempt < 24; attempt++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 200 + Math.random() * 120;
        const x = Math.max(margin, Math.min((arena.width || 2400) - margin, p.x + Math.cos(angle) * distance));
        const y = Math.max(margin, Math.min((arena.height || 2400) - margin, p.y + Math.sin(angle) * distance));
        if (!arena.isPositionBlocked(x, y, radius + 4)) {
          zone = { x, y, radius };
          break;
        }
      }
      if (!zone) return null;
      this.zoneGraphics = this.scene.add.graphics();
      this.zoneGraphics.setDepth(4);
    }

    if (type === OBJECTIVE_TYPES.BERSIHKAN_HOAKS && !this.scene.enemySpawner?.ensureObjectiveSupply?.(config.targetKills)) return null;
    this.processedKillIds.clear();
    this.feedbackRemaining = 0;
    this.activeObjective = {
      id: type,
      config,
      progress: 0,
      target: type === OBJECTIVE_TYPES.BERSIHKAN_HOAKS ? config.targetKills : config.holdDuration,
      timeRemaining: type === OBJECTIVE_TYPES.BERSIHKAN_HOAKS ? config.durationSeconds : config.timeLimitSeconds,
      zone,
      status: "active",
      rewardGiven: false,
    };

    // Audio & VFX alert
    audioManager.playSkill1();
    this.emitTelemetry();
    return this.activeObjective;
  }

  handleEnemyKilled(data) {
    if (!this.scene || this.scene.isGameOver || this.scene.isPaused || this.scene.isLevelUpPaused || !this.scene.stats?.isAlive()) return;
    if (!this.activeObjective || this.activeObjective.status !== "active") return;
    const id = data?.id;
    if (typeof id !== "string" || !id || this.processedKillIds.has(id)) return;

    if (this.activeObjective.id === OBJECTIVE_TYPES.BERSIHKAN_HOAKS) {
      if (data?.enemyType === "penyebar_hoaks" || data?.enemyId === "penyebar_hoaks") {
        this.processedKillIds.add(id);
        this.activeObjective.progress += 1;
        this.emitTelemetry();

        if (this.activeObjective.progress >= this.activeObjective.target) {
          this.completeObjective();
        }
      }
    }
  }

  update(deltaSeconds) {
    if (!this.scene) return;
    if (this.scene.isGameOver || !this.scene.stats?.isAlive()) {
      this.reset();
      return;
    }
    if (this.scene.isPaused || this.scene.isLevelUpPaused || !Number.isFinite(deltaSeconds) || deltaSeconds < 0) return;
    if (this.activeObjective && this.activeObjective.status !== "active") {
      this.feedbackRemaining = Math.max(0, this.feedbackRemaining - deltaSeconds);
      if (this.feedbackRemaining === 0) {
        this.activeObjective = null;
        this.nextObjectiveAt = this.scene.survivalTime + this.cooldownSeconds;
        this.emitTelemetry();
      }
      return;
    }

    // Trigger next objective if due and no active encounter
    if (!this.activeObjective) {
      if (this.scene.survivalTime >= this.nextObjectiveAt) {
        // Fairness checks: delay objective if Boss or Arena Event is active
        if (this.scene.activeBoss?.active || this.scene.pendingBossLevels?.length) {
          this.nextObjectiveAt = this.scene.survivalTime + 20;
          return;
        }
        if (this.scene.runDirector?.active || this.scene.runDirector?.warning) {
          this.nextObjectiveAt = this.scene.survivalTime + 15;
          return;
        }

        const types = [OBJECTIVE_TYPES.BERSIHKAN_HOAKS, OBJECTIVE_TYPES.AMANKAN_KOTAK];
        const nextType = types[this.objectiveIndex % types.length];
        if (this.startObjective(nextType)) this.objectiveIndex++;
        else this.nextObjectiveAt = this.scene.survivalTime + OBJECTIVE_TIMING.retrySeconds;
      }
      return;
    }

    if (this.activeObjective.status !== "active") return;

    // Tick objective timer
    this.activeObjective.timeRemaining = Math.max(0, this.activeObjective.timeRemaining - deltaSeconds);

    // Amankan Kotak Suara logic
    if (this.activeObjective.id === OBJECTIVE_TYPES.AMANKAN_KOTAK && this.activeObjective.zone) {
      const p = this.scene.player;
      const z = this.activeObjective.zone;
      const dist = Math.hypot(p.x - z.x, p.y - z.y);
      const isInside = dist <= z.radius;

      if (isInside) {
        this.activeObjective.progress = Math.min(this.activeObjective.target, this.activeObjective.progress + deltaSeconds);
        if (Math.random() < 0.15) {
          this.scene.vfxManager?.spawnHitSparks(p.x, p.y, 0x10b981, 2);
        }
      }

      this.renderZone(z, isInside, this.activeObjective.progress / this.activeObjective.target);

      if (this.activeObjective.progress >= this.activeObjective.target) {
        this.completeObjective();
        return;
      }
    }

    // Time's up -> fail objective
    if (this.activeObjective.timeRemaining <= 0) {
      this.failObjective();
      return;
    }

    this.emitTelemetry();
  }

  renderZone(zone, isPlayerInside, progressRatio) {
    if (!this.zoneGraphics || !this.zoneGraphics.scene) return;
    this.zoneGraphics.clear();

    const t = this.scene.time.now * 0.003;
    const pulse = Math.sin(t) * 4;
    const radius = zone.radius + pulse;

    // Fill
    const fillColor = isPlayerInside ? 0x10b981 : 0x06b6d4;
    const fillAlpha = isPlayerInside ? 0.30 : 0.15;
    this.zoneGraphics.fillStyle(fillColor, fillAlpha);
    this.zoneGraphics.fillCircle(zone.x, zone.y, radius);

    // Outer line
    const strokeColor = isPlayerInside ? 0x34d399 : 0x38bdf8;
    this.zoneGraphics.lineStyle(3, strokeColor, 0.9);
    this.zoneGraphics.strokeCircle(zone.x, zone.y, radius);

    // Progress arc
    if (progressRatio > 0) {
      this.zoneGraphics.lineStyle(5, 0xfacc15, 1);
      this.zoneGraphics.beginPath();
      this.zoneGraphics.arc(zone.x, zone.y, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progressRatio, false);
      this.zoneGraphics.strokePath();
    }
  }

  completeObjective() {
    if (!this.scene || this.scene.isGameOver || !this.scene.stats?.isAlive()) return;
    if (!this.activeObjective || this.activeObjective.status !== "active" || this.activeObjective.rewardGiven) return;
    this.activeObjective.status = "completed";
    this.activeObjective.rewardGiven = true;
    this.completedCount++;

    const cfg = this.activeObjective.config;
    // Award rewards exactly once
    if (cfg.rewardXp) {
      const result = this.scene.stats?.addXp(cfg.rewardXp);
      if (result?.leveledUp) this.scene.handleLevelUpTrigger?.(result.currentLevel);
    }
    if (cfg.rewardScore) {
      this.scene.addScore(cfg.rewardScore);
    }
    if (cfg.rewardPotions && this.scene.pickupSystem && this.activeObjective.zone) {
      this.scene.pickupSystem.spawnItem(ITEM_TYPES.HEALTH, this.activeObjective.zone.x - 20, this.activeObjective.zone.y, 200);
      this.scene.pickupSystem.spawnItem(ITEM_TYPES.MANA, this.activeObjective.zone.x + 20, this.activeObjective.zone.y, 40);
    }

    // Audio & VFX
    audioManager.playUltimate();
    this.scene.vfxManager?.shakeCamera(200, 0.005);
    achievementService.recordObjectiveComplete(this.activeObjective.id);

    this.clearZoneGraphics();
    this.emitTelemetry();

    // Live delta only: no delayed callback can outlive death or restart.
    this.feedbackRemaining = OBJECTIVE_TIMING.feedbackSeconds;
  }

  failObjective() {
    if (!this.activeObjective || this.activeObjective.status !== "active") return;
    this.activeObjective.status = "failed";

    audioManager.playEnemyDeath();
    this.clearZoneGraphics();
    this.emitTelemetry();

    // Live delta only: no delayed callback can outlive death or restart.
    this.feedbackRemaining = OBJECTIVE_TIMING.feedbackSeconds;
  }

  clearZoneGraphics() {
    if (this.zoneGraphics) {
      this.zoneGraphics.clear();
      this.zoneGraphics.destroy();
      this.zoneGraphics = null;
    }
  }

  getTelemetry() {
    if (!this.activeObjective) return null;
    return {
      id: this.activeObjective.id,
      title: this.activeObjective.config.title,
      subtitle: this.activeObjective.config.subtitle,
      description: this.activeObjective.config.description,
      progress: Math.round(this.activeObjective.progress * 10) / 10,
      target: this.activeObjective.target,
      timeRemaining: Math.ceil(this.activeObjective.timeRemaining),
      status: this.activeObjective.status,
      percent: Math.min(100, Math.round((this.activeObjective.progress / this.activeObjective.target) * 100)),
    };
  }

  emitTelemetry() {
    this.scene?.gameEvents?.onObjectiveStatus?.(this.getTelemetry());
  }

  reset() {
    this.clearZoneGraphics();
    this.activeObjective = null;
    this.feedbackRemaining = 0;
    this.processedKillIds.clear();
    this.nextObjectiveAt = (this.scene?.survivalTime || 0) + this.cooldownSeconds;
    this.emitTelemetry();
  }

  destroy() {
    this.reset();
    this.scene?.events.off("enemy-killed", this.onEnemyKilled);
    this.scene = null;
  }
}
