import Phaser from "phaser";
import WowoJumpScene from "./WowoJumpScene";

export const GAME_WIDTH = 390;
export const GAME_HEIGHT = 650;

export function createWowoJumpGame(parent, events) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#4f8eae",
    physics: {
      default: "arcade",
      arcade: { gravity: { y: 1050 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    scene: [new WowoJumpScene(events)],
  });
}
