// PlayerStats.js — Centralized state and combat calculations for Wowo
// ponytail: baseline stats static per PRD 6.2 & 7.1; extend with dynamic upgrade multipliers in Tahap 7.

export const DEFAULT_PLAYER_STATS = {
  MAX_HP: 1000,
  INITIAL_HP: 1000,
  MAX_MANA: 100,
  INITIAL_MANA: 100,
  MANA_REGEN: 5, // 5 per second
  MAX_ENERGY: 100,
  INITIAL_ENERGY: 0, // PRD Section 10.2: Start at 0, gather via combat up to 100
  BASE_SPEED: 220, // px/s
  IFRAME_DURATION: 0.7, // seconds
  INITIAL_LEVEL: 1,
  INITIAL_XP: 0,
  INITIAL_COINS: 0,
};

export class PlayerStats {
  constructor(config = {}) {
    this.maxHp = config.maxHp ?? DEFAULT_PLAYER_STATS.MAX_HP;
    this.hp = config.initialHp ?? DEFAULT_PLAYER_STATS.INITIAL_HP;

    this.maxMana = config.maxMana ?? DEFAULT_PLAYER_STATS.MAX_MANA;
    this.mana = config.initialMana ?? DEFAULT_PLAYER_STATS.INITIAL_MANA;
    this.manaRegen = config.manaRegen ?? DEFAULT_PLAYER_STATS.MANA_REGEN;

    this.maxEnergy = config.maxEnergy ?? DEFAULT_PLAYER_STATS.MAX_ENERGY;
    this.energy = config.initialEnergy ?? DEFAULT_PLAYER_STATS.INITIAL_ENERGY;

    this.baseSpeed = config.speed ?? DEFAULT_PLAYER_STATS.BASE_SPEED;
    this.speed = this.baseSpeed;
    this.iframeDuration = config.iframeDuration ?? DEFAULT_PLAYER_STATS.IFRAME_DURATION;

    // Progression (Tahap 7)
    this.level = config.initialLevel ?? DEFAULT_PLAYER_STATS.INITIAL_LEVEL;
    this.xp = config.initialXp ?? DEFAULT_PLAYER_STATS.INITIAL_XP;
    this.coins = config.initialCoins ?? DEFAULT_PLAYER_STATS.INITIAL_COINS;
    this.queuedLevelUps = 0;

    // Upgrade modifiers (Tahap 7)
    this.damageMultiplier = 1.0;
    this.attackSpeedMultiplier = 1.0;
    this.cooldownReduction = 0.0;
    this.pickupRadius = 45;
    this.magnetRadius = 140;

    this.upgradeLevels = {
      damage: 0,
      attackSpeed: 0,
      maxHp: 0,
      speed: 0,
      manaRegen: 0,
      cooldownReduction: 0,
    };

    this.iframeTimer = 0;
    this.isInvulnerable = false;
    this.status = "alive"; // "alive" | "dead"

    this.onChangeCallback = null;
  }

  setOnChange(callback) {
    this.onChangeCallback = callback;
  }

  notifyChange() {
    if (typeof this.onChangeCallback === "function") {
      this.onChangeCallback(this.getSnapshot());
    }
  }

  getXpRequired(level = this.level) {
    // Formula: 50 * level^1.5
    return Math.round(50 * Math.pow(level, 1.5));
  }

  get hpPercent() {
    return Math.max(0, Math.min(100, (this.hp / this.maxHp) * 100));
  }

  get manaPercent() {
    return Math.max(0, Math.min(100, (this.mana / this.maxMana) * 100));
  }

  get energyPercent() {
    return Math.max(0, Math.min(100, (this.energy / this.maxEnergy) * 100));
  }

  getSnapshot() {
    const xpReq = this.getXpRequired(this.level);
    return {
      hp: Math.round(this.hp),
      maxHp: this.maxHp,
      hpPercent: Math.max(0, Math.min(100, (this.hp / this.maxHp) * 100)),
      mana: Math.round(this.mana * 10) / 10,
      maxMana: this.maxMana,
      manaPercent: Math.max(0, Math.min(100, (this.mana / this.maxMana) * 100)),
      energy: Math.round(this.energy),
      maxEnergy: this.maxEnergy,
      energyPercent: Math.max(0, Math.min(100, (this.energy / this.maxEnergy) * 100)),
      speed: this.speed,
      level: this.level,
      xp: Math.round(this.xp),
      xpRequired: xpReq,
      xpPercent: Math.max(0, Math.min(100, (this.xp / xpReq) * 100)),
      coins: this.coins,
      queuedLevelUps: this.queuedLevelUps,
      damageMultiplier: this.damageMultiplier,
      attackSpeedMultiplier: this.attackSpeedMultiplier,
      cooldownReduction: this.cooldownReduction,
      upgradeLevels: { ...this.upgradeLevels },
      isInvulnerable: this.isInvulnerable,
      status: this.status,
      isAlive: this.status === "alive",
    };
  }

