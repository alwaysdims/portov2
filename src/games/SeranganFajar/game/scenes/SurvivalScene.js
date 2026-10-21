import Phaser from "phaser";
import { ARENA_CONFIG } from "../../config/gameConfig.js";
import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { PlayerStats } from "../../entities/player/PlayerStats.js";
import { EnemySpawner } from "../../entities/enemies/EnemySpawner.js";
import { ProjectileSystem } from "../systems/ProjectileSystem.js";
import { PlayerAttackSystem } from "../systems/PlayerAttackSystem.js";
import { PlayerSkillSystem } from "../systems/PlayerSkillSystem.js";
import { PickupSystem } from "../systems/PickupSystem.js";
import { DropSystem } from "../systems/DropSystem.js";
import { UpgradeSystem } from "../systems/UpgradeSystem.js";
import { ArenaSystem } from "../systems/ArenaSystem.js";
import { VFXManager } from "../systems/VFXManager.js";
import { audioManager } from "../audio/AudioManager.js";
import { NagaFajarBoss } from "../../entities/enemies/NagaFajarBoss.js";
import { NagaKecilMinion } from "../../entities/enemies/NagaKecilMinion.js";
import { getBossConfigForLevel } from "../../config/bossConfig.js";
import { UPGRADE_BALANCE } from "../../config/upgradeConfig.js";
import { RunDirector } from "../systems/RunDirector.js";
import { ObjectiveSystem } from "../systems/ObjectiveSystem.js";
import { ActorAnimator } from "../systems/ActorAnimator.js";
import { achievementService } from "../../services/AchievementService.js";

export default class SurvivalScene extends Phaser.Scene {
  constructor(gameEvents = {}) {
    super("SurvivalScene");
    this.gameEvents = gameEvents;
    this.isPaused = false;
    this.isLevelUpPaused = false;
    this.speed = ARENA_CONFIG.PLAYER_SPEED;
    this.stats = new PlayerStats({ speed: this.speed });
  }

  init(data) {
    if (data && Object.keys(data).length > 0) {
      this.gameEvents = data;
    }
    this.isPaused = false;
    this.isLevelUpPaused = false;
    this.isGameOver = false;
    this.finalStats = null;
    this.externalMovement = null;
    this.survivalTime = 0; // seconds elapsed
    this.score = 0; // gameplay score
    this.pendingBossLevels = [];
    this.lastBossLevel = 1;
    this.currentUpgradeChoices = null;
    this.stats = new PlayerStats({ speed: this.speed });
    this.stats.setOnChange((snapshot) => {
      this.gameEvents?.onStatsUpdate?.(snapshot);
    });

    // Enemy & Projectile managers (Tahap 4)
    this.projectileSystem = new ProjectileSystem(this);
    this.enemySpawner = new EnemySpawner(this);

    // Player Basic Attack System (Tahap 5)
    this.playerAttackSystem = new PlayerAttackSystem(this);

    // Player Skill System Q, E, R (Tahap 6)
    this.playerSkillSystem = new PlayerSkillSystem(this);

    // Drop, Pickup & Upgrade Progression (Tahap 7)
    this.pickupSystem = new PickupSystem(this);
    this.dropSystem = new DropSystem(this, this.pickupSystem);
    this.upgradeSystem = new UpgradeSystem(this);
    this.runDirector = new RunDirector(this);

    // Arena & Environment System (Tahap 8)
    this.arenaSystem = new ArenaSystem(this);

    // Visual Effects & Audio Feedback (Tahap 11)
    this.vfxManager = new VFXManager(this);
  }

