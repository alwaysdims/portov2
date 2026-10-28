import { test, expect, vi } from 'vitest';
import { KEY_BINDINGS, keyHint, attachCombatInput, createCombatInput, consumeCombatInput } from '../combatInput.js';

test('R/F are debounced, cleared on lockout/blur/unmount and cannot leak into shopping', () => {
  const listeners = new Map();
  const target = () => ({ addEventListener(type, fn) { listeners.set(fn, type); }, removeEventListener(type, fn) { listeners.delete(fn); } });
  const canvas = {};
  const doc = { ...target(), pointerLockElement: canvas, exitPointerLock: vi.fn(), hidden: false };
  vi.stubGlobal('document', doc); vi.stubGlobal('window', target());
  const input = createCombatInput(0);
  let modal = false, fighting = true;
  const cleanup = attachCombatInput(canvas, vi.fn(), input, { blocked: () => modal, combatEnabled: () => fighting });
  const send = (type, fields = {}) => { for (const [fn, name] of listeners) if (name === type) fn({ preventDefault() {}, ...fields }); };
  try {
    expect(KEY_BINDINGS.interact).toEqual(['KeyE']);
    expect(keyHint('prison')).toBe('R'); expect(keyHint('ultimate')).toBe('F');
    for (const [code, action] of [['KeyR', 'prison'], ['KeyF', 'ultimate']]) {
      send('keydown', { code }); expect(consumeCombatInput(input)[action]).toBe(true);
      send('keydown', { code, repeat: true }); expect(consumeCombatInput(input)[action]).toBe(false);
      send('keydown', { code }); expect(consumeCombatInput(input)[action]).toBe(false);
      send('keyup', { code }); send('keydown', { code }); expect(consumeCombatInput(input)[action]).toBe(true);
      send('keyup', { code });
    }
    fighting = false;
    send('keydown', { code: 'KeyR' }); send('keydown', { code: 'KeyF' }); send('keydown', { code: 'KeyE' });
    expect(consumeCombatInput(input)).toMatchObject({ prison: false, ultimate: false, interact: true });
    fighting = true;
    send('blur'); modal = true;
    send('keydown', { code: 'KeyR' }); send('keydown', { code: 'KeyF' });
    expect(consumeCombatInput(input)).toMatchObject({ prison: false, ultimate: false });
    modal = false; doc.pointerLockElement = null;
    send('keydown', { code: 'KeyR' }); expect(consumeCombatInput(input).prison).toBe(false);
    doc.pointerLockElement = canvas; send('pointerlockchange');
    send('keydown', { code: 'KeyF', target: { closest: () => ({}) } });
    expect(consumeCombatInput(input).ultimate).toBe(false);
    send('keydown', { code: 'KeyR' }); send('keydown', { code: 'KeyF' });
    cleanup();
    expect(consumeCombatInput(input)).toMatchObject({ prison: false, ultimate: false });
    expect(input.held.size).toBe(0); expect(listeners.size).toBe(0);
  } finally { cleanup(); vi.unstubAllGlobals(); }
});