  isAlive() {
    return this.status === "alive" && this.hp > 0;
  }

  /**
   * Applies damage to player with i-frame validation.
   * @param {number} amount
   * @returns {{ damaged: boolean, actualDamage: number, died: boolean }}
   */
  takeDamage(amount) {
    // Cannot damage dead or invulnerable player, or if damage is non-positive
    if (!this.isAlive() || this.isInvulnerable || typeof amount !== "number" || amount <= 0) {
      return { damaged: false, actualDamage: 0, died: false };
    }

    const prevHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    const actualDamage = prevHp - this.hp;

    let died = false;
    if (this.hp <= 0) {
      this.hp = 0;
      this.status = "dead";
      this.isInvulnerable = false;
      this.iframeTimer = 0;
      died = true;
    } else {
      // Trigger i-frames
      this.isInvulnerable = true;
      this.iframeTimer = this.iframeDuration;
    }

    this.notifyChange();
    return { damaged: true, actualDamage, died };
  }

  /**
   * Heals the player up to maxHp. Cannot revive dead player.
   * @param {number} amount
   * @returns {number} actual heal amount
   */
  heal(amount) {
    if (!this.isAlive() || typeof amount !== "number" || amount <= 0) {
      return 0;
    }

    const prevHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const actualHeal = this.hp - prevHp;

    if (actualHeal > 0) {
      this.notifyChange();
    }
    return actualHeal;
  }

  /**
   * Consumes mana for skill casting.
   * @param {number} amount
   * @returns {boolean} true if mana was sufficient and deducted
   */
  consumeMana(amount) {
    if (!this.isAlive() || typeof amount !== "number" || amount <= 0 || this.mana < amount) {
      return false;
    }
    this.mana = Math.max(0, this.mana - amount);
    this.notifyChange();
    return true;
  }

  /**
   * Adds Fajar Energy up to maxEnergy (e.g. +0.5 per basic attack hit, +2 per kill).
   * @param {number} amount
   * @returns {number} actual energy added
   */
  addEnergy(amount) {
    if (!this.isAlive() || typeof amount !== "number" || amount <= 0) {
      return 0;
    }
    const prev = this.energy;
    this.energy = Math.min(this.maxEnergy, Number((this.energy + amount).toFixed(2)));
    const added = this.energy - prev;
    if (added > 0) {
      this.notifyChange();
    }
    return added;
  }

  /**
   * Consumes Fajar Energy (e.g. 100 for Ultimate Serangan Fajar).
   * @param {number} amount
   * @returns {boolean} true if energy was sufficient and deducted
   */
  consumeEnergy(amount) {
    if (!this.isAlive() || typeof amount !== "number" || amount <= 0 || this.energy < amount) {
      return false;
    }
    this.energy = Math.max(0, Number((this.energy - amount).toFixed(2)));
    this.notifyChange();
    return true;
  }

  /**
   * Update lifecycle for delta-time mana regen and i-frame countdown.
   * @param {number} deltaSeconds
   * @param {boolean} isPaused
   */
  update(deltaSeconds, isPaused = false) {
    if (isPaused || !this.isAlive() || deltaSeconds <= 0) {
      return;
    }

    let changed = false;

    // 1. Mana Regeneration: manaBaru = min(maxMana, manaLama + regen * dt)
    if (this.mana < this.maxMana) {
      const prevMana = this.mana;
      this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * deltaSeconds);
      if (Math.abs(this.mana - prevMana) > 0.05) {
        changed = true;
      }
    }

    // 2. I-Frame countdown
    if (this.isInvulnerable) {
      this.iframeTimer -= deltaSeconds;
      if (this.iframeTimer <= 0) {
        this.iframeTimer = 0;
        this.isInvulnerable = false;
        changed = true;
      }
    }

