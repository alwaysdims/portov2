import { expect, test, vi } from 'vitest';
import { attachCombatInput, clearCombatInput, createCombatInput, consumeCombatInput } from '../combatInput.js';

test('input edges do not repeat, blur clears commands, cleanup removes every listener', () => {
  const listeners = new Map();
  const target = () => ({ addEventListener(type, fn) { listeners.set(fn, type); }, removeEventListener(type, fn) { expect(listeners.get(fn)).toBe(type); listeners.delete(fn); } });
  const win = target();
  const doc = { ...target(), hidden:false, pointerLockElement:null, exitPointerLock:vi.fn() };
  vi.stubGlobal('window',win);vi.stubGlobal('document',doc);
  const canvas={}; doc.pointerLockElement=canvas;
  const controls=createCombatInput(Math.PI);
  const clean=attachCombatInput(canvas,vi.fn(),controls);
  function dispatch(type, fields={}) { for(const [fn,eventType] of listeners)if(eventType===type)fn({preventDefault(){},...fields}); }
  dispatch('keydown',{code:'KeyE',repeat:false});
  expect(consumeCombatInput(controls).interact).toBe(true);
  dispatch('keydown',{code:'KeyE',repeat:true});
  dispatch('keydown',{code:'KeyE',repeat:false});
  expect(consumeCombatInput(controls).interact).toBe(false);
  dispatch('keyup',{code:'KeyE'});
  dispatch('keydown',{code:'KeyE'});
  expect(consumeCombatInput(controls).interact).toBe(true);
  dispatch('keyup',{code:'KeyE'});
  dispatch('keydown',{code:'KeyE'});
  dispatch('keydown',{code:'KeyQ',repeat:false});
  dispatch('keydown',{code:'KeyQ',repeat:true});
  expect(consumeCombatInput(controls).switchStance).toBe(true);
  expect(consumeCombatInput(controls).switchStance).toBe(false);
  dispatch('mousedown',{button:0,target:canvas});
  dispatch('keydown',{code:'Digit1'});
  expect(consumeCombatInput(controls)).toMatchObject({attack:true,dash:true});
  dispatch('keydown',{code:'KeyQ'});
  dispatch('keyup',{code:'KeyE'}); dispatch('keydown',{code:'KeyE'});
  dispatch('blur');
  expect(consumeCombatInput(controls)).toMatchObject({attack:false,dash:false,switchStance:false,interact:false});
  expect(controls.keys.size).toBe(0);
  expect(doc.exitPointerLock).toHaveBeenCalled();
  clean();expect(listeners.size).toBe(0);
  for (let attempt=0;attempt<3;attempt++) {
    const fresh = createCombatInput(Math.PI);
    const dispose = attachCombatInput(canvas,vi.fn(),fresh);
    expect(listeners.size).toBe(7);
    doc.pointerLockElement = canvas; dispatch('pointerlockchange');
    dispatch('keydown',{code:'KeyE'}); expect(consumeCombatInput(fresh).interact).toBe(true);
    dispatch('keydown',{code:'KeyE',repeat:true}); expect(consumeCombatInput(fresh).interact).toBe(false);
    doc.pointerLockElement = null;
    dispatch('pointerlockchange');
    dispatch('keydown',{code:'KeyJ'});
    expect(consumeCombatInput(fresh).attack).toBe(false);
    dispose();expect(listeners.size).toBe(0);
  }
  vi.unstubAllGlobals();
});

test('shopping blocks combat, modal blocks movement and E, UI clicks never queue attacks', () => {
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
    send('pointerlockchange');
    send('mousedown', { button: 0, target: {} });
    expect(consumeCombatInput(input).attack).toBe(false);
    send('keydown', { code: 'KeyJ', target: { closest: () => ({}) } });
    expect(consumeCombatInput(input).attack).toBe(false);
    fighting = false;
    for (const code of ['KeyJ', 'KeyQ', 'Digit1', 'Space', 'KeyE', 'KeyW']) send('keydown', { code });
    send('mousedown', { button: 0, target: canvas });
    expect(consumeCombatInput(input)).toMatchObject({ attack: false, dash: false, switchStance: false, interact: true });
    expect(input.keys.has('KeyW')).toBe(true);
    modal = true;
    clearCombatInput(input);
    send('keydown', { code: 'KeyE' }); send('keydown', { code: 'KeyW' });
    send('mousemove', { movementX: 50, movementY: 50 });
    send('mousedown', { button: 0, target: canvas });
    expect(consumeCombatInput(input)).toMatchObject({ attack: false, dash: false, switchStance: false, interact: false, yaw: 0 });
    expect(input.keys.size).toBe(0);
    send('pointerlockchange');
    expect(input.locked).toBe(false);
    expect(doc.exitPointerLock).toHaveBeenCalled();
    doc.pointerLockElement = null;
    modal = false; fighting = true;
    send('mousedown', { button: 0, target: canvas });
    expect(consumeCombatInput(input).attack).toBe(false);
    doc.pointerLockElement = canvas; send('pointerlockchange');
    expect(consumeCombatInput(input)).toMatchObject({ attack: false, dash: false, switchStance: false, interact: false });
    send('keydown', { code: 'KeyE' });
    expect(consumeCombatInput(input).interact).toBe(true);
    send('visibilitychange');
    doc.hidden = true; send('visibilitychange');
    expect(input.locked).toBe(false);
    expect(input.held.size).toBe(0);
  } finally {
    cleanup();
    expect(listeners.size).toBe(0);
    vi.unstubAllGlobals();
  }
});
