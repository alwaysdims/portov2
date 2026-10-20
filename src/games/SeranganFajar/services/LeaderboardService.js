// LeaderboardService.js — LocalStorage Top 10 leaderboard & High Score manager for Serangan Fajar: The Last Stand
// PRD Section 18: key 'seranganFajarLeaderboard', high score 'seranganFajarHighScore', Top 10 entries max.

export const LEADERBOARD_STORAGE_KEY = "seranganFajarLeaderboard";
export const HIGH_SCORE_STORAGE_KEY = "seranganFajarHighScore";
export const MAX_LEADERBOARD_ENTRIES = 10;
export const DEFAULT_PLAYER_NAME = "WOWO";

// In-memory fallback if localStorage is disabled, throws, or security-restricted
let memoryLeaderboard = [];
let memoryHighScore = 0;

/**
 * Format seconds into MM:SS string
 * @param {number} totalSeconds
 * @returns {string} e.g. "02:15"
 */
export function formatSurvivalTime(totalSeconds = 0) {
  const secs = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
}

/**
 * Validates and sanitizes player name or initials
 * @param {string} rawName
 * @returns {{ valid: boolean, error?: string, sanitized: string }}
 */
export function validatePlayerName(rawName) {
  if (typeof rawName !== "string") {
    return { valid: false, error: "Nama pemain harus berupa teks", sanitized: DEFAULT_PLAYER_NAME };
  }

  // Remove potential dangerous characters (HTML tags/control chars), allow letters, numbers, spaces, dots, dashes, underscores
  const cleaned = rawName.replace(/[<>'"/\\&]/g, "").trim();
  if (cleaned.length === 0) {
    return { valid: false, error: "Nama atau inisial tidak boleh kosong", sanitized: DEFAULT_PLAYER_NAME };
  }

  if (cleaned.length > 12) {
    return { valid: false, error: "Nama maksimal 12 karakter", sanitized: cleaned.slice(0, 12) };
  }

  return { valid: true, sanitized: cleaned };
}

/**
 * Reads high score safely from LocalStorage
 * @returns {number}
 */
export function readHighScore() {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(HIGH_SCORE_STORAGE_KEY) : null;
    if (raw !== null && raw !== undefined) {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return Math.floor(parsed);
      }
    }
    return memoryHighScore;
  } catch {
    return memoryHighScore;
  }
}

/**
 * Saves high score safely to LocalStorage
 * @param {number} score
 * @returns {number} new high score
 */
export function saveHighScore(score) {
  const current = readHighScore();
  const next = Math.max(current, Math.floor(Number(score) || 0));
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(next));
    }
  } catch {
    // Fallback in-memory
  }
  memoryHighScore = next;
  return next;
}

/**
 * Comparator for sorting leaderboard entries
 * 1. Score descending
 * 2. Survival time descending
 * 3. Timestamp ascending (earlier record wins ties)
 */
export function compareEntries(a, b) {
  const scoreDiff = (b.score || 0) - (a.score || 0);
  if (scoreDiff !== 0) return scoreDiff;

  const timeDiff = (b.survivalTime || 0) - (a.survivalTime || 0);
  if (timeDiff !== 0) return timeDiff;

  return (a.timestamp || 0) - (b.timestamp || 0);
}

/**
 * Sanitizes and parses a single leaderboard item
 * @param {any} item
 * @returns {object|null}
 */
