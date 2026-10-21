// PlayerSkillSystem.js — Skill 1 (Q), Skill 2 (E), and Ultimate (R) system for Wowo
// ponytail: baseline damage and cooldowns per PRD 8, 9, 10; dynamic skill tree upgrades expand in Tahap 7.

import { audioManager } from "../audio/AudioManager.js";
import { UPGRADE_BALANCE } from "../../config/upgradeConfig.js";

export const SKILL_CONFIG = {
  SKILL1: {
    NAME: "Tebar Pesona",
    KEY: "Q",
    PROJECTILE_COUNT: 3,
    DAMAGE_PER_PROJ: 80,
    SPREAD_DEG: 18,
    COOLDOWN: 5000, // ms
    MANA_COST: 20,
    SPEED: 450,
    MAX_DISTANCE: 500,
    TARGET_RANGE: 400,
  },
  SKILL2: {
    NAME: "Orasi Akbar",
    KEY: "E",
    RADIUS: 180,
    DAMAGE: 150,
    KNOCKBACK_SPEED: 250, // px/s
    KNOCKBACK_DURATION: 250, // ms
    COOLDOWN: 8000, // ms
    MANA_COST: 35,
  },
  ULTIMATE: {
    NAME: "Serangan Fajar",
    KEY: "R",
    RADIUS: 500,
    DAMAGE: 500,
    ENERGY_COST: 100,
    MANA_COST: 0,
    LOCKOUT: 1000, // ms lockout to prevent input bounce
  },
};

export class PlayerSkillSystem {
  constructor(scene) {
    this.scene = scene;

    this.skill1Cooldown = 0; // ms remaining
    this.skill2Cooldown = 0; // ms remaining
    this.ultimateLockout = 0; // ms remaining
    this.pendingFollowups = [];
  }

  canCastSkill1() {
    if (!this.scene || this.scene.isGameOver || this.scene.sys?.isActive?.() === false ||
      this.scene.isPaused || this.scene.isLevelUpPaused || !this.scene.stats?.isAlive()) return false;
    if (this.skill1Cooldown > 0) return false;
    if ((this.scene.stats?.mana ?? 0) < SKILL_CONFIG.SKILL1.MANA_COST) return false;
    return true;
  }

  canCastSkill2() {
    if (!this.scene || this.scene.isGameOver || this.scene.sys?.isActive?.() === false ||
      this.scene.isPaused || this.scene.isLevelUpPaused || !this.scene.stats?.isAlive()) return false;
    if (this.skill2Cooldown > 0) return false;
    if ((this.scene.stats?.mana ?? 0) < SKILL_CONFIG.SKILL2.MANA_COST) return false;
    return true;
  }

  canCastUltimate() {
    if (!this.scene || this.scene.isGameOver || this.scene.sys?.isActive?.() === false ||
      this.scene.isPaused || this.scene.isLevelUpPaused || !this.scene.stats?.isAlive()) return false;
    if (this.ultimateLockout > 0) return false;
    if ((this.scene.stats?.energy ?? 0) < SKILL_CONFIG.ULTIMATE.ENERGY_COST) return false;
    return true;
  }

  findNearestTarget(player, enemiesGroup, maxRange) {
    if (!player || !enemiesGroup || typeof enemiesGroup.getChildren !== "function") return null;
    const children = enemiesGroup.getChildren();
    if (!children || children.length === 0) return null;

    let nearest = null;
    let minDistanceSq = maxRange * maxRange;

    for (let i = 0; i < children.length; i++) {
      const enemy = children[i];
      if (!enemy.active || enemy.isDead || enemy.hp <= 0) continue;
      if (enemy.body && !enemy.body.enable) continue;

      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= minDistanceSq) {
        minDistanceSq = distSq;
        nearest = enemy;
      }
    }

