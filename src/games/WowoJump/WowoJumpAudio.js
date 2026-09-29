// WowoJump Audio Synthesizer via Web Audio API (zero external assets needed)

class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.isPlayingBgm = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    try {
      const saved = localStorage.getItem("wowojump-muted");
      if (saved !== null) {
        this.isMuted = saved === "true";
      }
    } catch {
      this.isMuted = false;
    }
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().catch(() => {});
      }
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);
    } catch {
      // Audio unsupported or blocked
    }
  }

  setMuted(muted) {
    this.isMuted = Boolean(muted);
    try {
      localStorage.setItem("wowojump-muted", String(this.isMuted));
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
    return this.isMuted;
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  // SFX: Boing / Jump
  playJump() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.14);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // ignore
    }
  }

  // SFX: Super Spring Bounce
  playSpring() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // ignore
    }
  }

  // SFX: Coin collected
  playCoin() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      // B5 then E6 bright bell
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.07);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // ignore
    }
  }

  // SFX: Damage taken (Sawit thorn)
  playDamage() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // ignore
    }
  }

  // SFX: Life restored (+1 Nyawa)
  playLife() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.13);
      });
    } catch {
      // ignore
    }
  }

  // SFX: Powerup activated
  playPowerup() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [392, 523.25, 659.25, 880]; // G4, C5, E5, A5
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.05;
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.11);
      });
    } catch {
      // ignore
    }
  }

  // SFX: Rocket Boost Launch
  playRocket() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.35);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // ignore
    }
  }

  // SFX: Game Over jingle
  playGameOver() {
    this.init();
    if (!this.ctx || this.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 369.99, 329.63, 261.63]; // A4, F#4, E4, C4
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.14;
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch {
      // ignore
    }
  }

  // 8-bit Chiptune Background Music
  startBgm() {
    if (this.isPlayingBgm) return;
    this.init();
    if (!this.ctx) return;
    this.isPlayingBgm = true;

    // Upbeat retro loop melody (C pentatonic / arcade groove)
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

    const stepDuration = 140; // ms per 16th note (~107 BPM)

    this.bgmTimer = setInterval(() => {
      if (!this.isPlayingBgm || !this.ctx || this.isMuted) return;
      try {
        const now = this.ctx.currentTime;
        const noteIndex = this.bgmStep % melody.length;
        const freq = melody[noteIndex];

        if (freq > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0.07, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(gain);
          gain.connect(this.bgmGain);
          osc.start(now);
          osc.stop(now + 0.11);
        }

        // Bassline on 8th beats
        if (this.bgmStep % 2 === 0) {
          const bassIndex = Math.floor(this.bgmStep / 2) % bass.length;
          const bassFreq = bass[bassIndex];
          const bassOsc = this.ctx.createOscillator();
          const bassGain = this.ctx.createGain();
          bassOsc.type = "triangle";
          bassOsc.frequency.setValueAtTime(bassFreq, now);
          bassGain.gain.setValueAtTime(0.12, now);
          bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          bassOsc.connect(bassGain);
          bassGain.connect(this.bgmGain);
          bassOsc.start(now);
          bassOsc.stop(now + 0.21);
        }

        this.bgmStep = (this.bgmStep + 1) % 1024;
      } catch {
        // ignore audio glitch
      }
    }, stepDuration);
  }

  stopBgm() {
    this.isPlayingBgm = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  destroy() {
    this.stopBgm();
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
      this.ctx = null;
    }
  }
}

export const audioManager = new AudioManager();
