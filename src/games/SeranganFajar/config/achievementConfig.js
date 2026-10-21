// achievementConfig.js — Definition and conditions for Replayability Achievements
// PRD Tahap 19: Replayability through meaningful gameplay achievements.

export const ACHIEVEMENTS = [
  {
    id: "pembasmi_hoaks",
    title: "Pembasmi Hoaks",
    description: "Kalahkan 25 Penyebar Hoaks secara kumulatif.",
    icon: "Megaphone",
    category: "combat",
  },
  {
    id: "tak_terkalahkan",
    title: "Tak Terkalahkan",
    description: "Bertahan hidup selama 5 menit (300 detik) dalam satu run.",
    icon: "Shield",
    category: "survival",
  },
  {
    id: "master_surat_suara",
    title: "Master Surat Suara",
    description: "Buka evolusi Badai Surat Suara dalam satu run.",
    icon: "Sparkles",
    category: "evolution",
  },
  {
    id: "penakluk_fajar",
    title: "Penakluk Fajar",
    description: "Kalahkan Boss Naga Fajar.",
    icon: "Trophy",
    category: "boss",
  },
  {
    id: "pengawal_demokrasi",
    title: "Pengawal Demokrasi",
    description: "Selesaikan Dynamic Objective Amankan Kotak Suara.",
    icon: "Lock",
    category: "objective",
  },
  {
    id: "raja_combo",
    title: "Raja Combo",
    description: "Capai 20x Combo Kills berturut-turut tanpa terputus.",
    icon: "Flame",
    category: "combat",
  },
];
