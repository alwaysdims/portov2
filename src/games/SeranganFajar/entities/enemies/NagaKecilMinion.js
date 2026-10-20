import { EnemyBase } from "./EnemyBase.js";
import { ASSET_KEYS } from "../../config/assetRegistry.js";

// NagaKecilMinion.js — Minion summoned by Boss Naga Fajar
export class NagaKecilMinion extends EnemyBase {
  constructor(scene, x, y) {
    const config = {
      id: "naga_kecil",
      name: "Naga Kecil",
      role: "summon_minion",
      hp: 50,
      speed: 125,
      damage: 8,
      attackInterval: 1200,
      scoreValue: 75,
      bodySize: { width: 32, height: 32 },
      bodyOffset: { x: 8, y: 10 },
    };
    super(scene, x, y, ASSET_KEYS.BOSS_NAGA_KECIL, config);
    this.setScale(1.1);
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
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      this.setVelocity((dx / dist) * this.speed, (dy / dist) * this.speed);
      this.setFlipX(dx < 0);
    } else {
      this.setVelocity(0, 0);
    }
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
