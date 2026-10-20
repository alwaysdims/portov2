// EnemyStats.js — Baseline enemy statistics and configuration per PRD Section 13
// ponytail: static wave weights initially; extend with dynamic minute-based wave director in Tahap 4/5.

export const ENEMY_TYPES = {
  TIM_AMPLOP: "tim_amplop",
  BOT_KAMPANYE: "bot_kampanye",
  PENYEBAR_HOAKS: "penyebar_hoaks",
};

export const ENEMY_CONFIGS = {
  [ENEMY_TYPES.TIM_AMPLOP]: {
    id: ENEMY_TYPES.TIM_AMPLOP,
    name: "Tim Amplop",
    role: "melee_swarm",
    hp: 60,
    speed: 140,
    damage: 15,
    attackInterval: 800, // ms between melee hits
    attackRange: 32, // px collision reach
    scoreValue: 50,
    bodySize: { width: 22, height: 24 },
    bodyOffset: { x: 7, y: 10 },
  },
  [ENEMY_TYPES.BOT_KAMPANYE]: {
    id: ENEMY_TYPES.BOT_KAMPANYE,
    name: "Bot Kampanye",
    role: "tank",
    hp: 200,
    speed: 90,
    damage: 30,
    attackInterval: 1200, // ms between tank heavy hits
    attackRange: 42,
    scoreValue: 150,
    bodySize: { width: 34, height: 34 },
    bodyOffset: { x: 7, y: 10 },
  },
  [ENEMY_TYPES.PENYEBAR_HOAKS]: {
    id: ENEMY_TYPES.PENYEBAR_HOAKS,
    name: "Penyebar Hoaks",
    role: "ranged_shooter",
    hp: 80,
    speed: 110,
    damage: 10,
    shootInterval: 2000, // ms between hoax projectile shots
    idealDistance: 220, // preferred distance from player
    retreatDistance: 170, // retreat threshold
    projectileSpeed: 220, // px/s
    projectileLifetime: 2500, // ms before bullet auto-destructs
    scoreValue: 100,
    bodySize: { width: 22, height: 26 },
    bodyOffset: { x: 7, y: 8 },
  },
};

export const SPAWNER_CONFIG = {
  MAX_ACTIVE_ENEMIES: 35,
  BASE_SPAWN_INTERVAL: 1800, // ms between spawn waves
  MIN_SPAWN_DISTANCE: 420, // px from Wowo (outside screen center)
  MAX_SPAWN_DISTANCE: 620, // px from Wowo (near screen perimeter)
};
