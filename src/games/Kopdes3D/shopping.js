// Shopping domain model — pure functions, integer Rupiah, no React dependency.
// Catalog prices from design.md; Level 1 mission from checkpoint 2.6 spec.

export const CATALOG = Object.freeze([
  { id: 'BR', name: 'Beras 1 kg', unit: 'kemasan 1 kg', price: 14000, minStock: 6, shelfId: 'rice' },
  { id: 'MY', name: 'Minyak goreng 1 L', unit: 'botol 1 L', price: 18000, minStock: 4, shelfId: 'staples' },
  { id: 'GU', name: 'Gula 1 kg', unit: 'kemasan 1 kg', price: 17000, minStock: 4, shelfId: 'staples' },
  { id: 'TL', name: 'Telur ½ kg', unit: 'kemasan ½ kg', price: 15000, minStock: 4, shelfId: 'staples' },
  { id: 'MI', name: 'Mi instan 1 bungkus', unit: 'bungkus', price: 3000, minStock: 10, shelfId: 'snacks' },
  { id: 'SU', name: 'Susu UHT 1 L', unit: 'kotak 1 L', price: 19000, minStock: 4, shelfId: 'drinks' },
  { id: 'SB', name: 'Sabun 1 batang', unit: 'batang', price: 6000, minStock: 4, shelfId: 'snacks' },
  { id: 'TE', name: 'Teh 1 kotak', unit: 'kotak', price: 5000, minStock: 4, shelfId: 'drinks' },
].map(Object.freeze));
// ponytail: eight fixed SKUs for this slice; validate external catalogs before loading them.

export const LEVELS = Object.freeze([
  {
    id: 1, name: 'Belanja Pertama', budget: 100000, timerSeconds: 300,
    requiredGuards: ['guard'], difficultyMultiplier: 1,
    reward: { exp: 120 },
    shoppingList: [
      { productId: 'BR', quantity: 2 },
      { productId: 'MY', quantity: 1 },
      { productId: 'GU', quantity: 1 },
      { productId: 'TL', quantity: 1 },
    ],
  },
]);

export function getProduct(id) { return CATALOG.find(p => p.id === id) ?? null; }

// Invariant: initialStock = shelfStock + basketQty + purchasedQty
// Stock reserved on pickup, restored on removal, not re-deducted at checkout.
export function createShoppingState(levelId = 1) {
  const level = LEVELS.find(l => l.id === levelId);
  if (!level) throw new Error(`Unknown level ${levelId}`);
  const stock = {};
  for (const item of CATALOG) stock[item.id] = item.minStock;
  return {
    levelId, budget: level.budget, initialBudget: level.budget,
    basket: {}, // { [productId]: quantity }
    stock,      // { [productId]: shelfStock }
    purchased: {}, // { [productId]: quantity } — after checkout
    shoppingList: level.shoppingList.map(r => ({ ...r })),
    transactionId: null, receipt: null, missionComplete: false,
    timerStart: null, timerEnd: null,
  };
}

function safeInt(n) { return Number.isSafeInteger(n) && n >= 0; }

export function inventoryValid(state) {
  if (!safeInt(state.budget) || !safeInt(state.initialBudget) || state.budget > state.initialBudget) return false;
  if ([state.stock, state.basket, state.purchased].some(items => !items || Object.entries(items).some(([id, q]) => !getProduct(id) || !safeInt(q)))) return false;
  return CATALOG.every(p => safeInt(state.stock[p.id]) &&
    state.stock[p.id] + (state.basket[p.id] ?? 0) + (state.purchased[p.id] ?? 0) === p.minStock);
}

export function addToBasket(state, productId, qty = 1) {
  if (!safeInt(qty) || qty < 1) return { ok: false, reason: 'INVALID_QUANTITY' };
  const product = getProduct(productId);
  if (!product) return { ok: false, reason: 'UNKNOWN_PRODUCT' };
  if (state.transactionId) return { ok: false, reason: 'ALREADY_CHECKED_OUT' };
  if (!inventoryValid(state)) return { ok: false, reason: 'INVALID_INVENTORY' };
  const shelf = state.stock[productId] ?? 0;
  if (shelf < qty) return { ok: false, reason: 'OUT_OF_STOCK' };
  const current = state.basket[productId] ?? 0;
  const newQty = current + qty;
  const newTotal = basketTotal({ ...state.basket, [productId]: newQty });
  if (newTotal > state.budget) return { ok: false, reason: 'BUDGET_EXCEEDED' };
  state.stock[productId] = shelf - qty;
  state.basket[productId] = newQty;
  return { ok: true };
}

export function removeFromBasket(state, productId, qty = 1) {
  if (!safeInt(qty) || qty < 1) return { ok: false, reason: 'INVALID_QUANTITY' };
  const product = getProduct(productId);
  if (!product) return { ok: false, reason: 'UNKNOWN_PRODUCT' };
  if (state.transactionId) return { ok: false, reason: 'ALREADY_CHECKED_OUT' };
  if (!inventoryValid(state)) return { ok: false, reason: 'INVALID_INVENTORY' };
  const current = state.basket[productId] ?? 0;
  if (current < qty) return { ok: false, reason: 'INSUFFICIENT_IN_BASKET' };
  state.basket[productId] = current - qty;
  if (state.basket[productId] === 0) delete state.basket[productId];
  state.stock[productId] = (state.stock[productId] ?? 0) + qty;
  return { ok: true };
}