    if (changed) {
      this.notifyChange();
    }
  }

  restoreMana(amount) {
    if (!this.isAlive() || typeof amount !== "number" || amount <= 0) {
      return 0;
    }
    const prev = this.mana;
    this.mana = Math.min(this.maxMana, this.mana + amount);
    const added = this.mana - prev;
    if (added > 0) {
      this.notifyChange();
    }
    return added;
  }

  addCoins(amount) {
    if (typeof amount !== "number" || amount <= 0) return 0;
    this.coins += amount;
    this.notifyChange();
    return amount;
  }

  addXp(amount) {
    if (!this.isAlive() || typeof amount !== "number" || amount <= 0) {
      return { leveledUp: false, levelsGained: 0 };
    }

    this.xp += amount;
    let levelsGained = 0;
    let xpReq = this.getXpRequired(this.level);

    while (this.xp >= xpReq) {
      this.xp -= xpReq;
      this.level++;
      this.queuedLevelUps++;
      levelsGained++;
      xpReq = this.getXpRequired(this.level);
    }

    this.notifyChange();
    return {
      leveledUp: levelsGained > 0,
      levelsGained,
      currentLevel: this.level,
      queued: this.queuedLevelUps,
    };
  }

  consumeQueuedLevelUp() {
    if (this.queuedLevelUps > 0) {
      this.queuedLevelUps--;
      this.notifyChange();
      return true;
    }
    return false;
  }

  applyUpgrade(upgradeId) {
    let applied = false;
    switch (upgradeId) {
      case "damage":
        this.upgradeLevels.damage++;
        this.damageMultiplier = Number((1.0 + this.upgradeLevels.damage * 0.15).toFixed(2));
        applied = true;
        break;

      case "attackSpeed":
        this.upgradeLevels.attackSpeed++;
        this.attackSpeedMultiplier = Number((1.0 + this.upgradeLevels.attackSpeed * 0.12).toFixed(2));
        applied = true;
        break;

      case "maxHp":
        this.upgradeLevels.maxHp++;
        this.maxHp += 150;
        this.hp = Math.min(this.maxHp, this.hp + 150);
        applied = true;
        break;

      case "speed":
        this.upgradeLevels.speed++;
        this.speed = this.baseSpeed + this.upgradeLevels.speed * 25;
        applied = true;
        break;

      case "manaRegen":
        this.upgradeLevels.manaRegen++;
        this.manaRegen = DEFAULT_PLAYER_STATS.MANA_REGEN + this.upgradeLevels.manaRegen * 2;
        applied = true;
        break;

      case "cooldownReduction":
        this.upgradeLevels.cooldownReduction++;
        // Capped at 40% reduction
        this.cooldownReduction = Math.min(0.40, Number((this.upgradeLevels.cooldownReduction * 0.08).toFixed(2)));
        applied = true;
        break;

      default:
        break;
    }

    if (applied) {
      this.notifyChange();
    }
    return applied;
  }

  /**
   * Resets all stats to initial configuration.
   */
  reset() {
    this.hp = DEFAULT_PLAYER_STATS.INITIAL_HP;
    this.maxHp = DEFAULT_PLAYER_STATS.MAX_HP;
    this.mana = DEFAULT_PLAYER_STATS.INITIAL_MANA;
    this.maxMana = DEFAULT_PLAYER_STATS.MAX_MANA;
    this.manaRegen = DEFAULT_PLAYER_STATS.MANA_REGEN;
    this.energy = DEFAULT_PLAYER_STATS.INITIAL_ENERGY;
    this.speed = this.baseSpeed;
    this.level = DEFAULT_PLAYER_STATS.INITIAL_LEVEL;
    this.xp = DEFAULT_PLAYER_STATS.INITIAL_XP;
    this.coins = DEFAULT_PLAYER_STATS.INITIAL_COINS;
    this.queuedLevelUps = 0;

    this.damageMultiplier = 1.0;
    this.attackSpeedMultiplier = 1.0;
    this.cooldownReduction = 0.0;
    this.pickupRadius = 45;
    this.magnetRadius = 140;
    this.upgradeLevels = {
      damage: 0,
      attackSpeed: 0,
      maxHp: 0,
      speed: 0,
      manaRegen: 0,
      cooldownReduction: 0,
    };

    this.isInvulnerable = false;
    this.iframeTimer = 0;
    this.status = "alive";
    this.notifyChange();
  }
}
