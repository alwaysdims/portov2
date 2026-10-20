import Phaser from "phaser";
import { EnemyBase } from "./EnemyBase.js";
import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { ITEM_TYPES } from "../../game/systems/PickupSystem.js";
import { audioManager } from "../../game/audio/AudioManager.js";

// NagaFajarBoss.js — Level-Up Boss #1 Naga Fajar
export class NagaFajarBoss extends EnemyBase {
  constructor(scene, x, y, bossConfig) {
    const config = {
      id: bossConfig?.id || "naga_fajar",
      name: bossConfig?.name || "NAGA FAJAR",
      role: "boss",
      hp: bossConfig?.hp || 4000,
      speed: bossConfig?.speed || 95,
      damage: bossConfig?.damage || 60,
      attackInterval: bossConfig?.attackInterval || 1400,
      scoreValue: bossConfig?.scoreValue || 1500,
      bodySize: bossConfig?.bodySize || { width: 80, height: 70 },
      bodyOffset: bossConfig?.bodyOffset || { x: 14, y: 15 },
    };

    super(scene, x, y, ASSET_KEYS.BOSS_NAGA_IDLE, config);
    this.bossConfig = bossConfig || config;
    this.setScale(1.2);
    this.setDepth(15);

    // Boss state
    this.isBoss = true;
    this.isRage = false;
    this.rageThreshold = (bossConfig?.rageHpThreshold || 0.5) * this.maxHp;
    this.attackCooldownTimer = 1000;
    this.patternStep = 0; // Cycles: 0: Area, 1: Paper Spread, 2: Summon Minion
    this.telegraphGraphics = this.scene.add.graphics();
    this.telegraphGraphics.setDepth(14);

    // Disable redundant overhead health bar to save draw calls (Boss uses dedicated screen UI)
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.destroy();
      this.healthBar = null;
    }

