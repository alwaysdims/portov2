import { ENEMY_TYPES, SPAWNER_CONFIG } from "./EnemyStats.js";
import { MeleeEnemy } from "./MeleeEnemy.js";
import { TankEnemy } from "./TankEnemy.js";
import { RangedEnemy } from "./RangedEnemy.js";
import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { DIFFICULTY_CONFIG, getDifficultyPhase } from "../../config/difficultyConfig.js";

// EnemySpawner.js — Procedural wave spawner with density caps and boundary enforcement
// ponytail: circular perimeter spawning; add multi-wave narrative triggers in Tahap 14.

export class EnemySpawner {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.maxActiveEnemies = Number.isFinite(options.maxActiveEnemies) ? Math.min(DIFFICULTY_CONFIG.maxActiveEnemies, Math.max(0, Math.floor(options.maxActiveEnemies))) : DIFFICULTY_CONFIG.maxActiveEnemies;
    this.spawnInterval = options.spawnInterval || SPAWNER_CONFIG.BASE_SPAWN_INTERVAL;
    this.baseSpawnInterval = this.spawnInterval;
    this.pacing = 1;
    this.minDist = options.minDist || SPAWNER_CONFIG.MIN_SPAWN_DISTANCE;
    this.maxDist = options.maxDist || SPAWNER_CONFIG.MAX_SPAWN_DISTANCE;

    this.enemies = scene.physics.add.group({
      runChildUpdate: false,
    });

    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.processedKillIds = new Set();
    this.spawnTimer = null;

    // Listen for enemy kill events
    this.onEnemyKilled = (data) => {
      if (typeof data?.id !== "string" || !data.id || this.processedKillIds.has(data.id) || this.scene.isGameOver || this.scene.stats?.status === "dead") return;
      this.processedKillIds.add(data.id);
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

  setPacing(multiplier) {
    if (!Number.isFinite(multiplier) || multiplier <= 0 || this.pacing === multiplier) return;
    this.pacing = multiplier;
    this.spawnInterval = Math.round(this.baseSpawnInterval / multiplier);
    if (this.spawnTimer) this.start();
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
    if (this.scene.isPaused || this.scene.isLevelUpPaused || this.scene.isGameOver || this.scene.stats?.status === "dead") return;
    if (this.getActiveCount() >= this.maxActiveEnemies) return;

    // Spawn 1 to 2 enemies per tick depending on current density
    const spawnCount = this.getActiveCount() < 10 ? 2 : 1;
    for (let i = 0; i < spawnCount; i++) {
      if (this.getActiveCount() >= this.maxActiveEnemies) break;
      this.spawnSingleEnemy(this.scene.runDirector?.active === "Serbuan Tim Kampanye" ? ENEMY_TYPES.TIM_AMPLOP : null);
    }
  }

  spawnSingleEnemy(forcedType = null) {
    const player = this.scene?.player;
    if (!this.enemies || !player?.active || this.scene.isPaused || this.scene.isLevelUpPaused || this.scene.isGameOver || this.scene.stats?.status === "dead" || this.getActiveCount() >= this.maxActiveEnemies) return null;

    // Shift composition after 3/5 minutes; preserve enemy stats and density cap.
    let type = forcedType;
    if (!type) {
      const roll = Math.random();
      const phase = getDifficultyPhase(this.scene.survivalTime);
      const melee = phase.meleeWeight;
      const tank = phase.tankCumulativeWeight;
      type = roll < melee ? ENEMY_TYPES.TIM_AMPLOP :
        roll < tank ? ENEMY_TYPES.BOT_KAMPANYE : ENEMY_TYPES.PENYEBAR_HOAKS;
    }

    // Determine spawn position on a ring around Wowo, validating against obstacles
    let x = player.x;
    let y = player.y;
    let valid = false;

    const arena = this.scene.arenaSystem;
    const width = arena?.width || 2400;
    const height = arena?.height || 2400;
    for (let attempt = 0; attempt < 32; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.minDist + Math.random() * (this.maxDist - this.minDist);
      const candX = player.x + Math.cos(angle) * dist;
      const candY = player.y + Math.sin(angle) * dist;
      if (candX < 89 || candX > width - 89 || candY < 89 || candY > height - 89) continue;

      if (!arena || !arena.isPositionBlocked(candX, candY, 25)) {
        x = candX;
        y = candY;
        valid = true;
        break;
      }
    }

    if (!valid) return null;

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

  ensureObjectiveSupply(required) {
    if (!Number.isInteger(required) || required <= 0 || required > this.maxActiveEnemies || !this.enemies) return false;
    const player = this.scene?.player;
    if (!player?.active) return false;
    let available = this.enemies.getChildren().filter((enemy) => enemy.active && !enemy.isDead && enemy.enemyId === ENEMY_TYPES.PENYEBAR_HOAKS && Math.hypot(enemy.x - player.x, enemy.y - player.y) <= this.maxDist).length;
    while (available < required && this.getActiveCount() < this.maxActiveEnemies) {
      if (!this.spawnSingleEnemy(ENEMY_TYPES.PENYEBAR_HOAKS)) break;
      available++;
    }
    // Countdown waits for all five nearby live targets; never exceeds cap.
    return available >= required;
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
    if (!this.enemies || !this.scene || this.scene.isPaused || this.scene.isLevelUpPaused || this.scene.isGameOver || this.scene.stats?.status === "dead") return;

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
    this.processedKillIds.clear();
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
