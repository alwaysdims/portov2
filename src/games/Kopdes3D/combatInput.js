const movement = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight']);
const actions = { KeyQ: 'switchStance', Space: 'dash', Digit1: 'dash', KeyJ: 'attack', KeyE: 'interact' };

export function createCombatInput(yaw) {
  return { keys: new Set(), held: new Set(), yaw, pitch: 0.35, attack: false, dash: false, switchStance: false, interact: false, locked: false, cameraReady: false };
}

export function consumeCombatInput(input) {
  const command = { keys: input.keys, yaw: input.yaw, attack: input.attack, dash: input.dash, switchStance: input.switchStance, interact: input.interact };
  input.attack = input.dash = input.switchStance = input.interact = false;
  return command;
}

export function attachCombatInput(canvas, onLockChange, input) {
  function clear() {
    input.keys.clear(); input.held.clear();
    input.attack = input.dash = input.switchStance = input.interact = false;
  }
  function release() {
    clear(); input.locked = false;
    onLockChange(false);
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }
  function lockChanged() {
    clear();
    input.locked = document.pointerLockElement === canvas;
    onLockChange(input.locked);
  }
  function keyDown(event) {
    if (event.code === 'Escape' && document.pointerLockElement === canvas) { release(); return; }
    if (document.pointerLockElement !== canvas || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!movement.has(event.code) && !actions[event.code]) return;
    event.preventDefault();
    if (movement.has(event.code)) input.keys.add(event.code);
    if (!event.repeat && !input.held.has(event.code) && actions[event.code]) input[actions[event.code]] = true;
    input.held.add(event.code);
  }
  function keyUp(event) { input.keys.delete(event.code); input.held.delete(event.code); }
  function mouseDown(event) {
    if (event.button === 0 && event.target === canvas && document.pointerLockElement === canvas) input.attack = true;
  }
  function mouseMove(event) {
    if (document.pointerLockElement !== canvas || !Number.isFinite(event.movementX) || !Number.isFinite(event.movementY)) return;
    input.yaw = (input.yaw - Math.max(-1000, Math.min(1000, event.movementX)) * 0.002) % (Math.PI * 2);
    input.pitch = Math.max(-0.1, Math.min(1.05, input.pitch + Math.max(-1000, Math.min(1000, event.movementY)) * 0.002));
  }
  function visibilityChanged() { if (document.hidden) release(); }
  const listeners = [[window, 'keydown', keyDown], [window, 'keyup', keyUp], [window, 'blur', release],
    [document, 'mousedown', mouseDown], [document, 'mousemove', mouseMove],
    [document, 'pointerlockchange', lockChanged], [document, 'visibilitychange', visibilityChanged]];
  for (const [target, event, handler] of listeners) target.addEventListener(event, handler);
  return () => {
    for (const [target, event, handler] of listeners) target.removeEventListener(event, handler);
    release();
  };
}
