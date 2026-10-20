import { EnemyBase } from "./EnemyBase.js";
import { ENEMY_CONFIGS, ENEMY_TYPES } from "./EnemyStats.js";

// MeleeEnemy.js — Tim Amplop swarm enemy
// ponytail: straight-line vector chase; upgrade with spatial flocking/boids in Tahap 14.

export class MeleeEnemy extends EnemyBase {
  constructor(scene, x, y, textureKey) {
    const config = ENEMY_CONFIGS[ENEMY_TYPES.TIM_AMPLOP];
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

    // Subtle walk bobbing
    const bob = Math.sin(time * 0.014) * 0.05;
    this.setScale(1 + bob, 1 - bob);
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
