import Phaser from "phaser";
import coinSpritesheet from "../assets/coin-spritesheet.png";
import lifeSpritesheet from "../assets/nyawa-spritesheet.png";
import platformAsset from "../assets/kopdes.png";
import wowoDefaultSpritesheet from "../assets/wowo-spritesheet.png";
import wowoPatriotSpritesheet from "../assets/wowo-patriot-spritesheet.png";
import wowoSafariSpritesheet from "../assets/wowo-safari-spritesheet.png";
import wowoGoldSpritesheet from "../assets/wowo-gold-spritesheet.png";
import wowoCyberSpritesheet from "../assets/wowo-cyber-spritesheet.png";
import obstacleAsset from "../assets/rintangan-kopdes.png";
import boostSpritesheet from "../assets/boost-spritesheet.png";
import { audioManager } from "../WowoJumpAudio";
import { readSelectedSkin } from "../WowoJumpStorage";

// 3 Vertical Lanes configuration (Left, Center, Right)
export const LANES = [80, 195, 310];

const SETTINGS = {
  initialLives: 3,
  gravity: 1050,
  jumpForce: 820,
  springJumpForce: 1150,
  playerSpeed: 380,
  coinScore: 10,
  damageInvulnerability: 1200,
  platformWidth: 140,
  platformHeight: 90,
  playerStartY: 480,
  minPlatformGap: 105,
  maxPlatformGap: 165,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default class WowoJumpScene extends Phaser.Scene {
  constructor(gameEvents) {
    super("WowoJump");
    this.gameEvents = gameEvents;
    this.moveDirection = 0;
    this.currentSkin = "default";
  }

  preload() {
    const skinSheets = {
      default: wowoDefaultSpritesheet,
      patriot: wowoPatriotSpritesheet,
      safari: wowoSafariSpritesheet,
      gold: wowoGoldSpritesheet,
      cyber: wowoCyberSpritesheet,
    };
    Object.entries(skinSheets).forEach(([key, sheet]) => {
      this.load.spritesheet(`wowo-${key}`, sheet, {
        frameWidth: 87,
        frameHeight: 183,
      });
    });

    this.load.spritesheet("boost", boostSpritesheet, {
      frameWidth: 80,
      frameHeight: 80,
    });
    this.load.spritesheet("coin", coinSpritesheet, {
      frameWidth: 120,
      frameHeight: 120,
    });
    this.load.spritesheet("life", lifeSpritesheet, {
      frameWidth: 94,
      frameHeight: 94,
    });
    this.load.image("platform", platformAsset);
    this.load.image("obstacle", obstacleAsset);
  }

  create() {
    this.physics.resume();
    this.physics.world.gravity.y = SETTINGS.gravity;

    // Reset camera effects
    this.cameras.main.resetFX();
    this.cameras.main.setAlpha(1);
    this.cameras.main.setDeadzone(0, 170);
    this.cameras.main.setBounds(0, -100000, 390, 100650);
    this.physics.world.setBounds(0, -100000, 390, 101000);

    // Background sky gradient
    this.add.rectangle(195, -49000, 390, 102000, 0x4f8eae).setDepth(-4);

    // Vertical lane guides
    LANES.forEach((laneX) => {
      const guide = this.add.rectangle(laneX, -49000, 2, 102000, 0xffffff, 0.12);
      guide.setDepth(-3);
    });

    // Decorative clouds / sun
    this.add.circle(62, 80, 28, 0xffdf72, 0.8).setScrollFactor(0.15).setDepth(-2);

    // Generate procedural runtime texture graphics for powerups and particles
    this.createRuntimeTextures();

    // Groups
    this.platforms = this.physics.add.staticGroup();
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.livesGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.powerups = this.physics.add.group({ allowGravity: false, immovable: true });
    this.obstacles = this.physics.add.staticGroup();

    // Input
    this.inputKeys = this.input.keyboard.addKeys("LEFT,RIGHT,A,D");
    this.input.keyboard.addCapture("LEFT,RIGHT,A,D");

    // Register animations for all character skins
    ["default", "patriot", "safari", "gold", "cyber"].forEach((skinKey) => {
      const animKey = `wowo-jump-${skinKey}`;
      if (!this.anims.exists(animKey)) {
        this.anims.create({
          key: animKey,
          frames: this.anims.generateFrameNumbers(`wowo-${skinKey}`, { start: 0, end: 10 }),
          frameRate: 14,
          repeat: -1,
        });
      }
    });

    if (!this.anims.exists("boost-fire")) {
      this.anims.create({
        key: "boost-fire",
        frames: this.anims.generateFrameNumbers("boost", { start: 0, end: 2 }),
        frameRate: 15,
        repeat: -1,
      });
    }

    if (!this.anims.exists("coin-spin")) {
      this.anims.create({
        key: "coin-spin",
        frames: this.anims.generateFrameNumbers("coin", { start: 0, end: 9 }),
        frameRate: 11,
        repeat: -1,
      });
    }

    if (!this.anims.exists("life-spin")) {
      this.anims.create({
        key: "life-spin",
        frames: this.anims.generateFrameNumbers("life", { start: 0, end: 19 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    this.resetWorld();

    // Colliders
    this.physics.add.collider(this.player, this.platforms, this.landOnPlatform, null, this);
    this.physics.add.collider(this.player, this.movingPlatforms, this.landOnPlatform, null, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.livesGroup, this.collectLife, null, this);
    this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, null, this);
  }

  createRuntimeTextures() {
    // 1. Dust particle for landing juice
    if (!this.textures.exists("particle-dust")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 0.85);
      g.fillCircle(5, 5, 5);
      g.generateTexture("particle-dust", 10, 10);
      g.destroy();
    }

    // 2. Sparkle particle for coin collection
    if (!this.textures.exists("particle-sparkle")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xfde047, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("particle-sparkle", 8, 8);
      g.destroy();
    }

    // 3. Power-up: Magnet (Purple circle with magnet ring)
    if (!this.textures.exists("item-magnet")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8b5cf6, 1);
      g.fillCircle(16, 16, 15);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeCircle(16, 16, 13);
      g.fillStyle(0xef4444, 1);
      g.fillRect(10, 8, 4, 10);
      g.fillStyle(0x3b82f6, 1);
      g.fillRect(18, 8, 4, 10);
      g.generateTexture("item-magnet", 32, 32);
      g.destroy();
    }

    // 4. Power-up: Shield (Cyan glowing orb)
    if (!this.textures.exists("item-shield")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x06b6d4, 1);
      g.fillCircle(16, 16, 15);
      g.lineStyle(3, 0xffffff, 1);
      g.strokeCircle(16, 16, 13);
      g.fillStyle(0xcffafe, 0.9);
      g.fillCircle(16, 16, 7);
      g.generateTexture("item-shield", 32, 32);
      g.destroy();
    }

    // 5. Power-up: Rocket Boost (Orange-red rocket orb)
    if (!this.textures.exists("item-rocket")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf97316, 1);
      g.fillCircle(16, 16, 15);
      g.lineStyle(3, 0xfde047, 1);
      g.strokeCircle(16, 16, 13);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(16, 6, 9, 24, 23, 24);
      g.generateTexture("item-rocket", 32, 32);
      g.destroy();
    }
  }

  resetWorld() {
    this.platforms.clear(true, true);
    this.movingPlatforms.clear(true, true);
    this.coins.clear(true, true);
    this.livesGroup.clear(true, true);
    this.powerups.clear(true, true);
    this.obstacles.clear(true, true);

    this.lives = SETTINGS.initialLives;
    this.coinsCollected = 0;
    this.score = 0;
    this.highestY = 0;
    this.nextPlatformY = -60;
    this.lastLaneIndex = 1;
    this.lastPlatformX = LANES[1];
    this.lastHudUpdate = 0;
    this.isGameOver = false;
    this.isInvulnerable = false;
    this.moveDirection = 0;

    // Power-up states
    this.activeShield = false;
    this.magnetTimer = 0;
    this.rocketTimer = 0;

    // Initial safe platforms
    this.createPlatform(LANES[1], 570, "normal", false);
    this.createPlatform(LANES[0], 430, "normal", false);
    this.createPlatform(LANES[2], 295, "normal", true);
    this.createPlatform(LANES[1], 150, "normal", true);
    this.createPlatform(LANES[0], 10, "normal", true);

    // Create player character
    const skinId = readSelectedSkin() || "default";
    this.currentSkin = skinId;
    if (this.player) this.player.destroy();
    this.player = this.physics.add
      .sprite(LANES[1], SETTINGS.playerStartY, `wowo-${skinId}`, 0)
      .setScale(0.6)
      .setDepth(3);

    this.player.body.setSize(48, 75).setOffset(19, 75);

    // Shield visual overlay
    if (this.shieldAura) this.shieldAura.destroy();
    this.shieldAura = this.add
      .circle(this.player.x, this.player.y, 38, 0x06b6d4, 0.35)
      .setStrokeStyle(2, 0x67e8f9, 0.9)
      .setDepth(4)
      .setVisible(false);

    // Rocket flame sprite under feet
    if (this.boostSprite) this.boostSprite.destroy();
    this.boostSprite = this.add
      .sprite(this.player.x, this.player.y + 48, "boost", 0)
      .setOrigin(0.5, 0)
      .setScale(0.75)
      .setDepth(2)
      .setVisible(false);

    // Initial bounce
    this.player.setVelocityY(-SETTINGS.jumpForce);
    this.player.anims.play(`wowo-jump-${skinId}`, true);
    audioManager.playJump();

    this.highestY = this.player.y;
    this.cameras.main.stopFollow();
    this.cameras.main.scrollY = 0;
    this.emitHud(true);
  }

  applyCosmeticSkin() {
    const skinId = readSelectedSkin() || "default";
    this.currentSkin = skinId;
    if (this.player) {
      this.player.setTexture(`wowo-${skinId}`);
      this.player.anims.play(`wowo-jump-${skinId}`, true);
    }
  }

  isPlatformReachable(prevX, prevY, nextX, nextY) {
    const dy = prevY - nextY; // vertical gap (positive when moving up)
    if (dy < SETTINGS.minPlatformGap) return false;

    const dx = Math.abs(nextX - prevX);

    // Calculate maximum allowed vertical gap based on horizontal distance
    let maxAllowedDy;
    if (dx > 200) {
      // Crossing from Lane 0 (80) to Lane 2 (310) -> constrain gap so player can cross in airtime
      maxAllowedDy = 125;
    } else if (dx > 100) {
      // Adjacent lane
      maxAllowedDy = 155;
    } else {
      // Same lane
      maxAllowedDy = 175;
    }

    return dy <= maxAllowedDy;
  }

  createPlatform(x, y, type = "normal", withExtras = true) {
    let platform;

    if (type === "moving") {
      platform = this.movingPlatforms.create(x, y, "platform").setOrigin(0.5, 1).setDepth(1);
      platform.displayWidth = SETTINGS.platformWidth;
      platform.displayHeight = SETTINGS.platformHeight;
      platform.refreshBody();
      platform.body.setSize(125, 18).setOffset(8, 0);
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
      platform.body.checkCollision.up = true;
      platform.platformType = "moving";
      platform.moveSpeed = Phaser.Math.Between(55, 80) * (Math.random() < 0.5 ? 1 : -1);
      platform.setTint(0xbbf7d0); // Light green tint
    } else if (type === "fragile") {
      platform = this.platforms.create(x, y, "platform").setOrigin(0.5, 1).setDepth(1);
      platform.displayWidth = SETTINGS.platformWidth;
      platform.displayHeight = SETTINGS.platformHeight;
      platform.refreshBody();
      platform.body.setSize(125, 18).setOffset(8, 0);
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
      platform.body.checkCollision.up = true;
      platform.platformType = "fragile";
      platform.setTint(0xfca5a5); // Fragile pink/red tint
    } else if (type === "spring") {
      platform = this.platforms.create(x, y, "platform").setOrigin(0.5, 1).setDepth(1);
      platform.displayWidth = SETTINGS.platformWidth;
      platform.displayHeight = SETTINGS.platformHeight;
      platform.refreshBody();
      platform.body.setSize(125, 18).setOffset(8, 0);
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
      platform.body.checkCollision.up = true;
      platform.platformType = "spring";
      platform.setTint(0xfde047); // Golden yellow spring tint
    } else if (type === "hazard") {
      // Platform with hanging sawit obstacle underneath
      platform = this.platforms.create(x, y, "obstacle").setOrigin(0.5, 1).setDepth(1);
      platform.displayWidth = 140;
      platform.displayHeight = 90;
      platform.refreshBody();

      // Safe landing roof surface
      platform.body.setSize(125, 18).setOffset(8, 0);
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
      platform.body.checkCollision.up = true;
      platform.platformType = "hazard";

      // Damage collision zone strictly on the lower sawit roots
      const hazardSawit = this.obstacles.create(x, y, "particle-dust").setVisible(false).setOrigin(0.5, 1);
      hazardSawit.displayWidth = 70;
      hazardSawit.displayHeight = 28;
      hazardSawit.refreshBody();
      hazardSawit.body.setSize(70, 28).setOffset(-35, -28);
    } else {
      // Standard Kopdes
      platform = this.platforms.create(x, y, "platform").setOrigin(0.5, 1).setDepth(1);
      platform.displayWidth = SETTINGS.platformWidth;
      platform.displayHeight = SETTINGS.platformHeight;
      platform.refreshBody();
      platform.body.setSize(125, 18).setOffset(8, 0);
      platform.body.checkCollision.down = false;
      platform.body.checkCollision.left = false;
      platform.body.checkCollision.right = false;
      platform.body.checkCollision.up = true;
      platform.platformType = "normal";
    }

    if (!withExtras) return platform;

    const roll = Math.random();
    if (roll < 0.45) {
      this.createCoin(x, y - 110);
    } else if (roll < 0.58 && this.lives < SETTINGS.initialLives) {
      this.createLifePickup(x, y - 110);
    } else if (roll < 0.70 && this.score > 250) {
      // Spawn random powerup
      const powerupTypes = ["magnet", "shield", "rocket"];
      const picked = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
      this.createPowerup(x, y - 110, picked);
    }

    return platform;
  }

  createCoin(x, y) {
    const coin = this.coins.create(x, y, "coin").setScale(0.28).setDepth(2);
    coin.play("coin-spin");
    coin.body.setSize(coin.width * 0.7, coin.height * 0.7).setOffset(coin.width * 0.15, coin.height * 0.15);
  }

  createLifePickup(x, y) {
    const lifeItem = this.livesGroup.create(x, y, "life").setScale(0.38).setDepth(2);
    lifeItem.play("life-spin");
    lifeItem.body.setSize(lifeItem.width * 0.7, lifeItem.height * 0.7).setOffset(lifeItem.width * 0.15, lifeItem.height * 0.15);
  }

  createPowerup(x, y, type) {
    const textureKey = `item-${type}`;
    const item = this.powerups.create(x, y, textureKey).setScale(1).setDepth(2);
    item.powerupType = type;
    item.body.setSize(28, 28).setOffset(2, 2);

    // Floating bobbing effect
    this.tweens.add({
      targets: item,
      y: y - 8,
      yoyo: true,
      repeat: -1,
      duration: 600,
      ease: "Sine.easeInOut",
    });
  }

  generatePlatforms() {
    while (this.nextPlatformY > this.cameras.main.scrollY - 780) {
      const difficulty = clamp(Math.floor(this.score / 500), 0, 4);

      let targetX = LANES[1];
      let targetGap = SETTINGS.minPlatformGap + 20;
      let valid = false;

      // Safe retry loop up to 20 attempts
      for (let attempt = 0; attempt < 20; attempt++) {
        let laneIndex = Phaser.Math.Between(0, 2);
        if (laneIndex === this.lastLaneIndex && Math.random() < 0.65) {
          laneIndex = (laneIndex + Phaser.Math.Between(1, 2)) % 3;
        }

        const candidateX = LANES[laneIndex];
        const gap = Phaser.Math.Between(
          SETTINGS.minPlatformGap + difficulty * 4,
          SETTINGS.maxPlatformGap + difficulty * 3
        );

        if (this.isPlatformReachable(this.lastPlatformX, this.nextPlatformY, candidateX, this.nextPlatformY - gap)) {
          targetX = candidateX;
          targetGap = gap;
          this.lastLaneIndex = laneIndex;
          valid = true;
          break;
        }
      }

      // Fallback if no valid random candidate: step to adjacent lane with safe gap
      if (!valid) {
        this.lastLaneIndex = (this.lastLaneIndex + 1) % 3;
        targetX = LANES[this.lastLaneIndex];
        targetGap = 120;
      }

      this.lastPlatformX = targetX;
      this.nextPlatformY -= targetGap;

      // Determine platform variation
      let type = "normal";
      const typeRoll = Math.random();

      if (this.score > 700 && typeRoll < 0.22) {
        type = "moving";
      } else if (this.score > 400 && typeRoll < 0.38) {
        type = "fragile";
      } else if (typeRoll < 0.5) {
        type = "spring";
      } else if (this.score > 300 && typeRoll < 0.72) {
        type = "hazard";
      }

      this.createPlatform(targetX, this.nextPlatformY, type, true);
    }
  }

  landOnPlatform(player, platform) {
    if (player.body.velocity.y < 0) return;
    const landedOnTop = player.body.touching.down || player.body.blocked.down;
    if (!landedOnTop) return;

    // Juice: Squash and stretch on landing
    player.setScale(0.72, 0.45);
    this.tweens.add({
      targets: player,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 180,
      ease: "Back.easeOut",
    });

    // Juice: Dust particle puff at landing feet
    this.spawnDust(player.x, player.y + 40);

    // Platform-specific reactions
    if (platform.platformType === "spring") {
      player.setVelocityY(-SETTINGS.springJumpForce);
      player.anims.play("wowo-jump", true);
      audioManager.playSpring();
      this.showFloatingText(platform.x, platform.y - 25, "SUPER BOUNCE!", "#fde047");
      return;
    }

    if (platform.platformType === "fragile") {
      player.setVelocityY(-SETTINGS.jumpForce);
      player.anims.play("wowo-jump", true);
      audioManager.playJump();

      // Crumble and destroy fragile platform
      this.tweens.add({
        targets: platform,
        alpha: 0,
        y: platform.y + 15,
        duration: 220,
        onComplete: () => platform.destroy(),
      });
      return;
    }

    // Normal or moving platform bounce
    player.setVelocityY(-SETTINGS.jumpForce);
    player.anims.play("wowo-jump", true);
    audioManager.playJump();
  }

  spawnDust(x, y) {
    for (let i = 0; i < 4; i++) {
      const p = this.add.image(x + (Math.random() * 30 - 15), y, "particle-dust").setDepth(2).setScale(0.8);
      this.tweens.add({
        targets: p,
        x: p.x + (Math.random() * 40 - 20),
        y: y + Math.random() * 8,
        alpha: 0,
        scale: 0.2,
        duration: 280,
        onComplete: () => p.destroy(),
      });
    }
  }

  collectCoin(_player, coin) {
    if (!coin.active) return;
    const { x, y } = coin;
    coin.destroy();

    this.coinsCollected += 1;
    this.score += SETTINGS.coinScore;
    audioManager.playCoin();

    // Sparkle particles
    for (let i = 0; i < 5; i++) {
      const p = this.add.image(x, y, "particle-sparkle").setDepth(5);
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 24 + 10;
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        scale: 0.1,
        duration: 350,
        onComplete: () => p.destroy(),
      });
    }

    this.showFloatingText(x, y - 18, "+1", "#fff4a3");
    this.emitHud(true);
  }

  collectLife(_player, lifeItem) {
    if (!lifeItem.active) return;
    const { x, y } = lifeItem;
    lifeItem.destroy();

    if (this.lives < SETTINGS.initialLives) {
      this.lives += 1;
      this.emitHud(true);
    }
    audioManager.playLife();
    this.showFloatingText(x, y - 18, "+1 NYAWA", "#86efac");
  }

  collectPowerup(_player, item) {
    if (!item.active) return;
    const type = item.powerupType;
    const { x, y } = item;
    item.destroy();

    audioManager.playPowerup();

    if (type === "shield") {
      this.activeShield = true;
      this.shieldAura.setVisible(true);
      this.showFloatingText(x, y - 20, "PERISAI AKTIF!", "#67e8f9");
    } else if (type === "magnet") {
      this.magnetTimer = 6.0; // 6 seconds
      this.showFloatingText(x, y - 20, "MAGNET KOIN!", "#c084fc");
    } else if (type === "rocket") {
      this.rocketTimer = 3.5; // 3.5 seconds super boost
      this.player.setVelocityY(-1100);
      this.showFloatingText(x, y - 20, "ROKET BOOST! 🚀", "#fb923c");
      if (audioManager.playRocket) {
        audioManager.playRocket();
      } else {
        audioManager.playPowerup();
      }
    }

    this.emitHud(true);
  }

  showFloatingText(x, y, text, color = "#ffffff") {
    const fb = this.add
      .text(x, y, text, {
        color,
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        stroke: "#0f172a",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.tweens.add({
      targets: fb,
      y: y - 36,
      alpha: 0,
      duration: 520,
      onComplete: () => fb.destroy(),
    });
  }

  hitObstacle(_player, obstacle) {
    if (this.isGameOver) return;

    // Rocket boost invulnerability: smash right through obstacles
    if (this.rocketTimer > 0) {
      if (obstacle && obstacle.active) {
        this.spawnDust(obstacle.x, obstacle.y);
        obstacle.destroy();
      }
      return;
    }

    if (this.isInvulnerable) return;

    // Shield powerup absorbs 1 hit completely
    if (this.activeShield) {
      this.activeShield = false;
      this.shieldAura.setVisible(false);
      this.isInvulnerable = true;
      audioManager.playSpring();
      this.showFloatingText(this.player.x, this.player.y - 30, "PERISAI HANCUR!", "#67e8f9");
      this.time.delayedCall(800, () => {
        this.isInvulnerable = false;
      });
      return;
    }

    this.lives = Math.max(0, this.lives - 1);
    this.isInvulnerable = true;
    audioManager.playDamage();

    this.player.setTint(0xff8b8b);
    this.cameras.main.shake(140, 0.012);

    this.tweens.add({
      targets: this.player,
      alpha: 0.25,
      yoyo: true,
      repeat: 5,
      duration: 100,
    });

    this.time.delayedCall(SETTINGS.damageInvulnerability, () => {
      if (!this.player?.active) return;
      this.isInvulnerable = false;
      this.player.clearTint().setAlpha(1);
    });

    this.emitHud(true);

    if (this.lives <= 0) {
      this.endGame();
    }
  }

  endGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    audioManager.playGameOver();
    audioManager.stopBgm();

    // Disable player physics and stop gameplay
    this.player.setVelocity(0, 0);
    this.physics.pause();

    if (this.boostSprite) this.boostSprite.setVisible(false);
    if (this.shieldAura) this.shieldAura.setVisible(false);

    // Juice: Cute / funny Game Over dizzy animation on Wowo
    this.player.anims.stop();
    this.tweens.add({
      targets: this.player,
      rotation: 0.35,
      yoyo: true,
      repeat: -1,
      duration: 320,
      ease: "Sine.easeInOut",
    });

    // Floating dizzy stars over Wowo's head
    const stars = this.add.text(this.player.x, this.player.y - 50, "💫 💫", { fontSize: "20px" }).setOrigin(0.5).setDepth(6);
    this.tweens.add({
      targets: stars,
      y: this.player.y - 62,
      rotation: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 400,
    });

    this.cameras.main.fade(260, 7, 18, 35);

    const finalHeight = Math.max(0, Math.floor((SETTINGS.playerStartY - this.highestY) / 8));
    this.gameEvents.onGameOver({
      score: this.score,
      coins: this.coinsCollected,
      height: finalHeight,
    });
  }

  setMoveDirection(direction) {
    this.moveDirection = direction;
  }

  emitHud(force = false) {
    const now = this.time.now;
    if (!force && now - this.lastHudUpdate < 100) return;
    this.lastHudUpdate = now;
    this.gameEvents.onState({
      score: this.score,
      coins: this.coinsCollected,
      lives: this.lives,
      hasShield: this.activeShield,
      hasMagnet: this.magnetTimer > 0,
      hasRocket: this.rocketTimer > 0,
    });
  }

  update(_time, delta) {
    if (this.isGameOver) return;
    const dt = delta / 1000;

    // Moving platforms horizontal update
    this.movingPlatforms.getChildren().forEach((p) => {
      p.x += p.moveSpeed * dt;
      if (p.x < LANES[0] - 15) {
        p.x = LANES[0] - 15;
        p.moveSpeed = Math.abs(p.moveSpeed);
      } else if (p.x > LANES[2] + 15) {
        p.x = LANES[2] + 15;
        p.moveSpeed = -Math.abs(p.moveSpeed);
      }
      p.refreshBody();
    });

    // Keyboard & touch input handling
    const keyboardDirection =
      (this.inputKeys.LEFT.isDown || this.inputKeys.A.isDown ? -1 : 0) +
      (this.inputKeys.RIGHT.isDown || this.inputKeys.D.isDown ? 1 : 0);

    const direction = keyboardDirection || this.moveDirection;
    this.player.setVelocityX(direction * SETTINGS.playerSpeed);

    // Keep player in bounds
    if (this.player.x < LANES[0] - 25) {
      this.player.x = LANES[0] - 25;
      if (this.player.body.velocity.x < 0) this.player.setVelocityX(0);
    } else if (this.player.x > LANES[2] + 25) {
      this.player.x = LANES[2] + 25;
      if (this.player.body.velocity.x > 0) this.player.setVelocityX(0);
    }

    // Sprite flipping
    if (direction < 0) {
      this.player.setFlipX(true);
    } else if (direction > 0) {
      this.player.setFlipX(false);
    }

    // Sync shield position
    if (this.shieldAura && this.shieldAura.visible) {
      this.shieldAura.setPosition(this.player.x, this.player.y);
    }

    // Animation & Rocket Boost state
    const currentAnimKey = `wowo-jump-${this.currentSkin}`;

    // RULE: Boost flame ONLY appears when player collects the triangle rocket power-up!
    if (this.rocketTimer > 0) {
      this.rocketTimer -= dt;
      this.player.setVelocityY(-950);

      // Lock player to upright launching pose (frame 0) so feet stay extended straight down
      this.player.anims.stop();
      this.player.setFrame(0);

      // Boost flame locked seamlessly onto Wowo's shoe soles
      this.boostSprite.setVisible(true);
      this.boostSprite.setPosition(this.player.x, this.player.y + 48);
      this.boostSprite.setScale(1.05);
      this.boostSprite.setFlipX(this.player.flipX);
      if (!this.boostSprite.anims.isPlaying) {
        this.boostSprite.anims.play("boost-fire", true);
      }

      // Dynamic thrust smoke/dust trail under feet
      if (Math.random() < 0.4) {
        this.spawnDust(this.player.x + (Math.random() * 14 - 7), this.player.y + 76);
      }
    } else {
      // Normal jumps: boost flame is completely inactive
      this.boostSprite.setVisible(false);

      if (!this.player.anims.isPlaying) {
        this.player.anims.play(currentAnimKey, true);
      }
    }

    // Magnet powerup: pull nearby coins to player
    if (this.magnetTimer > 0) {
      this.magnetTimer -= dt;
      const pullRadius = 240;
      this.coins.getChildren().forEach((coin) => {
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, coin.x, coin.y);
        if (dist < pullRadius) {
          const angle = Phaser.Math.Angle.Between(coin.x, coin.y, this.player.x, this.player.y);
          coin.x += Math.cos(angle) * 360 * dt;
          coin.y += Math.sin(angle) * 360 * dt;
        }
      });
    }

    // Height & score calculation
    this.highestY = Math.min(this.highestY, this.player.y);
    const heightScore = Math.max(0, Math.floor((SETTINGS.playerStartY - this.highestY) / 8));
    this.score = Math.max(this.score, heightScore + this.coinsCollected * SETTINGS.coinScore);

    // Camera upward follow (faster tracking during rocket boost so Wowo stays centered)
    const targetCameraY = this.player.y - 320;
    const lerpFactor = this.rocketTimer > 0 ? 0.35 : 0.18;
    if (targetCameraY < this.cameras.main.scrollY) {
      this.cameras.main.scrollY = Phaser.Math.Linear(this.cameras.main.scrollY, targetCameraY, lerpFactor);
    }

    this.generatePlatforms();
    this.removeOffscreenObjects();
    this.emitHud();

    // Falling offscreen -> game over
    if (this.player.y > this.cameras.main.scrollY + 680) {
      this.endGame();
    }
  }

  removeOffscreenObjects() {
    const limit = this.cameras.main.scrollY + 760;
    [this.platforms, this.movingPlatforms, this.coins, this.livesGroup, this.powerups, this.obstacles].forEach(
      (group) => {
        const toRemove = group.getChildren().filter((object) => object.y > limit);
        toRemove.forEach((object) => object.destroy());
      }
    );
  }
}

