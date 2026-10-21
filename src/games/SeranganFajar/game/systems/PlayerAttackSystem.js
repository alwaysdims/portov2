import { UPGRADE_BALANCE } from "../../config/upgradeConfig.js";

// PlayerAttackSystem.js — Auto-targeting and firing controller for Wowo's Basic Attack (Surat Suara)
// ponytail: single-target closest enemy auto-fire; extend with pierce/multi-shot upgrades in Tahap 7.

import { audioManager } from "../audio/AudioManager.js";

export const BASIC_ATTACK_CONFIG = {
  NAME: "Surat Suara",
  DAMAGE: 25,
  RANGE: 300, // world units radius
  INTERVAL: 1200, // ms between shots
  MANA_COST: 0,
  SPEED: 400, // world units / second
  MAX_DISTANCE: 450, // world units max range
  TARGETS_PER_SHOT: 1,
};

export class PlayerAttackSystem {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.damage = options.damage || BASIC_ATTACK_CONFIG.DAMAGE;
    this.range = options.range || BASIC_ATTACK_CONFIG.RANGE;
    this.interval = options.interval || BASIC_ATTACK_CONFIG.INTERVAL;
    this.manaCost = options.manaCost ?? BASIC_ATTACK_CONFIG.MANA_COST;
    this.speed = options.speed || BASIC_ATTACK_CONFIG.SPEED;
    this.maxDistance = options.maxDistance || BASIC_ATTACK_CONFIG.MAX_DISTANCE;

    // Start with attack ready
    this.lastAttackTime = -this.interval;
    this.attacksFired = 0;
    this.pendingShot = null;
  }

  findNearestTarget(player, enemiesGroup) {
    if (!player || !enemiesGroup) return null;

    const children = enemiesGroup.getChildren();
    if (!children || children.length === 0) return null;

    let nearest = null;
    let minDistanceSq = this.range * this.range;

    for (let i = 0; i < children.length; i++) {
      const enemy = children[i];
      if (!enemy.active || enemy.isDead || enemy.hp <= 0) {
        continue;
      }
      if (enemy.body && !enemy.body.enable) {
        continue;
      }

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

  fireAtTarget(player, target, projectileSystem, damage) {
    const count = this.scene.stats?.behaviorUpgrades.badaiSurat ? UPGRADE_BALANCE.stormShots : 1;
    const angle = Math.atan2(target.y - player.y, target.x - player.x);
    this.scene.vfxManager?.weaponSwing?.(player.x, player.y, angle, count > 1);
    for (let i = 0; i < count; i++) {
      const offset = (i - (count - 1) / 2) * 0.18;
      projectileSystem.fireVoteProjectile(player.x, player.y,
        player.x + Math.cos(angle + offset) * this.range,
        player.y + Math.sin(angle + offset) * this.range,
        damage, this.speed, this.maxDistance);
    }
  }

  update(time, delta, player, enemiesGroup, projectileSystem) {
    if (this.scene?.isGameOver || !this.scene?.stats?.isAlive()) { this.pendingShot = null; return; }
    if (this.scene.isPaused || this.scene.isLevelUpPaused || !player) return;
    if (this.pendingShot) {
      this.pendingShot.remaining -= delta;
      if (this.pendingShot.remaining <= 0) {
        const shot = this.pendingShot;
        this.pendingShot = null;
        const target = shot.target.active && !shot.target.isDead ? shot.target : this.findNearestTarget(player, enemiesGroup);
        if (target && projectileSystem) {
          this.fireAtTarget(player, target, projectileSystem, shot.damage);
          audioManager.playAttack();
        }
      }
      return;
    }

    const attackSpeedMult = this.scene.stats?.attackSpeedMultiplier ?? 1.0;
    const effectiveInterval = Math.max(300, Math.round(this.interval / attackSpeedMult));

    // Cooldown check
    if (time < this.lastAttackTime + effectiveInterval) {
      return;
    }

    // Find nearest target within range
    const target = this.findNearestTarget(player, enemiesGroup);
    if (!target) {
      return;
    }

    // Fire vote projectile toward target
    this.lastAttackTime = time;
    this.attacksFired++;

    const damageMult = this.scene.stats?.damageMultiplier ?? 1.0;
    const finalDamage = Math.round(this.damage * damageMult);

    if (projectileSystem) {
      this.pendingShot = { target, damage: finalDamage, remaining: 110 };
      this.scene.playerAnimator?.trigger('attack');
    }
  }

  fireManual(player, enemiesGroup, projectileSystem) {
    if (this.scene.isPaused || this.scene.isLevelUpPaused || !player || !this.scene.stats?.isAlive()) {
      return false;
    }

    const now = this.scene.time?.now ?? 0;
    const interval = Math.max(300, Math.round(this.interval / (this.scene.stats?.attackSpeedMultiplier ?? 1)));
    if (this.pendingShot || now < this.lastAttackTime + interval) return false;
    const target = this.findNearestTarget(player, enemiesGroup);
    if (!target || !projectileSystem) return false;
    this.lastAttackTime = now;
    this.attacksFired++;
    const damageMult = this.scene.stats?.damageMultiplier ?? 1.0;
    const finalDamage = Math.round(this.damage * damageMult);

    if (projectileSystem) {
      this.pendingShot = { target, damage: finalDamage, remaining: 110 };
      this.scene.playerAnimator?.trigger('attack');
      return true;
    }
    return false;
  }

  reset() {
    this.lastAttackTime = -this.interval;
    this.attacksFired = 0;
    this.pendingShot = null;
  }

  destroy() {
    this.reset();
    this.scene = null;
  }
}