function sanitizeEntry(item) {
  if (!item || typeof item !== "object") return null;

  const score = Number(item.score);
  if (!Number.isFinite(score) || score < 0) return null;

  const survivalTime = Number(item.survivalTime);
  const validTime = Number.isFinite(survivalTime) && survivalTime >= 0 ? Math.floor(survivalTime) : 0;

  const nameVal = typeof item.playerName === "string" ? item.playerName.trim().slice(0, 12) : "";
  const playerName = nameVal.length > 0 ? nameVal : DEFAULT_PLAYER_NAME;

  return {
    id: typeof item.id === "string" && item.id.length > 0 ? item.id : `sf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    playerName,
    score: Math.floor(score),
    survivalTime: validTime,
    formattedTime: typeof item.formattedTime === "string" ? item.formattedTime : formatSurvivalTime(validTime),
    level: Math.max(1, Math.floor(Number(item.level) || 1)),
    enemiesKilled: Math.max(0, Math.floor(Number(item.enemiesKilled) || 0)),
    votesCollected: Math.max(0, Math.floor(Number(item.votesCollected) || 0)),
    fundsCollected: Math.max(0, Math.floor(Number(item.fundsCollected) || 0)),
    attacksFired: Math.max(0, Math.floor(Number(item.attacksFired) || 0)),
    timestamp: Number(item.timestamp) || Date.now(),
    date: typeof item.date === "string" ? item.date : new Date().toISOString(),
  };
}

/**
 * Reads and returns Top 10 leaderboard entries
 * @returns {Array<object>}
 */
export function readLeaderboard() {
  try {
    if (typeof localStorage === "undefined") {
      return [...memoryLeaderboard];
    }

    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (!raw) {
      return [...memoryLeaderboard];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [...memoryLeaderboard];
    }

    // Filter, sanitize, sort, and slice Top 10
    const validEntries = parsed
      .map(sanitizeEntry)
      .filter((e) => e !== null)
      .sort(compareEntries)
      .slice(0, MAX_LEADERBOARD_ENTRIES);

    memoryLeaderboard = validEntries;
    return validEntries;
  } catch {
    return [...memoryLeaderboard];
  }
}

/**
 * Checks whether a given score & survival time qualifies for Top 10
 * @param {number} score
 * @param {number} survivalTime
 * @returns {boolean}
 */
export function qualifiesForLeaderboard(score = 0, survivalTime = 0) {
  const current = readLeaderboard();
  if (current.length < MAX_LEADERBOARD_ENTRIES) {
    return true;
  }

  const numScore = Math.floor(Number(score) || 0);
  const numTime = Math.floor(Number(survivalTime) || 0);
  const lowest = current[current.length - 1];

  if (numScore > lowest.score) return true;
  if (numScore === lowest.score && numTime > lowest.survivalTime) return true;
  return false;
}

/**
 * Saves a new score entry to leaderboard and updates high score
 * @param {object} gameData
 * @returns {{ success: boolean, rank: number|null, isTop10: boolean, isHighScore: boolean, entries: Array<object>, entry: object }}
 */
export function saveLeaderboardEntry(gameData = {}) {
  const nameValidation = validatePlayerName(gameData.playerName ?? DEFAULT_PLAYER_NAME);
  const finalName = nameValidation.sanitized;

  const numScore = Math.max(0, Math.floor(Number(gameData.score) || 0));
  const numTime = Math.max(0, Math.floor(Number(gameData.survivalTime) || 0));

  const newEntry = {
    id: `sf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    playerName: finalName,
    score: numScore,
    survivalTime: numTime,
    formattedTime: gameData.formattedTime || formatSurvivalTime(numTime),
    level: Math.max(1, Math.floor(Number(gameData.level) || 1)),
    enemiesKilled: Math.max(0, Math.floor(Number(gameData.enemiesKilled) || 0)),
    votesCollected: Math.max(0, Math.floor(Number(gameData.votesCollected) || 0)),
    fundsCollected: Math.max(0, Math.floor(Number(gameData.fundsCollected) || 0)),
    attacksFired: Math.max(0, Math.floor(Number(gameData.attacksFired) || 0)),
    timestamp: Date.now(),
    date: new Date().toISOString(),
  };

  let entries = readLeaderboard();
  entries.push(newEntry);
  entries.sort(compareEntries);

  const rankIndex = entries.findIndex((e) => e.id === newEntry.id);
  const rank = rankIndex !== -1 ? rankIndex + 1 : null;
  const isTop10 = rank !== null && rank <= MAX_LEADERBOARD_ENTRIES;

  const top10 = entries.slice(0, MAX_LEADERBOARD_ENTRIES);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(top10));
    }
  } catch {
    // LocalStorage write failed, continue with in-memory fallback
  }

  memoryLeaderboard = top10;

  // High score check
  const prevHigh = readHighScore();
  const isHighScore = numScore > prevHigh;
  if (isHighScore) {
    saveHighScore(numScore);
  }

  return {
    success: true,
    rank: isTop10 ? rank : null,
    isTop10,
    isHighScore,
    entries: top10,
    entry: newEntry,
  };
}

/**
 * Clears leaderboard for testing or maintenance
 */
export function resetLeaderboard() {
  memoryLeaderboard = [];
  memoryHighScore = 0;
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(LEADERBOARD_STORAGE_KEY);
      localStorage.removeItem(HIGH_SCORE_STORAGE_KEY);
    }
  } catch {
    // Ignore error
  }
}
