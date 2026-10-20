import Phaser from "phaser";
import BootScene from "../game/scenes/BootScene.js";
import SurvivalScene from "../game/scenes/SurvivalScene.js";
import { ARENA_CONFIG } from "./arenaConfig.js";

export { ARENA_CONFIG };

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export function getPhaserConfig(parent, events = {}) {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#1e293b",
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [
      new BootScene(events),
      new SurvivalScene(events),
    ],
  };
}
