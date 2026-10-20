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
    this.lastShakeTime = 0;
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
      color = "#38bdf8";
      stroke = "#0369a1";
      fontSize = "14px";
    } else if (type === "ultimate") {
      color = "#fbbf24";
      stroke = "#78350f";
      fontSize = "18px";
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

  /**
   * Spawns radiant hit spark particles
   * @param {number} x
   * @param {number} y
   * @param {number} color Hex color (e.g. 0xffeb3b)
   * @param {number} count Particle count (default 5)
   */
  spawnHitSparks(x, y, color = 0xffeb3b, count = 5) {
    if (!this.scene || typeof this.scene.add?.circle !== "function") return;

    const actualCount = Math.min(count, 8);
    for (let i = 0; i < actualCount; i++) {
      if (this.activeParticles.length >= VFX_CONFIG.MAX_ACTIVE_PARTICLES) {
        const oldest = this.activeParticles.shift();
        if (oldest && oldest.active) oldest.destroy();
      }

      const p = this.scene.add.circle(x, y, 2.5, color, 0.9);
      p.setDepth(14);
      this.activeParticles.push(p);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 18 + 8;
      const destX = x + Math.cos(angle) * distance;
      const destY = y + Math.sin(angle) * distance;

      this.scene.tweens?.add({
        targets: p,
        x: destX,
        y: destY,
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: Math.random() * 100 + 200,
        ease: "Power2",
        onComplete: () => {
          const idx = this.activeParticles.indexOf(p);
          if (idx !== -1) this.activeParticles.splice(idx, 1);
          p.destroy();
        },
      });
    }
  }

  /**
   * Spawns comic debris scatter on enemy defeat
   * @param {number} x
   * @param {number} y
   */
  spawnEnemyDeathDebris(x, y) {
    if (!this.scene || typeof this.scene.add?.rectangle !== "function") return;

    const colors = [0xf97316, 0xef4444, 0xfacc15, 0xffffff];
    for (let i = 0; i < 7; i++) {
      const color = colors[i % colors.length];
      const p = this.scene.add.rectangle(x, y, 3, 3, color, 0.9);
      p.setDepth(14);
      this.activeParticles.push(p);

      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 26 + 12;
      const destX = x + Math.cos(angle) * distance;
      const destY = y + Math.sin(angle) * distance;

      this.scene.tweens?.add({
        targets: p,
        x: destX,
        y: destY,
        angle: Math.random() * 360,
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        duration: 320,
        ease: "Cubic.easeOut",
        onComplete: () => {
          const idx = this.activeParticles.indexOf(p);
          if (idx !== -1) this.activeParticles.splice(idx, 1);
          p.destroy();
        },
      });
    }
  }

  /**
   * Spawns an expanding golden aura ring for Level Up
   * @param {number} x
   * @param {number} y
   */
  spawnLevelUpAura(x, y) {
    if (!this.scene || typeof this.scene.add?.graphics !== "function") return;

    const ring = this.scene.add.graphics();
    ring.setDepth(13);

    const animObj = { radius: 10, alpha: 1.0 };
    this.scene.tweens?.add({
      targets: animObj,
      radius: 90,
      alpha: 0,
      duration: 500,
      ease: "Cubic.easeOut",
      onUpdate: () => {
        ring.clear();
        ring.lineStyle(4, 0xfbbf24, animObj.alpha);
        ring.strokeCircle(x, y, animObj.radius);
      },
      onComplete: () => {
        ring.clear();
        ring.destroy();
      },
    });

    // Sparkles radiating upward
    for (let i = 0; i < 8; i++) {
      const spark = this.scene.add.circle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 20,
        3,
        0xfef08a,
        1
      );
      spark.setDepth(14);
      this.scene.tweens?.add({
        targets: spark,
        y: spark.y - 40 - Math.random() * 20,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 450,
        ease: "Quad.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
  }

  /**
   * Controlled camera shake with rate-limiting
   * @param {number} duration
   * @param {number} intensity
   */
  shakeCamera(duration = 120, intensity = 0.005) {
    const now = Date.now();
    if (now - this.lastShakeTime < VFX_CONFIG.SHAKE_COOLDOWN_MS) return;
    this.lastShakeTime = now;

    if (this.scene?.cameras?.main) {
      this.scene.cameras.main.shake(duration, intensity);
    }
  }

  /**
   * Cleans all active effects from scene
   */
  clearAll() {
    for (let i = 0; i < this.activeDamageTexts.length; i++) {
      const txt = this.activeDamageTexts[i];
      if (txt?.active) txt.destroy();
    }
    this.activeDamageTexts = [];

    for (let i = 0; i < this.activeParticles.length; i++) {
      const p = this.activeParticles[i];
      if (p?.active) p.destroy();
    }
    this.activeParticles = [];
  }

  destroy() {
    this.clearAll();
    this.scene = null;
  }
}
