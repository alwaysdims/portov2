import { ASSET_KEYS } from "../../config/assetRegistry.js";
import { audioManager } from "../audio/AudioManager.js";

// ProjectileSystem.js — Pool and lifecycle management for ranged projectiles
// ponytail: straight-line arcade bullets; add curve / homing mechanics if designated in future milestones.

export class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;

    // Enemy bullets (Penyebar Hoaks)
    this.bullets = scene.physics.add.group({
      defaultKey: ASSET_KEYS.PROJECTILE_HOAKS,
      maxSize: 40,
    });

    // Player basic attack projectiles (Surat Suara)
    this.voteProjectiles = scene.physics.add.group({
      defaultKey: ASSET_KEYS.PROJECTILE_SURAT_SUARA,
      maxSize: 30,
    });

    // Player skill 1 projectiles (Amplop Burst)
    this.envelopeProjectiles = scene.physics.add.group({
      defaultKey: ASSET_KEYS.PROJECTILE_AMPLOP,
      maxSize: 30,
    });

    // Boss paper talisman projectiles (Proyektil Kertas)
    this.bossProjectiles = scene.physics.add.group({
      defaultKey: ASSET_KEYS.BOSS_PROYEKTIL_KERTAS,
      maxSize: 35,
    });
  }

  setupPlayerCollision(player) {
    if (!player) return;
    this.scene.physics.add.overlap(
      this.bullets,
      player,
      this.handleBulletHitPlayer,
      null,
      this
    );
    this.scene.physics.add.overlap(
      this.bossProjectiles,
      player,
      this.handleBossBulletHitPlayer,
      null,
      this
    );
  }

  setupEnemyCollision(enemyGroup) {
    if (!enemyGroup) return;
    this.scene.physics.add.overlap(
      this.voteProjectiles,
      enemyGroup,
      this.handleVoteHitEnemy,
      null,
      this
    );
    this.scene.physics.add.overlap(
      this.envelopeProjectiles,
      enemyGroup,
      this.handleEnvelopeHitEnemy,
      null,
      this
    );
  }

  recycleProjectile(projectile) {
    if (!projectile) return;
    projectile.setActive(false);
    projectile.setVisible(false);
    if (projectile.body) {
      projectile.body.enable = false;
      projectile.body.setVelocity(0, 0);
    }
  }

  fireVoteProjectile(startX, startY, targetX, targetY, damage = 25, speed = 400, maxDistance = 450) {
    if (!this.voteProjectiles || !this.scene || this.scene.isPaused) return null;

    let projectile = this.voteProjectiles.get(startX, startY, ASSET_KEYS.PROJECTILE_SURAT_SUARA);
    if (!projectile) {
      const children = this.voteProjectiles.getChildren();
      if (children.length > 0) {
        projectile = children[0];
        children.push(children.shift());
      }
    }
    if (!projectile) return null;

    projectile.setPosition(startX, startY);
    projectile.setActive(true);
    projectile.setVisible(true);
    projectile.setAlpha(1);
    projectile.setScale(1);
    projectile.setDepth(9);

    if (projectile.body) {
      projectile.body.enable = true;
      projectile.body.setSize(14, 14);
      projectile.body.setOffset(3, 3);
    }

    const angle = Math.atan2(targetY - startY, targetX - startX);
    projectile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    projectile.setRotation(angle);

    projectile.damage = damage;
    projectile.startX = startX;
    projectile.startY = startY;
    projectile.maxDistance = maxDistance;
    projectile.spawnTime = this.scene.time.now;

    return projectile;
  }

  handleVoteHitEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.active || enemy.isDead) return;

    const dmg = projectile.damage || 25;
    // Apply damage to enemy
    enemy.takeDamage(dmg);

    // Audio & Visual feedback
    audioManager.playEnemyHit();
    this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 8, dmg, "normal");
    this.scene.vfxManager?.spawnHitSparks(enemy.x, enemy.y, 0xffeb3b, 4);

    // Add +0.5 Fajar Energy per valid basic attack hit (PRD Section 10.3)
    this.scene.stats?.addEnergy(0.5);

    this.recycleProjectile(projectile);
  }

  fireEnvelopeSpread(startX, startY, targetX, targetY, count = 3, spreadDeg = 18, damage = 80, speed = 450, maxDistance = 500) {
    if (!this.envelopeProjectiles || !this.scene || this.scene.isPaused) return [];

    const baseAngle = Math.atan2(targetY - startY, targetX - startX);
    const spreadRad = (spreadDeg * Math.PI) / 180;
    const projectiles = [];

    // Spread angles: for 3 count -> [-spreadRad, 0, +spreadRad]
    const half = (count - 1) / 2;
    for (let i = 0; i < count; i++) {
      const offset = (i - half) * spreadRad;
      const angle = baseAngle + offset;

      let proj = this.envelopeProjectiles.get(startX, startY, ASSET_KEYS.PROJECTILE_AMPLOP);
      if (!proj) {
        const children = this.envelopeProjectiles.getChildren();
        if (children.length > 0) {
          proj = children[0];
          children.push(children.shift());
        }
      }
      if (!proj) continue;

      proj.setPosition(startX, startY);
      proj.setActive(true);
      proj.setVisible(true);
      proj.setAlpha(1);
      proj.setScale(1);
      proj.setDepth(9);

      if (proj.body) {
        proj.body.enable = true;
        proj.body.setSize(18, 12);
        proj.body.setOffset(3, 2);
      }

      proj.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      proj.setRotation(angle);

      proj.damage = damage;
      proj.startX = startX;
      proj.startY = startY;
      proj.maxDistance = maxDistance;
      proj.spawnTime = this.scene.time.now;

      projectiles.push(proj);
    }

    return projectiles;
  }

  handleEnvelopeHitEnemy(projectile, enemy) {
    if (!projectile.active || !enemy.active || enemy.isDead) return;

    const dmg = projectile.damage || 80;
    // Apply 80 burst damage to enemy
    enemy.takeDamage(dmg);

    // Audio & Visual feedback
    audioManager.playEnemyHit();
    this.scene.vfxManager?.showDamageNumber(enemy.x, enemy.y - 8, dmg, "skill");
    this.scene.vfxManager?.spawnHitSparks(enemy.x, enemy.y, 0x38bdf8, 5);

    this.recycleProjectile(projectile);
  }

  fireHoaxBullet(startX, startY, targetX, targetY, damage = 10, speed = 220, lifetime = 2500) {
    if (!this.bullets || !this.scene || this.scene.isPaused) return null;

    let bullet = this.bullets.get(startX, startY, ASSET_KEYS.PROJECTILE_HOAKS);
    if (!bullet) {
      const children = this.bullets.getChildren();
      if (children.length > 0) {
        bullet = children[0];
        children.push(children.shift());
      }
    }
    if (!bullet) return null;

    bullet.setPosition(startX, startY);
    bullet.setActive(true);
    bullet.setVisible(true);
    bullet.setAlpha(1);
    bullet.setScale(1);
    bullet.setDepth(8);

    if (bullet.body) {
      bullet.body.enable = true;
      bullet.body.setSize(10, 10);
      bullet.body.setOffset(3, 3);
    }

    const angle = Math.atan2(targetY - startY, targetX - startX);
    bullet.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    bullet.setRotation(angle);

    bullet.damage = damage;
    bullet.spawnTime = this.scene.time.now;
    bullet.lifetime = lifetime;

    return bullet;
  }

  handleBulletHitPlayer(player, bullet) {
    if (!bullet.active) return;

    // Apply damage to player Wowo
    if (this.scene.stats?.isAlive()) {
      this.scene.takeDamage(bullet.damage || 10);
    }

    this.recycleProjectile(bullet);
  }

  handleBossBulletHitPlayer(player, bullet) {
    if (!bullet.active) return;

    if (this.scene.stats?.isAlive()) {
      this.scene.takeDamage(bullet.damage || 25);
    }

    this.recycleProjectile(bullet);
  }

  fireBossPaperSpread(startX, startY, targetX, targetY, count = 5, damage = 35) {
    if (!this.bossProjectiles || !this.scene || this.scene.isPaused) return;

    const baseAngle = Math.atan2(targetY - startY, targetX - startX);
    const spreadRad = (14 * Math.PI) / 180;
    const half = (count - 1) / 2;

    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (i - half) * spreadRad;
      const vx = Math.cos(angle) * 230;
      const vy = Math.sin(angle) * 230;

      let bullet = this.bossProjectiles.get(startX, startY, ASSET_KEYS.BOSS_PROYEKTIL_KERTAS);
      if (!bullet) {
        const children = this.bossProjectiles.getChildren();
        if (children.length > 0) {
          bullet = children[0];
          children.push(children.shift());
        }
      }
      if (!bullet) continue;

      bullet.setPosition(startX, startY);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setAlpha(1);
      bullet.setRotation(angle);
      bullet.setDepth(9);
      bullet.damage = damage;
      bullet.spawnTime = this.scene.time.now;
      bullet.lifetime = 2600;

      if (bullet.body) {
        bullet.body.enable = true;
        bullet.body.setSize(20, 10);
        bullet.body.reset(startX, startY);
        bullet.setVelocity(vx, vy);
      }
    }
  }

  update(time) {
    // 1. Update enemy hoax bullets
    if (this.bullets) {
      const children = this.bullets.getChildren();
      for (let i = children.length - 1; i >= 0; i--) {
        const bullet = children[i];
        if (!bullet.active) continue;

        // Check lifetime expiration
        if (time - bullet.spawnTime >= bullet.lifetime) {
          this.recycleProjectile(bullet);
          continue;
        }

        // Check world boundary bounds
        if (
          bullet.x < 0 ||
          bullet.x > 2400 ||
          bullet.y < 0 ||
          bullet.y > 2400
        ) {
          this.recycleProjectile(bullet);
        }
      }
    }

    // 2. Update player vote projectiles
    if (this.voteProjectiles) {
      const voteChildren = this.voteProjectiles.getChildren();
      for (let i = voteChildren.length - 1; i >= 0; i--) {
        const proj = voteChildren[i];
        if (!proj.active) continue;

        // Subtle gentle paper flutter rotation
        proj.rotation += 0.08;

        // Check travel distance
        const dx = proj.x - proj.startX;
        const dy = proj.y - proj.startY;
        const distSq = dx * dx + dy * dy;

        if (distSq >= proj.maxDistance * proj.maxDistance) {
          this.recycleProjectile(proj);
          continue;
        }

        // Check world boundary bounds
        if (
          proj.x < 0 ||
          proj.x > 2400 ||
          proj.y < 0 ||
          proj.y > 2400
        ) {
          this.recycleProjectile(proj);
        }
      }
    }

    // 3. Update player envelope projectiles (Skill 1)
    if (this.envelopeProjectiles) {
      const envChildren = this.envelopeProjectiles.getChildren();
      for (let i = envChildren.length - 1; i >= 0; i--) {
        const env = envChildren[i];
        if (!env.active) continue;

        // Check travel distance
        const dx = env.x - env.startX;
        const dy = env.y - env.startY;
        const distSq = dx * dx + dy * dy;

        if (distSq >= env.maxDistance * env.maxDistance) {
          this.recycleProjectile(env);
          continue;
        }

        // Check world boundary bounds
        if (
          env.x < 0 ||
          env.x > 2400 ||
          env.y < 0 ||
          env.y > 2400
        ) {
          this.recycleProjectile(env);
        }
      }
    }

    // 4. Update boss paper projectiles
    if (this.bossProjectiles) {
      const bossChildren = this.bossProjectiles.getChildren();
      for (let i = bossChildren.length - 1; i >= 0; i--) {
        const bp = bossChildren[i];
        if (!bp.active) continue;

        if (time - bp.spawnTime >= bp.lifetime) {
          this.recycleProjectile(bp);
          continue;
        }

        if (bp.x < 0 || bp.x > 2400 || bp.y < 0 || bp.y > 2400) {
          this.recycleProjectile(bp);
        }
      }
    }
  }

  clearHostileProjectiles() {
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    if (this.bossProjectiles) {
      this.bossProjectiles.clear(true, true);
    }
  }

  clearAll() {
    if (this.bullets) {
      this.bullets.clear(true, true);
    }
    if (this.bossProjectiles) {
      this.bossProjectiles.clear(true, true);
    }
    if (this.voteProjectiles) {
      this.voteProjectiles.clear(true, true);
    }
    if (this.envelopeProjectiles) {
      this.envelopeProjectiles.clear(true, true);
    }
  }

  destroy() {
    this.clearAll();
    this.bullets = null;
    this.bossProjectiles = null;
    this.voteProjectiles = null;
    this.envelopeProjectiles = null;
  }
}
