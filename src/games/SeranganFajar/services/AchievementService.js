// AchievementService.js — LocalStorage achievement tracker with in-memory fallback
// PRD Tahap 19: Persistent achievement tracking without affecting leaderboard.

import { ACHIEVEMENTS } from "../config/achievementConfig.js";
import { BOSS_ROSTER } from "../config/bossConfig.js";

const validCount = (value) => Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;

export const ACHIEVEMENT_STORAGE_KEY = "seranganFajarAchievements";

let memoryAchievementsState = {
  unlocked: {},
  stats: {
    hoaksKillsCumulative: 0,
    maxSurvivalTime: 0,
    maxCombo: 0,
    bossesDefeated: [],
    evolutionsUnlocked: [],
    objectivesCompleted: [],
  },
};

export class AchievementService {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadState();
  }

  loadState() {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(ACHIEVEMENT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            unlocked: parsed.unlocked || {},
            stats: {
              hoaksKillsCumulative: validCount(parsed.stats?.hoaksKillsCumulative),
              maxSurvivalTime: validCount(parsed.stats?.maxSurvivalTime),
              maxCombo: validCount(parsed.stats?.maxCombo),
              bossesDefeated: Array.isArray(parsed.stats?.bossesDefeated) ? parsed.stats.bossesDefeated : [],
              evolutionsUnlocked: Array.isArray(parsed.stats?.evolutionsUnlocked) ? parsed.stats.evolutionsUnlocked : [],
              objectivesCompleted: Array.isArray(parsed.stats?.objectivesCompleted) ? parsed.stats.objectivesCompleted : [],
            },
          };
        }
      }
    } catch {
      // In-memory fallback
    }
    return memoryAchievementsState;
  }

  saveState() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(ACHIEVEMENT_STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Memory fallback
    }
    memoryAchievementsState = this.state;
  }

  onUnlock(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyUnlock(achievement) {
    for (const listener of this.listeners) {
      try {
        listener(achievement);
      } catch {
        // Safe callback execution
      }
    }
  }

  unlock(achievementId) {
    if (this.state.unlocked[achievementId]) return false;
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) return false;

    this.state.unlocked[achievementId] = {
      unlockedAt: Date.now(),
    };
    this.saveState();
    this.notifyUnlock(ach);
    return true;
  }

  isUnlocked(achievementId) {
    return Boolean(this.state.unlocked[achievementId]);
  }

  getAchievementsWithStatus() {
    return ACHIEVEMENTS.map((ach) => ({
      ...ach,
      isUnlocked: Boolean(this.state.unlocked[ach.id]),
      unlockedAt: this.state.unlocked[ach.id]?.unlockedAt || null,
    }));
  }

  // --- STAT RECORDERS ---

  recordKill(enemyType) {
    if (enemyType === "penyebar_hoaks") {
      this.state.stats.hoaksKillsCumulative = (this.state.stats.hoaksKillsCumulative || 0) + 1;
      this.saveState();
      if (this.state.stats.hoaksKillsCumulative >= 25) {
        this.unlock("pembasmi_hoaks");
      }
    }
  }

  recordSurvivalTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return;
    const wholeSeconds = Math.floor(seconds);
    if (wholeSeconds > validCount(this.state.stats.maxSurvivalTime)) {
      this.state.stats.maxSurvivalTime = wholeSeconds;
      this.saveState();
    }
    if (seconds >= 300) {
      this.unlock("tak_terkalahkan");
    }
  }

  recordEvolution(upgradeId) {
    if (upgradeId === "badaiSurat") {
      if (!this.state.stats.evolutionsUnlocked.includes("badaiSurat")) {
        this.state.stats.evolutionsUnlocked.push("badaiSurat");
        this.saveState();
      }
      this.unlock("master_surat_suara");
    }
  }

  recordBossDefeat(bossId) {
    if (!BOSS_ROSTER.some((boss) => boss.id === bossId)) return;
    const id = bossId;
    if (!this.state.stats.bossesDefeated.includes(id)) {
      this.state.stats.bossesDefeated.push(id);
      this.saveState();
    }
    if (id === "naga_fajar") {
      this.unlock("penakluk_fajar");
    }
  }

  recordObjectiveComplete(objectiveId) {
    if (!this.state.stats.objectivesCompleted.includes(objectiveId)) {
      this.state.stats.objectivesCompleted.push(objectiveId);
      this.saveState();
    }
    if (objectiveId === "amankan_kotak") {
      this.unlock("pengawal_demokrasi");
    }
  }

  recordCombo(comboCount) {
    if (comboCount > (this.state.stats.maxCombo || 0)) {
      this.state.stats.maxCombo = comboCount;
      this.saveState();
    }
    if (comboCount >= 20) {
      this.unlock("raja_combo");
    }
  }

  reset() {
    this.state = {
      unlocked: {},
      stats: {
        hoaksKillsCumulative: 0,
        maxSurvivalTime: 0,
        maxCombo: 0,
        bossesDefeated: [],
        evolutionsUnlocked: [],
        objectivesCompleted: [],
      },
    };
    this.saveState();
  }
}

export const achievementService = new AchievementService();
