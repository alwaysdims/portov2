// AudioManager.js — Pure Web Audio API synthesized sound effects and chiptune BGM
// Zero external audio assets footprint, 100% reliable across browsers and offline.

const MUTED_STORAGE_KEY = "seranganFajarMuted";

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    this.isPlayingBgm = false;
    this.isBgmPaused = false;
    this.bgmTimer = null;
    this.bgmStep = 0;

    // Throttle timestamps to prevent audio stutter under high spawn density
    this.lastAttackSound = 0;
    this.lastHitSound = 0;
    this.lastHurtSound = 0;
    this.lastXpSound = 0;

    // Load persisted mute preference
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(MUTED_STORAGE_KEY);
        if (saved !== null) {
          this.isMuted = saved === "true";
        }
      }
    } catch {
      this.isMuted = false;
    }
  }

  /**
   * Initializes or resumes AudioContext upon user gesture
   */
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master Gain Node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // BGM Gain Node (lower default volume for non-intrusive background music)
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      // SFX Gain Node
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch {
      // AudioContext unavailable or blocked by autoplay
    }
  }

  /**
   * Sets mute state and updates master gain
   * @param {boolean} muted
   * @returns {boolean}
   */
  setMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(MUTED_STORAGE_KEY, String(this.isMuted));
      }
    } catch {
      // Ignore storage error
    }

    if (this.masterGain && this.ctx) {
      try {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, now);
      } catch {
        // Ignore gain error
      }
    }

    return this.isMuted;
  }

  /**
   * Toggles mute state
   * @returns {boolean} new mute state
   */
  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  // =========================================================================
  // SYNTHESIZED SOUND EFFECTS (SFX)
  // =========================================================================

  /**
   * Basic Attack: Surat Suara shot (crisp paper flutter / zip)
   */
  playAttack() {
    const nowMs = Date.now();
    if (nowMs - this.lastAttackSound < 120) return;
    this.lastAttackSound = nowMs;

    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.07);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.09);
    } catch {
      // Ignore
    }
  }

  /**
   * Enemy Hit: impact click
   */
  playEnemyHit() {
    const nowMs = Date.now();
    if (nowMs - this.lastHitSound < 60) return;
    this.lastHitSound = nowMs;

    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Boss Hit: heavy thudding impact
   */
  playBossHit() {
    const nowMs = Date.now();
    if (nowMs - this.lastHitSound < 90) return;
    this.lastHitSound = nowMs;

    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch {
      // Ignore
    }
  }

  /**
   * Enemy Death: retro defeat pop & crunch
   */
  playEnemyDeath() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.17);
    } catch {
      // Ignore
    }
  }

  /**
   * Player Hurt: dull thud / grunt
   */
  playPlayerHurt() {
    const nowMs = Date.now();
    if (nowMs - this.lastHurtSound < 200) return;
    this.lastHurtSound = nowMs;

    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.14);
    } catch {
      // Ignore
    }
  }

  /**
   * Skill 1: Tebar Pesona (Triple Envelope Burst)
   */
  playSkill1() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.04;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.3, start + 0.08);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.1);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Skill 2: Orasi Akbar (Megaphone Sonic Boom)
   */
  playSkill2() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.09);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.24);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {
      // Ignore
    }
  }

  /**
   * Ultimate: Serangan Fajar (Golden Blast & Chime)
   */
  playUltimate() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;

      // 1. Deep Sub-Bass Impact
      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = "triangle";
      sub.frequency.setValueAtTime(150, t);
      sub.frequency.exponentialRampToValueAtTime(35, t + 0.45);
      subGain.gain.setValueAtTime(0.45, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.46);
      sub.connect(subGain);
      subGain.connect(this.sfxGain);
      sub.start(t);
      sub.stop(t + 0.48);

      // 2. High Shimmer Golden Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.06;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  playSkillQ() {
    this.playSkill1();
  }

  playSkillE() {
    this.playSkill2();
  }

  playSkillR() {
    this.playUltimate();
  }

  /**
   * Pickup: Suara / XP blip
   */
  playPickupXp() {
    const nowMs = Date.now();
    if (nowMs - this.lastXpSound < 45) return;
    this.lastXpSound = nowMs;

    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Pickup: Dana / Coin ring
   */
  playPickupCoin() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(987.77, t); // B5
      osc2.frequency.setValueAtTime(1318.51, t + 0.06); // E6

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc1.stop(t + 0.07);
      osc2.start(t + 0.06);
      osc2.stop(t + 0.15);
    } catch {
      // Ignore
    }
  }

  /**
   * Level Up: Fanfare arpeggio
   */
  playLevelUp() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25]; // C4, E4, G4, C5, E5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.07;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Combo streak milestone chime
   */
  playCombo() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [440.0, 554.37, 659.25]; // A4, C#5, E5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.05;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Achievement unlock fanfare
   */
  playAchievement() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [329.63, 440.0, 554.37, 659.25, 880.0]; // E4, A4, C#5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.06;

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Game Over: Descending defeat sequence
   */
  playGameOver() {
    this.init();
    if (!this.ctx || this.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [392.0, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = t + idx * 0.12;

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.26);
      });
    } catch {
      // Ignore
    }
  }

  // =========================================================================
  // RETRO CHIPTUNE BACKGROUND MUSIC (BGM)
  // =========================================================================

  /**
   * Starts synthesized chiptune arcade background music
   */
  startBgm() {
    if (this.isPlayingBgm) return;
    this.init();
    if (!this.ctx) return;

    this.isPlayingBgm = true;
    this.isBgmPaused = false;

    // Upbeat political rally / arcade chiptune melody
    const melody = [
      261.63, 0, 329.63, 392.0, 523.25, 392.0, 329.63, 0,
      293.66, 0, 349.23, 440.0, 587.33, 440.0, 349.23, 0,
      329.63, 0, 392.0, 523.25, 659.25, 523.25, 392.0, 0,
      392.0, 329.63, 293.66, 261.63, 293.66, 0, 261.63, 0,
    ];

    const bass = [
      130.81, 130.81, 130.81, 130.81,
      146.83, 146.83, 146.83, 146.83,
      164.81, 164.81, 164.81, 164.81,
      196.0, 196.0, 130.81, 130.81,
    ];

    const stepDuration = 140; // ms per step (~107 BPM)

    this.bgmTimer = setInterval(() => {
      if (!this.isPlayingBgm || this.isBgmPaused || !this.ctx || this.isMuted) return;

      try {
        const now = this.ctx.currentTime;
        const noteIndex = this.bgmStep % melody.length;
        const freq = melody[noteIndex];

        // 1. Lead Melody Note
        if (freq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(this.bgmGain);
          osc.start(now);
          osc.stop(now + 0.11);
        }

        // 2. Bassline Note (every 2 steps)
        if (this.bgmStep % 2 === 0) {
          const bassIndex = Math.floor(this.bgmStep / 2) % bass.length;
          const bassFreq = bass[bassIndex];
          if (bassFreq > 0) {
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = "triangle";
            bOsc.frequency.setValueAtTime(bassFreq, now);
            bGain.gain.setValueAtTime(0.09, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            bOsc.connect(bGain);
            bGain.connect(this.bgmGain);
            bOsc.start(now);
            bOsc.stop(now + 0.22);
          }
        }

        this.bgmStep = (this.bgmStep + 1) % (melody.length * 4);
      } catch {
        // Ignore audio node error
      }
    }, stepDuration);
  }

  /**
   * Pauses BGM playback
   */
  pauseBgm() {
    this.isBgmPaused = true;
  }

  /**
   * Resumes BGM playback
   */
  resumeBgm() {
    this.isBgmPaused = false;
    if (!this.isPlayingBgm) {
      this.startBgm();
    }
  }

  /**
   * Stops BGM playback and resets loop
   */
  stopBgm() {
    this.isPlayingBgm = false;
    this.isBgmPaused = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    this.bgmStep = 0;
  }

  /**
   * Cleans up audio resources
   */
  destroy() {
    this.stopBgm();
    if (this.ctx) {
      try {
        this.ctx.close().catch(() => {});
      } catch {
        // Ignore
      }
      this.ctx = null;
    }
  }
}

// Global shared singleton instance
export const audioManager = new AudioManager();
