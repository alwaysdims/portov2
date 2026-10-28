import { describe, it, expect } from 'vitest';
import { createShoppingState, addToBasket, removeFromBasket, basketTotal,
  isShoppingListComplete, shoppingListStatus, checkout, computeScore, resetShopping,
  getProduct, CATALOG } from '../shopping.js';

describe('shopping domain', () => {
  describe('catalog', () => {
    it('all prices are safe integers', () => {
      for (const p of CATALOG) {
        expect(Number.isSafeInteger(p.price)).toBe(true);
        expect(p.price).toBeGreaterThan(0);
      }
    });
    it('no duplicate IDs', () => {
      const ids = CATALOG.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
    it('BR exists at 14000', () => {
      expect(getProduct('BR')).toMatchObject({ id: 'BR', price: 14000 });
    });
  });

  describe('basket operations', () => {
    it('add item reserves stock', () => {
      const s = createShoppingState();
      const r = addToBasket(s, 'BR', 1);
      expect(r.ok).toBe(true);
      expect(s.basket.BR).toBe(1);
      expect(s.stock.BR).toBe(5);
    });
    it('add multiple items', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      expect(s.basket.BR).toBe(2);
      expect(s.stock.BR).toBe(4);
    });
    it('reject out of stock', () => {
      const s = createShoppingState();
      const r = addToBasket(s, 'BR', 7);
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('OUT_OF_STOCK');
    });
    it('reject unknown product', () => {
      const s = createShoppingState();
      expect(addToBasket(s, 'FAKE', 1).ok).toBe(false);
    });
    it('reject invalid quantity', () => {
      const s = createShoppingState();
      expect(addToBasket(s, 'BR', 0).ok).toBe(false);
      expect(addToBasket(s, 'BR', -1).ok).toBe(false);
      expect(addToBasket(s, 'BR', 1.5).ok).toBe(false);
    });
    it('reject budget exceeded', () => {
      const s = createShoppingState();
      // Budget 100000, SU costs 19000 each, stock 4 => 4*19000=76000 ok
      addToBasket(s, 'SU', 4); // 76000
      addToBasket(s, 'BR', 1); // +14000 = 90000
      const r = addToBasket(s, 'MY', 1); // +18000 = 108000 > 100000
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('BUDGET_EXCEEDED');
    });
    it('remove restores stock', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      const r = removeFromBasket(s, 'BR', 1);
      expect(r.ok).toBe(true);
      expect(s.basket.BR).toBe(1);
      expect(s.stock.BR).toBe(5);
    });
    it('remove all deletes entry', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 1);
      removeFromBasket(s, 'BR', 1);
      expect(s.basket.BR).toBeUndefined();
      expect(s.stock.BR).toBe(6);
    });
    it('reject remove more than in basket', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 1);
      expect(removeFromBasket(s, 'BR', 2).ok).toBe(false);
    });
    it('stock invariant holds', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 3);
      removeFromBasket(s, 'BR', 1);
      // initial=6, shelf=4, basket=2, purchased=0
      expect(s.stock.BR + s.basket.BR + (s.purchased.BR ?? 0)).toBe(6);
    });
  });

  describe('basket total', () => {
    it('computes correct total', () => {
      expect(basketTotal({ BR: 2, MY: 1 })).toBe(2 * 14000 + 18000);
    });
    it('empty basket is 0', () => {
      expect(basketTotal({})).toBe(0);
    });
  });

  describe('shopping list', () => {
    it('initially incomplete', () => {
      const s = createShoppingState();
      expect(isShoppingListComplete(s)).toBe(false);
    });
    it('complete when all required met', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      expect(isShoppingListComplete(s)).toBe(true);
    });
    it('status shows per-item detail', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 1);
      const status = shoppingListStatus(s);
      const br = status.find(x => x.productId === 'BR');
      expect(br.have).toBe(1);
      expect(br.required).toBe(2);
      expect(br.complete).toBe(false);
    });
  });

  describe('checkout', () => {
    function filledState() {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      return s;
    }

    it('successful checkout', () => {
      const s = filledState();
      const r = checkout(s, { runId: 'test-run', simTick: 1000 });
      expect(r.ok).toBe(true);
      expect(r.receipt).toBeDefined();
      expect(r.receipt.total).toBe(2 * 14000 + 18000 + 17000 + 15000);
      expect(r.receipt.status).toBe('PAID');
      expect(r.receipt.transactionId).toContain('test-run');
      expect(r.receipt.runId).toBe('test-run');
      expect(r.receipt.levelId).toBe(1);
    });
    it('budget deducted once', () => {
      const s = filledState();
      const total = basketTotal(s.basket);
      checkout(s, { runId: 'r', simTick: 100 });
      expect(s.budget).toBe(100000 - total);
    });
    it('idempotent on repeat', () => {
      const s = filledState();
      const r1 = checkout(s, { runId: 'r', simTick: 100 });
      const r2 = checkout(s, { runId: 'r', simTick: 200 });
      expect(r2.ok).toBe(true);
      expect(r2.reason).toBe('ALREADY_COMPLETED');
      expect(r2.receipt.transactionId).toBe(r1.receipt.transactionId);
      expect(s.budget).toBe(100000 - r1.receipt.total); // not deducted twice
    });
    it('reject incomplete list', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 1); // need 2
      const r = checkout(s, { runId: 'r', simTick: 100 });
      expect(r.ok).toBe(false);
      expect(r.reason).toBe('SHOPPING_LIST_INCOMPLETE');
    });
    it('receipt items match basket', () => {
      const s = filledState();
      const r = checkout(s, { runId: 'r', simTick: 100 });
      expect(r.receipt.items.length).toBe(4);
      const br = r.receipt.items.find(i => i.productId === 'BR');
      expect(br.quantity).toBe(2);
      expect(br.subtotal).toBe(28000);
    });
    it('no negative budget after checkout', () => {
      const s = filledState();
      checkout(s, { runId: 'r', simTick: 100 });
      expect(s.budget).toBeGreaterThanOrEqual(0);
    });
    it('purchased tracks items', () => {
      const s = filledState();
      checkout(s, { runId: 'r', simTick: 100 });
      expect(s.purchased.BR).toBe(2);
      expect(s.purchased.MY).toBe(1);
    });
    it('basket empty after checkout', () => {
      const s = filledState();
      checkout(s, { runId: 'r', simTick: 100 });
      expect(Object.keys(s.basket).length).toBe(0);
    });
    it('stock not re-deducted at checkout', () => {
      const s = filledState();
      const stockBefore = { ...s.stock };
      checkout(s, { runId: 'r', simTick: 100 });
      // Stock should remain same (was already reserved on add)
      expect(s.stock).toEqual(stockBefore);
    });
    it('reject add after checkout', () => {
      const s = filledState();
      checkout(s, { runId: 'r', simTick: 100 });
      expect(addToBasket(s, 'BR', 1).ok).toBe(false);
      expect(addToBasket(s, 'BR', 1).reason).toBe('ALREADY_CHECKED_OUT');
    });
  });

  describe('scoring', () => {
    it('perfect score all categories', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      checkout(s, { runId: 'r', simTick: 100 });
      const score = computeScore(s, { damageTaken: 0, maxHP: 100, elapsedSeconds: 0, timerSeconds: 300 });
      expect(score.combat).toBe(30);
      expect(score.accuracy).toBe(40);
      expect(score.budget).toBe(20);
      expect(score.time).toBe(10);
      expect(score.score).toBe(100);
      expect(score.stars).toBe(3);
    });
    it('extra items reduce accuracy', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      addToBasket(s, 'MI', 1); // extra
      checkout(s, { runId: 'r', simTick: 100 });
      const score = computeScore(s, { damageTaken: 0, maxHP: 100, elapsedSeconds: 0, timerSeconds: 300 });
      expect(score.accuracy).toBeLessThan(40);
    });
    it('damage reduces combat score', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      checkout(s, { runId: 'r', simTick: 100 });
      const score = computeScore(s, { damageTaken: 50, maxHP: 100, elapsedSeconds: 0, timerSeconds: 300 });
      expect(score.combat).toBe(15);
    });
    it('star thresholds', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      checkout(s, { runId: 'r', simTick: 100 });
      // High damage, slow time
      const score = computeScore(s, { damageTaken: 80, maxHP: 100, elapsedSeconds: 280, timerSeconds: 300 });
      expect(score.stars).toBeLessThanOrEqual(2);
    });
    it('no receipt returns null', () => {
      const s = createShoppingState();
      expect(computeScore(s, { damageTaken: 0, maxHP: 100, elapsedSeconds: 0, timerSeconds: 300 })).toBeNull();
    });
    it('exp includes base + star bonus', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      addToBasket(s, 'MY', 1);
      addToBasket(s, 'GU', 1);
      addToBasket(s, 'TL', 1);
      checkout(s, { runId: 'r', simTick: 100 });
      const score = computeScore(s, { damageTaken: 0, maxHP: 100, elapsedSeconds: 0, timerSeconds: 300 });
      expect(score.exp).toBe(120 + 10 * 3); // base 120 + 30
    });
  });

  describe('reset', () => {
    it('full reset restores initial state', () => {
      const s = createShoppingState();
      addToBasket(s, 'BR', 2);
      checkout(s, { runId: 'r', simTick: 100 });
      const fresh = resetShopping();
      expect(fresh.budget).toBe(100000);
      expect(fresh.basket).toEqual({});
      expect(fresh.purchased).toEqual({});
      expect(fresh.stock.BR).toBe(6);
      expect(fresh.transactionId).toBeNull();
      expect(fresh.receipt).toBeNull();
    });
  });

  describe('no negative stock', () => {
    it('cannot go below zero', () => {
      const s = createShoppingState();
      for (let i = 0; i < 10; i++) addToBasket(s, 'BR', 1);
      expect(s.stock.BR).toBeGreaterThanOrEqual(0);
      expect(s.basket.BR).toBeLessThanOrEqual(6);
    });
  });
});
