import { expect, test } from 'vitest';
import { advanceObjectives, canInteract, collectProduct, createObjectives, GATE, gatePose, nearestInteraction, objectiveSnapshot, PRODUCT } from '../objectives.js';
import { createCombat, prepareCombat } from '../combat.js';

const player = (position = PRODUCT.position) => ({ hp: 100, state: 'IDLE', position: { ...position } });
function tick(state, actor, extra = {}, visible) {
  advanceObjectives(state, { tick: state.tick + 1, player: actor, ...extra }, visible);
}
function open(state, actor = player()) {
  tick(state, actor, { events: state.requiredGuards.map((id, index) => ({ id: index + 1, type: 'death', targetId: id })) });
  for (let i = 0; i < GATE.duration; i++) tick(state, actor);
}

test('objective stages, mandatory deaths, duplicate events and clear are deterministic/idempotent', () => {
  const state = createObjectives(['a', 'b', 'a']);
  const actor = player({ x: 0, y: 0.87, z: -1 });
  tick(state, actor); expect(state.stage).toBe('APPROACH_ARENA');
  actor.position.z = 12; tick(state, actor); expect(state.stage).toBe('DEFEAT_GUARDS');
  const events = [{ id: 1, type: 'hit', targetId: 'b' }, { id: 2, type: 'death', targetId: 'other' }, { id: 3, type: 'death', targetId: 'a' }];
  tick(state, actor, { events }); tick(state, actor, { events });
  expect(objectiveSnapshot(state).remaining).toBe(1); expect(state.gate).toBe('LOCKED');
  events.push({ id: 4, type: 'death', targetId: 'b' });
  tick(state, actor, { events }); expect(state.stage).toBe('UNLOCK_KOPDES');
  expect(gatePose(state).y).toBe(GATE.position[1]);
  for (let i = 0; i < GATE.duration - 1; i++) tick(state, actor, { events });
  expect(state.gate).toBe('UNLOCKING');
  const age = state.gateAge;
  advanceObjectives(state, { tick: state.tick, player: actor, events });
  expect(state.gateAge).toBe(age);
  tick(state, actor, { events }); expect(state.gate).toBe('OPEN'); expect(state.stage).toBe('ENTER_KOPDES');
  expect(state.clearCount).toBe(1); expect(objectiveSnapshot(state).notification).toBe(true);
  actor.position.z = 30; tick(state, actor); expect(state.stage).toBe('SHOPPING_ACTIVE');
  actor.position = { ...PRODUCT.position }; tick(state, actor, { interact: true });
  expect(state.stage).toBe('SHOPPING_ACTIVE'); expect(state.cart).toEqual({ quantity: 1, total: 14000 }); expect(state.stock).toBe(5);
  for (let i = 0; i < 181; i++) tick(state, actor, { interact: true, events });
  // After 181 more interact ticks: 5 more BR collected (total 6), then stock 0; clearCount still 1 (events already processed)
  expect(state.clearCount).toBe(1); expect(state.stock).toBe(0); expect(objectiveSnapshot(state).notification).toBe(false);
});

test('nearest radius inclusive, stable ID tie, visibility, invalid targets and vertical range', () => {
  const actor = player({ x: 0, y: 0, z: 0 });
  const a = { id: 'a', position: { x: -1, y: 0, z: 0 }, radius: 1 };
  const b = { id: 'b', position: { x: 1, y: 0, z: 0 }, radius: 1 };
  expect(nearestInteraction(actor, [b, a])).toBe(a);
  expect(nearestInteraction(actor, [a, b])).toBe(a);
  expect(nearestInteraction(actor, [a, b], (_, to) => to.x > 0)).toBe(b);
  expect(nearestInteraction(actor, [a], () => false)).toBe(null);
  expect(nearestInteraction(actor, [{ ...a, position: { x: 0, y: 2, z: 0 } }, { ...b, radius: NaN }])).toBe(null);
  expect(nearestInteraction(actor, [{ ...a, enabled: false }])).toBe(null);
  actor.position.x = NaN; expect(nearestInteraction(actor, [a])).toBe(null);
});

test.each(['DEAD', 'ATTACK', 'DASH', 'HURT', 'STUNNED'])('interaction blocked during %s without buffering', stateName => {
  const state = createObjectives(); const actor = player(); open(state, actor);
  actor.state = stateName; tick(state, actor, { interact: true });
  expect(state.prompt).toBe(null); expect(state.stock).toBe(6);
  actor.state = 'IDLE'; tick(state, actor); expect(state.stock).toBe(6);
});

test('independent hurt/stun deadlines, HP and active actions block interaction', () => {
  for (const extra of [{ hp: 0 }, { attack: {} }, { dash: {} }, { stunUntil: 100 }, { _hurtUntil: 100 }]) {
    expect(canInteract({ ...player(), ...extra }, 1)).toBe(false);
  }
});

test('locked gate, distance and LOS prevent collection', () => {
  const state = createObjectives(); const actor = player();
  tick(state, actor, { interact: true }); expect(state.stock).toBe(6);
  open(state, actor);
  tick(state, actor, { interact: true }, () => false); expect(state.stock).toBe(6);
  actor.position.z -= 2; tick(state, actor, { interact: true }); expect(state.stock).toBe(6);
  actor.position = { ...PRODUCT.position }; tick(state, actor, { interact: true }); expect(state.stock).toBe(5);
});

test.each([0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER, '1'])('quantity %s rejected without mutation', quantity => {
  const state = createObjectives(); open(state);
  const stockBefore = state.shopping.stock.BR;
  expect(collectProduct(state, 'BR', quantity)).toBe(false);
  expect(state.shopping.stock.BR).toBe(stockBefore);
});

test('unknown SKU and duplicate collection handled by shopping domain', () => {
  const state = createObjectives(); open(state);
  expect(collectProduct(state, 'UNKNOWN')).toBe(false);
  // Collect all required items for Level 1
  expect(collectProduct(state, 'BR')).toBe(true);
  expect(collectProduct(state, 'BR')).toBe(true);
  expect(collectProduct(state, 'MY')).toBe(true);
  expect(collectProduct(state, 'GU')).toBe(true);
  expect(collectProduct(state, 'TL')).toBe(true);
  expect(state.stage).toBe('READY_FOR_CHECKOUT');
  // Extra BR still works (stock available)
  expect(collectProduct(state, 'BR')).toBe(true);
  expect(state.shopping.stock.BR).toBe(3);
  const snapshot = objectiveSnapshot(state);
  expect(snapshot.basketTotal).toBeGreaterThan(0);
});

test('retry factory resets objective, encounter, gate, notification, prompt, cart and stock', () => {
  for (let attempt = 0; attempt < 3; attempt++) {
    const state = createObjectives(); const combat = createCombat();
    expect(state).toMatchObject({ stage: 'APPROACH_ARENA', gate: 'LOCKED', gateAge: 0, openedAt: null, stock: 6, clearCount: 0, prompt: null, cart: { quantity: 0, total: 0 } });
    expect(combat.guard.hp).toBe(50); expect(combat.events).toEqual([]);
    open(state); collectProduct(state);
    combat.guard.hp = 0; prepareCombat(combat);
    expect(combat.events.filter(event => event.type === 'death')).toHaveLength(1);
    prepareCombat(combat); expect(combat.events.filter(event => event.type === 'death')).toHaveLength(1);
  }
});