  create() {
    this.time.paused = false;
    this.tweens.resumeAll();
    // 1. Setup World Dimensions & Physics Bounds
    const { WIDTH, HEIGHT, SPAWN_X, SPAWN_Y } = ARENA_CONFIG;
    this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

    // 2. Build Full TPS Arena Environment (Ground, Roads, Landmarks, Obstacles & Borders)
    this.arenaSystem.buildArena();

    // 3. Player Wowo (spawned in clear central plaza)
    this.player = this.physics.add.sprite(SPAWN_X, SPAWN_Y, ASSET_KEYS.PLAYER_WOWO_ACTION);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(SPAWN_Y + 15);
    // Trim collision box to bottom half (feet) for authentic top-down perspective
    this.player.body.setSize(24, 20);
    this.player.body.setOffset(20, 40);
    this.playerAnimator = new ActorAnimator(this.player, ASSET_KEYS.PLAYER_WOWO_ACTION);

    // 4. Camera Setup: Smooth follow with clamp inside world bounds
    this.cameras.main.setBounds(0, 0, WIDTH, HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // 5. Input Controls Setup
    this.inputKeys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,P,R,Q,E");
    this.input.keyboard.addCapture("W,A,S,D,UP,DOWN,LEFT,RIGHT,P,R,Q,E");

    // Canvas focus & blur protection
    if (this.game.canvas) {
      this.game.canvas.setAttribute("tabindex", "0");
      this.game.canvas.style.outline = "none";
    }

    this.input.on("pointerdown", () => {
      audioManager.init();
      audioManager.resumeBgm();
      if (this.game.canvas) {
        this.game.canvas.focus();
      }
      if (document.activeElement && document.activeElement !== document.body && document.activeElement !== this.game.canvas) {
        document.activeElement.blur();
      }
    });

    this.onWindowBlur = () => {
      this.input?.keyboard?.resetKeys();
    };
    window.addEventListener("blur", this.onWindowBlur);

    // Single press keys (with input field guard to prevent typing from triggering game actions)
    const isTyping = () => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      return tag === "input" || tag === "textarea";
    };

    this.input.keyboard.on("keydown-P", () => {
      if (isTyping() || this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return;
      this.togglePause();
    });
    this.input.keyboard.on("keydown-ESC", () => {
      if (isTyping() || this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return;
      this.togglePause();
    });

    // Skill keys: Q (Skill 1), E (Skill 2), R (Ultimate when alive / Restart when dead)
    this.input.keyboard.on("keydown-Q", () => {
      if (isTyping() || this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return;
      this.castSkill1();
    });
    this.input.keyboard.on("keydown-E", () => {
      if (isTyping() || this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return;
      this.castSkill2();
    });
    this.input.keyboard.on("keydown-R", () => {
      if (isTyping() || this.isLevelUpPaused) return;
      if (this.isGameOver || !this.stats?.isAlive()) {
        this.restartGame();
      } else {
        this.castUltimate();
      }
    });

    // Fullscreen toggle key: F
    this.input.keyboard.on("keydown-F", () => {
      if (isTyping()) return;
      this.gameEvents?.onToggleFullscreen?.();
    });

    // Initial stats and ready event
    this.stats.notifyChange();

    // 6. Enemy Spawner, Projectiles & Basic Attack (Tahap 4 & 5)
    this.projectileSystem.setupPlayerCollision(this.player);
    this.projectileSystem.setupEnemyCollision(this.enemySpawner.enemies);
    this.enemySpawner.setupPlayerOverlap(this.player);
    this.enemySpawner.start();

    // 7. Arena Obstacle & Border Collisions (Tahap 8)
    this.arenaSystem.setupColliders(this.player, this.enemySpawner.enemies);

    // Register scene shutdown lifecycle listener
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);

    // 8. Dynamic Objectives & Combo Streak (Tahap 19)
    this.objectiveSystem = new ObjectiveSystem(this);
    this.comboCount = 0;
    this.lastKillTime = 0;
    this.COMBO_WINDOW_MS = 2500;
    this.processedKillIds = new Set();

    // 9. Enemy death drop & score hook (Tahap 7 & 9)
    this.handleEnemyKilled = (data) => {
      if (this.isGameOver || !data?.id || this.processedKillIds.has(data.id)) return;
      this.processedKillIds.add(data.id);
      this.dropSystem?.handleEnemyKilled(data);
      let killScore = 20;
      if (data?.enemyType === "bot_kampanye") {
        killScore = 50;
        this.vfxManager?.shakeCamera(140, 0.004);
      } else if (data?.enemyType === "penyebar_hoaks") {
        killScore = 35;
      } else if (data?.enemyType === "naga_kecil") {
        killScore = 75;
      } else if (data?.enemyType === "naga_fajar") {
        killScore = 1500;
      }

      // Combo kill streak tracking
      const now = this.time.now;
      if (now - this.lastKillTime <= this.COMBO_WINDOW_MS) {
        this.comboCount++;
      } else {
        this.comboCount = 1;
      }
      this.lastKillTime = now;

      // Combo milestone bonuses & SFX
      if (this.comboCount >= 3) {
        const bonus = Math.min(60, this.comboCount * 3);
        killScore += bonus;
        this.gameEvents?.onComboUpdate?.({ count: this.comboCount, windowRemaining: this.COMBO_WINDOW_MS });
        if (this.comboCount === 5 || this.comboCount === 10 || this.comboCount === 20 || this.comboCount === 50) {
          audioManager.playCombo();
          this.vfxManager?.showDamageNumber(data.x, data.y - 16, `COMBO x${this.comboCount}!`, "crit");
          achievementService.recordCombo(this.comboCount);
        }
      }

      this.addScore(killScore);
      achievementService.recordKill(data?.enemyType || data?.enemyId);
    };
    this.events.on("enemy-killed", this.handleEnemyKilled);

    // 10. Boss telemetry and defeat events
    this.handleBossStatus = (data) => {
      if (data && this.activeBoss && data.instanceId && data.instanceId !== this.activeBoss.instanceId) {
        return;
      }
      this.gameEvents?.onBossStatus?.(data);
    };
    this.events.on("boss-status", this.handleBossStatus);

    this.handleBossDefeated = (data) => {
      if (data.id !== this.activeBoss?.instanceId) return;
      this.activeBoss = null;
      achievementService.recordBossDefeat(data?.enemyId);
      this.gameEvents?.onBossDefeated?.({
        name: data.name,
        message: `VICTORY! ${data.name} DIKALAHKAN!`,
        rewardText: "Hadiah besar telah dijatuhkan!",
      });
      this.spawnNextBoss();
    };
    this.events.on("boss-defeated", this.handleBossDefeated);

    this.gameEvents?.onGameReady?.({
      x: this.player.x,
      y: this.player.y,
      survivalTime: 0,
      formattedTime: "00:00",
      score: 0,
    });

    // Start background music (starts playback once user has interacted)
    audioManager.startBgm();
  }

  setMovement(vx, vy) {
    this.externalMovement = { vx, vy };
  }

  handleGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.isLevelUpPaused = false;
    this.pendingBossLevels = [];
    this.currentUpgradeChoices = null;
    this.gameEvents?.onLevelUpClose?.();
    this.playerSkillSystem?.reset();
    this.playerAttackSystem?.reset();
    this.runDirector?.end();
    this.comboCount = 0;
    this.gameEvents?.onComboUpdate?.(null);
    this.objectiveSystem?.destroy();
    this.objectiveSystem = null;
    this.gameEvents?.onObjectiveStatus?.(null);

    this.setVisualPause(false);
    // Freeze player
    if (this.player) {
      this.player.setVelocity(0, 0);
      this.playerAnimator?.trigger('death');
      this.player.setAlpha(1.0);
      if (this.player.body) {
        this.player.body.enable = false;
      }
    }

    // Stop spawners & enemy movements
    this.enemySpawner?.stop();
    if (this.enemySpawner?.enemies) {
      const children = this.enemySpawner.enemies.getChildren();
      for (let i = 0; i < children.length; i++) {
        const enemy = children[i];
        if (enemy?.body) {
          enemy.body.setVelocity(0, 0);
        }
      }
    }

    // Clear hostile projectiles so player is not hit post-mortem
    this.projectileSystem?.clearHostileProjectiles();

    // Clear active boss state if present
    if (this.activeBoss) {
      if (this.activeBoss.telegraphGraphics) {
        this.activeBoss.telegraphGraphics.clear();
      }
      this.activeBoss = null;
    }
    this.gameEvents?.onBossStatus?.(null);

    // Audio & Camera feedback: stop BGM, play game over, shake and flash
    audioManager.stopBgm();
    audioManager.playGameOver();
    this.vfxManager?.shakeCamera(280, 0.008);
    this.cameras.main.flash(350, 220, 38, 38, false);
    this.vfxManager?.clearAll();

    // Freeze and record final stats snapshot
    const finalScore = Math.floor(this.score);
    const finalTime = Math.floor(this.survivalTime);
    this.finalStats = {
      score: finalScore,
      survivalTime: finalTime,
      formattedTime: this.getFormattedSurvivalTime(),
      level: this.stats.level,
      enemiesKilled: this.enemySpawner?.totalKilled || 0,
      votesCollected: Math.floor(this.stats.totalXp),
      fundsCollected: this.stats.coins,
      attacksFired: this.playerAttackSystem?.attacksFired || 0,
      endedAt: new Date().toISOString(),
    };

    // Emit event to React UI
    this.gameEvents?.onGameOver?.(this.finalStats);
  }

  takeDamage(amount) {
    if (this.isGameOver || !this.stats || !this.stats.isAlive()) return { damaged: false };
    const res = this.stats.takeDamage(amount);
    if (res.damaged) {
      if (res.died) {
        this.handleGameOver();
      } else {
        this.playerAnimator?.trigger('hurt');
        this.player.setTint(0xff4444);
        this.time.delayedCall(100, () => {
          if (this.player?.active && this.stats?.isAlive()) {
            this.player.clearTint();
          }
        });
        audioManager.playPlayerHurt();
        this.vfxManager?.showDamageNumber(this.player.x, this.player.y - 12, res.actualDamage, "player");
        this.vfxManager?.spawnHitSparks(this.player.x, this.player.y, 0xf43f5e, 4);
        this.vfxManager?.shakeCamera(120, 0.005);
      }
    }
    return res;
  }

  heal(amount) {
    if (!this.stats || !this.stats.isAlive()) return 0;
    return this.stats.heal(amount);
  }

  damageNearestEnemy(amount = 50) {
    if (!this.enemySpawner?.enemies) return null;
    const children = this.enemySpawner.enemies.getChildren();
    let nearest = null;
    let minDist = 350;
    for (let i = 0; i < children.length; i++) {
      const e = children[i];
      if (!e.active || e.isDead) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < minDist) {
        minDist = d;
        nearest = e;
      }
    }
    if (nearest) {
      return nearest.takeDamage(amount);
    }
    return null;
  }

  fireBasicAttack() {
    return this.playerAttackSystem?.fireManual(this.player, this.enemySpawner?.enemies, this.projectileSystem);
  }

  castSkill1() {
    return this.playerSkillSystem?.castSkill1(this.player, this.enemySpawner?.enemies, this.projectileSystem);
  }

  castSkill2() {
    return this.playerSkillSystem?.castSkill2(this.player, this.enemySpawner?.enemies);
  }

  castUltimate() {
    return this.playerSkillSystem?.castUltimate(this.player, this.enemySpawner?.enemies);
  }

  handleLevelUpTrigger() {
    if (this.isLevelUpPaused || this.isPaused || this.isGameOver || !this.stats?.queuedLevelUps) return;
    this.isLevelUpPaused = true;
    this.setVisualPause(true);
    this.input?.keyboard?.resetKeys();
    this.physics.pause();
    this.enemySpawner?.stop();
    this.player?.setVelocity(0, 0);
    audioManager.playLevelUp();
    this.vfxManager?.spawnLevelUpAura(this.player.x, this.player.y);
    this.presentNextUpgrade();
  }

  presentNextUpgrade() {
    if (!this.isLevelUpPaused || this.isGameOver) return;
    while (this.stats.queuedLevelUps > 0) {
      const choices = this.upgradeSystem.getUpgradeChoices({ ...this.stats.upgradeLevels, ...this.stats.behaviorUpgrades }, 3);
      if (choices.length) {
        this.currentUpgradeChoices = choices;
        this.gameEvents?.onLevelUp?.({ level: this.stats.level, choices });
        return;
      }
      // ponytail: finite fallback = score, not XP; each exhausted level earns 100 points.
      this.addScore(100);
      this.stats.consumeQueuedLevelUp();
    }
    this.currentUpgradeChoices = null;
    this.isLevelUpPaused = false;
    this.input?.keyboard?.resetKeys();
    this.gameEvents?.onLevelUpClose?.();
    if (!this.isPaused && this.stats.isAlive()) {
      this.setVisualPause(false);
      this.physics.resume();
      this.enemySpawner?.start();
      for (let level = this.lastBossLevel + 1; level <= this.stats.level; level++) {
        // Boss milestone at level 3, 6, 9, 12, etc. (every 3 levels)
        if (level % 3 === 0) {
          const bossIdx = Math.floor(level / 3);
          this.pendingBossLevels.push(bossIdx);
        }
      }
      this.lastBossLevel = this.stats.level;
      this.spawnNextBoss();
    }
  }

  chooseUpgrade(upgradeId) {
    if (!this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive() ||
      !this.currentUpgradeChoices?.some((choice) => choice.id === upgradeId)) return false;
    if (!this.upgradeSystem.applyUpgrade(upgradeId)) {
      // State changed after choices rendered: regenerate or consume finite fallback.
      this.presentNextUpgrade();
      return false;
    }
    this.currentUpgradeChoices = null;
    audioManager.playPickupCoin();
    this.stats.consumeQueuedLevelUp();
    this.presentNextUpgrade();
    return true;
  }

  spawnNextBoss() {
    if (this.activeBoss?.active || !this.pendingBossLevels?.length ||
      this.isPaused || this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return null;
    // Fairness: hold boss spawn if arena event or dynamic objective is active
    if (this.runDirector?.active || this.objectiveSystem?.activeObjective) {
      return null;
    }
    const level = this.pendingBossLevels.shift();
    return this.spawnLevelBoss(level);
  }

  spawnLevelBoss(level = 1) {
    if (this.activeBoss?.active || !this.enemySpawner?.enemies || !this.player ||
      this.isPaused || this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return null;
    const bossConfig = getBossConfigForLevel(level);

    // Calculate spawn position in a ring ~380px away from Wowo
    const angle = Math.random() * Math.PI * 2;
    const distance = 380;
    const spawnX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 150, 2250);
    const spawnY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 150, 2250);

    const boss = new NagaFajarBoss(this, spawnX, spawnY, bossConfig);
    this.enemySpawner.enemies.add(boss);
    this.activeBoss = boss;

    // Trigger boss alert in HUD
    this.gameEvents?.onBossAlert?.({
      title: "BOSS ENCOUNTER!",
      name: bossConfig.name,
      subtitle: `${bossConfig.name} MUNCUL!`,
      message: bossConfig.subtitle || "Kalahkan dia untuk mendapatkan hadiah besar!",
      duration: 4000,
    });

    audioManager.playUltimate();
    this.vfxManager?.shakeCamera(400, 0.008);

    return boss;
  }

  spawnNagaKecilMinion(x, y) {
    if (!this.enemySpawner?.enemies) return null;
    const minion = new NagaKecilMinion(this, x, y);
    this.enemySpawner.enemies.add(minion);
    return minion;
  }

  debugSpawnBoss(level = 1) {
    return this.spawnLevelBoss(level);
  }

  debugAddXp(amount = 50) {
    const res = this.stats.addXp(amount);
    if (res.leveledUp) {
      this.handleLevelUpTrigger(res.currentLevel);
    }
  }

  debugAddCoins(amount = 5) {
    this.stats.addCoins(amount);
  }

  getEnemyTelemetry() {
    return {
      activeEnemies: this.enemySpawner?.getActiveCount() || 0,
      totalSpawned: this.enemySpawner?.totalSpawned || 0,
      totalKilled: this.enemySpawner?.totalKilled || 0,
      activeBullets: this.projectileSystem?.bullets?.countActive(true) || 0,
      activeVotes: this.projectileSystem?.voteProjectiles?.countActive(true) || 0,
      attacksFired: this.playerAttackSystem?.attacksFired || 0,
    };
  }

  addScore(points = 0) {
    this.score += points;
  }

  getFormattedSurvivalTime() {
    const totalSecs = Math.floor(this.survivalTime);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  update(time, delta = 16.66) {
    if (!this.sys?.isActive() || this.isPaused || this.isLevelUpPaused || !this.player || !this.player.body || !this.stats) {
      return;
    }

    // If dead or game over, lock all controls and show death pose
    if (this.isGameOver || !this.stats.isAlive()) {
      if (!this.isGameOver) {
        this.handleGameOver();
      }
      this.player.setVelocity(0, 0);
      this.playerAnimator?.trigger('death');
      this.player.setAlpha(1.0);
      return;
    }

    const deltaSeconds = delta / 1000;
    this.stats.update(deltaSeconds, this.isPaused);

    // Active survival time & points (Tahap 9)
    if (this.stats.isAlive()) {
      this.survivalTime += deltaSeconds;
      this.score += deltaSeconds * 2;
      this.runDirector?.update(deltaSeconds, this.survivalTime);
      this.objectiveSystem?.update(deltaSeconds);
      achievementService.recordSurvivalTime(this.survivalTime);
      this.spawnNextBoss();
    }

    // Expire combo if window passed
    if (this.comboCount > 0 && time - this.lastKillTime > this.COMBO_WINDOW_MS) {
      this.comboCount = 0;
      this.gameEvents?.onComboUpdate?.(null);
    }

    // Auto-targeting & Basic Attack (Tahap 5)
    if (this.playerAttackSystem && this.enemySpawner?.enemies) {
      this.playerAttackSystem.update(time, delta, this.player, this.enemySpawner.enemies, this.projectileSystem);
    }

    // Cooldown countdown for Skill 1, Skill 2, and Ultimate (Tahap 6)
    if (this.playerSkillSystem) {
      this.playerSkillSystem.update(deltaSeconds, this.isPaused);
    }

    // Update enemies and projectiles (Tahap 4 & 5)
    if (this.enemySpawner) {
      this.enemySpawner.update(time, delta, this.player, this.projectileSystem);
    }
    if (this.projectileSystem) {
      this.projectileSystem.update(time);
    }

    // Update items and magnet pickup (Tahap 7)
    if (this.pickupSystem) {
      this.pickupSystem.update(time, delta, this.player);
    }

    // Dynamic 2.5D depth sorting (Tahap 8)
    this.arenaSystem?.updateYDepth(this.player, this.enemySpawner?.enemies);

    // Directional vector calculation
    let vx = 0;
    let vy = 0;

    const left = this.inputKeys.LEFT.isDown || this.inputKeys.A.isDown;
    const right = this.inputKeys.RIGHT.isDown || this.inputKeys.D.isDown;
    const up = this.inputKeys.UP.isDown || this.inputKeys.W.isDown;
    const down = this.inputKeys.DOWN.isDown || this.inputKeys.S.isDown;

    if (left) vx -= 1;
    if (right) vx += 1;
    if (up) vy -= 1;
    if (down) vy += 1;

    // Diagonal normalization for discrete keyboard input
    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    // Blend / override with external touch movement (Virtual Joystick)
    if (this.externalMovement) {
      const evx = Number(this.externalMovement.vx) || 0;
      const evy = Number(this.externalMovement.vy) || 0;
      if (evx !== 0 || evy !== 0) {
        vx += evx;
        vy += evy;
      }
    }

    // Ensure combined vector magnitude never exceeds 1.0
    const mag = Math.hypot(vx, vy);
    if (mag > 1.0) {
      vx /= mag;
      vy /= mag;
    }

    const currentSpeed = (this.stats?.speed ?? this.speed) +
      (this.stats?.speedBuff > 0 ? UPGRADE_BALANCE.speedBonus : 0);
    this.player.setVelocity(vx * currentSpeed, vy * currentSpeed);

    // Sprite facing direction (with small deadband to prevent flickering)
    if (vx < -0.05) {
      this.player.setFlipX(true);
    } else if (vx > 0.05) {
      this.player.setFlipX(false);
    }

    const isMoving = vx !== 0 || vy !== 0;

    this.player.setAlpha(this.stats.isInvulnerable && Math.floor(time / 80) % 2 === 0 ? 0.5 : 1);
    this.playerAnimator?.update(deltaSeconds, isMoving, this.stats.speedBuff > 0);
    if (isMoving && this.stats.speedBuff > 0 && time - (this.lastDustAt || 0) > 140) {
      this.lastDustAt = time;
      this.vfxManager?.spawnHitSparks(this.player.x, this.player.y + 24, 0xb59b73, 1);
    }

    // Emit position update throttled to ~10 Hz
    if (!this.lastPosEmit || time - this.lastPosEmit > 100) {
      this.lastPosEmit = time;
      this.gameEvents?.onPlayerUpdate?.({
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        isMoving,
        enemiesActive: this.enemySpawner?.getActiveCount() || 0,
        enemiesKilled: this.enemySpawner?.totalKilled || 0,
        attacksFired: this.playerAttackSystem?.attacksFired || 0,
        skills: this.playerSkillSystem?.getSkillStatus(),
        basicAttack: {
          name: "Surat Suara",
          range: this.playerAttackSystem?.range || 300,
          attacksFired: this.playerAttackSystem?.attacksFired || 0,
          damage: Math.round((this.playerAttackSystem?.damage || 25) * (this.stats?.damageMultiplier || 1)),
        },
        level: this.stats.level,
        xp: this.stats.xp,
        xpRequired: this.stats.getXpRequired(this.stats.level),
        xpPercent: this.stats.getSnapshot().xpPercent,
        coins: this.stats.coins,
        upgradeLevels: this.stats.upgradeLevels,
        survivalTime: Math.floor(this.survivalTime),
        formattedTime: this.getFormattedSurvivalTime(),
        score: Math.floor(this.score),
      });
    }
  }

  setVisualPause(paused) {
    this.time.paused = paused;
    if (paused) this.tweens.pauseAll();
    else this.tweens.resumeAll();
    for (const object of this.children.list) {
      if (object.anims) {
        if (paused) object.anims.pause();
        else if (object.anims.isPaused) object.anims.resume();
      }
    }
  }

  togglePause() {
    if (this.isLevelUpPaused || this.isGameOver || !this.stats?.isAlive()) return;

    this.isPaused = !this.isPaused;
    this.setVisualPause(this.isPaused);
    this.input?.keyboard?.resetKeys();
    if (this.isPaused) {
      this.physics.pause();
      this.enemySpawner?.stop();
      if (this.player?.body) {
        this.player.setVelocity(0, 0);
      }
      audioManager.pauseBgm();
    } else {
      this.physics.resume();
      if (this.stats?.isAlive()) {
        this.enemySpawner?.start();
      }
      audioManager.resumeBgm();
    }
    this.gameEvents?.onPauseChange?.(this.isPaused);
    if (!this.isPaused) {
      if (this.stats?.queuedLevelUps > 0) this.handleLevelUpTrigger();
      else this.spawnNextBoss();
    }
  }

  restartGame() {
    this.isGameOver = false;
    this.finalStats = null;
    this.isPaused = false;
    this.isLevelUpPaused = false;
    this.externalMovement = null;
    this.survivalTime = 0;
    this.score = 0;
    this.pendingBossLevels = [];
    this.lastBossLevel = 1;
    this.currentUpgradeChoices = null;
    if (this.activeBoss) {
      if (this.activeBoss.telegraphGraphics) {
        this.activeBoss.telegraphGraphics.clear();
      }
      this.activeBoss = null;
    }
    this.gameEvents?.onBossStatus?.(null);
    this.runDirector?.end();
    this.comboCount = 0;
    this.gameEvents?.onComboUpdate?.(null);
    this.objectiveSystem?.destroy();
    this.objectiveSystem = null;
    this.gameEvents?.onObjectiveStatus?.(null);
    this.gameEvents?.onLevelUpClose?.();
    this.gameEvents?.onGameOverChange?.(null);
    this.gameEvents?.onPauseChange?.(false);
    this.shutdown();
    this.stats.reset();
    this.scene.restart(this.gameEvents);
  }

  shutdown() {
    this.pendingBossLevels = [];
    this.currentUpgradeChoices = null;
    this.comboCount = 0;
    this.gameEvents?.onComboUpdate?.(null);
    this.objectiveSystem?.destroy();
    this.objectiveSystem = null;
    this.gameEvents?.onObjectiveStatus?.(null);
    this.runDirector?.destroy();
    this.runDirector = null;
    this.gameEvents?.onLevelUpClose?.();
    if (this.activeBoss) {
      if (this.activeBoss.telegraphGraphics) {
        this.activeBoss.telegraphGraphics.clear();
      }
      this.activeBoss = null;
    }
    this.gameEvents?.onBossStatus?.(null);
    if (this.onWindowBlur) {
      window.removeEventListener("blur", this.onWindowBlur);
      this.onWindowBlur = null;
    }
    if (this.handleEnemyKilled) {
      this.events.off("enemy-killed", this.handleEnemyKilled);
      this.handleEnemyKilled = null;
    }
    if (this.handleBossStatus) {
      this.events.off("boss-status", this.handleBossStatus);
      this.handleBossStatus = null;
    }
    if (this.handleBossDefeated) {
      this.events.off("boss-defeated", this.handleBossDefeated);
      this.handleBossDefeated = null;
    }
    this.activeBoss = null;
    this.time?.removeAllEvents();
    this.tweens?.killAll();
    this.input?.keyboard?.resetKeys();
    this.input?.keyboard?.removeAllListeners();
    this.input?.removeAllListeners();
    this.externalMovement = null;
    this.isPaused = false;
    this.isLevelUpPaused = false;
    this.vfxManager?.destroy();
    audioManager.stopBgm();
    this.arenaSystem?.destroy();
    this.pickupSystem?.destroy();
    this.dropSystem?.destroy();
    this.projectileSystem?.destroy();
    this.enemySpawner?.destroy();
    this.playerAttackSystem?.destroy();
    this.playerSkillSystem?.destroy();
    this.processedKillIds?.clear();
    this.playerAnimator?.destroy();
    this.playerAnimator = null;
  }
}
