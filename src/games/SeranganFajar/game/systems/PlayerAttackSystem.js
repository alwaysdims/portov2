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

  update(time, delta, player, enemiesGroup, projectileSystem) {
    if (this.scene.isPaused || !player || !this.scene.stats?.isAlive()) {
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
      projectileSystem.fireVoteProjectile(
        player.x,
        player.y,
        target.x,
        target.y,
        finalDamage,
        this.speed,
        this.maxDistance
      );
      audioManager.playAttack();
    }
  }

  fireManual(player, enemiesGroup, projectileSystem) {
    if (this.scene.isPaused || this.scene.isLevelUpPaused || !player || !this.scene.stats?.isAlive()) {
      return false;
    }

    const target = this.findNearestTarget(player, enemiesGroup);
    if (!target) {
      return false;
    }

    this.attacksFired++;
    const damageMult = this.scene.stats?.damageMultiplier ?? 1.0;
    const finalDamage = Math.round(this.damage * damageMult);

    if (projectileSystem) {
      projectileSystem.fireVoteProjectile(
        player.x,
        player.y,
        target.x,
        target.y,
        finalDamage,
        this.speed,
        this.maxDistance
      );
      audioManager.playAttack();
      return true;
    }
    return false;
  }

  reset() {
    this.lastAttackTime = 0;
    this.attacksFired = 0;
  }

  destroy() {
    this.reset();
    this.scene = null;
  }
}
