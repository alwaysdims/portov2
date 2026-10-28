import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createObjectives, advanceObjectives, applyShoppingAction, completeScoring, CASHIER_TARGET, shelfProducts, GATE, objectiveSnapshot } from '../objectives.js';
import { addToBasket, checkout, createShoppingState, inventoryValid, basketTotal } from '../shopping.js';

const actor = position => ({ hp: 100, state: 'IDLE', position: { ...position } });
const fill = state => { for (const [id, q] of [['BR', 2], ['MY', 1], ['GU', 1], ['TL', 1]]) expect(addToBasket(state, id, q).ok).toBe(true); };
function ready() {
  const state = createObjectives();
  const player = actor(CASHIER_TARGET.position);
  advanceObjectives(state, { tick: 1, player, events: [{ id: 1, type: 'death', targetId: 'guard' }] });
  for (let tick = 2; tick <= GATE.duration + 1; tick++) advanceObjectives(state, { tick, player });
  fill(state.shopping);
  advanceObjectives(state, { tick: state.tick + 1, player });
  state.stage = 'READY_FOR_CHECKOUT';
  return { state, player };
}

test('world publishes interaction on same tick before pause can freeze stale basket', () => {
  // Structural wiring guard complements the real-browser pickup/pause regression.
  const source = readFileSync(new URL('../GameWorld.jsx', import.meta.url), 'utf8');
  expect(source).toMatch(/if \(command\.current\.interact \|\|[\s\S]*?\) publish\(\);/);
  const { state } = ready();
  state.shopping.basket.BR = 1; state.shopping.stock.BR = 5;
  state.stage = 'SHOPPING_ACTIVE'; state.tick = 66;
  const player = actor(shelfProducts.find(p => p.id === 'BR').position);
  advanceObjectives(state, { tick: 67, player, interact: true });
  const paused = objectiveSnapshot(state);
  expect(paused.basket.BR).toBe(2);
  expect(applyShoppingAction(state, { type: 'REMOVE_ITEM', productId: 'BR', quantity: paused.basket.BR }, { player }).ok).toBe(true);
  expect(state.shopping.basket.BR).toBeUndefined();
  expect(state.shopping.stock.BR).toBe(6);
});

test('all SKU targets distinct and nearest position selects every required product', () => {
  expect(new Set(shelfProducts.map(p => JSON.stringify(p.position))).size).toBe(shelfProducts.length);
  for (const id of ['BR', 'MY', 'GU', 'TL']) {
    const { state } = ready();
    const player = actor(shelfProducts.find(p => p.id === id).position);
    advanceObjectives(state, { tick: state.tick + 1, player, interact: true });
    expect(state.shopping.basket[id]).toBe(id === 'BR' ? 3 : 2);
  }
});
test('combat unfinished blocks checkout even when UI stage forged', () => {
  const state = createObjectives(); fill(state.shopping); state.stage = 'READY_FOR_CHECKOUT';
  const before = JSON.stringify(state.shopping);
  expect(applyShoppingAction(state, { type: 'CHECKOUT' }, { player: actor(CASHIER_TARGET.position) }).ok).toBe(false);
  expect(JSON.stringify(state.shopping)).toBe(before);
});
test('locked gate blocks shopping', () => {
  const state = createObjectives(); state.stage = 'SHOPPING_ACTIVE';
  expect(applyShoppingAction(state, { type: 'ADD_ITEM', productId: 'BR' }, { player: actor(shelfProducts[0].position) }).ok).toBe(false);
  expect(state.shopping.basket).toEqual({});
});
test('cashier proximity and LOS revalidated on confirmation', () => {
  const { state, player } = ready();
  expect(applyShoppingAction(state, { type: 'CHECKOUT' }, { player, visible: () => false }).ok).toBe(false);
  expect(applyShoppingAction(state, { type: 'CHECKOUT' }, { player: actor({ x: 0, y: .87, z: 30 }) }).ok).toBe(false);
  expect(state.shopping.receipt).toBeNull();
});
test('double E only opens greeting; explicit confirmation pays once then receipt precedes result', () => {
  const { state, player } = ready();
  for (let i = 0; i < 2; i++) advanceObjectives(state, { tick: state.tick + 1, player, interact: true });
  expect(state.dialogState).toBe('greeting'); expect(state.shopping.receipt).toBeNull();
  const first = applyShoppingAction(state, { type: 'CHECKOUT' }, { player });
  const second = applyShoppingAction(state, { type: 'CHECKOUT' }, { player });
  expect(second.receipt).toBe(first.receipt); expect(state.shopping.budget).toBe(22000);
  expect(state.stage).toBe('CHECKOUT_COMPLETE'); expect(state.score).toBeNull();
  const result = applyShoppingAction(state, { type: 'CLOSE_RECEIPT' }, { combatStats: { damageTaken: 0, maxHP: 100 } });
  expect(state.stage).toBe('MISSION_COMPLETE'); expect(result.score.exp).toBe(150);
  expect(completeScoring(state)).toBeNull(); expect(state.rewarded).toBe(true);
});
test('guard defeat and shop entry alone cannot award completion', () => {
  const { state } = ready();
  expect(completeScoring(state)).toBeNull(); expect(state.score).toBeNull(); expect(state.rewarded).toBe(false);
});
test('expired mission and dead player reject checkout without partial purchase', () => {
  for (const failure of ['expired', 'dead']) {
    const { state, player } = ready();
    if (failure === 'expired') state.tick = state.shopping.timerStart + 300 * 60;
    else player.hp = 0;
    const before = structuredClone(state.shopping);
    expect(applyShoppingAction(state, { type: 'CHECKOUT' }, { player }).reason)
      .toBe(failure === 'expired' ? 'TIME_EXPIRED' : 'CASHIER_OUT_OF_RANGE');
    expect(state.shopping).toEqual(before);
    expect(state.score).toBeNull();
  }
});

