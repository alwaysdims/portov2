import { expect, test, vi } from 'vitest';
import { attachCombatInput, createCombatInput, consumeCombatInput } from '../combatInput.js';

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
