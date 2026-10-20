// ArenaSystem.js — TPS election arena environment, paving network, landmarks, collision & camera clamp
// ponytail: static obstacle grid; destructible booths & dynamic crowd barriers unlock in Tahap 14.

import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { ARENA_CONFIG } from "../../config/arenaConfig.js";

export class ArenaSystem {
  constructor(scene) {
    this.scene = scene;
    this.width = ARENA_CONFIG.WIDTH;
    this.height = ARENA_CONFIG.HEIGHT;

    this.bordersGroup = null;
    this.obstaclesGroup = null;
    this.obstacleBoxes = [];
    this.propsList = [];
    this.roadTiles = [];
  }

  buildArena() {
    this.createGround();
    this.createRoads();
    this.createBorders();
    this.createObstacles();
  }

  createGround() {
    // 1. Continuous grass surface covering entire world bounds
    this.ground = this.scene.add.tileSprite(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      ASSET_KEYS.ARENA_GROUND
    );
    this.ground.setDepth(0);
  }

  createRoads() {
    const cx = this.width / 2;
    const cy = this.height / 2;

    // 2. Structured cobblestone road avenues
    // Main East-West thoroughfare (128px wide)
    const ewRoad = this.scene.add.tileSprite(cx, cy, 2160, 128, ASSET_KEYS.ARENA_ROAD);
    ewRoad.setDepth(1);
    this.roadTiles.push(ewRoad);

    // Main North-South thoroughfare (128px wide)
    const nsRoad = this.scene.add.tileSprite(cx, cy, 128, 2160, ASSET_KEYS.ARENA_ROAD);
    nsRoad.setDepth(1);
    this.roadTiles.push(nsRoad);

    // Central Crossroads Town Square Plaza (384x384 px)
    const centerPlaza = this.scene.add.tileSprite(cx, cy, 384, 384, ASSET_KEYS.ARENA_ROAD);
    centerPlaza.setDepth(1);
    this.roadTiles.push(centerPlaza);

    // TPS Voting Pavilion Paved Plazas
    const pads = [
      { x: cx, y: 940, w: 256, h: 128 }, // North TPS Pavilion
      { x: cx, y: 1460, w: 256, h: 128 }, // South TPS Pavilion
      { x: 760, y: cy, w: 160, h: 160 }, // West TPS Booth
      { x: 1640, y: cy, w: 160, h: 160 }, // East TPS Booth
    ];

    pads.forEach(({ x, y, w, h }) => {
      const pad = this.scene.add.tileSprite(x, y, w, h, ASSET_KEYS.ARENA_ROAD);
      pad.setDepth(1);
      this.roadTiles.push(pad);
    });
  }

  createBorders() {
    this.bordersGroup = this.scene.physics.add.staticGroup();
    const borderSize = 32;

    // Horizontal top & bottom stone barriers
    for (let x = 16; x < this.width; x += borderSize) {
      const top = this.bordersGroup.create(x, 16, ASSET_KEYS.ARENA_BORDER);
      top.setDepth(2);
      top.refreshBody();

      const btm = this.bordersGroup.create(x, this.height - 16, ASSET_KEYS.ARENA_BORDER);
      btm.setDepth(2);
      btm.refreshBody();
    }

    // Vertical left & right stone barriers
    for (let y = 48; y < this.height - 32; y += borderSize) {
      const lft = this.bordersGroup.create(16, y, ASSET_KEYS.ARENA_BORDER);
      lft.setDepth(2);
      lft.refreshBody();

      const rgt = this.bordersGroup.create(this.width - 16, y, ASSET_KEYS.ARENA_BORDER);
      rgt.setDepth(2);
      rgt.refreshBody();
    }
  }

