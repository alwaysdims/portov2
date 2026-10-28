import { ARENA_BOUNDS, SHELVES, ANCHORS } from './environment/config.js';
import { createShoppingState, addToBasket, removeFromBasket, isShoppingListComplete,
  checkout, computeScore, CATALOG, LEVELS, basketTotal as shopBasketTotal,
  shoppingListStatus } from './shopping.js';

const shelfProducts = CATALOG.map(p => {
  const shelf = SHELVES.find(s => s.id === p.shelfId);
  const peers = CATALOG.filter(item => item.shelfId === p.shelfId);
  const offset = (peers.indexOf(p) - (peers.length - 1) / 2) * 1.25;
  return Object.freeze({
    id: p.id, name: p.name, price: p.price,
    position: Object.freeze({ x: shelf.interaction[0], y: 0.87, z: shelf.interaction[2] + offset }),
    radius: 1.8,
  });
});

const cashierAnchor = ANCHORS.find(a => a.id === 'checkout-trigger');
const CASHIER_TARGET = Object.freeze({
  id: 'cashier', name: 'Kasir KOPDES',
  position: Object.freeze({ x: cashierAnchor.position[0], y: 0.87, z: cashierAnchor.position[2] }),
  radius: 1.8,
});
let runSequence = 0;

const rice = SHELVES.find(shelf => shelf.id === 'rice');
export const PRODUCT = Object.freeze({ id: 'BR', name: 'Beras 1kg', price: 14000, stock: 6, quantity: 1,
  position: Object.freeze({ x: rice.interaction[0], y: 0.87, z: rice.interaction[2] }), radius: 1.8 });
export const GATE = Object.freeze({ position: [0, 1.7, 25], size: [24, 3.4, 0.3], duration: 60, lift: 4 });

export const OBJECTIVE_LABELS = Object.freeze({
  APPROACH_ARENA: 'Dekati arena penjaga.',
  DEFEAT_GUARDS: 'Kalahkan semua penjaga wajib.',
  UNLOCK_KOPDES: 'Gerbang KOPDES sedang dibuka.',
  ENTER_KOPDES: 'Masuk ke KOPDES.',
  SHOPPING_ACTIVE: 'Belanja kebutuhan sesuai daftar. Dekati rak, tekan E.',
  READY_FOR_CHECKOUT: 'Daftar lengkap! Dekati kasir, tekan E untuk bayar.',
  CHECKOUT_COMPLETE: 'Pembayaran berhasil!',
  MISSION_COMPLETE: 'Misi selesai!',
  MISSION_FAILED: 'Waktu misi habis. Ulangi misi.',
  INTERACT_WITH_PRODUCT: 'Belanja kebutuhan sesuai daftar. Dekati rak, tekan E.',
  PRODUCT_COLLECTED: 'Daftar lengkap! Dekati kasir, tekan E untuk bayar.',
});

export function createObjectives(requiredGuards = ['guard'], levelId = 1) {
  const shopping = createShoppingState(levelId);
  return {
    tick: 0, stage: 'APPROACH_ARENA', requiredGuards: [...new Set(requiredGuards)], deadGuards: new Set(),
    eventCursor: 0, clearCount: 0, gate: 'LOCKED', gateAge: 0, openedAt: null,
    stock: PRODUCT.stock, cart: { quantity: 0, total: 0 }, prompt: null,
    shopping, cashierPrompt: null, dialogState: null,
    score: null, feedback: null, runId: `run-${Date.now()}-${++runSequence}`, rewarded: false,
  };
}

export function canInteract(player, tick) {
  return player?.hp > 0 && ['IDLE', 'MOVE'].includes(player.state) && !player.attack && !player.dash &&
    !(player.stunUntil > tick) && !(player._hurtUntil > tick);
}

export function nearestInteraction(player, targets, visible = () => true) {
  const p = player?.position;
  if (!p || ![p.x, p.y, p.z].every(Number.isFinite)) return null;
  let nearest = null, best = Infinity;
  for (const target of targets) {
    const to = target.position;
    if (target.enabled === false || typeof target.id !== 'string' || !to ||
      ![to.x, to.y, to.z, target.radius].every(Number.isFinite) || target.radius < 0) continue;
    const distance = Math.hypot(to.x - p.x, to.y - p.y, to.z - p.z);
    if (distance > target.radius || !visible(p, to)) continue;
    if (distance < best || (distance === best && target.id < nearest.id)) { nearest = target; best = distance; }
  }
  return nearest;
}

export function collectProduct(state, id = 'BR', quantity = 1) {
  if (state.gate !== 'OPEN') return false;
  if (!['INTERACT_WITH_PRODUCT', 'SHOPPING_ACTIVE', 'READY_FOR_CHECKOUT'].includes(state.stage)) return false;
  const result = addToBasket(state.shopping, id, quantity);
  if (!result.ok) return false;
  state.stock = state.shopping.stock[PRODUCT.id] ?? state.stock;
  const bqty = state.shopping.basket[PRODUCT.id] ?? 0;
  state.cart = { quantity: bqty, total: bqty * PRODUCT.price };
  if (isShoppingListComplete(state.shopping)) {
    state.stage = 'READY_FOR_CHECKOUT';
  } else {
    state.stage = 'SHOPPING_ACTIVE';
  }
  state.prompt = null;
  return true;
}

