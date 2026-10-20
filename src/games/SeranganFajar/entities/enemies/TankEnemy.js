import { EnemyBase } from "./EnemyBase.js";
import { ENEMY_CONFIGS, ENEMY_TYPES } from "./EnemyStats.js";

// TankEnemy.js — Bot Kampanye heavy tank enemy
// ponytail: steady directional march; add frontal shield reduction in Tahap 12.

export class TankEnemy extends EnemyBase {
  constructor(scene, x, y, textureKey) {
    const config = ENEMY_CONFIGS[ENEMY_TYPES.BOT_KAMPANYE];
    super(scene, x, y, textureKey, config);
  }

  updateAI(time, delta, target) {
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
    const angle = Math.atan2(dy, dx);

    this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed);

    // Face player
    this.setFlipX(dx < 0);

    // Heavy mechanical tread step
    const step = Math.sin(time * 0.008) * 0.03;
    this.setScale(1 + step, 1 - step);
  }

  tryAttack(target, time) {
    if (this.isDead || !this.active || this.scene.stats?.status === "dead") return false;

    if (time >= this.lastAttackTime + this.attackInterval) {
      this.lastAttackTime = time;
      this.scene.takeDamage(this.damage);
      return true;
    }
    return false;
  }
}
