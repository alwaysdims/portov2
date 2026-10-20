// UpgradeSystem.js — Upgrade definitions, randomized 3-card selection, and progression logic
// ponytail: 6 core stats; synergy fusions and character-specific cards unlock in Tahap 12.

export const UPGRADE_DEFINITIONS = [
  {
    id: "damage",
    name: "Kekuatan Opini",
    category: "OFFENSE",
    description: "Meningkatkan damage seluruh serangan (Surat Suara, Amplop, Orasi, Ultimate) sebesar 15%.",
    statLabel: "+15% Damage",
    icon: "⚔️",
    maxLevel: 5,
  },
  {
    id: "attackSpeed",
    name: "Cepat Coblos",
    category: "OFFENSE",
    description: "Meningkatkan frekuensi lemparan Surat Suara otomatis sebesar 12%.",
    statLabel: "+12% Attack Speed",
    icon: "⚡",
    maxLevel: 5,
  },
  {
    id: "maxHp",
    name: "Rompi Tebal",
    category: "DEFENSE",
    description: "Meningkatkan batas maksimum HP sebesar 150 poin dan memulihkan 150 HP seketika.",
    statLabel: "+150 Max HP",
    icon: "❤️",
    maxLevel: 5,
  },
  {
    id: "speed",
    name: "Gerak Blusukan",
    category: "UTILITY",
    description: "Meningkatkan kecepatan lari Wowo sebesar 25 px/detik untuk menghindari kepungan.",
    statLabel: "+25 Move Speed",
    icon: "👟",
    maxLevel: 5,
  },
  {
    id: "manaRegen",
    name: "Kopi Stamina",
    category: "UTILITY",
    description: "Meningkatkan laju regenerasi Mana sebesar 2 poin per detik.",
    statLabel: "+2 Mana/detik",
    icon: "☕",
    maxLevel: 5,
  },
  {
    id: "cooldownReduction",
    name: "Relasi Efisien",
    category: "UTILITY",
    description: "Mengurangi cooldown Skill 1 (Amplop Burst) dan Skill 2 (Orasi Akbar) sebesar 8%.",
    statLabel: "-8% Cooldown",
    icon: "⏱️",
    maxLevel: 5,
  },
];

export class UpgradeSystem {
  constructor(scene) {
    this.scene = scene;
  }

  /**
   * Generates up to `count` unique upgrade choices from the pool.
   * Excludes upgrades that have already reached their max level.
   */
  getUpgradeChoices(currentUpgradeLevels = {}, count = 3) {
    const available = UPGRADE_DEFINITIONS.filter((def) => {
      const currentLv = currentUpgradeLevels[def.id] || 0;
      return currentLv < def.maxLevel;
    }).map((def) => {
      const currentLv = currentUpgradeLevels[def.id] || 0;
      return {
        ...def,
        currentLevel: currentLv,
        nextLevel: currentLv + 1,
      };
    });

    if (available.length <= count) {
      return available;
    }

    // Fisher-Yates random shuffle
    const shuffled = [...available];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    return shuffled.slice(0, count);
  }

  /**
   * Applies selected upgrade ID to player stats.
   */
  applyUpgrade(upgradeId) {
    if (!this.scene || !this.scene.stats) {
      return false;
    }
    return this.scene.stats.applyUpgrade(upgradeId);
  }
}
