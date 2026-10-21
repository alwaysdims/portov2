// UpgradeSystem.js — data-driven selection and application on existing combat stats.
import { UPGRADE_DEFINITIONS, eligibleUpgrades } from "../../config/upgradeConfig.js";

export { UPGRADE_DEFINITIONS };

export class UpgradeSystem {
  constructor(scene, random = Math.random) {
    this.scene = scene;
    this.random = random;
  }

  /**
   * Generates up to `count` unique upgrade choices from the pool.
   * Excludes upgrades that have already reached their max level.
   */
  getUpgradeChoices(currentUpgradeLevels = {}, count = 3) {
    const available = eligibleUpgrades(currentUpgradeLevels).map((def) => {
      const currentLv = currentUpgradeLevels[def.id] || 0;
      return {
        ...def,
        statLabel: def.effect,
        maxLevel: def.maxStacks,
        currentLevel: currentLv,
        nextLevel: currentLv + 1,
      };
    });
    // Evolution cards must be offered when unlocked, never hidden by random dilution.
    const evolution = available.find((def) => def.rarity === "legendary");
    const pool = available.filter((def) => def !== evolution);

    if (available.length <= count) {
      return available;
    }

    // Fisher-Yates random shuffle
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    return [...(evolution ? [evolution] : []), ...shuffled.slice(0, count - (evolution ? 1 : 0))];
  }

  /**
   * Applies selected upgrade ID to player stats.
   */
  applyUpgrade(upgradeId) {
    const stats = this.scene?.stats;
    if (!stats || !eligibleUpgrades({ ...stats.upgradeLevels, ...stats.behaviorUpgrades })
      .some((def) => def.id === upgradeId)) return false;
    if (stats.applyUpgrade(upgradeId)) return true;
    stats.behaviorUpgrades[upgradeId] = 1;
    if (upgradeId === "magnetDemokrasi") {
      stats.pickupRadius += 25;
      stats.magnetRadius += 80;
    }
    stats.notifyChange();
    return true;
  }
}