    // Initial telemetry emit
    this.emitBossStatus(true);
  }

  tryAttack(target, time) {
    if (this.isDead || !this.active || this.scene.stats?.status === "dead") return false;

    if (time >= this.lastAttackTime + this.attackInterval) {
      this.lastAttackTime = time;
      const dmg = this.isRage ? 28 : 18;
      this.scene.takeDamage(dmg);
      audioManager.playPlayerHurt();
      this.scene?.vfxManager?.shakeCamera(150, 0.003);
      return true;
    }
    return false;
  }

  emitBossStatus(isActive = true) {
    const currentHp = typeof this.hp === "number" ? this.hp : this.maxHp;
    this.scene?.events?.emit("boss-status", {
      id: this.enemyId,
      name: this.enemyName,
      subtitle: this.bossConfig.subtitle || "Simbol Kekuatan Kebenaran",
      hp: Math.max(0, currentHp),
      maxHp: this.maxHp,
      hpPercent: Math.max(0, Math.min(100, (currentHp / this.maxHp) * 100)),
      isRage: this.isRage,
      active: isActive && !this.isDead,
    });
  }

  takeDamage(amount) {
    if (this.isDead) return false;
    const res = super.takeDamage(amount);

    // Check Phase 2 (Rage) trigger
    if (!this.isRage && this.hp <= this.rageThreshold) {
      this.triggerRagePhase();
    }

    this.emitBossStatus(!this.isDead);
    return res;
  }

  triggerRagePhase() {
    this.isRage = true;
    this.speed += this.bossConfig.rageSpeedBonus || 40;
    this.attackInterval = this.bossConfig.rageAttackInterval || 950;

    // Visual rage feedback
    if (this.scene.textures.exists(ASSET_KEYS.BOSS_NAGA_RAGE)) {
      this.setTexture(ASSET_KEYS.BOSS_NAGA_RAGE);
    } else {
      this.setTint(0xff3333);
    }

    this.scene?.vfxManager?.shakeCamera(350, 0.008);
    this.scene?.vfxManager?.spawnHitSparks?.(this.x, this.y, 0xff0000, 15);
    audioManager.playUltimate();

    // Floating rage banner
    const rageText = this.scene.add.text(this.x, this.y - 60, "BERSERK! PHASE 2", {
      fontFamily: "monospace",
      fontSize: "16px",
      fontStyle: "bold",
      fill: "#ef4444",
      stroke: "#000000",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: rageText,
      y: rageText.y - 35,
      alpha: 0,
      scale: 1.3,
      duration: 1200,
      onComplete: () => rageText.destroy(),
    });
  }

  updateAI(time, delta, target) {
    if (this.isDead || !this.active || !this.body) {
      if (this.telegraphGraphics) {
        this.telegraphGraphics.clear();
      }
      return;
    }

    if (!target || !target.active || this.scene.stats?.status === "dead") {
      this.setVelocity(0, 0);
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);

    // Always orient toward target
    this.setFlipX(dx < 0);

    // Move toward player if not within close combat range
    if (dist > 110) {
      this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
      const targetTex = this.isRage ? ASSET_KEYS.BOSS_NAGA_RAGE : ASSET_KEYS.BOSS_NAGA_WALK;
      if (this.texture.key !== targetTex && this.scene.textures.exists(targetTex)) {
        this.setTexture(targetTex);
      }
    } else {
      this.setVelocity(0, 0);
      const targetTex = this.isRage ? ASSET_KEYS.BOSS_NAGA_RAGE : ASSET_KEYS.BOSS_NAGA_IDLE;
      if (this.texture.key !== targetTex && this.scene.textures.exists(targetTex)) {
        this.setTexture(targetTex);
      }
    }

    // Attack pattern cooldown cycle
    this.attackCooldownTimer -= delta;
    if (this.attackCooldownTimer <= 0) {
      this.executeAttackPattern(target);
      this.attackCooldownTimer = this.attackInterval;
    }
  }

  executeAttackPattern(target) {
    if (this.isDead || !target || !target.active) return;

    // Pattern 1: Dragon Area Sweep / Slash
    if (this.patternStep === 0) {
      this.executeAreaSlash(target);
      this.patternStep = 1;
    }
    // Pattern 2: Paper Talisman Projectile Spread
    else if (this.patternStep === 1) {
      this.executePaperSpread(target);
      this.patternStep = 2;
    }
    // Pattern 3: Summon Naga Kecil Minions
    else {
      this.executeSummonMinions();
      this.patternStep = 0;
    }
  }

  executeAreaSlash(target) {
    const radius = this.isRage ? 105 : 85;
    const tx = target.x;
    const ty = target.y;

    // Red warning telegraph circle (850ms gives fair reaction window to dodge)
    if (this.telegraphGraphics) {
      this.telegraphGraphics.clear();
      this.telegraphGraphics.lineStyle(2, 0xef4444, 0.85);
      this.telegraphGraphics.strokeCircle(tx, ty, radius);
      this.telegraphGraphics.fillStyle(0xdc2626, 0.22);
      this.telegraphGraphics.fillCircle(tx, ty, radius);
    }

    if (this.scene.textures.exists(ASSET_KEYS.BOSS_NAGA_ATTACK) && !this.isRage) {
      this.setTexture(ASSET_KEYS.BOSS_NAGA_ATTACK);
    }

    this.scene.time.delayedCall(850, () => {
      if (this.isDead || !this.scene) {
        this.telegraphGraphics?.clear();
        return;
      }
      this.telegraphGraphics?.clear();

      // Trigger burst damage if player is within radius
      const currentDist = Phaser.Math.Distance.Between(target.x, target.y, tx, ty);
      if (currentDist <= radius && this.scene.stats?.isAlive()) {
        const dmg = this.isRage ? 30 : 20;
        this.scene.takeDamage(dmg);
        this.scene.vfxManager?.shakeCamera(180, 0.004);
      }

      // Visual flash
      this.scene.vfxManager?.spawnEnemyDeathDebris(tx, ty);
      audioManager.playSkillE();
    });
  }

  executePaperSpread(target) {
    const count = this.isRage ? 5 : 3;
    const dmg = this.isRage ? 16 : 12;
    this.scene.projectileSystem?.fireBossPaperSpread(this.x, this.y, target.x, target.y, count, dmg);
    audioManager.playSkillQ();
  }

  executeSummonMinions() {
    // Cap active minions to 2 maximum to keep battle focused and fair
    const activeMinions = this.scene.enemySpawner?.enemies?.getChildren()
      .filter((e) => e.active && !e.isDead && e.enemyId === "naga_kecil").length || 0;
    if (activeMinions >= 2) return;

    const count = 1;
    for (let i = 0; i < count; i++) {
      if (activeMinions + i >= 2) break;
      const angle = (i * Math.PI) + (Math.random() * 0.5);
      const spawnX = Phaser.Math.Clamp(this.x + Math.cos(angle) * 70, 150, 2250);
      const spawnY = Phaser.Math.Clamp(this.y + Math.sin(angle) * 70, 150, 2250);
      this.scene?.spawnNagaKecilMinion?.(spawnX, spawnY);
    }
    audioManager.playPlayerHurt();
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.telegraphGraphics) {
      this.telegraphGraphics.clear();
      this.telegraphGraphics.destroy();
      this.telegraphGraphics = null;
    }

    if (this.scene.textures.exists(ASSET_KEYS.BOSS_NAGA_DEATH)) {
      this.setTexture(ASSET_KEYS.BOSS_NAGA_DEATH);
    }

    // Hide boss status bar in UI
    this.emitBossStatus(false);

    // Notify scene
    this.scene?.events?.emit("boss-defeated", {
      id: this.enemyId,
      name: this.enemyName,
      x: this.x,
      y: this.y,
    });

    // Massive drops reward!
    const drops = this.bossConfig.drops || {};
    const ps = this.scene.pickupSystem;
    if (ps) {
      // 1. Suara (XP Besar)
      const suaraCount = drops.suaraCount || 5;
      const suaraVal = drops.suaraValue || 40;
      for (let i = 0; i < suaraCount; i++) {
        const ox = (Math.random() - 0.5) * 60;
        const oy = (Math.random() - 0.5) * 60;
        ps.spawnItem(ITEM_TYPES.SUARA, this.x + ox, this.y + oy, suaraVal);
      }

      // 2. Dana (Koin Emas)
      const danaCount = drops.danaCount || 8;
      const danaVal = drops.danaValue || 2;
      for (let i = 0; i < danaCount; i++) {
        const ox = (Math.random() - 0.5) * 70;
        const oy = (Math.random() - 0.5) * 70;
        ps.spawnItem(ITEM_TYPES.DANA, this.x + ox, this.y + oy, danaVal);
      }

      // 3. Health & Mana Potions
      ps.spawnItem(ITEM_TYPES.HEALTH, this.x - 30, this.y, 250);
      ps.spawnItem(ITEM_TYPES.MANA, this.x + 30, this.y, 50);

      // 4. Fajar Energy Orbs
      ps.spawnItem(ITEM_TYPES.FAJAR_ENERGY, this.x, this.y - 30, 25);
      ps.spawnItem(ITEM_TYPES.FAJAR_ENERGY, this.x, this.y + 30, 25);
    }

    // Visual & Audio Fanfare
    audioManager.playUltimate();
    this.scene?.vfxManager?.shakeCamera(500, 0.012);
    this.scene?.vfxManager?.spawnEnemyDeathDebris(this.x, this.y);

    super.die();
  }

  destroy(fromScene) {
    if (this.telegraphGraphics) {
      this.telegraphGraphics.clear();
      this.telegraphGraphics.destroy();
      this.telegraphGraphics = null;
    }
    super.destroy(fromScene);
  }
}
