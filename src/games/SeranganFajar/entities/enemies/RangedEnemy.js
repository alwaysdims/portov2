import { EnemyBase } from "./EnemyBase.js";
import { ENEMY_CONFIGS, ENEMY_TYPES } from "./EnemyStats.js";

// RangedEnemy.js — Penyebar Hoaks shooter enemy
// ponytail: straight distance-based kiting; enhance with flanking angles in Tahap 14.

export class RangedEnemy extends EnemyBase {
  constructor(scene, x, y, textureKey) {
    const config = ENEMY_CONFIGS[ENEMY_TYPES.PENYEBAR_HOAKS];
    super(scene, x, y, textureKey, config);

    this.shootInterval = config.shootInterval || 2000;
    this.idealDistance = config.idealDistance || 220;
    this.retreatDistance = config.retreatDistance || 170;
    this.lastShootTime = 0;
  }

  updateAI(time, delta, target, projectileSystem) {
    if (this.isDead || !this.active || !this.body) return;

    if (this.knockbackTimer > 0) {
      this.knockbackTimer -= delta;
      return;
    }

    if (!target || !target.active || this.scene.stats?.status === "dead") {
      this.setVelocity(0, 0);
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

    // Ranged shooting
    if (dist <= 450 && projectileSystem) {
      if (time >= this.lastShootTime + this.shootInterval) {
        this.lastShootTime = time;
        projectileSystem.fireHoaxBullet(
          this.x,
          this.y,
          target.x,
          target.y,
          this.damage,
          this.config.projectileSpeed,
          this.config.projectileLifetime
        );
      }
    }
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
