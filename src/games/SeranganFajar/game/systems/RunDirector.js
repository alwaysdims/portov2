import { ENEMY_TYPES } from "../../entities/enemies/EnemyStats.js";
import { ITEM_TYPES } from "./PickupSystem.js";
import { EVENT_BALANCE } from "../../config/eventConfig.js";
import { audioManager } from "../audio/AudioManager.js";

// Director owns pacing and finite events; scene remains owner of Phaser objects.
export class RunDirector {
  constructor(scene) {
    this.scene = scene;
    this.nextAt = EVENT_BALANCE.firstAt;
    this.active = null;
    this.elapsed = 0;
    this.tick = 0;
    this.eventIndex = 0;
    this.warning = false;
    this.eventItems = new Map();
  }

  update(deltaSeconds, survivalTime) {
    const scene = this.scene;
    if (!scene?.stats?.isAlive() || scene.isGameOver || scene.isPaused || scene.isLevelUpPaused) return;
    const spawner = scene.enemySpawner;
    // Change composition and cadence, not enemy HP or damage.
    if (spawner && !this.active) {
      const phase = survivalTime < 180 ? 0 : survivalTime < 300 ? 1 : 2;
      spawner.setPacing(phase === 0 ? 1 : phase === 1 ? 1.3 : 1.6);
    }
    if (scene.activeBoss?.active || scene.pendingBossLevels?.length) {
      if (this.active || this.warning) this.end(survivalTime);
      this.nextAt = Math.max(this.nextAt, survivalTime + EVENT_BALANCE.warningSeconds);
      return;
    }
    if (!this.active && !this.warning && survivalTime >= this.nextAt - EVENT_BALANCE.warningSeconds) {
      this.warning = true;
      scene.gameEvents?.onArenaEvent?.({ name: this.eventIndex % 2 === 0 ? "Serbuan Tim Kampanye" : "Hujan Amplop", warning: true });
      audioManager.playLevelUp();
    }
    if (!this.active && survivalTime >= this.nextAt) {
      this.active = this.eventIndex++ % 2 === 0 ? "Serbuan Tim Kampanye" : "Hujan Amplop";
      this.warning = false;
      this.elapsed = 0;
      this.tick = 0;
      scene.gameEvents?.onArenaEvent?.({ name: this.active, remaining: EVENT_BALANCE.duration });
      scene.vfxManager?.shakeCamera(180, 0.004);
    }
    if (!this.active) return;
    this.elapsed += deltaSeconds;
    this.tick += deltaSeconds;
    const interval = this.active === "Serbuan Tim Kampanye" ? EVENT_BALANCE.campaignInterval : EVENT_BALANCE.envelopeInterval;
    if (this.tick >= interval) {
      this.tick -= interval;
      if (this.active === "Serbuan Tim Kampanye" && spawner?.getActiveCount() < Math.min(spawner.maxActiveEnemies, EVENT_BALANCE.campaignCap)) {
        spawner.spawnSingleEnemy(ENEMY_TYPES.TIM_AMPLOP);
      } else if (this.active === "Hujan Amplop" && scene.pickupSystem && scene.player) {
        const angle = Math.random() * Math.PI * 2;
        const x = Math.max(80, Math.min(2320, scene.player.x + Math.cos(angle) * 120));
        const y = Math.max(80, Math.min(2320, scene.player.y + Math.sin(angle) * 120));
        if (!scene.arenaSystem?.isPositionBlocked(x, y, 15)) {
          const item = scene.pickupSystem.spawnItem(ITEM_TYPES.DANA, x, y, EVENT_BALANCE.envelopeValue);
          if (item) this.eventItems.set(item, item.spawnTime);
        }
      }
    }
    if (this.elapsed >= EVENT_BALANCE.duration) this.end(survivalTime);
  }

  end(survivalTime = this.scene?.survivalTime || 0) {
    for (const [item, spawnTime] of this.eventItems) {
      if (item?.active && item.spawnTime === spawnTime) this.scene?.pickupSystem?.recycleItem(item);
    }
    this.eventItems.clear();
    this.active = null;
    this.warning = false;
    this.nextAt = survivalTime + EVENT_BALANCE.cooldown;
    this.scene?.gameEvents?.onArenaEvent?.(null);
  }

  destroy() {
    this.end();
    this.scene = null;
  }
}