export function gatePose(state) {
  return { x: GATE.position[0], y: GATE.position[1] + (state.gate === 'OPEN' ? GATE.lift : 0.12 * Math.sin(Math.PI * state.gateAge / GATE.duration)),
    z: GATE.position[2] };
}

export const CASHIER_DIALOGUES = Object.freeze({
  greeting: 'Selamat datang di KOPDES! Mari periksa belanjaan kamu.',
  success: 'Pembayaran berhasil! Terima kasih sudah berbelanja.',
  incomplete: 'Barang belum lengkap. Periksa daftar belanja dulu ya.',
  budget_exceeded: 'Maaf, uang tidak cukup. Kurangi beberapa barang.',
});

export function attemptCheckout(state, simTick, { player, visible } = {}) {
  if (state.shopping.transactionId) return { ok: true, receipt: state.shopping.receipt, reason: 'ALREADY_COMPLETED' };
  if (state.gate !== 'OPEN' || !state.requiredGuards.every(id => state.deadGuards.has(id))) return { ok: false, reason: 'ENCOUNTER_UNFINISHED' };
  if (!canInteract(player, state.tick) || !nearestInteraction(player, [CASHIER_TARGET], visible)) return { ok: false, reason: 'CASHIER_OUT_OF_RANGE' };
  if (state.tick - (state.shopping.timerStart ?? 0) >= LEVELS.find(l => l.id === state.shopping.levelId).timerSeconds * 60) return { ok: false, reason: 'TIME_EXPIRED' };
  if (!['SHOPPING_ACTIVE', 'READY_FOR_CHECKOUT'].includes(state.stage)) return { ok: false, reason: 'WRONG_STAGE' };
  const result = checkout(state.shopping, { runId: state.runId, simTick });
  if (!result.ok) {
    state.dialogState = result.reason === 'BUDGET_EXCEEDED' ? 'budget_exceeded' :
      result.reason === 'SHOPPING_LIST_INCOMPLETE' ? 'incomplete' : result.reason;
    return result;
  }
  state.stage = 'CHECKOUT_COMPLETE';
  state.dialogState = 'success';
  state.cart = { quantity: 0, total: 0 };
  state.stock = state.shopping.stock[PRODUCT.id] ?? 0;
  return result;
}

export function completeScoring(state, combatStats) {
  if (state.stage !== 'CHECKOUT_COMPLETE' || state.score) return null;
  const level = LEVELS.find(l => l.id === state.shopping.levelId);
  const elapsedTicks = (state.shopping.timerEnd ?? state.tick) - (state.shopping.timerStart ?? 0);
  const elapsedSeconds = elapsedTicks / 60;
  state.score = computeScore(state.shopping, {
    damageTaken: combatStats?.damageTaken ?? 0,
    maxHP: combatStats?.maxHP ?? 100,
    elapsedSeconds,
    timerSeconds: level?.timerSeconds ?? 300,
  });
  state.stage = 'MISSION_COMPLETE';
  state.shopping.missionComplete = true;
  state.rewarded = true; // Run-local reward only; persistence/replay ledger is future scope.
  return state.score;
}

export function applyShoppingAction(state, action, context = {}) {
  let result;
  if (action.type === 'CLOSE_DIALOG') {
    state.dialogState = null;
    return { ok: true };
  }
  if (action.type === 'CLOSE_RECEIPT') {
    const score = completeScoring(state, context.combatStats);
    return { ok: !!score || state.stage === 'MISSION_COMPLETE', score: state.score };
  }
  if (action.type === 'CHECKOUT') {
    result = attemptCheckout(state, state.tick, context);
  } else if (['ADD_ITEM', 'REMOVE_ITEM'].includes(action.type)) {
    if (state.gate !== 'OPEN' || !['SHOPPING_ACTIVE', 'READY_FOR_CHECKOUT'].includes(state.stage) || !canInteract(context.player, state.tick)) {
      result = { ok: false, reason: 'SHOPPING_LOCKED' };
    } else if (action.type === 'ADD_ITEM' && !nearestInteraction(context.player, shelfProducts.filter(p => p.id === action.productId), context.visible)) {
      result = { ok: false, reason: 'PRODUCT_OUT_OF_RANGE' };
    } else {
      result = action.type === 'ADD_ITEM' ? addToBasket(state.shopping, action.productId, action.quantity === undefined ? 1 : action.quantity) :
        removeFromBasket(state.shopping, action.productId, action.quantity === undefined ? 1 : action.quantity);
      if (result.ok) {
        state.stage = isShoppingListComplete(state.shopping) ? 'READY_FOR_CHECKOUT' : 'SHOPPING_ACTIVE';
        state.stock = state.shopping.stock.BR;
        state.cart = { quantity: state.shopping.basket.BR ?? 0, total: (state.shopping.basket.BR ?? 0) * PRODUCT.price };
      }
    }
  } else result = { ok: false, reason: 'UNKNOWN_ACTION' };
  state.feedback = result.ok ? null : result.reason;
  return result;
}

