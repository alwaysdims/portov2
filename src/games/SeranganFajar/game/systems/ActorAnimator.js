// Fixed-grid authored frames; animation owns visuals, never physics or movement.
export const WOWO_ANIMATIONS = {
  idle: [0, 6, 8, true], walk: [1, 8, 12, true], run: [2, 8, 16, true],
  attack: [3, 6, 18], skillQ: [4, 6, 16], skillE: [5, 6, 16],
  skillR: [6, 8, 16], hurt: [7, 4, 16], death: [8, 8, 12],
};
export const NAGA_ANIMATIONS = {
  idle: [0, 6, 8, true], move: [1, 8, 12, true], windup: [2, 6, 12],
  breath: [3, 6, 12], slash: [4, 6, 14], spread: [5, 6, 14],
  summon: [6, 6, 10], hurt: [7, 4, 16], phase: [8, 8, 12], death: [9, 8, 10],
};

export function registerActorAnimations(scene, texture, definitions) {
  for (const [state, [row, count, frameRate, loop]] of Object.entries(definitions)) {
    const key = `${texture}:${state}`;
    if (!scene.anims.exists(key)) scene.anims.create({
      key, frames: scene.anims.generateFrameNumbers(texture, { start: row * 8, end: row * 8 + count - 1 }),
      frameRate, repeat: loop ? -1 : 0,
    });
  }
}

const PRIORITY = { idle: 0, walk: 0, run: 0, attack: 1, skillQ: 2, skillE: 2, skillR: 2, hurt: 3, death: 4 };

export class ActorAnimator {
  constructor(sprite, texture, definitions = WOWO_ANIMATIONS) {
    this.sprite = sprite;
    this.texture = texture;
    this.definitions = definitions;
    this.state = null;
    this.remaining = 0;
    this.setState('idle');
  }

  setState(state) {
    if (this.state === state || !this.definitions[state] || !this.sprite?.active) return false;
    this.state = state;
    this.sprite.play(`${this.texture}:${state}`);
    return true;
  }

  trigger(state) {
    if (!this.definitions[state] || this.state === 'death') return false;
    if (this.remaining > 0 && (PRIORITY[state] ?? 1) < (PRIORITY[this.state] ?? 1)) return false;
    if (this.state === state && this.remaining > 0) return false;
    const [, count, fps] = this.definitions[state];
    this.remaining = state === 'death' ? Infinity : count / fps;
    return this.setState(state);
  }

  update(deltaSeconds, moving = false, running = false, paused = false) {
    if (!this.sprite?.active) return;
    if (paused) { this.sprite.anims.pause(); return; }
    if (this.sprite.anims.isPaused) this.sprite.anims.resume();
    if (this.state === 'death') return;
    this.remaining = Math.max(0, this.remaining - deltaSeconds);
    if (this.remaining === 0) this.setState(moving ? (running ? 'run' : 'walk') : 'idle');
  }

  destroy() {
    this.sprite?.anims?.stop();
    this.sprite = null;
  }
}