export function basketTotal(basket) {
  let total = 0;
  for (const [id, qty] of Object.entries(basket)) {
    const p = getProduct(id);
    if (!p || !safeInt(qty)) return Infinity;
    total += p.price * qty;
    if (!safeInt(total)) return Infinity;
  }
  return total;
}

export function shoppingListStatus(state) {
  return state.shoppingList.map(req => {
    const product = getProduct(req.productId);
    const inBasket = state.basket[req.productId] ?? 0;
    const purchased = state.purchased[req.productId] ?? 0;
    const have = inBasket + purchased;
    return {
      productId: req.productId, name: product?.name ?? req.productId,
      required: req.quantity, have, price: product?.price ?? 0,
      subtotal: (product?.price ?? 0) * req.quantity,
      complete: have >= req.quantity,
    };
  });
}

export function isShoppingListComplete(state) {
  return shoppingListStatus(state).every(s => s.complete);
}

// Atomic checkout — single state transition, idempotent on transactionId.
export function checkout(state, { runId, simTick }) {
  // Idempotent: same transaction returns same receipt
  if (state.transactionId) {
    if (state.receipt) return { ok: true, receipt: state.receipt, reason: 'ALREADY_COMPLETED' };
    return { ok: false, reason: 'TRANSACTION_IN_PROGRESS' };
  }
  if (!inventoryValid(state)) return { ok: false, reason: 'INVALID_INVENTORY' };
  if (!Array.isArray(state.shoppingList) || !state.shoppingList.length || state.shoppingList.some(r => !getProduct(r.productId) || !safeInt(r.quantity) || r.quantity < 1)) return { ok: false, reason: 'INVALID_MISSION' };
  if (typeof runId !== 'string' || !runId || !safeInt(simTick)) return { ok: false, reason: 'INVALID_TRANSACTION' };
  if (!isShoppingListComplete(state)) return { ok: false, reason: 'SHOPPING_LIST_INCOMPLETE' };
  const total = basketTotal(state.basket);
  if (!safeInt(total)) return { ok: false, reason: 'INVALID_TOTAL' };
  if (total > state.budget) return { ok: false, reason: 'BUDGET_EXCEEDED' };

  // Generate unique transaction ID
  const transactionId = `${runId}:checkout:${simTick}`;

  // Build receipt from basket state (not recalculated)
  const items = [];
  for (const [id, qty] of Object.entries(state.basket)) {
    const p = getProduct(id);
    items.push(Object.freeze({ productId: id, name: p.name, unit: p.unit, price: p.price, quantity: qty, subtotal: p.price * qty }));
  }

  const receipt = Object.freeze({
    kopdesName: 'KOPDES Desa', missionName: LEVELS.find(l => l.id === state.levelId)?.name ?? '',
    runId, levelId: state.levelId, transactionId, items: Object.freeze(items),
    total, initialBudget: state.initialBudget, change: state.budget - total,
    status: 'PAID', simTick, timestamp: `Tick ${simTick} (simulasi)`,
  });

  // Commit: move basket to purchased, deduct budget
  for (const [id, qty] of Object.entries(state.basket)) {
    state.purchased[id] = (state.purchased[id] ?? 0) + qty;
  }
  state.basket = {};
  state.budget -= total;
  state.transactionId = transactionId;
  state.receipt = receipt;
  state.timerEnd = simTick;
  return { ok: true, receipt };
}

// Scoring per design.md formula
export function computeScore(state, { damageTaken, maxHP, elapsedSeconds, timerSeconds }) {
  if (!state.receipt) return null;
  const combat = 30 * Math.max(0, Math.min(1, 1 - damageTaken / maxHP));
  const purchasedUnits = Object.values(state.purchased).reduce((s, q) => s + q, 0);
  const matchedUnits = state.shoppingList.reduce((s, req) => {
    const have = state.purchased[req.productId] ?? 0;
    return s + Math.min(have, req.quantity);
  }, 0);
  const accuracy = purchasedUnits > 0 ? 40 * (matchedUnits / purchasedUnits) : 0;
  const requiredCost = state.shoppingList.reduce((s, req) => s + (getProduct(req.productId)?.price ?? 0) * req.quantity, 0);
  const budgetDenom = Math.max(1, state.initialBudget - requiredCost);
  const budgetScore = 20 * Math.max(0, Math.min(1, 1 - (state.receipt.total - requiredCost) / budgetDenom));
  const time = 10 * Math.max(0, Math.min(1, 1 - elapsedSeconds / timerSeconds));
  const raw = combat + accuracy + budgetScore + time;
  const score = Math.round(raw);
  const stars = score >= 85 ? 3 : score >= 65 ? 2 : 1;
  const level = LEVELS.find(l => l.id === state.levelId);
  const baseExp = level?.reward?.exp ?? 120;
  const exp = baseExp + 10 * stars;
  return { combat: Math.round(combat), accuracy: Math.round(accuracy),
    budget: Math.round(budgetScore), time: Math.round(time),
    score, stars, exp };
}

// Full reset for retry
export function resetShopping(levelId = 1) { return createShoppingState(levelId); }
