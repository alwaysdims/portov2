import Phaser from "phaser";
import { audioManager } from "../../game/audio/AudioManager.js";

// EnemyBase.js — Base class for all enemy archetypes in Serangan Fajar
// ponytail: visual HP bar drawn via procedural Graphics; replace with bitmap font damage numbers in Tahap 11.

let enemyInstanceCounter = 0;

export class EnemyBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, textureKey, config) {
    super(scene, x, y, textureKey);

    this.scene = scene;
    this.config = config;
    this.enemyId = config.id;
    this.enemyName = config.name;
    this.instanceId = `${config.id || "enemy"}_${++enemyInstanceCounter}_${Date.now()}`;

    // Combat Stats
    this.maxHp = config.hp;
    this.hp = config.hp;
    this.speed = config.speed;
    this.damage = config.damage;
    this.scoreValue = config.scoreValue || 50;
    this.isDead = false;

    // Cooldown trackers
    this.lastAttackTime = 0;
    this.attackInterval = config.attackInterval || 1000;
    this.knockbackTimer = 0;

    // Add to scene & physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDepth(5);
    this.setCollideWorldBounds(true);

    if (config.bodySize) {
      this.body.setSize(config.bodySize.width, config.bodySize.height);
    }
    if (config.bodyOffset) {
      this.body.setOffset(config.bodyOffset.x, config.bodyOffset.y);
    }

    // Lightweight health bar graphics
    this.healthBar = scene.add.graphics();
    this.healthBar.setDepth(6);
    this.updateHealthBar();
  }

  takeDamage(amount) {
    if (this.isDead || !this.active) {
      return { damaged: false, died: false, actualDamage: 0 };
    }

    const validDamage = Math.max(0, Number(amount) || 0);
    if (validDamage === 0) {
      return { damaged: false, died: false, actualDamage: 0 };
    }

    const previousHp = this.hp;
    this.hp = Math.max(0, this.hp - validDamage);
    const actualDamage = previousHp - this.hp;

    // Red damage flash
    this.setTint(0xff5555);
    this.scene.time.delayedCall(120, () => {
      if (this.active && !this.isDead) {
        this.clearTint();
      }
    });

    this.updateHealthBar();

    if (this.hp <= 0) {
      this.die();
      return { damaged: true, died: true, actualDamage };
    }

    return { damaged: true, died: false, actualDamage };
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    // Disable physics immediately so dead enemy cannot collide or deal damage
    if (this.body) {
      this.body.enable = false;
      this.setVelocity(0, 0);
    }

    // Hide health bar
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.destroy();
      this.healthBar = null;
    }

    // Notify scene spawner/statistics
    this.scene?.events?.emit("enemy-killed", {
      id: this.instanceId,
      enemyId: this.enemyId,
      enemyType: this.enemyId,
      enemyName: this.enemyName,
      score: this.scoreValue,
      x: this.x,
      y: this.y,
    });

    // Audio & Particle debris feedback
    audioManager.playEnemyDeath();
    this.scene?.vfxManager?.spawnEnemyDeathDebris(this.x, this.y);

    // Smooth death fade & scale down
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 220,
      ease: "Power2",
      onComplete: () => {
        this.destroy();
      },
    });
  }

  applyKnockback(vx, vy, durationMs = 250) {
    if (this.isDead || !this.body) return;
    this.knockbackTimer = durationMs;
    this.setVelocity(vx, vy);
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

  updateHealthBar() {
    if (!this.healthBar || this.isDead || !this.active) return;

    this.healthBar.clear();

    // Only display health bar once damaged to keep screen clean
    if (this.hp >= this.maxHp) return;

    const barWidth = 26;
    const barHeight = 3;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.displayHeight / 2 - 6;

    // Background (slate dark)
    this.healthBar.fillStyle(0x0f172a, 0.8);
    this.healthBar.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

    // HP Fill (emerald to red)
    const pct = Math.max(0, this.hp / this.maxHp);
    const color = pct > 0.5 ? 0x10b981 : pct > 0.25 ? 0xf59e0b : 0xef4444;

    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(barX, barY, Math.round(barWidth * pct), barHeight);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.healthBar && this.active && !this.isDead) {
      this.updateHealthBar();
    }
  }

  destroy(fromScene) {
    if (this.healthBar) {
      this.healthBar.clear();
      this.healthBar.destroy();
      this.healthBar = null;
    }
    super.destroy(fromScene);
  }
}
