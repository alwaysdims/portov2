import Phaser from "phaser";
import { getPhaserConfig } from "../config/gameConfig.js";

/**
 * Creates and initializes a Phaser Game instance for Serangan Fajar.
 * @param {HTMLElement} parent - DOM container element
 * @param {Object} events - React communication callbacks
 * @returns {Phaser.Game}
 */
export function createSeranganFajarGame(parent, events = {}) {
  const config = getPhaserConfig(parent, events);
  return new Phaser.Game(config);
}
