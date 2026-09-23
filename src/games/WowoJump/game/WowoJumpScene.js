import Phaser from "phaser";
import coinAsset from "../assets/coin.jpeg";
import platformAsset from "../assets/kopdes.png";
import wowoSpritesheet from "../assets/wowo-spritesheet.png";
import obstacleAsset from "../assets/rintangan-kopdes.png";
import boostSpritesheet from "../assets/boost-spritesheet.png";

// 3 Vertical Lanes configuration (Left, Center, Right)
const LANES = [80, 195, 310];

const SETTINGS = {
  initialLives: 3,
  gravity: 1050,
  jumpForce: 820, // High jump force as requested ("lompat lebih tinggi")
  playerSpeed: 380, // Fast snappy horizontal movement across 3 lanes
  coinScore: 10,
  damageInvulnerability: 1200,
  platformWidth: 140,
  platformHeight: 90,
  playerStartY: 480,
  minPlatformGap: 130,
  maxPlatformGap: 165,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default class WowoJumpScene extends Phaser.Scene {
  constructor(gameEvents) {
    super("WowoJump");
    // Custom event callback handler passed from React container
    this.gameEvents = gameEvents;
    this.moveDirection = 0;
  }

  preload() {
    // 11 frames of Wowo jump animation (87x183 px)
    this.load.spritesheet("wowo", wowoSpritesheet, {
      frameWidth: 87,
      frameHeight: 183,
    });
    // 3 frames of root/rocket boost flame under feet (80x80 px)
    this.load.spritesheet("boost", boostSpritesheet, {
      frameWidth: 80,
      frameHeight: 80,
    });
    this.load.spritesheet("coin", coinAsset, {
      frameWidth: 304,
      frameHeight: 430,
    });
    this.load.image("platform", platformAsset);
    this.load.image("obstacle", obstacleAsset);
  }

  create() {
    this.physics.world.gravity.y = SETTINGS.gravity;
    this.cameras.main.setDeadzone(0, 170);
    this.cameras.main.setBounds(0, -100000, 390, 100650);
    this.physics.world.setBounds(0, -100000, 390, 101000);

    // Background sky gradient / rectangle
    this.add.rectangle(195, -50000, 390, 101000, 0x4f8eae).setDepth(-3);

    // Faint vertical lane guides for visual clarity (3 vertical lanes)
    LANES.forEach((laneX) => {
      const guide = this.add.rectangle(laneX, -50000, 2, 101000, 0xffffff, 0.12);
      guide.setDepth(-2);
    });

    // Sun decoration
    this.add
      .circle(62, 80, 28, 0xffdf72, 0.8)
      .setScrollFactor(0.15)
      .setDepth(-1);

    this.platforms = this.physics.add.staticGroup();
    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.obstacles = this.physics.add.staticGroup();

    // Keyboard input capture
    this.inputKeys = this.input.keyboard.addKeys("LEFT,RIGHT,A,D");
    this.input.keyboard.addCapture("LEFT,RIGHT,A,D");

    // Wowo jump animation
    if (!this.anims.exists("wowo-jump")) {
      this.anims.create({
        key: "wowo-jump",
        frames: this.anims.generateFrameNumbers("wowo", { start: 0, end: 10 }),
        frameRate: 14,
        repeat: -1,
      });
    }

    // Boost flame animation under feet
    if (!this.anims.exists("boost-fire")) {
      this.anims.create({
        key: "boost-fire",
        frames: this.anims.generateFrameNumbers("boost", { start: 0, end: 2 }),
        frameRate: 15,
        repeat: -1,
      });
    }

    this.resetWorld();

    // Platform collision
    this.physics.add.collider(
      this.player,
      this.platforms,
      this.landOnPlatform,
      null,
      this
    );

    // Coin collection
    this.physics.add.overlap(
      this.player,
      this.coins,
      this.collectCoin,
      null,
      this
    );

    // Obstacle damage
    this.physics.add.overlap(
      this.player,
      this.obstacles,
      this.hitObstacle,
      null,
      this
    );
  }

  resetWorld() {
    this.platforms.clear(true, true);
    this.coins.clear(true, true);
    this.obstacles.clear(true, true);
    this.lives = SETTINGS.initialLives;
    this.coinsCollected = 0;
    this.score = 0;
    this.highestY = 0;
    this.nextPlatformY = -65;
    this.lastLaneIndex = 1; // Start middle lane
    this.lastHudUpdate = 0;
    this.isGameOver = false;
    this.isInvulnerable = false;

    // Create initial safe platforms strictly aligned to the 3 vertical lanes
    this.createPlatform(LANES[1], 570, false); // Center lane bottom
    this.createPlatform(LANES[0], 430, false); // Left lane
    this.createPlatform(LANES[2], 295, true);  // Right lane
    this.createPlatform(LANES[1], 150, true);  // Center lane
    this.createPlatform(LANES[0], 10, true);   // Left lane

    // Create player character
    if (this.player) this.player.destroy();
    this.player = this.physics.add
      .sprite(LANES[1], SETTINGS.playerStartY, "wowo", 0)
      .setScale(0.6)
      .setDepth(3);

    // Player physics body size
    this.player.body.setSize(50, 80).setOffset(18, 70);
    this.player.setCollideWorldBounds(true);

    // Rocket / Root boost sprite under Wowo's feet
    if (this.boostSprite) this.boostSprite.destroy();
    this.boostSprite = this.add
      .sprite(this.player.x, this.player.y + 44, "boost", 0)
      .setOrigin(0.5, 0) // Align top of flame to feet
      .setScale(0.7)
      .setDepth(2)
      .setVisible(false);

    // High initial jump boost
    this.player.setVelocityY(-SETTINGS.jumpForce);
    this.player.anims.play("wowo-jump", true);

    this.highestY = this.player.y;
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.emitHud(true);
  }

  createPlatform(x, y, withExtras) {
    const platform = this.platforms
      .create(x, y, "platform")
      .setOrigin(0.5, 1)
      .setDepth(1);
    platform.displayWidth = SETTINGS.platformWidth;
    platform.displayHeight = SETTINGS.platformHeight;
    platform.refreshBody();

    // Top surface collision box — one-way pass-through platformer physics
    platform.body.setSize(125, 16).setOffset(8, 72);
    platform.body.checkCollision.down = false;
    platform.body.checkCollision.left = false;
    platform.body.checkCollision.right = false;
    platform.body.checkCollision.up = true;
    platform.refreshBody();

    if (withExtras && Math.random() < 0.6) {
      this.createCoin(x, y - 110);
    }
    if (
      withExtras &&
      this.score > 150 &&
      Math.random() < this.obstacleChance()
    ) {
      this.createObstacle(x, y - 16);
    }
  }

  createCoin(x, y) {
    const coin = this.coins
      .create(x, y, "coin", 0)
      .setScale(0.15)
      .setDepth(2);
    coin.body.setSize(120, 180).setOffset(92, 80);
  }

  createObstacle(x, y) {
    const obstacle = this.obstacles
      .create(x, y, "obstacle")
      .setOrigin(0.5, 1)
      .setDepth(2);
    obstacle.displayWidth = 130;
    obstacle.displayHeight = 60;
    obstacle.refreshBody();
    obstacle.body.setSize(75, 34).setOffset(28, 26);
    obstacle.refreshBody();
  }

  generatePlatforms() {
    while (this.nextPlatformY > this.cameras.main.scrollY - 780) {
      const difficulty = clamp(Math.floor(this.score / 600), 0, 3);
      const gapY = Phaser.Math.Between(
        SETTINGS.minPlatformGap + difficulty * 5,
        SETTINGS.maxPlatformGap + difficulty * 5
      );

      // Pick a lane from 3 vertical columns, avoiding same lane 3 times in a row
      let laneIndex = Phaser.Math.Between(0, 2);
      if (laneIndex === this.lastLaneIndex && Math.random() < 0.65) {
        laneIndex = (laneIndex + Phaser.Math.Between(1, 2)) % 3;
      }
      this.lastLaneIndex = laneIndex;

      const x = LANES[laneIndex];
      this.nextPlatformY -= gapY;
      this.createPlatform(x, this.nextPlatformY, true);
    }
  }

  obstacleChance() {
    return clamp(0.14 + this.score / 9000, 0.14, 0.35);
  }

  landOnPlatform(player, _platform) {
    // Only bounce when landing on top while falling down
    if (player.body.velocity.y < 0) return;
    const landedOnTop = player.body.touching.down || player.body.blocked.down;
    if (!landedOnTop) return;

    // High jump bounce off Kopdes
    player.setVelocityY(-SETTINGS.jumpForce);
  }

  collectCoin(_player, coin) {
    if (!coin.active) return;
    const { x, y } = coin;
    coin.destroy();
    this.coinsCollected += 1;
    this.score += SETTINGS.coinScore;

    const feedback = this.add
      .text(x, y - 18, "+1", {
        color: "#fff4a3",
        fontFamily: "Arial, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        stroke: "#5b3a0c",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(5);
    this.tweens.add({
      targets: feedback,
      y: feedback.y - 34,
      alpha: 0,
      duration: 450,
      onComplete: () => feedback.destroy(),
    });
    this.emitHud(true);
  }

  hitObstacle() {
    if (this.isInvulnerable || this.isGameOver) return;

    this.lives = Math.max(0, this.lives - 1);
    this.isInvulnerable = true;

    this.player.setTint(0xff8b8b);
    this.cameras.main.shake(140, 0.01);
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
    this.isGameOver = true;
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    if (this.boostSprite) this.boostSprite.setVisible(false);
    this.physics.pause();
    this.cameras.main.fade(220, 7, 18, 35);
    this.gameEvents.onGameOver({
      score: this.score,
      coins: this.coinsCollected,
    });
  }

  setMoveDirection(direction) {
    this.moveDirection = direction;
  }

  restart() {
    this.scene.restart();
  }

  emitHud(force = false) {
    const now = this.time.now;
    if (!force && now - this.lastHudUpdate < 120) return;
    this.lastHudUpdate = now;
    this.gameEvents.onState({
      score: this.score,
      coins: this.coinsCollected,
      lives: this.lives,
    });
  }

  update() {
    if (this.isGameOver) return;

    // Keyboard input handling (LEFT / RIGHT or A / D)
    const keyboardDirection =
      (this.inputKeys.LEFT.isDown || this.inputKeys.A.isDown ? -1 : 0) +
      (this.inputKeys.RIGHT.isDown || this.inputKeys.D.isDown ? 1 : 0);

    const direction = keyboardDirection || this.moveDirection;

    // Apply horizontal movement, clamped between left lane (80px) and right lane (310px)
    this.player.setVelocityX(direction * SETTINGS.playerSpeed);

    // Keep player within horizontal lane boundaries (LANES[0] - 25 to LANES[2] + 25)
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

    // Wowo jump animation
    if (!this.player.anims.isPlaying) {
      this.player.anims.play("wowo-jump", true);
    }

    // Root / Rocket boost effect under Wowo's feet when ascending high
    if (this.player.body.velocity.y < -50) {
      this.boostSprite.setVisible(true);
      this.boostSprite.setPosition(this.player.x, this.player.y + 42);
      this.boostSprite.setFlipX(this.player.flipX);
      if (!this.boostSprite.anims.isPlaying) {
        this.boostSprite.anims.play("boost-fire", true);
      }
    } else {
      this.boostSprite.setVisible(false);
    }

    // Track highest position for score calculation
    this.highestY = Math.min(this.highestY, this.player.y);
    const heightScore = Math.max(
      0,
      Math.floor((SETTINGS.playerStartY - this.highestY) / 8)
    );
    this.score = Math.max(
      this.score,
      heightScore + this.coinsCollected * SETTINGS.coinScore
    );

    this.generatePlatforms();
    this.removeOffscreenObjects();
    this.emitHud();

    // Game over when falling off the bottom
    if (this.player.y > this.cameras.main.scrollY + 780) {
      this.endGame();
    }
  }

  removeOffscreenObjects() {
    const limit = this.cameras.main.scrollY + 820;
    [this.platforms, this.coins, this.obstacles].forEach((group) => {
      group.getChildren().forEach((object) => {
        if (object.y > limit) object.destroy();
      });
    });
  }
}
