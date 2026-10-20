import Phaser from "phaser";
import { ENEMY_TYPES, SPAWNER_CONFIG } from "./EnemyStats.js";
import { MeleeEnemy } from "./MeleeEnemy.js";
import { TankEnemy } from "./TankEnemy.js";
import { RangedEnemy } from "./RangedEnemy.js";
import { ASSET_KEYS } from "../../config/assetRegistry.js";

// EnemySpawner.js — Procedural wave spawner with density caps and boundary enforcement
// ponytail: circular perimeter spawning; add multi-wave narrative triggers in Tahap 14.

export class EnemySpawner {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.maxActiveEnemies = options.maxActiveEnemies || SPAWNER_CONFIG.MAX_ACTIVE_ENEMIES;
    this.spawnInterval = options.spawnInterval || SPAWNER_CONFIG.BASE_SPAWN_INTERVAL;
    this.minDist = options.minDist || SPAWNER_CONFIG.MIN_SPAWN_DISTANCE;
    this.maxDist = options.maxDist || SPAWNER_CONFIG.MAX_SPAWN_DISTANCE;

    this.enemies = scene.physics.add.group({
      runChildUpdate: false,
    });

    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.spawnTimer = null;

    // Listen for enemy kill events
    this.onEnemyKilled = () => {
      this.totalKilled++;
      this.scene.stats?.addEnergy(2); // PRD Section 10.3: +2 Energy per kill
    };
    scene.events.on("enemy-killed", this.onEnemyKilled);
  }

  start() {
    this.stop();
    this.spawnTimer = this.scene.time.addEvent({
      delay: this.spawnInterval,
      callback: this.spawnWave,
      callbackScope: this,
      loop: true,
    });
  }

  stop() {
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
      this.spawnTimer = null;
    }
  }

  getActiveCount() {
    if (!this.enemies) return 0;
    let count = 0;
    const children = this.enemies.getChildren();
    for (let i = 0; i < children.length; i++) {
      if (children[i].active && !children[i].isDead) {
        count++;
      }
    }
    return count;
  }

  spawnWave() {
    if (this.scene.isPaused || this.scene.stats?.status === "dead") return;
    if (this.getActiveCount() >= this.maxActiveEnemies) return;

    // Spawn 1 to 2 enemies per tick depending on current density
    const spawnCount = this.getActiveCount() < 10 ? 2 : 1;
    for (let i = 0; i < spawnCount; i++) {
      if (this.getActiveCount() >= this.maxActiveEnemies) break;
      this.spawnSingleEnemy();
    }
  }

  spawnSingleEnemy(forcedType = null) {
    const player = this.scene.player;
    if (!player || !player.active) return null;

    // Determine type
    let type = forcedType;
    if (!type) {
      const roll = Math.random();
      if (roll < 0.65) {
        type = ENEMY_TYPES.TIM_AMPLOP;
      } else if (roll < 0.85) {
        type = ENEMY_TYPES.BOT_KAMPANYE;
      } else {
        type = ENEMY_TYPES.PENYEBAR_HOAKS;
      }
    }

    // Determine spawn position on a ring around Wowo, validating against obstacles
    let x = player.x;
    let y = player.y;
    let valid = false;

    for (let attempt = 0; attempt < 8; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(this.minDist, this.maxDist);
      const candX = Phaser.Math.Clamp(player.x + Math.cos(angle) * dist, 80, 2320);
      const candY = Phaser.Math.Clamp(player.y + Math.sin(angle) * dist, 80, 2320);

      if (!this.scene.arenaSystem || !this.scene.arenaSystem.isPositionBlocked(candX, candY, 25)) {
        x = candX;
        y = candY;
        valid = true;
        break;
      }
    }

    if (!valid) {
      const fallbackAngle = Math.random() * Math.PI * 2;
      x = Phaser.Math.Clamp(player.x + Math.cos(fallbackAngle) * this.minDist, 80, 2320);
      y = Phaser.Math.Clamp(player.y + Math.sin(fallbackAngle) * this.minDist, 80, 2320);
    }

    let enemy;
    switch (type) {
      case ENEMY_TYPES.BOT_KAMPANYE:
        enemy = new TankEnemy(this.scene, x, y, ASSET_KEYS.ENEMY_BOT_KAMPANYE);
        break;
      case ENEMY_TYPES.PENYEBAR_HOAKS:
        enemy = new RangedEnemy(this.scene, x, y, ASSET_KEYS.ENEMY_PENYEBAR_HOAKS);
        break;
      case ENEMY_TYPES.TIM_AMPLOP:
      default:
        enemy = new MeleeEnemy(this.scene, x, y, ASSET_KEYS.ENEMY_TIM_AMPLOP);
        break;
    }

    if (enemy) {
      this.enemies.add(enemy);
      this.totalSpawned++;
    }

    return enemy;
  }

  setupPlayerOverlap(player) {
    if (!player) return;
    this.scene.physics.add.overlap(
      this.enemies,
      player,
      (p, enemy) => {
        if (enemy && enemy.active && !enemy.isDead) {
          enemy.tryAttack(p, this.scene.time.now);
        }
      },
      null,
      this
    );
  }

  update(time, delta, player, projectileSystem) {
    if (!this.enemies || this.scene.isPaused) return;

    const children = this.enemies.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const enemy = children[i];
      if (!enemy.active) {
        continue;
      }
      if (enemy.isDead) {
        continue;
      }

      if (enemy.updateAI) {
        enemy.updateAI(time, delta, player, projectileSystem);
      }

      // Soft separation repulsion between close enemies (prevent unnatural single-point stacking)
      if (!enemy.isBoss) {
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const other = children[j];
          if (!other || !other.active || other.isDead || other.isBoss) continue;
          const dx = enemy.x - other.x;
          const dy = enemy.y - other.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 576 && distSq > 0.1) { // closer than 24px
            const dist = Math.sqrt(distSq);
            const push = (24 - dist) * 0.35;
            const nx = (dx / dist) * push;
            const ny = (dy / dist) * push;
            enemy.x += nx;
            enemy.y += ny;
            other.x -= nx;
            other.y -= ny;
          }
        }
      }
    }
  }

  clearAll() {
    this.stop();
    if (this.enemies) {
      const children = this.enemies.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        const enemy = children[i];
        if (enemy.healthBar) {
          enemy.healthBar.destroy();
          enemy.healthBar = null;
        }
        enemy.destroy();
      }
      this.enemies.clear(true, true);
    }
  }

  destroy() {
    this.stop();
    if (this.onEnemyKilled) {
      this.scene?.events?.off("enemy-killed", this.onEnemyKilled);
      this.onEnemyKilled = null;
    }
    this.clearAll();
    this.enemies = null;
  }
}
