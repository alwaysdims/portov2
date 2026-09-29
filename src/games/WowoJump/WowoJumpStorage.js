// Storage management for WowoJump: High score, Local Leaderboard, Coins & Cosmetics

import defaultPreview from "./assets/skins/wowo-default.png";
import patriotPreview from "./assets/skins/wowo-patriot.png";
import safariPreview from "./assets/skins/wowo-safari.png";
import goldPreview from "./assets/skins/wowo-gold.png";
import cyberPreview from "./assets/skins/wowo-cyber.png";

const KEYS = {
  HIGH_SCORE: "wowoJumpHighScore",
  LEGACY_HIGH_SCORE: "wowojump-high-score",
  LEADERBOARD: "wowoJumpLeaderboard",
  COINS: "wowoJumpCoins",
  SKINS: "wowoJumpSkins",
  SELECTED_SKIN: "wowoJumpSelectedSkin",
};

export const WOWO_SKINS = [
  {
    id: "default",
    name: "Wowo Klasik",
    cost: 0,
    description: "Jas formal hitam kenegaraan",
    color: "#334155",
    preview: defaultPreview,
  },
  {
    id: "patriot",
    name: "Wowo Patriot",
    cost: 40,
    description: "Jas putih bersih & dasi emas berkharisma",
    color: "#e2e8f0",
    preview: patriotPreview,
  },
  {
    id: "safari",
    name: "Wowo Safari Khaki",
    cost: 60,
    description: "Setelan safari krem taktis andalan lapangan",
    color: "#d97706",
    preview: safariPreview,
  },
  {
    id: "gold",
    name: "Wowo Sultan Emas",
    cost: 80,
    description: "Jas emas berkilau sultan Kopdes",
    color: "#eab308",
    preview: goldPreview,
  },
  {
    id: "cyber",
    name: "Wowo Cyber Neon",
    cost: 120,
    description: "Setelan futuristik aksen cyan & dasi magenta",
    color: "#06b6d4",
    preview: cyberPreview,
  },
];

export const COSMETIC_SHOP = WOWO_SKINS;

// In-memory fallback if localStorage is unavailable/blocked
let memoryLeaderboard = [];
let memoryHighScore = 0;
let memoryCoins = 0;
let memorySkins = ["default"];
let memorySelectedSkin = "default";

export function readHighScore() {
  try {
    const raw = localStorage.getItem(KEYS.HIGH_SCORE) || localStorage.getItem(KEYS.LEGACY_HIGH_SCORE);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : memoryHighScore;
  } catch {
    return memoryHighScore;
  }
}

export function saveHighScore(score) {
  const current = readHighScore();
  const next = Math.max(current, score);
  try {
    localStorage.setItem(KEYS.HIGH_SCORE, String(next));
    localStorage.setItem(KEYS.LEGACY_HIGH_SCORE, String(next));
  } catch {
    memoryHighScore = next;
  }
  return next;
}

export function readLeaderboard() {
  try {
    const raw = localStorage.getItem(KEYS.LEADERBOARD);
    if (!raw) return memoryLeaderboard;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 10);
    }
    return memoryLeaderboard;
  } catch {
    return memoryLeaderboard;
  }
}

export function saveLeaderboardEntry({ score, coins, height = 0 }) {
  if (typeof score !== "number" || score < 0) return { rank: null, entries: readLeaderboard() };

  let current;
  try {
    current = readLeaderboard();
  } catch {
    current = [];
  }

  const newEntry = {
    id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    score: Math.floor(score),
    coins: Math.floor(coins || 0),
    height: Math.floor(height || 0),
    date: Date.now(),
  };

  const updated = [...current, newEntry]
    .sort((a, b) => b.score - a.score || b.coins - a.coins)
    .slice(0, 10);

  try {
    localStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(updated));
  } catch {
    memoryLeaderboard = updated;
  }

  // Find 1-based rank if inside top 10
  const rankIndex = updated.findIndex((entry) => entry.id === newEntry.id);
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;

  return {
    rank,
    entry: newEntry,
    entries: updated,
  };
}

// Total Coins Balance for Shop
export function readCoinBalance() {
  try {
    const raw = localStorage.getItem(KEYS.COINS);
    const num = Number(raw);
    return Number.isFinite(num) ? num : memoryCoins;
  } catch {
    return memoryCoins;
  }
}

export function addCoinsToBalance(amount) {
  if (!amount || amount <= 0) return readCoinBalance();
  const current = readCoinBalance();
  const next = current + Math.floor(amount);
  try {
    localStorage.setItem(KEYS.COINS, String(next));
  } catch {
    memoryCoins = next;
  }
  return next;
}

// Skins ownership and selection
export function readSkins() {
  try {
    const raw = localStorage.getItem(KEYS.SKINS);
    if (!raw) return memorySkins;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : ["default"];
  } catch {
    return memorySkins;
  }
}

export function readSelectedSkin() {
  try {
    return localStorage.getItem(KEYS.SELECTED_SKIN) || memorySelectedSkin;
  } catch {
    return memorySelectedSkin;
  }
}

export function purchaseSkin(skinId) {
  const item = COSMETIC_SHOP.find((s) => s.id === skinId);
  if (!item) return { success: false, message: "Item tidak ditemukan" };

  const owned = readSkins();
  if (owned.includes(skinId)) {
    return { success: false, message: "Sudah dimiliki" };
  }

  const balance = readCoinBalance();
  if (balance < item.cost) {
    return { success: false, message: "Koin tidak cukup!" };
  }

  const nextBalance = balance - item.cost;
  const nextOwned = [...owned, skinId];

  try {
    localStorage.setItem(KEYS.COINS, String(nextBalance));
    localStorage.setItem(KEYS.SKINS, JSON.stringify(nextOwned));
    localStorage.setItem(KEYS.SELECTED_SKIN, skinId);
  } catch {
    memoryCoins = nextBalance;
    memorySkins = nextOwned;
    memorySelectedSkin = skinId;
  }

  return { success: true, balance: nextBalance, owned: nextOwned, selected: skinId };
}

export function selectSkin(skinId) {
  const owned = readSkins();
  if (!owned.includes(skinId) && skinId !== "default") {
    return false;
  }
  try {
    localStorage.setItem(KEYS.SELECTED_SKIN, skinId);
  } catch {
    memorySelectedSkin = skinId;
  }
  return true;
}
