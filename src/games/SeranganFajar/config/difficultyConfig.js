import { SPAWNER_CONFIG } from "../entities/enemies/EnemyStats.js";

export const DEFAULT_DIFFICULTY = "medium";

// Medium keeps combat/economy baseline; pressure changes cadence and aimed lanes only.
export const DIFFICULTY_CONFIG = Object.freeze({
  id: DEFAULT_DIFFICULTY,
  label: "Medium",
  multipliers: Object.freeze({ hp: 1, damage: 1, speed: 1, xp: 1 }),
  bossMilestoneEvery: 3,
  maxActiveEnemies: SPAWNER_CONFIG.MAX_ACTIVE_ENEMIES,
  phases: Object.freeze([
    Object.freeze({ startsAt: 0, pacing: 1, meleeWeight: 0.65, tankCumulativeWeight: 0.85 }),
    Object.freeze({ startsAt: 180, pacing: 1.3, meleeWeight: 0.5, tankCumulativeWeight: 0.78 }),
    Object.freeze({ startsAt: 300, pacing: 1.6, meleeWeight: 0.4, tankCumulativeWeight: 0.68 }),
  ]),
  rangedBurst: Object.freeze({ startsAt: 180, windupMs: 900, shotCount: 3, spreadRadians: 0.12 }),
});

export function getDifficultyPhase(seconds = 0) {
  const phases = DIFFICULTY_CONFIG.phases;
  return seconds >= phases[2].startsAt ? phases[2] : seconds >= phases[1].startsAt ? phases[1] : phases[0];
}
