import { EnemyBase } from "./EnemyBase.js";
import { ENEMY_CONFIGS, ENEMY_TYPES } from "./EnemyStats.js";
import { DIFFICULTY_CONFIG } from "../../config/difficultyConfig.js";

// RangedEnemy.js — Penyebar Hoaks shooter enemy
// ponytail: straight distance-based kiting; enhance with flanking angles in Tahap 14.

export class RangedEnemy extends EnemyBase {
  constructor(scene, x, y, textureKey) {
    const config = ENEMY_CONFIGS[ENEMY_TYPES.PENYEBAR_HOAKS];
    super(scene, x, y, textureKey, config);

    this.shootInterval = config.shootInterval || 2000;
    this.idealDistance = config.idealDistance || 220;
    this.retreatDistance = config.retreatDistance || 170;
    this.shootElapsed = 0;
    this.windupRemaining = 0;
    this.aimAngle = 0;
    this.telegraphGraphics = null;
  }

  updateAI(time, delta, target, projectileSystem) {
    if (this.isDead || !this.active || !this.body || !this.scene || this.scene.isGameOver || this.scene.stats?.status === "dead") {
      this.clearTelegraph();
      return;
    }
    if (this.scene.isPaused || this.scene.isLevelUpPaused || !Number.isFinite(delta) || delta < 0) return;
    if (!target?.active) {
      this.setVelocity(0, 0);
      this.clearTelegraph();
      return;
    }
    const burst = DIFFICULTY_CONFIG.rangedBurst;
    if (this.windupRemaining > 0) {
      this.setVelocity(0, 0);
      this.windupRemaining = Math.max(0, this.windupRemaining - delta);
      this.renderTelegraph();
      if (this.windupRemaining === 0) {
        if (projectileSystem) {
          for (let i = 0; i < burst.shotCount; i++) {
            this.fireAtAngle(projectileSystem, this.aimAngle + (i - (burst.shotCount - 1) / 2) * burst.spreadRadians);
          }
        }
        this.clearTelegraph();
        this.shootElapsed = 0;
      }
      return;
    }
    this.shootElapsed = Math.min(this.shootInterval, this.shootElapsed + delta);
    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      return;
    }

    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);

    // Kiting movement AI
    if (dist > this.idealDistance + 40) {
      // Approach target
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);
    } else if (dist < this.retreatDistance) {
      // Retreat away from target
      const retreatSpeed = this.speed * 0.85;
      this.setVelocity(-Math.cos(angle) * retreatSpeed, -Math.sin(angle) * retreatSpeed);
    } else {
      // Hold position in sweet spot
      this.setVelocity(0, 0);
    }

    // Face target
    this.setFlipX(dx < 0);

    if (dist <= 450 && projectileSystem && this.shootElapsed >= this.shootInterval) {
      this.shootElapsed = 0;
      if (this.scene.survivalTime >= burst.startsAt) {
        // Lock aim before warning: sidestep beats fan; no tracking during windup.
        this.aimAngle = angle;
        this.windupRemaining = burst.windupMs;
        this.setVelocity(0, 0);
        this.telegraphGraphics = this.scene.add.graphics();
        this.telegraphGraphics.setDepth(8);
        this.renderTelegraph();
      } else {
        this.fireAtAngle(projectileSystem, angle);
      }
    }
  }

  fireAtAngle(projectileSystem, angle) {
    projectileSystem.fireHoaxBullet(this.x, this.y, this.x + Math.cos(angle) * 450, this.y + Math.sin(angle) * 450, this.damage, this.config.projectileSpeed, this.config.projectileLifetime);
  }

  renderTelegraph() {
    if (!this.telegraphGraphics) return;
    const burst = DIFFICULTY_CONFIG.rangedBurst;
    this.telegraphGraphics.clear();
    this.telegraphGraphics.lineStyle(2, 0xffb347, 0.8);
    this.telegraphGraphics.strokeCircle(this.x, this.y, 20);
    for (let i = 0; i < burst.shotCount; i++) {
      const angle = this.aimAngle + (i - (burst.shotCount - 1) / 2) * burst.spreadRadians;
      this.telegraphGraphics.lineBetween(this.x, this.y, this.x + Math.cos(angle) * 450, this.y + Math.sin(angle) * 450);
    }
  }

  clearTelegraph() {
    this.telegraphGraphics?.destroy();
    this.telegraphGraphics = null;
    this.windupRemaining = 0;
  }

  die() {
    this.clearTelegraph();
    super.die();
  }

  destroy(fromScene) {
    this.clearTelegraph();
    super.destroy(fromScene);
  }

  tryAttack(target, time) {
    // Secondary emergency melee bump if player gets right in their face (< 24px)
    if (this.isDead || !this.active || this.scene.stats?.status === "dead") return false;

    if (time >= this.lastAttackTime + this.attackInterval) {
      this.lastAttackTime = time;
      this.scene.takeDamage(this.damage);
      return true;
    }
    return false;
  }
}
