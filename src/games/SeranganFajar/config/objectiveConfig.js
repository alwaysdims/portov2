// objectiveConfig.js — Configuration for Dynamic Arena Objectives in Serangan Fajar: The Last Stand
// PRD Tahap 19: Dynamic objectives to break repetitive kiting, integrated with RunDirector.

export const OBJECTIVE_TIMING = Object.freeze({ firstAt: 70, cooldown: 110, retrySeconds: 2, feedbackSeconds: 3.5 });

export const OBJECTIVE_TYPES = {
  BERSIHKAN_HOAKS: "bersihkan_hoaks",
  AMANKAN_KOTAK: "amankan_kotak",
};

export const OBJECTIVE_CONFIGS = {
  [OBJECTIVE_TYPES.BERSIHKAN_HOAKS]: {
    id: OBJECTIVE_TYPES.BERSIHKAN_HOAKS,
    title: "BERSIHKAN HOAKS",
    subtitle: "Tangkal Kampanye Hitam",
    description: "Kalahkan 5 Penyebar Hoaks sebelum disinformasi menyebar!",
    targetKills: 5,
    durationSeconds: 35,
    rewardXp: 300,
    rewardScore: 500,
  },
  [OBJECTIVE_TYPES.AMANKAN_KOTAK]: {
    id: OBJECTIVE_TYPES.AMANKAN_KOTAK,
    title: "AMANKAN KOTAK SUARA",
    subtitle: "Jaga Keamanan Pemilu",
    description: "Bertahan dalam zona Kotak Suara selama 12 detik!",
    holdDuration: 12,
    timeLimitSeconds: 40,
    zoneRadius: 90,
    rewardXp: 400,
    rewardScore: 600,
    rewardPotions: true,
  },
};
