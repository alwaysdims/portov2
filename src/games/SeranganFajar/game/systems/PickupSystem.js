// PickupSystem.js — Item pooling, magnet attraction, pickup collisions, and floating feedback
// ponytail: single items group; spatial hash grid planned in Tahap 14 for 200+ simultaneous drops.

import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { audioManager } from "../audio/AudioManager.js";

export const ITEM_TYPES = {
  SUARA: "suara",
  DANA: "dana",
  HEALTH: "health",
  MANA: "mana",
  FAJAR_ENERGY: "fajar_energy",
};

export class PickupSystem {
  constructor(scene) {
    this.scene = scene;
    this.itemsGroup = scene.physics.add.group({
      maxSize: 60,
    });
    this.processedItems = new Set();
    this.itemsCollected = 0;
    this.itemLifespanMs = 25000; // 25s auto-despawn
    this.activeFeedbackTexts = [];
  }

  recycleItem(item) {
    if (!item) return;
    item.isCollected = true;
    item.setActive(false);
    item.setVisible(false);
    if (item.body) {
      item.body.enable = false;
      item.body.setVelocity(0, 0);
    }
  }

  spawnItem(itemType, x, y, value) {
    if (!this.scene) return null;

    let textureKey;
    switch (itemType) {
      case ITEM_TYPES.SUARA:
        textureKey = ASSET_KEYS.ITEM_SUARA;
        break;
      case ITEM_TYPES.DANA:
        textureKey = ASSET_KEYS.ITEM_DANA;
        break;
      case ITEM_TYPES.HEALTH:
        textureKey = ASSET_KEYS.ITEM_HEALTH;
        break;
      case ITEM_TYPES.MANA:
        textureKey = ASSET_KEYS.ITEM_MANA;
        break;
      case ITEM_TYPES.FAJAR_ENERGY:
        textureKey = ASSET_KEYS.ITEM_FAJAR_ENERGY;
        break;
      default:
        textureKey = ASSET_KEYS.ITEM_SUARA;
        break;
    }

    let item = this.itemsGroup.getFirstDead(false);
    if (!item) {
      if (this.itemsGroup.getLength() < 60) {
        item = this.itemsGroup.create(x, y, textureKey);
      } else {
        // Recycle oldest uncollected item if capacity reached
        const children = this.itemsGroup.getChildren();
        item = children.find(c => c.active && !c.isCollected) || children[0];
      }
    }
    if (!item) return null;

    item.setTexture(textureKey);
    item.setPosition(x, y);
    item.setActive(true);
    item.setVisible(true);
    item.setAlpha(1);
    item.setDepth(4);
    item.itemType = itemType;
    item.itemValue = value;
    item.isCollected = false;
    item.spawnTime = this.scene.time?.now || Date.now();

    if (item.body) {
      item.body.enable = true;
      item.body.setAllowGravity(false);
      item.body.setImmovable(false);
      item.body.setCircle(9);
      item.body.setVelocity(0, 0);
    }

    // Spawn pop animation
    item.setScale(0);
    this.scene.tweens.add({
      targets: item,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    return item;
  }

  update(time, delta, player) {
    if (this.scene.isPaused || this.scene.isLevelUpPaused || !player || !this.scene.stats?.isAlive()) {
      // Freeze item velocities when paused or dead
      const children = this.itemsGroup.getChildren();
      for (let i = 0; i < children.length; i++) {
        const item = children[i];
        if (item.active && item.body) {
          item.setVelocity(0, 0);
        }
      }
      return;
    }

    const pickupRadius = this.scene.stats?.pickupRadius ?? 45;
    const magnetRadius = this.scene.stats?.magnetRadius ?? 140;
    const pickupRadiusSq = pickupRadius * pickupRadius;
    const magnetRadiusSq = magnetRadius * magnetRadius;

    const children = this.itemsGroup.getChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      const item = children[i];
      if (!item.active || item.isCollected) continue;

      // Expiration check (25s) with flashing warning in last 5s
      const age = time - (item.spawnTime || time);
      if (age >= this.itemLifespanMs) {
        this.recycleItem(item);
        continue;
      }
      if (age >= this.itemLifespanMs - 5000) {
        item.setAlpha(Math.sin(time * 0.02) > 0 ? 0.35 : 0.9);
      } else if (item.alpha !== 1) {
        item.setAlpha(1.0);
      }

      const dx = player.x - item.x;
      const dy = player.y - item.y;
      const distSq = dx * dx + dy * dy;

      // 1. Pickup Check
      if (distSq <= pickupRadiusSq) {
        this.collectItem(item, player);
        continue;
      }

      // 2. Magnet Attraction Check
      if (distSq <= magnetRadiusSq) {
        const dist = Math.sqrt(distSq);
        const magnetSpeed = 340; // px/s
        if (dist > 0.1 && item.body) {
          item.setVelocity((dx / dist) * magnetSpeed, (dy / dist) * magnetSpeed);
        }
      } else if (item.body) {
        // Slow down if outside magnet radius
        item.setVelocity(item.body.velocity.x * 0.85, item.body.velocity.y * 0.85);
      }
    }
  }

  collectItem(item, player) {
    if (!item || item.isCollected) return;

    item.isCollected = true;
    if (item.body) {
      item.body.enable = false;
    }

    const stats = this.scene.stats;
    let feedbackText = "";
    let feedbackColor = "#ffffff";
    let sparkColor = 0xffffff;

    switch (item.itemType) {
      case ITEM_TYPES.SUARA: {
        const result = stats?.addXp(item.itemValue);
        this.scene?.addScore?.(item.itemValue * 2);
        feedbackText = `+${item.itemValue} Suara`;
        feedbackColor = "#4ade80"; // green
        sparkColor = 0x4ade80;
        audioManager.playPickupXp();
        if (result?.leveledUp && this.scene.handleLevelUpTrigger) {
          this.scene.handleLevelUpTrigger(result.currentLevel);
        }
        break;
      }

      case ITEM_TYPES.DANA:
        stats?.addCoins(item.itemValue);
        this.scene?.addScore?.(item.itemValue * 25);
        feedbackText = `+${item.itemValue} Koin`;
        feedbackColor = "#facc15"; // gold yellow
        sparkColor = 0xfacc15;
        audioManager.playPickupCoin();
        break;

      case ITEM_TYPES.HEALTH: {
        const healed = stats?.heal(item.itemValue || 150);
        this.scene?.addScore?.(10);
        feedbackText = `+${healed || item.itemValue} HP`;
        feedbackColor = "#f87171"; // red
        sparkColor = 0xf87171;
        audioManager.playPickupXp();
        break;
      }

      case ITEM_TYPES.MANA: {
        const restored = stats?.restoreMana(item.itemValue || 30);
        this.scene?.addScore?.(10);
        feedbackText = `+${restored || item.itemValue} MP`;
        feedbackColor = "#38bdf8"; // blue
        sparkColor = 0x38bdf8;
        audioManager.playPickupXp();
        break;
      }

      case ITEM_TYPES.FAJAR_ENERGY: {
        const added = stats?.addEnergy(item.itemValue || 15);
        this.scene?.addScore?.(15);
        feedbackText = `+${added || item.itemValue} Energi`;
        feedbackColor = "#fbbf24"; // amber gold
        sparkColor = 0xfbbf24;
        audioManager.playPickupXp();
        break;
      }

      default:
        break;
    }

    this.itemsCollected++;
    this.showFloatingFeedback(player.x, player.y - 20, feedbackText, feedbackColor);
    this.scene?.vfxManager?.spawnHitSparks(item.x, item.y, sparkColor, 4);

    // Shrink and recycle
    this.scene.tweens.add({
      targets: item,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 120,
      onComplete: () => {
        this.recycleItem(item);
      },
    });
  }

  showFloatingFeedback(x, y, text, color = "#ffffff") {
    if (!this.scene || !text) return;

    // Prune oldest feedback text if over capacity (max 8)
    while (this.activeFeedbackTexts.length >= 8) {
      const oldest = this.activeFeedbackTexts.shift();
      if (oldest?.active) oldest.destroy();
    }

    // Slight random offset to prevent overlap
    const offsetX = (Math.random() - 0.5) * 24;
    const txt = this.scene.add.text(x + offsetX, y, text, {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      color,
      stroke: "#0f172a",
      strokeThickness: 3,
    });
    txt.setOrigin(0.5);
    txt.setDepth(15);
    this.activeFeedbackTexts.push(txt);

    this.scene.tweens.add({
      targets: txt,
      y: y - 28,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => {
        const idx = this.activeFeedbackTexts.indexOf(txt);
        if (idx !== -1) {
          this.activeFeedbackTexts.splice(idx, 1);
        }
        txt.destroy();
      },
    });
  }

  clearAll() {
    if (this.activeFeedbackTexts) {
      for (let i = 0; i < this.activeFeedbackTexts.length; i++) {
        const txt = this.activeFeedbackTexts[i];
        if (txt?.active) txt.destroy();
      }
      this.activeFeedbackTexts = [];
    }
    if (this.itemsGroup) {
      this.itemsGroup.clear(true, true);
    }
    this.processedItems.clear();
    this.itemsCollected = 0;
  }

  destroy() {
    this.clearAll();
    if (this.itemsGroup) {
      this.itemsGroup.destroy(true);
      this.itemsGroup = null;
    }
    this.scene = null;
  }
}
