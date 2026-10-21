// DropSystem.js — Calculates and coordinates item drop tables upon enemy defeat
// ponytail: hardcoded drop rates; external wave-loot config table planned in Tahap 13.

import { ITEM_TYPES } from "./PickupSystem.js";

export const ENEMY_DROP_TABLES = {
  "Tim Amplop": {
    suara: { chance: 1.0, value: 15 },
    dana: { chance: 0.25, value: 1 },
    health: { chance: 0.06, value: 150 },
    mana: { chance: 0.06, value: 30 },
    fajar_energy: { chance: 0.05, value: 15 },
  },
  "Bot Kampanye": {
    suara: { chance: 1.0, value: 40 },
    dana: { chance: 0.60, value: 2 },
    health: { chance: 0.18, value: 150 },
    mana: { chance: 0.18, value: 30 },
    fajar_energy: { chance: 0.15, value: 15 },
  },
  "Penyebar Hoaks": {
    suara: { chance: 1.0, value: 25 },
    dana: { chance: 0.35, value: 1 },
    health: { chance: 0.10, value: 150 },
    mana: { chance: 0.10, value: 30 },
    fajar_energy: { chance: 0.10, value: 15 },
  },
  tim_amplop: {
    suara: { chance: 1.0, value: 15 },
    dana: { chance: 0.25, value: 1 },
    health: { chance: 0.06, value: 150 },
    mana: { chance: 0.06, value: 30 },
    fajar_energy: { chance: 0.05, value: 15 },
  },
  bot_kampanye: {
    suara: { chance: 1.0, value: 40 },
    dana: { chance: 0.60, value: 2 },
    health: { chance: 0.18, value: 150 },
    mana: { chance: 0.18, value: 30 },
    fajar_energy: { chance: 0.15, value: 15 },
  },
  penyebar_hoaks: {
    suara: { chance: 1.0, value: 25 },
    dana: { chance: 0.35, value: 1 },
    health: { chance: 0.10, value: 150 },
    mana: { chance: 0.10, value: 30 },
    fajar_energy: { chance: 0.10, value: 15 },
  },
  naga_kecil: {
    suara: { chance: 1.0, value: 15 },
    dana: { chance: 0.50, value: 1 },
    health: { chance: 0.35, value: 150 },
    mana: { chance: 0.35, value: 30 },
    fajar_energy: { chance: 0.20, value: 15 },
  },
  "Naga Kecil": {
    suara: { chance: 1.0, value: 15 },
    dana: { chance: 0.50, value: 1 },
    health: { chance: 0.35, value: 150 },
    mana: { chance: 0.35, value: 30 },
    fajar_energy: { chance: 0.20, value: 15 },
  },
  DEFAULT: {
    suara: { chance: 1.0, value: 15 },
    dana: { chance: 0.20, value: 1 },
    health: { chance: 0.05, value: 150 },
    mana: { chance: 0.05, value: 30 },
    fajar_energy: { chance: 0.05, value: 15 },
  },
};

export class DropSystem {
  constructor(scene, pickupSystem) {
    this.scene = scene;
    this.pickupSystem = pickupSystem;
    this.processedEnemyIds = new Set();
  }

  handleEnemyKilled(eventData) {
    if (!eventData || !eventData.id) return;

    // Keep each instance ID for this run; evicting IDs lets a delayed duplicate drop twice.
    if (this.processedEnemyIds.has(eventData.id)) return;
    this.processedEnemyIds.add(eventData.id);

    const table =
      ENEMY_DROP_TABLES[eventData.enemyName] ||
      ENEMY_DROP_TABLES[eventData.enemyType] ||
      ENEMY_DROP_TABLES.DEFAULT;
    const x = eventData.x;
    const y = eventData.y;

    if (!this.pickupSystem) return;

    // 1. Suara (XP)
    if (Math.random() <= table.suara.chance) {
      this.pickupSystem.spawnItem(ITEM_TYPES.SUARA, x, y, table.suara.value);
    }

    // 2. Dana (Koin)
    if (Math.random() <= table.dana.chance) {
      const offsetX = (Math.random() - 0.5) * 16;
      const offsetY = (Math.random() - 0.5) * 16;
      this.pickupSystem.spawnItem(ITEM_TYPES.DANA, x + offsetX, y + offsetY, table.dana.value);
    }

    // 3. Health Potion
    if (Math.random() <= table.health.chance) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      this.pickupSystem.spawnItem(ITEM_TYPES.HEALTH, x + offsetX, y + offsetY, table.health.value);
    }

    // 4. Mana Potion
    if (Math.random() <= table.mana.chance) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      this.pickupSystem.spawnItem(ITEM_TYPES.MANA, x + offsetX, y + offsetY, table.mana.value);
    }

    // 5. Fajar Energy Orb
    if (Math.random() <= table.fajar_energy.chance) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      this.pickupSystem.spawnItem(ITEM_TYPES.FAJAR_ENERGY, x + offsetX, y + offsetY, table.fajar_energy.value);
    }
  }

  reset() {
    this.processedEnemyIds.clear();
  }

  destroy() {
    this.reset();
  }
}
