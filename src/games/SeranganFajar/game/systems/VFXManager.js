// VFXManager.js — Particle hit sparks, floating damage numbers, and camera shake controllers
// High-performance, capped effects pool, zero external particle assets.

export const VFX_CONFIG = {
  MAX_DAMAGE_TEXTS: 35,
  MAX_ACTIVE_PARTICLES: 60,
  SHAKE_COOLDOWN_MS: 100,
};

export class VFXManager {
  constructor(scene) {
    this.scene = scene;
    this.activeDamageTexts = [];
    this.activeParticles = [];
    this.lastShakeTime = -Infinity;
    this.particlePool = [];
    this.setQuality(scene.registry?.get("vfxQuality") || "medium");
  }

  /**
   * Spawns a floating combat damage number that rises and fades
   * @param {number} x
   * @param {number} y
   * @param {number|string} amount
   * @param {"normal"|"skill"|"ultimate"|"player"} type
   */
  showDamageNumber(x, y, amount, type = "normal") {
    if (!this.scene || typeof this.scene.add?.text !== "function") return;

    // Prune oldest text if over capacity
    while (this.activeDamageTexts.length >= VFX_CONFIG.MAX_DAMAGE_TEXTS) {
      const oldest = this.activeDamageTexts.shift();
      if (oldest && oldest.active) {
        this.scene.tweens?.killTweensOf(oldest);
        oldest.destroy();
      }
    }

    const val = typeof amount === "number" ? Math.round(amount) : amount;
    const offsetX = (Math.random() - 0.5) * 16;
    const offsetY = (Math.random() - 0.5) * 8;

    let color = "#ffffff";
    let stroke = "#0f172a";
    let fontSize = "12px";

    if (type === "skill") {
      color = "#fcd34d";
      stroke = "#78350f";
      fontSize = "14px";
    } else if (type === "ultimate") {
      color = "#fbbf24";
      stroke = "#78350f";
      fontSize = "18px";
    } else if (type === "boss") {
      color = "#f43f5e";
      stroke = "#881337";
      fontSize = "16px";
    } else if (type === "crit") {
      color = "#f59e0b";
      stroke = "#78350f";
      fontSize = "15px";
    } else if (type === "player") {
      color = "#f43f5e";
      stroke = "#4c0519";
      fontSize = "13px";
    }

    const txt = this.scene.add.text(x + offsetX, y + offsetY, String(val), {
      fontFamily: "Arial, sans-serif",
      fontSize,
      fontStyle: "bold",
      color,
      stroke,
      strokeThickness: type === "ultimate" ? 4 : 3,
    });

    txt.setOrigin(0.5);
    txt.setDepth(15);
    this.activeDamageTexts.push(txt);

    this.scene.tweens?.add({
      targets: txt,
      y: y - 26,
      scaleX: type === "ultimate" ? 1.3 : 1.1,
      scaleY: type === "ultimate" ? 1.3 : 1.1,
      alpha: 0,
      duration: type === "ultimate" ? 700 : 550,
      ease: "Cubic.easeOut",
      onComplete: () => {
        const idx = this.activeDamageTexts.indexOf(txt);
        if (idx !== -1) {
          this.activeDamageTexts.splice(idx, 1);
        }
        txt.destroy();
      },
    });
  }

  setQuality(quality = "medium") {
    const settings = {
      low: { cap: 24, sparks: 3, trailMs: 100 },
      medium: { cap: 48, sparks: 5, trailMs: 65 },
      high: { cap: 60, sparks: 8, trailMs: 45 },
    };
    if (!Object.hasOwn(settings, quality)) return false;
    this.quality = quality;
    this.settings = settings[quality];
    while (this.activeParticles.length > this.settings.cap) this.recycle(this.activeParticles[0]);
    return true;
  }

  recycle(effect) {
    this.scene?.tweens?.killTweensOf(effect);
    const index = this.activeParticles.indexOf(effect);
    if (index !== -1) this.activeParticles.splice(index, 1);
    effect.vfxGeneration = (effect.vfxGeneration || 0) + 1;
    effect.clear();
    effect.setActive(false).setVisible(false);
  }

  transient(x, y, draw, tween = {}) {
    if (!this.scene?.add?.graphics || !this.scene.tweens?.add) return null;
    if (this.activeParticles.length >= this.settings.cap) this.recycle(this.activeParticles[0]);
    let effect = this.particlePool.find((item) => !item.active);
    if (!effect) {
      effect = this.scene.add.graphics();
      this.particlePool.push(effect);
    }
    this.scene.tweens.killTweensOf(effect);
    effect.clear();
    effect.setPosition(x, y).setScale(1).setRotation(0).setAlpha(1);
    // Below hostile warnings (depth 14); never obscure them with large filled disks.
    effect.setDepth(12).setActive(true).setVisible(true);
    draw(effect);
    this.activeParticles.push(effect);
    const generation = effect.vfxGeneration;
    this.scene.tweens.add({
      targets: effect, alpha: 0, duration: 180, ...tween,
      onComplete: () => {
        if (generation === effect.vfxGeneration) this.recycle(effect);
      },
    });
    return effect;
  }

