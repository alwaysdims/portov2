import Phaser from "phaser";
import coinAsset from "../assets/coin.jpeg";
import platformAsset from "../assets/kopdes.png";
import wowoAsset from "../assets/lompat.jpeg";
import obstacleAsset from "../assets/rintangan-kopdes.png";

const SETTINGS = {
  initialLives: 3,
  gravity: 1050,
  jumpForce: 535,
  playerSpeed: 245,
  coinScore: 10,
  damageInvulnerability: 1200,
  platformWidth: 162,
  platformHeight: 108,
  playerStartY: 480,
  minPlatformGap: 92,
  maxPlatformGap: 112,
  maxHorizontalStep: 96,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default class WowoJumpScene extends Phaser.Scene {
  constructor(events) {
    super("WowoJump");
    this.events = events;
    this.moveDirection = 0;
  }

  preload() {
    this.load.spritesheet("wowo", wowoAsset, { frameWidth: 102, frameHeight: 218 });
    this.load.spritesheet("coin", coinAsset, { frameWidth: 304, frameHeight: 430 });
    this.load.image("platform", platformAsset);
    this.load.image("obstacle", obstacleAsset);
  }

  create() {
    this.physics.world.gravity.y = SETTINGS.gravity;
    this.cameras.main.setDeadzone(0, 170);
    this.cameras.main.setBounds(0, -100000, 390, 100650);
    this.physics.world.setBounds(0, -100000, 390, 101000);

    this.add.rectangle(195, -50000, 390, 101000, 0x4f8eae).setDepth(-2);
    this.add.circle(62, 80, 28, 0xffdf72, 0.8).setScrollFactor(0.15).setDepth(-1);

    this.platforms = this.physics.add.staticGroup();
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.obstacles = this.physics.add.staticGroup();
    this.inputKeys = this.input.keyboard.addKeys("LEFT,RIGHT,A,D");
    this.input.keyboard.addCapture("LEFT,RIGHT,A,D");
    this.resetWorld();

    this.physics.add.collider(this.player, this.platforms, this.landOnPlatform, undefined, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
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
    this.lastPlatformX = 260;
    this.lastHudUpdate = 0;
    this.isGameOver = false;
    this.isInvulnerable = false;

    this.createPlatform(195, 570, false);
    this.createPlatform(130, 450, false);
    this.createPlatform(240, 335, true);
    this.createPlatform(145, 225, true);
    this.createPlatform(260, 120, true);

    if (this.player) this.player.destroy();
    this.player = this.physics.add.sprite(195, SETTINGS.playerStartY, "wowo", 4).setScale(0.58).setDepth(3);
    this.player.body.setSize(52, 88).setOffset(25, 75);
    this.player.setCollideWorldBounds(true);
    this.player.setVelocityY(-SETTINGS.jumpForce);
    this.highestY = this.player.y;
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.emitHud(true);
  }

  createPlatform(x, y, withExtras) {
    const platform = this.platforms.create(x, y, "platform").setOrigin(0.5, 1).setDepth(1);
    platform.displayWidth = SETTINGS.platformWidth;
    platform.displayHeight = SETTINGS.platformHeight;
    platform.refreshBody();
    platform.body.setSize(142, 16).setOffset(10, 88);
    platform.refreshBody();

    if (withExtras && Math.random() < 0.58) this.createCoin(x, y - 122);
    if (withExtras && this.score > 180 && Math.random() < this.obstacleChance()) {
      this.createObstacle(x, y - 18);
    }
  }

  createCoin(x, y) {
    const coin = this.coins.create(x + Phaser.Math.Between(-48, 48), y, "coin", 0).setScale(0.16).setDepth(2);
    coin.body.setSize(120, 180).setOffset(92, 80);
  }

  createObstacle(x, y) {
    const obstacle = this.obstacles.create(x, y, "obstacle").setOrigin(0.5, 1).setDepth(2);
    obstacle.displayWidth = 145;
    obstacle.displayHeight = 66;
    obstacle.refreshBody();
    obstacle.body.setSize(82, 36).setOffset(31, 29);
    obstacle.refreshBody();
  }

  generatePlatforms() {
    while (this.nextPlatformY > this.cameras.main.scrollY - 780) {
      const difficulty = clamp(Math.floor(this.score / 500), 0, 3);
      const gapY = Phaser.Math.Between(
        SETTINGS.minPlatformGap + difficulty * 3,
        SETTINGS.maxPlatformGap + difficulty * 3,
      );
      const maxStep = SETTINGS.maxHorizontalStep + difficulty * 3;
      const x = clamp(
        this.lastPlatformX + Phaser.Math.Between(-maxStep, maxStep),
        94,
        296,
      );
      this.nextPlatformY -= gapY;
      this.lastPlatformX = x;
      this.createPlatform(x, this.nextPlatformY, true);
    }
  }

  obstacleChance() {
    return clamp(0.12 + this.score / 10000, 0.12, 0.3);
  }

  landOnPlatform(player, platform) {
    const landedOnTop = player.body.touching.down || player.body.blocked.down;
    if (!landedOnTop || player.body.bottom > platform.body.top + 30) return;
    player.setVelocityY(-SETTINGS.jumpForce);
  }

  collectCoin(_player, coin) {
    if (!coin.active) return;
    const { x, y } = coin;
    coin.destroy();
    this.coinsCollected += 1;
    this.score += SETTINGS.coinScore;
    const feedback = this.add.text(x, y - 18, "+1", {
      color: "#fff4a3",
      fontFamily: "Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#5b3a0c",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
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
    this.cameras.main.shake(120, 0.008);
    this.tweens.add({ targets: this.player, alpha: 0.25, yoyo: true, repeat: 5, duration: 100 });
    this.time.delayedCall(SETTINGS.damageInvulnerability, () => {
      if (!this.player?.active) return;
      this.isInvulnerable = false;
      this.player.clearTint().setAlpha(1);
    });
    this.emitHud(true);
    if (this.lives <= 0) this.endGame();
  }

  endGame() {
    this.isGameOver = true;
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.cameras.main.fade(220, 7, 18, 35);
    this.events.onGameOver({ score: this.score, coins: this.coinsCollected });
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
    this.events.onState({ score: this.score, coins: this.coinsCollected, lives: this.lives });
  }

  update() {
    if (this.isGameOver) return;
    const keyboardDirection = (this.inputKeys.LEFT.isDown || this.inputKeys.A.isDown ? -1 : 0)
      + (this.inputKeys.RIGHT.isDown || this.inputKeys.D.isDown ? 1 : 0);
    const direction = keyboardDirection || this.moveDirection;
    this.player.setVelocityX(direction * SETTINGS.playerSpeed);
    this.player.setFlipX(direction < 0);

    this.highestY = Math.min(this.highestY, this.player.y);
    const heightScore = Math.max(0, Math.floor((SETTINGS.playerStartY - this.highestY) / 8));
    this.score = Math.max(this.score, heightScore + this.coinsCollected * SETTINGS.coinScore);
    this.generatePlatforms();
    this.removeOffscreenObjects();
    this.emitHud();

    if (this.player.y > this.cameras.main.scrollY + 780) this.endGame();
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