test.each(['ADD_ITEM', 'REMOVE_ITEM'])('adapter rejects null quantity for %s without inventory mutation', type => {
  const { state } = ready();
  const player = actor(shelfProducts.find(p => p.id === 'BR').position);
  const before = structuredClone(state.shopping);
  expect(applyShoppingAction(state, { type, productId: 'BR', quantity: null }, { player }).reason).toBe('INVALID_QUANTITY');
  expect(state.shopping).toEqual(before);
});

test('deadline fails mission immediately, freezes timer and blocks shopping until retry', () => {
  const { state, player } = ready();
  const deadline = state.shopping.timerStart + 300 * 60;
  const basket = { ...state.shopping.basket };
  advanceObjectives(state, { tick: deadline - 1, player });
  expect(state.stage).toBe('READY_FOR_CHECKOUT');
  advanceObjectives(state, { tick: deadline, player, interact: true });
  expect(state.stage).toBe('MISSION_FAILED');
  expect(state.feedback).toBe('TIME_EXPIRED');
  expect(state.dialogState).toBeNull();
  expect(state.shopping.timerEnd).toBe(deadline);
  expect(state.prompt).toBeNull(); expect(state.cashierPrompt).toBeNull();
  expect(state.shopping.basket).toEqual(basket);
  expect(applyShoppingAction(state, { type: 'REMOVE_ITEM', productId: 'BR' }, { player }).ok).toBe(false);
  expect(state.shopping.receipt).toBeNull(); expect(state.rewarded).toBe(false);
  advanceObjectives(state, { tick: deadline + 20, player });
  expect(state.tick).toBe(deadline);
  expect(objectiveSnapshot(state).elapsedSeconds).toBe(300);
  expect(createObjectives().stage).toBe('APPROACH_ARENA');
});

test('exact budget pays zero change', () => {
  const state = createShoppingState(); state.budget = state.initialBudget = 78000; fill(state);
  const r = checkout(state, { runId: 'exact', simTick: 1 });
  expect(r.ok).toBe(true); expect(r.receipt.change).toBe(0); expect(inventoryValid(state)).toBe(true);
});
test('insufficient budget checkout atomic; no partial purchase', () => {
  const state = createShoppingState(); fill(state); state.budget = 77000;
  const before = structuredClone(state);
  expect(checkout(state, { runId: 'low', simTick: 1 }).reason).toBe('BUDGET_EXCEEDED');
  expect(state).toEqual(before);
});
test.each([NaN, -1, 1.5, Infinity, 99])('corrupt stock %s blocks checkout without mutation', stock => {
  const state = createShoppingState(); fill(state); state.stock.BR = stock;
  const before = structuredClone(state);
  expect(checkout(state, { runId: 'bad', simTick: 1 }).reason).toBe('INVALID_INVENTORY');
  expect(state).toEqual(before);
});
test('receipt lines deeply immutable, consistent totals, stock conserved', () => {
  const state = createShoppingState(); fill(state);
  const receipt = checkout(state, { runId: 'immutable', simTick: 100 }).receipt;
  expect(Object.isFrozen(receipt.items[0])).toBe(true);
  expect(() => { receipt.items[0].price = 1; }).toThrow();
  expect(receipt.total).toBe(receipt.items.reduce((s, i) => s + i.subtotal, 0));
  expect(inventoryValid(state)).toBe(true);
});
test('overflow basket totals rejected', () => {
  expect(basketTotal({ BR: Number.MAX_SAFE_INTEGER })).toBe(Infinity);
});
test('reset starts independent run with new token and full state', () => {
  const { state, player } = ready(); applyShoppingAction(state, { type: 'CHECKOUT' }, { player });
  const fresh = createObjectives();
  expect(fresh.runId).not.toBe(state.runId); expect(fresh.shopping.budget).toBe(100000);
  expect(fresh.shopping.receipt).toBeNull(); expect(fresh.shopping.basket).toEqual({});
  expect(fresh.gate).toBe('LOCKED'); expect(fresh.shopping.stock.BR).toBe(6); expect(fresh.score).toBeNull();
});
test('snapshot stock and basket independent from authoritative inventory', () => {
  const { state } = ready(); const snapshot = objectiveSnapshot(state);
  snapshot.stockById.BR = -1; snapshot.basket.BR = -1;
  expect(inventoryValid(state.shopping)).toBe(true);
});
test('returning item moves ready stage back to shopping, adding remotely rejected', () => {
  const { state, player } = ready();
  expect(applyShoppingAction(state, { type: 'REMOVE_ITEM', productId: 'MY' }, { player }).ok).toBe(true);
  expect(state.stage).toBe('SHOPPING_ACTIVE'); expect(state.shopping.stock.MY).toBe(4);
  expect(applyShoppingAction(state, { type: 'ADD_ITEM', productId: 'MY' }, { player }).reason).toBe('PRODUCT_OUT_OF_RANGE');
});