    return nearest;
  }

  castSkill1(player, enemiesGroup, projectileSystem) {
    if (!this.canCastSkill1() || !player || !projectileSystem) {
      return { success: false, reason: "CANNOT_CAST" };
    }

    // Must have a valid target in range per PRD Section 8.4
    const target = this.findNearestTarget(player, enemiesGroup, SKILL_CONFIG.SKILL1.TARGET_RANGE);
    if (!target) {
      return { success: false, reason: "NO_TARGET" };
    }

    // Deduct Mana and set Cooldown
    const consumed = this.scene.stats.consumeMana(SKILL_CONFIG.SKILL1.MANA_COST);
    if (!consumed) {
      return { success: false, reason: "INSUFFICIENT_MANA" };
    }

    const cdr = this.scene.stats?.cooldownReduction ?? 0.0;
    this.skill1Cooldown = Math.max(1000, Math.round(SKILL_CONFIG.SKILL1.COOLDOWN * (1 - cdr)));

    const dmgMult = this.scene.stats?.damageMultiplier ?? 1.0;
    const finalDmg = Math.round(SKILL_CONFIG.SKILL1.DAMAGE_PER_PROJ * dmgMult);

    this.scene.playerAnimator?.trigger("skillQ");

    // Fire 3 envelope projectiles in spread arc
    projectileSystem.fireEnvelopeSpread(
      player.x,
      player.y,
      target.x,
      target.y,
      SKILL_CONFIG.SKILL1.PROJECTILE_COUNT,
      SKILL_CONFIG.SKILL1.SPREAD_DEG,
      finalDmg,
      SKILL_CONFIG.SKILL1.SPEED,
      SKILL_CONFIG.SKILL1.MAX_DISTANCE
    );

    // Visual pulse on player
    this.playCastFlash(player, 0xffd166);
    this.scene.vfxManager?.weaponSwing?.(player.x, player.y,
      Math.atan2(target.y - player.y, target.x - player.x),
      Boolean(this.scene.stats.behaviorUpgrades.amplopBerantai));
    audioManager.playSkill1();
    this.applySpeedBuff();

    return { success: true };
  }

  castSkill2(player, enemiesGroup) {
    if (!this.canCastSkill2() || !player) {
      return { success: false, reason: "CANNOT_CAST" };
    }

    // Deduct Mana and set Cooldown
    const consumed = this.scene.stats.consumeMana(SKILL_CONFIG.SKILL2.MANA_COST);
    if (!consumed) {
      return { success: false, reason: "INSUFFICIENT_MANA" };
    }

    const cdr = this.scene.stats?.cooldownReduction ?? 0.0;
    this.skill2Cooldown = Math.max(1000, Math.round(SKILL_CONFIG.SKILL2.COOLDOWN * (1 - cdr)));

    const dmgMult = this.scene.stats?.damageMultiplier ?? 1.0;
    const finalDmg = Math.round(SKILL_CONFIG.SKILL2.DAMAGE * dmgMult);

    this.scene.playerAnimator?.trigger("skillE");
    this.scene.vfxManager?.castPulse(player.x, player.y, 0xf97316);
    this.pendingFollowups.push({ remaining: 125, kind: "castE", player, enemiesGroup, damage: finalDmg });
    return { success: true, pending: true };
  }

  releaseSkill2(player, enemiesGroup, finalDmg) {
    const radius = SKILL_CONFIG.SKILL2.RADIUS;
    const radiusSq = radius * radius;
    let hitCount = 0;

    if (enemiesGroup && typeof enemiesGroup.getChildren === "function") {
      const children = enemiesGroup.getChildren();
      for (let i = 0; i < children.length; i++) {
        const enemy = children[i];
        if (!enemy.active || enemy.isDead || enemy.hp <= 0) continue;
        if (enemy.body && !enemy.body.enable) continue;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= radiusSq) {
          hitCount++;
          // Apply damage
          enemy.takeDamage(finalDmg);
          if (enemy.isBoss) {
            audioManager.playBossHit();
            this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 10, finalDmg, "boss");
            this.scene.vfxManager?.spawnHitSparks(enemy.x, enemy.y, 0xf43f5e, 6);
          } else {
            this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 8, finalDmg, "skill");
            this.scene.vfxManager?.spawnHitSparks(enemy.x, enemy.y, 0xfb923c, 4);
          }

          // Apply radial knockback
          const dist = Math.sqrt(distSq);
          let nx;
          let ny;
          if (dist > 0.01) {
            nx = dx / dist;
            ny = dy / dist;
          } else {
            const randomAngle = Math.random() * Math.PI * 2;
            nx = Math.cos(randomAngle);
            ny = Math.sin(randomAngle);
          }

          if (enemy.applyKnockback) {
            enemy.applyKnockback(
              nx * SKILL_CONFIG.SKILL2.KNOCKBACK_SPEED,
              ny * SKILL_CONFIG.SKILL2.KNOCKBACK_SPEED,
              SKILL_CONFIG.SKILL2.KNOCKBACK_DURATION
            );
          }
        }
      }
    }

    // Visual expanding shockwave ring and audio
    this.playShockwave(player.x, player.y, radius, 0xf97316);
    audioManager.playSkill2();
    this.scene.vfxManager?.shakeCamera(180, 0.008);
    this.applySpeedBuff();
    if (this.scene.stats.behaviorUpgrades.orasiMembara) {
      const x = player.x;
      const y = player.y;
      this.pendingFollowups.push({ remaining: UPGRADE_BALANCE.followupDelay, x, y, radius,
        damage: Math.round(finalDmg * UPGRADE_BALANCE.followupDamageRatio), enemiesGroup, color: 0xea580c, kind: "E" });
    }

    return { success: true, hitCount };
  }

  castUltimate(player, enemiesGroup) {
    if (!this.canCastUltimate() || !player) {
      return { success: false, reason: "CANNOT_CAST" };
    }

    // Deduct 100 Energy
    const consumed = this.scene.stats.consumeEnergy(SKILL_CONFIG.ULTIMATE.ENERGY_COST);
    if (!consumed) {
      return { success: false, reason: "INSUFFICIENT_ENERGY" };
    }

    this.ultimateLockout = SKILL_CONFIG.ULTIMATE.LOCKOUT;

    const dmgMult = this.scene.stats?.damageMultiplier ?? 1.0;
    const finalDmg = Math.round(SKILL_CONFIG.ULTIMATE.DAMAGE * dmgMult);

    this.scene.playerAnimator?.trigger("skillR");
    this.scene.vfxManager?.castPulse(player.x, player.y, 0xfbbf24);
    this.pendingFollowups.push({ remaining: 187.5, kind: "castR", player, enemiesGroup, damage: finalDmg });
    return { success: true, pending: true };
  }

  releaseUltimate(player, enemiesGroup, finalDmg) {
    const radius = SKILL_CONFIG.ULTIMATE.RADIUS;
    const radiusSq = radius * radius;
    let hitCount = 0;

    if (enemiesGroup && typeof enemiesGroup.getChildren === "function") {
      const children = enemiesGroup.getChildren();
      for (let i = 0; i < children.length; i++) {
        const enemy = children[i];
        if (!enemy.active || enemy.isDead || enemy.hp <= 0) continue;
        if (enemy.body && !enemy.body.enable) continue;

        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distSq = dx * dx + dy * dy;

        if (distSq <= radiusSq) {
          hitCount++;
          // Apply massive ultimate damage with upgrade multiplier
          enemy.takeDamage(finalDmg);
          if (enemy.isBoss) {
            audioManager.playBossHit();
            this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 14, finalDmg, "boss");
            this.scene.vfxManager?.spawnHitSparks(enemy.x, enemy.y, 0xf43f5e, 10);
          } else {
            this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 10, finalDmg, "ultimate");
            this.scene.vfxManager?.spawnHitSparks(enemy.x, enemy.y, 0xfbbf24, 6);
            if (typeof enemy.applyKnockback === "function") {
              const dx = enemy.x - player.x;
              const dy = enemy.y - player.y;
              const len = Math.hypot(dx, dy) || 1;
              enemy.applyKnockback((dx / len) * 200, (dy / len) * 200, 160);
            }
          }
        }
      }
    }

    // Golden blast shockwave, audio, and screen shake
    this.playUltimateBlast(player.x, player.y, radius);
    audioManager.playUltimate();
    this.scene.vfxManager?.shakeCamera(320, 0.015);
    this.applySpeedBuff();
    if (this.scene.stats.behaviorUpgrades.fajarBangkit) {
      const x = player.x;
      const y = player.y;
      this.pendingFollowups.push({ remaining: UPGRADE_BALANCE.followupDelay, x, y, radius,
        damage: Math.round(finalDmg * UPGRADE_BALANCE.followupDamageRatio), enemiesGroup, color: 0xfbbf24, kind: "R" });
    }
    return { success: true, hitCount };
  }

  damageArea(x, y, radius, damage, enemiesGroup) {
    for (const enemy of enemiesGroup?.getChildren() || []) {
      if (!enemy.active || enemy.isDead || enemy.hp <= 0 || (enemy.body && !enemy.body.enable)) continue;
      if ((enemy.x - x) ** 2 + (enemy.y - y) ** 2 <= radius ** 2) {
        enemy.takeDamage(damage);
        this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 8, damage, "skill");
      }
    }
  }

  applySpeedBuff() {
    if (this.scene.stats?.behaviorUpgrades.langkahCepat) {
      this.scene.stats.speedBuff = UPGRADE_BALANCE.speedDuration;
      this.scene.vfxManager?.spawnHitSparks(this.scene.player.x, this.scene.player.y, 0x38bdf8, 4);
    }
  }

  playCastFlash(player, color = 0xffd166) {
    this.scene?.vfxManager?.castPulse?.(player.x, player.y, color);
  }

  playShockwave(x, y, maxRadius, color = 0xf97316, evolved = false) {
    this.scene?.vfxManager?.shockwave?.(x, y, maxRadius, color, evolved);
  }

  playUltimateBlast(x, y, maxRadius, evolved = false) {
    this.scene?.vfxManager?.ultimateBlast?.(x, y, maxRadius, evolved);
  }

  update(deltaSeconds, isPaused = false) {
    if (!this.scene || this.scene.isGameOver || !this.scene.stats?.isAlive() ||
      this.scene.sys?.isActive?.() === false) {
      this.pendingFollowups.length = 0;
      return;
    }
    if (isPaused || this.scene.isPaused || this.scene.isLevelUpPaused || deltaSeconds <= 0) return;

    const deltaMs = deltaSeconds * 1000;
    for (let i = this.pendingFollowups.length - 1; i >= 0; i--) {
      const followup = this.pendingFollowups[i];
      followup.remaining -= deltaMs;
      if (followup.remaining <= 0) {
        // Remove before releasing: release may append its evolution follow-up.
        if (followup.kind === "castE" || followup.kind === "castR") {
          this.pendingFollowups.splice(i, 1);
          if (followup.player?.active) {
            if (followup.kind === "castE") this.releaseSkill2(followup.player, followup.enemiesGroup, followup.damage);
            else this.releaseUltimate(followup.player, followup.enemiesGroup, followup.damage);
          }
          continue;
        }
        this.damageArea(followup.x, followup.y, followup.radius, followup.damage, followup.enemiesGroup);
        if (followup.kind === "R") {
          this.playUltimateBlast(followup.x, followup.y, followup.radius, true);
        } else {
          this.playShockwave(followup.x, followup.y, followup.radius, followup.color, true);
        }
        this.pendingFollowups.splice(i, 1);
      }
    }
    if (this.skill1Cooldown > 0) {
      this.skill1Cooldown = Math.max(0, this.skill1Cooldown - deltaMs);
    }
    if (this.skill2Cooldown > 0) {
      this.skill2Cooldown = Math.max(0, this.skill2Cooldown - deltaMs);
    }
    if (this.ultimateLockout > 0) {
      this.ultimateLockout = Math.max(0, this.ultimateLockout - deltaMs);
    }
  }

  getSkillStatus() {
    const mana = this.scene.stats?.mana ?? 0;
    const energy = this.scene.stats?.energy ?? 0;
    const cdr = this.scene.stats?.cooldownReduction ?? 0;
    const totalCd1 = Math.max(1000, Math.round(SKILL_CONFIG.SKILL1.COOLDOWN * (1 - cdr))) / 1000;
    const totalCd2 = Math.max(1000, Math.round(SKILL_CONFIG.SKILL2.COOLDOWN * (1 - cdr))) / 1000;
    const isPlayable = !this.scene.isPaused && !this.scene.isLevelUpPaused && Boolean(this.scene.stats?.isAlive());

    return {
      skill1: {
        name: SKILL_CONFIG.SKILL1.NAME,
        key: SKILL_CONFIG.SKILL1.KEY,
        cooldownRemaining: Number((this.skill1Cooldown / 1000).toFixed(1)),
        cooldownTotal: totalCd1,
        cooldownPercent: Math.min(100, Math.max(0, (this.skill1Cooldown / (totalCd1 * 1000)) * 100)),
        manaCost: SKILL_CONFIG.SKILL1.MANA_COST,
        hasMana: mana >= SKILL_CONFIG.SKILL1.MANA_COST,
        isReady: isPlayable && this.skill1Cooldown <= 0 && mana >= SKILL_CONFIG.SKILL1.MANA_COST,
      },
      skill2: {
        name: SKILL_CONFIG.SKILL2.NAME,
        key: SKILL_CONFIG.SKILL2.KEY,
        cooldownRemaining: Number((this.skill2Cooldown / 1000).toFixed(1)),
        cooldownTotal: totalCd2,
        cooldownPercent: Math.min(100, Math.max(0, (this.skill2Cooldown / (totalCd2 * 1000)) * 100)),
        manaCost: SKILL_CONFIG.SKILL2.MANA_COST,
        hasMana: mana >= SKILL_CONFIG.SKILL2.MANA_COST,
        isReady: isPlayable && this.skill2Cooldown <= 0 && mana >= SKILL_CONFIG.SKILL2.MANA_COST,
      },
      ultimate: {
        name: SKILL_CONFIG.ULTIMATE.NAME,
        key: SKILL_CONFIG.ULTIMATE.KEY,
        energyCost: SKILL_CONFIG.ULTIMATE.ENERGY_COST,
        currentEnergy: Number(energy.toFixed(1)),
        hasEnergy: energy >= SKILL_CONFIG.ULTIMATE.ENERGY_COST,
        isReady: isPlayable && energy >= SKILL_CONFIG.ULTIMATE.ENERGY_COST && this.ultimateLockout <= 0,
      },
    };
  }

  reset() {
    this.skill1Cooldown = 0;
    this.skill2Cooldown = 0;
    this.ultimateLockout = 0;
    this.pendingFollowups.length = 0;
  }

  destroy() {
    this.reset();
    this.scene = null;
  }
}