export function advanceObjectives(state, { tick, player, events = [], interact = false }, visible) {
  if (!Number.isSafeInteger(tick) || tick <= state.tick || state.stage === 'MISSION_FAILED') return;
  state.tick = tick;
  if (state.shopping.timerStart === null) state.shopping.timerStart = tick;
  const deadline = state.shopping.timerStart + LEVELS.find(l => l.id === state.shopping.levelId).timerSeconds * 60;
  if (!state.shopping.transactionId && tick >= deadline) {
    state.stage = 'MISSION_FAILED';
    state.feedback = 'TIME_EXPIRED';
    state.shopping.timerEnd = deadline;
    state.prompt = state.cashierPrompt = state.dialogState = null;
    return;
  }

  for (const event of events) {
    if (event.id <= state.eventCursor) continue;
    if (event.type === 'death' && state.requiredGuards.includes(event.targetId)) state.deadGuards.add(event.targetId);
    state.eventCursor = Math.max(state.eventCursor, event.id);
  }
  const p = player.position;
  if (state.stage === 'APPROACH_ARENA' && p.x >= ARENA_BOUNDS.min[0] && p.x <= ARENA_BOUNDS.max[0] &&
    p.z >= ARENA_BOUNDS.min[2] && p.z <= ARENA_BOUNDS.max[2]) state.stage = 'DEFEAT_GUARDS';
  if (state.gate === 'LOCKED' && state.requiredGuards.every(id => state.deadGuards.has(id))) {
    state.clearCount++;
    state.gate = 'UNLOCKING';
    state.stage = 'UNLOCK_KOPDES';
  } else if (state.gate === 'UNLOCKING') {
    state.gateAge++;
    if (state.gateAge === GATE.duration) {
      state.gate = 'OPEN'; state.openedAt = tick; state.stage = 'ENTER_KOPDES';
    }
  }
  if (state.stage === 'ENTER_KOPDES' && Math.abs(p.x) < 7.7 && p.z > 28.4 && p.z < 39.8) {
    state.stage = 'SHOPPING_ACTIVE';
  }

  const shopStages = ['SHOPPING_ACTIVE', 'READY_FOR_CHECKOUT'];
  if (shopStages.includes(state.stage) && canInteract(player, tick)) {
    const enabledProducts = shelfProducts.filter(t => (state.shopping.stock[t.id] ?? 0) > 0);
    state.prompt = nearestInteraction(player, enabledProducts, visible)?.id ?? null;
    if (!state.prompt) {
      state.cashierPrompt = nearestInteraction(player, [CASHIER_TARGET], visible)?.id ?? null;
    } else {
      state.cashierPrompt = null;
    }
  } else if (!['CHECKOUT_COMPLETE', 'MISSION_COMPLETE'].includes(state.stage)) {
    state.prompt = null;
    state.cashierPrompt = null;
  }

  if (interact && !state.dialogState && canInteract(player, tick) && shopStages.includes(state.stage)) {
    if (state.prompt) {
      applyShoppingAction(state, { type: 'ADD_ITEM', productId: state.prompt }, { player, visible });
    } else if (state.cashierPrompt) {
      state.dialogState = 'greeting';
    }
  }
}

export function objectiveSnapshot(state) {
  const listStatus = state.shopping ? shoppingListStatus(state.shopping) : [];
  const total = state.shopping ? shopBasketTotal(state.shopping.basket) : 0;

  return {
    stage: state.stage, label: OBJECTIVE_LABELS[state.stage] ?? '', remaining: state.requiredGuards.length - state.deadGuards.size,
    gate: state.gate, notification: state.openedAt !== null && state.tick - state.openedAt < 180,
    prompt: state.prompt, cashierPrompt: state.cashierPrompt,
    stock: state.shopping?.stock[PRODUCT.id] ?? state.stock, cart: { ...state.cart },
    shoppingList: listStatus,
    basket: state.shopping ? { ...state.shopping.basket } : {},
    basketTotal: total,
    budget: state.shopping?.budget ?? 0, initialBudget: state.shopping?.initialBudget ?? 0,
    dialogState: state.dialogState, receipt: state.shopping?.receipt ?? null,
    score: state.score, missionComplete: state.stage === 'MISSION_COMPLETE',
    stockById: { ...state.shopping.stock }, feedback: state.feedback,
    levelId: state.shopping.levelId, missionName: LEVELS.find(l => l.id === state.shopping.levelId)?.name,
    elapsedSeconds: ((state.shopping.timerEnd ?? state.tick) - (state.shopping.timerStart ?? 0)) / 60,
  };
}

export { CATALOG, LEVELS, CASHIER_TARGET, shelfProducts, removeFromBasket };
