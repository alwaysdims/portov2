// bossConfig.js — Configuration for Level-Up Boss encounters in Serangan Fajar: The Last Stand
// Per user update document: Boss spawns on every level up with unique mechanics and major reward drops.

export const BOSS_ROSTER = [
  {
    level: 1,
    id: "naga_fajar",
    name: "NAGA FAJAR",
    subtitle: "Simbol Kekuatan Kebenaran",
    description: "Bangkit di tengah kegelapan disinformasi untuk menguji tekad sang calon.",
    hp: 1500, // Balanced: ~40-50 shots, ideal 20s duel
    damage: 25,
    speed: 75, // Comfortable kite speed (Wowo is 220)
    attackInterval: 2200, // ms between pattern attacks
    scoreValue: 1500,
    rageHpThreshold: 0.50, // triggers at 50% HP
    rageSpeedBonus: 20,
    rageAttackInterval: 1600,
    bodySize: { width: 75, height: 65 },
    bodyOffset: { x: 14, y: 15 },
    attackPatterns: {
      slashAreaRadius: 85,
      paperProjectileCountPhase1: 3,
      paperProjectileCountPhase2: 5,
      paperProjectileSpeed: 190,
      summonCountPhase1: 1,
      summonCountPhase2: 1,
    },
    drops: {
      suaraCount: 5,
      suaraValue: 35, // 175 XP total
      danaCount: 6,
      danaValue: 2,  // 12 Koin
      healthCount: 2,
      manaCount: 2,
      fajarEnergyCount: 2,
    },
  },
  {
    level: 2,
    id: "mega_bot_kampanye",
    name: "MEGA BOT KAMPANYE",
    subtitle: "Mesin Pabrik Opini Massal",
    description: "Robot perang propaganda bertenaga kecerdasan buatan hitam.",
    hp: 2800,
    damage: 35,
    speed: 70,
    attackInterval: 2400,
    scoreValue: 3000,
    rageHpThreshold: 0.45,
    rageSpeedBonus: 20,
    rageAttackInterval: 1700,
    bodySize: { width: 85, height: 85 },
    bodyOffset: { x: 10, y: 10 },
  },
  {
    level: 3,
    id: "raja_hoaks",
    name: "RAJA HOAKS",
    subtitle: "Dalang Manipulasi Persepsi",
    description: "Penyihir bayangan pemutarbalik fakta dan pembuat fitnah.",
    hp: 4500,
    damage: 45,
    speed: 85,
    attackInterval: 2200,
    scoreValue: 5000,
    rageHpThreshold: 0.50,
    rageSpeedBonus: 25,
    rageAttackInterval: 1500,
    bodySize: { width: 75, height: 80 },
    bodyOffset: { x: 10, y: 10 },
  },
  {
    level: 4,
    id: "naga_merah",
    name: "NAGA MERAH",
    subtitle: "Kobaran Api Kepentingan",
    description: "Naga api legendaris pembakar etika pemilu.",
    hp: 6500,
    damage: 55,
    speed: 95,
    attackInterval: 2000,
    scoreValue: 8000,
    rageHpThreshold: 0.50,
    rageSpeedBonus: 25,
    rageAttackInterval: 1400,
    bodySize: { width: 90, height: 85 },
    bodyOffset: { x: 10, y: 10 },
  },
  {
    level: 5,
    id: "sembilan_naga",
    name: "9 NAGA",
    subtitle: "Oligarki Puncak Penguasa Fajar",
    description: "Entitas sembilan kepala pemegang mandat bayangan terakhir.",
    hp: 9500,
    damage: 70,
    speed: 105,
    attackInterval: 1800,
    scoreValue: 15000,
    rageHpThreshold: 0.50,
    rageSpeedBonus: 30,
    rageAttackInterval: 1200,
    bodySize: { width: 110, height: 100 },
    bodyOffset: { x: 15, y: 15 },
  },
];

export function getBossConfigForLevel(bossIndex = 1) {
  const index = Math.max(0, Math.min(Math.floor(bossIndex) - 1, BOSS_ROSTER.length - 1));
  return BOSS_ROSTER[index];
}
