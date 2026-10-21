import { BOSS_ATTACKS, isPointInBreath } from "../../config/bossAttackConfig.js";
import { EnemyBase } from "./EnemyBase.js";
import { NAGA_ANIMATIONS } from "../../game/systems/ActorAnimator.js";
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

    super(scene, x, y, ASSET_KEYS.BOSS_NAGA_ACTION, config);
    this.bossConfig = bossConfig || config;
    this.setScale(1.2);
    this.body.setSize(66, 54);
    this.body.setOffset(31, 54); // Keep collision inside animated coil.
    this.setDepth(15);

    // Boss state
    this.isBoss = true;
    this.isRage = false;
    this.rageThreshold = (bossConfig?.rageHpThreshold || 0.5) * this.maxHp;
    this.attackCooldownTimer = 1000;
    this.patternStep = 0; // Breath, circle slash, paper fan, minions; same order in both phases.
    this.attackState = null;
    this.visualState = null;
    this.visualStateElapsed = 0;
    this.visualHoldMs = 0;
    this.contactCooldown = this.attackInterval;
    this.rewardGiven = false;
    this.encounterEnded = false;
    this.onSceneShutdown = () => {
      this.encounterEnded = true;
      this.cancelAttacks();
    };
    scene.events.once("shutdown", this.onSceneShutdown);
    this.telegraphGraphics = this.scene.add.graphics();
    this.telegraphGraphics.setDepth(14);

    // Disable redundant overhead health bar to save draw calls (Boss uses dedicated screen UI)
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.destroy();
      this.healthBar = null;
    }

    // Initial telemetry emit & intro shockwave
    this.emitBossStatus(true);
    this.scene?.vfxManager?.shakeCamera(160, 0.002);
    this.scene?.vfxManager?.spawnHitSparks(x, y, 0xf43f5e, 10);

    // Start idle animation on spritesheet
    this.setVisualState("idle");
  }

  canFight() {
    return !this.isDead && !this.encounterEnded && this.active && this.body && this.scene &&
      !this.scene.isGameOver && this.scene.stats?.isAlive() &&
      (!this.scene.sys?.isActive || this.scene.sys.isActive());
  }

  isGameplayPaused() {
    return this.scene?.isPaused || this.scene?.isLevelUpPaused || this.scene?.physics?.world?.isPaused;
  }

  tryAttack(target) {
    if (!this.canFight() || this.isGameplayPaused() || !target?.active || this.attackState || this.visualHoldMs > 0 || this.contactCooldown > 0) return false;
    this.contactCooldown = this.attackInterval;
    this.scene.takeDamage(this.isRage ? 28 : 18);
    audioManager.playPlayerHurt();
    this.scene.vfxManager?.shakeCamera(90, 0.0015);
    return true;
  }

  setVisualState(state, holdMs = 0) {
    if (this.visualState !== state) {
      this.visualState = state;
      this.visualStateElapsed = 0;
      // Play matching spritesheet animation if registered
      const animKey = `${ASSET_KEYS.BOSS_NAGA_ACTION}:${state}`;
      if (this.scene?.anims?.exists(animKey) && this.active && typeof this.play === 'function') {
        this.play(animKey, true);
      }
    }
    this.visualHoldMs = holdMs;
  }

  applyKnockback() {
    // Boss has massive poise / heavy dragon constitution — immune to knockback
  }

  emitBossStatus(isActive = true) {
    const currentHp = typeof this.hp === "number" ? this.hp : this.maxHp;
    this.scene?.events?.emit("boss-status", {
      id: this.enemyId,
      enemyId: this.enemyId,
      instanceId: this.instanceId,
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
    if (this.isDead || !res?.damaged) return res;
    if (!this.attackState && !this.isRage) this.setVisualState("hurt", 100);

    // Check Phase 2 (Rage) trigger
    if (!this.isRage && this.hp <= this.rageThreshold) {
      this.triggerRagePhase();
    }

    this.emitBossStatus(!this.isDead);
    return res;
  }

  triggerRagePhase() {
    if (this.isRage || this.isDead) return;
    this.cancelAttacks();
    this.isRage = true;
    this.setVisualState("phase", 700);
    this.attackCooldownTimer = Math.max(this.attackCooldownTimer, 700);
    this.speed += this.bossConfig.rageSpeedBonus || 40;
    this.attackInterval = this.bossConfig.rageAttackInterval || 950;

    // Visual rage feedback
    this.setTint(0xffbb99);

    this.scene?.vfxManager?.shakeCamera(180, 0.0025);
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
    if (!this.canFight() || !target?.active) {
      this.cancelAttacks();
      return;
    }
    if (this.isGameplayPaused()) return;
    const elapsed = Number.isFinite(delta) ? Math.max(0, delta) : 0;
    this.visualStateElapsed += elapsed;
    this.contactCooldown = Math.max(0, this.contactCooldown - elapsed);
    this.visualHoldMs = Math.max(0, this.visualHoldMs - elapsed);
    if (this.attackState) {
      this.setVelocity(0, 0);
      this.updateAttack(elapsed);
      return;
    }
    if (this.visualHoldMs > 0) {
      this.setVelocity(0, 0);
      return;
    }
    this.attackCooldownTimer -= elapsed;
    if (this.attackCooldownTimer <= 0) {
      this.executeAttackPattern(target);
      return;
    }
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.setFlipX(dx < 0);
    const moving = dist > 110;
    this.setVelocity(moving ? dx / dist * this.speed : 0, moving ? dy / dist * this.speed : 0);
    this.setVisualState(moving ? "move" : "idle");

  }

  executeAttackPattern(target) {
    if (!this.canFight() || this.isGameplayPaused() || !target?.active || this.attackState) return;
    const type = Object.keys(BOSS_ATTACKS)[this.patternStep];
    this.patternStep = (this.patternStep + 1) % 4;
    const config = BOSS_ATTACKS[type];
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    const attack = {
      ...config, type, target, angle, elapsed: 0, released: false, hit: false,
      x: type === "slash" ? target.x : this.x,
      y: type === "slash" ? target.y : this.y,
      range: this.isRage ? config.rageRange : config.range,
      halfWidth: this.isRage ? config.rageHalfWidth : config.halfWidth,
      radius: this.isRage ? config.rageRadius : config.radius,
      count: this.isRage ? config.rageCount : config.count,
      damage: this.isRage ? config.rageDamage : config.damage,
    };
    if (type === "summon") {
      const bounds = this.scene.physics.world.bounds;
      attack.points = Array.from({ length: attack.count }, (_, i) => {
        const direction = angle + Math.PI + i * Math.PI;
        return {
          x: Math.max(bounds.x + 80, Math.min(bounds.x + bounds.width - 80, this.x + Math.cos(direction) * config.distance)),
          y: Math.max(bounds.y + 80, Math.min(bounds.y + bounds.height - 80, this.y + Math.sin(direction) * config.distance)),
        };
      });
    }
    this.attackState = attack;
    this.setVelocity(0, 0);
    this.setFlipX(Math.cos(angle) < 0);
    this.setVisualState("windup");
    this.drawAttack();
  }

  updateAttack(delta) {
    const attack = this.attackState;
    attack.elapsed += delta;
    if (!attack.released && attack.elapsed >= attack.windupMs) {
      attack.released = true;
      this.setVisualState(attack.type);
      if (attack.type === "spread") {
        const system = this.scene.projectileSystem;
        // API returns void and reuses pooled sprites: snapshot active objects before firing.
        const active = new Set(system?.bossProjectiles?.getChildren().filter(bullet => bullet.active));
        system?.fireBossPaperSpread(attack.x, attack.y, attack.x + Math.cos(attack.angle), attack.y + Math.sin(attack.angle), attack.count, attack.damage);
        for (const bullet of system?.bossProjectiles?.getChildren() || []) {
          if (bullet.active && !active.has(bullet)) {
            bullet.ownerInstanceId = this.instanceId;
            bullet.ownerEnemyId = this.enemyId;
          }
        }
        audioManager.playSkillQ();
      } else if (attack.type === "summon") {
        for (const point of attack.points) {
          const count = this.scene.enemySpawner?.enemies?.getChildren().filter(enemy => enemy.active && !enemy.isDead && enemy.enemyId === "naga_kecil").length || 0;
          if (count >= attack.maxActive) break;
          const minion = this.scene.spawnNagaKecilMinion?.(point.x, point.y);
          if (minion) minion.ownerInstanceId = this.instanceId;
        }
      } else {
        audioManager.playSkillE();
      }
    }
    if (attack.released && !attack.hit && attack.target.active) {
      const target = attack.target;
      const hit = attack.type === "breath" ? isPointInBreath(target.x, target.y, attack.x, attack.y, attack.angle, attack.range, attack.halfWidth) :
        attack.type === "slash" && Math.hypot(target.x - attack.x, target.y - attack.y) <= attack.radius;
      if (hit) {
        attack.hit = true; // One damage application per cast, not per frame.
        this.scene.takeDamage(attack.damage);
        if (!this.canFight()) { this.cancelAttacks(); return; }
        this.scene.vfxManager?.shakeCamera(90, 0.0015);
      }
    }
    if (attack.elapsed >= attack.windupMs + attack.activeMs) {
      this.attackState = null;
      this.telegraphGraphics?.clear();
      this.attackCooldownTimer = this.attackInterval;
      this.setVisualState("idle");
    } else this.drawAttack();
  }

  drawAttack() {
    const attack = this.attackState;
    const graphics = this.telegraphGraphics;
    if (!attack || !graphics) return;
    graphics.clear();
    const color = attack.type === "summon" ? 0xa78bfa : attack.released ? 0xffa329 : 0xef4444;
    graphics.lineStyle(2, color, 0.9);
    graphics.fillStyle(color, attack.released ? 0.4 : 0.15);
    if (attack.type === "breath") {
      const endX = attack.x + Math.cos(attack.angle) * attack.range;
      const endY = attack.y + Math.sin(attack.angle) * attack.range;
      const sideX = -Math.sin(attack.angle) * attack.halfWidth;
      const sideY = Math.cos(attack.angle) * attack.halfWidth;
      graphics.fillTriangle(attack.x, attack.y, endX + sideX, endY + sideY, endX - sideX, endY - sideY);
      graphics.strokeTriangle(attack.x, attack.y, endX + sideX, endY + sideY, endX - sideX, endY - sideY);
    } else if (attack.type === "slash") {
      graphics.fillCircle(attack.x, attack.y, attack.radius);
      graphics.strokeCircle(attack.x, attack.y, attack.radius);
    } else if (attack.type === "spread") {
      for (let i = 0; i < attack.count; i++) {
        const direction = attack.angle + (i - (attack.count - 1) / 2) * attack.spacing;
        graphics.lineBetween(attack.x, attack.y, attack.x + Math.cos(direction) * 220, attack.y + Math.sin(direction) * 220);
      }
    } else {
      for (const point of attack.points) {
        graphics.fillCircle(point.x, point.y, 24);
        graphics.strokeCircle(point.x, point.y, 24);
      }
    }
  }

  cancelAttacks() {
    this.attackState = null;
    this.telegraphGraphics?.clear();
    if (this.body) this.setVelocity(0, 0);
    const system = this.scene?.projectileSystem;
    for (const bullet of system?.bossProjectiles?.getChildren() || []) {
      if (bullet.ownerInstanceId === this.instanceId) {
        if (bullet.active) system.recycleProjectile(bullet);
        bullet.ownerInstanceId = null;
        bullet.ownerEnemyId = null;
      }
    }
  }

  preUpdate(time, delta) {
    // Scene.update stops calling AI on gameover; sprite preUpdate still runs.
    if (!this.isDead && !this.canFight()) this.cancelAttacks();
    if (!this.isGameplayPaused()) {
      if (this.isDead) this.visualStateElapsed += delta;
      const [row, count, fps, loop] = NAGA_ANIMATIONS[this.visualState] || NAGA_ANIMATIONS.idle;
      const step = Math.floor(this.visualStateElapsed * fps / 1000);
      const frame = row * 8 + (loop ? step % count : Math.min(count - 1, step));
      if (this.frame.name !== frame) this.setFrame(frame);
    }
    super.preUpdate(time, delta);
  }

  die() {
    if (this.isDead || this.rewardGiven) return;
    this.rewardGiven = true;
    this.hp = 0;
    this.cancelAttacks();
    this.setVisualState("death");
    for (const minion of this.scene.enemySpawner?.enemies?.getChildren() || []) {
      if (minion.ownerInstanceId === this.instanceId) minion.destroy();
    }
    // Base owns isDead, immediate body disable, enemy-killed, fade and destruction.
    super.die();

    if (this.telegraphGraphics) {
      this.telegraphGraphics.clear();
      this.telegraphGraphics.destroy();
      this.telegraphGraphics = null;
    }

    this.clearTint();
    this.scene.vfxManager?.ultimateBlast(this.x, this.y, 140, true);

    // Hide boss status bar in UI
    this.emitBossStatus(false);

    // Notify scene
    this.scene?.events?.emit("boss-defeated", {
      id: this.instanceId,
      enemyId: this.enemyId,
      instanceId: this.instanceId,
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
    this.scene?.vfxManager?.shakeCamera(220, 0.003);
  }

  destroy(fromScene) {
    this.encounterEnded = true;
    this.cancelAttacks();
    this.scene?.events?.off("shutdown", this.onSceneShutdown);
    if (this.telegraphGraphics) {
      this.telegraphGraphics.clear();
      this.telegraphGraphics.destroy();
      this.telegraphGraphics = null;
    }
    super.destroy(fromScene);
  }
}