  createObstacles() {
    this.obstaclesGroup = this.scene.physics.add.staticGroup();
    this.obstacleBoxes = [];

    // 1. TPS Tent Pavilions (128x80)
    // In 3/4 top-down perspective, only the table/base collides, canopy overhangs above player
    const tents = [
      { x: 1200, y: 940 }, // North Main TPS 01
      { x: 1200, y: 1460 }, // South TPS 02
      { x: 760, y: 1200 }, // West TPS 03
      { x: 1640, y: 1200 }, // East TPS 04
    ];

    tents.forEach(({ x, y }) => {
      const tent = this.obstaclesGroup.create(x, y, ASSET_KEYS.PROP_TENT);
      // Collider box at the bottom base
      tent.body.setSize(100, 32);
      tent.body.setOffset(14, 48);
      tent.setDepth(y + 36);
      tent.refreshBody();
      this.propsList.push(tent);

      // Store obstacle bounding box for spawn validation
      this.obstacleBoxes.push({
        minX: x - 50,
        maxX: x + 50,
        minY: y + 8,
        maxY: y + 40,
        radius: 45,
      });
    });

    // 2. Campaign Billboards (Baliho) (80x100)
    // Wood frame poles at base collide
    const balihos = [
      { x: 1050, y: 1070 },
      { x: 1350, y: 1070 },
      { x: 1050, y: 1330 },
      { x: 1350, y: 1330 },
      { x: 500, y: 1100 },
      { x: 1900, y: 1100 },
      { x: 1200, y: 500 },
      { x: 1200, y: 1900 },
    ];

    balihos.forEach(({ x, y }) => {
      const baliho = this.obstaclesGroup.create(x, y, ASSET_KEYS.PROP_BALIHO);
      baliho.body.setSize(56, 20);
      baliho.body.setOffset(12, 78);
      baliho.setDepth(y + 40);
      baliho.refreshBody();
      this.propsList.push(baliho);

      this.obstacleBoxes.push({
        minX: x - 28,
        maxX: x + 28,
        minY: y + 28,
        maxY: y + 48,
        radius: 30,
      });
    });

    // 3. Shaded Trees & Foliage Groves (64x80)
    // Only tree trunk base collides, leaves canopy renders above characters
    const trees = [
      // North-West Grove
      { x: 350, y: 350 }, { x: 500, y: 300 }, { x: 680, y: 420 },
      { x: 450, y: 600 }, { x: 320, y: 750 }, { x: 600, y: 780 }, { x: 820, y: 520 },
      // North-East Grove
      { x: 1600, y: 350 }, { x: 1800, y: 280 }, { x: 2050, y: 400 },
      { x: 1750, y: 550 }, { x: 1950, y: 700 }, { x: 1620, y: 780 },
      // South-West Grove
      { x: 350, y: 1650 }, { x: 520, y: 1800 }, { x: 720, y: 1680 },
      { x: 400, y: 2050 }, { x: 650, y: 2020 }, { x: 820, y: 1850 },
      // South-East Grove
      { x: 1650, y: 1650 }, { x: 1850, y: 1800 }, { x: 2050, y: 1680 },
      { x: 1700, y: 2000 }, { x: 1950, y: 2050 }, { x: 1550, y: 1880 },
    ];

    trees.forEach(({ x, y }) => {
      const tree = this.obstaclesGroup.create(x, y, ASSET_KEYS.PROP_TREE);
      tree.body.setSize(20, 16);
      tree.body.setOffset(22, 62);
      tree.setDepth(y + 36);
      tree.refreshBody();
      this.propsList.push(tree);

      this.obstacleBoxes.push({
        minX: x - 10,
        maxX: x + 10,
        minY: y + 22,
        maxY: y + 38,
        radius: 20,
      });
    });
  }

  setupColliders(player, enemiesGroup) {
    if (!this.scene) return;

    // Player collision with obstacles & borders
    if (player) {
      if (this.obstaclesGroup) {
        this.scene.physics.add.collider(player, this.obstaclesGroup);
      }
      if (this.bordersGroup) {
        this.scene.physics.add.collider(player, this.bordersGroup);
      }
    }

    // Enemies collision with obstacles & borders
    if (enemiesGroup) {
      if (this.obstaclesGroup) {
        this.scene.physics.add.collider(enemiesGroup, this.obstaclesGroup);
      }
      if (this.bordersGroup) {
        this.scene.physics.add.collider(enemiesGroup, this.bordersGroup);
      }
    }
  }

  isPositionBlocked(x, y, radius = 24) {
    // 1. Border clearance check
    const borderMargin = 64;
    if (
      x < borderMargin ||
      x > this.width - borderMargin ||
      y < borderMargin ||
      y > this.height - borderMargin
    ) {
      return true;
    }

    // 2. Obstacle box clearance check
    for (let i = 0; i < this.obstacleBoxes.length; i++) {
      const box = this.obstacleBoxes[i];
      // Expand box by test radius
      if (
        x >= box.minX - radius &&
        x <= box.maxX + radius &&
        y >= box.minY - radius &&
        y <= box.maxY + radius
      ) {
        return true;
      }
    }

    return false;
  }

  updateYDepth(player, enemiesGroup) {
    // Dynamic 2.5D Y-depth sorting
    if (player && player.active) {
      player.setDepth(player.y + 15);
    }

    if (enemiesGroup) {
      const children = enemiesGroup.getChildren();
      for (let i = 0; i < children.length; i++) {
        const enemy = children[i];
        if (enemy.active && !enemy.isDead) {
          enemy.setDepth(enemy.y + 15);
        }
      }
    }
  }

  destroy() {
    if (this.bordersGroup) {
      this.bordersGroup.clear(true, true);
      this.bordersGroup = null;
    }
    if (this.obstaclesGroup) {
      this.obstaclesGroup.clear(true, true);
      this.obstaclesGroup = null;
    }
    if (this.roadTiles) {
      for (let i = 0; i < this.roadTiles.length; i++) {
        if (this.roadTiles[i]?.destroy) this.roadTiles[i].destroy();
      }
      this.roadTiles = [];
    }
    if (this.propsList) {
      for (let i = 0; i < this.propsList.length; i++) {
        if (this.propsList[i]?.destroy) this.propsList[i].destroy();
      }
      this.propsList = [];
    }
    this.obstacleBoxes = [];
    if (this.ground) {
      this.ground.destroy();
      this.ground = null;
    }
  }
}