  spawnHitSparks(x, y, color = 0xffd166, count = 5) {
    for (let i = 0; i < Math.min(count, this.settings.sparks); i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 18;
      this.transient(x, y, (effect) => {
        effect.fillStyle(color, 0.8).fillCircle(0, 0, 2);
      }, {
        x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance,
        scaleX: 0.1, scaleY: 0.1, duration: 200 + Math.random() * 100,
      });
    }
  }

  spawnEnemyDeathDebris(x, y) {
    const colors = [0xf97316, 0xef4444, 0xfacc15, 0xffffff];
    for (let i = 0; i < Math.min(7, this.settings.sparks); i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 12 + Math.random() * 26;
      this.transient(x, y, (effect) => {
        effect.fillStyle(colors[i % colors.length], 0.8).fillRect(-1.5, -1.5, 3, 3);
      }, {
        x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance,
        rotation: Math.random() * Math.PI * 2, scaleX: 0.2, scaleY: 0.2, duration: 320,
      });
    }
  }

  spawnLevelUpAura(x, y) {
    this.impactRing(x, y, 0xfbbf24, 90, 500);
    this.spawnHitSparks(x, y, 0xfef08a, 8);
  }

  impactRing(x, y, color = 0xfbbf24, radius = 26, duration = 220) {
    const effect = this.transient(x, y, (ring) => {
      ring.lineStyle(2, color, 0.75).strokeCircle(0, 0, radius);
    }, { scaleX: 1, scaleY: 1, duration, ease: "Quad.easeOut" });
    effect?.setScale(Math.min(1, 8 / radius));
    return effect;
  }

  weaponSwing(x, y, angle, evolved = false) {
    return this.transient(x, y, (effect) => {
      // Segmented warm crescent, no filled disk obscuring targets.
      for (let i = 0; i < 9; i++) {
        const a = angle - 0.8 + i * 0.18;
        const b = a + 0.15;
        const radius = evolved ? 38 : 30;
        effect.lineStyle(evolved ? 4 : 3, i < 5 ? 0xf97316 : 0xffdc73, 0.3 + i * 0.06);
        effect.lineBetween(Math.cos(a) * radius, Math.sin(a) * radius,
          Math.cos(b) * radius, Math.sin(b) * radius);
      }
    }, { scaleX: 1.25, scaleY: 1.25, duration: 160 });
  }

  energyLink(x, y, targetX, targetY) {
    return this.transient(x, y, (effect) => {
      const dx = targetX - x;
      const dy = targetY - y;
      effect.lineStyle(4, 0xf97316, 0.35).lineBetween(0, 0, dx, dy);
      effect.lineStyle(1.5, 0xffe6a3, 0.9).lineBetween(0, 0, dx, dy);
    }, { duration: 140 });
  }

  projectileTrail(x, y, angle, skill = false) {
    return this.transient(x, y, (effect) => {
      effect.lineStyle(skill ? 3 : 2, skill ? 0xffd166 : 0xfb923c, 0.55);
      effect.lineBetween(0, 0, -Math.cos(angle) * 14, -Math.sin(angle) * 14);
    }, { duration: 110, scaleX: 0.6, scaleY: 0.6 });
  }

  castPulse(x, y, color = 0xffd166) {
    this.impactRing(x, y, color, 32, 170);
    this.spawnHitSparks(x, y, color, 3);
  }

  shockwave(x, y, radius, color = 0xf97316, evolved = false) {
    this.impactRing(x, y, color, radius, evolved ? 320 : 260);
    if (evolved) this.impactRing(x, y, 0xffd166, radius * 0.76, 240);
  }

  ultimateBlast(x, y, radius, evolved = false) {
    this.impactRing(x, y, evolved ? 0xfff5cf : 0xfbbf24, radius, evolved ? 360 : 450);
    this.impactRing(x, y, evolved ? 0xfb923c : 0xffe6a3, radius * 0.78, 320);
    if (evolved) {
      // Evolution has eight rays, unlike initial gold double ring.
      this.transient(x, y, (effect) => {
        effect.lineStyle(2, 0xffdf80, 0.6);
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          effect.lineBetween(Math.cos(angle) * 24, Math.sin(angle) * 24,
            Math.cos(angle) * 90, Math.sin(angle) * 90);
        }
      }, { scaleX: 1.8, scaleY: 1.8, duration: 280 });
    }
    this.spawnHitSparks(x, y, evolved ? 0xfff5cf : 0xffd166, 6);
  }

  /**
   * Controlled camera shake with rate-limiting
   * @param {number} duration
   * @param {number} intensity
   */
  shakeCamera(duration = 120, intensity = 0.005) {
    const now = this.scene?.time?.now ?? Date.now();
    if (now - this.lastShakeTime < VFX_CONFIG.SHAKE_COOLDOWN_MS) return;
    this.lastShakeTime = now;

    if (this.scene?.cameras?.main) {
      this.scene.cameras.main.shake(Math.max(0, Math.min(180, duration)),
        Math.max(0, Math.min(0.006, intensity)));
    }
  }

  /**
   * Cleans all active effects from scene
   */
  clearAll() {
    for (const text of this.activeDamageTexts) {
      this.scene?.tweens?.killTweensOf(text);
      text.destroy();
    }
    this.activeDamageTexts.length = 0;
    for (const effect of [...this.activeParticles]) this.recycle(effect);
  }

  destroy() {
    this.clearAll();
    for (const effect of this.particlePool) effect.destroy();
    this.particlePool.length = 0;
    this.scene = null;
  }
}
