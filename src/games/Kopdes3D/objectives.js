import { ARENA_BOUNDS, SHELVES } from './environment/config.js';

const rice = SHELVES.find(shelf => shelf.id === 'rice');
export const PRODUCT = Object.freeze({ id: 'BR', name: 'Beras 1kg', price: 14000, stock: 6, quantity: 1,
  position: Object.freeze({ x: rice.interaction[0], y: 0.87, z: rice.interaction[2] }), radius: 1.8 });
export const GATE = Object.freeze({ position: [0, 1.7, 25], size: [24, 3.4, 0.3], duration: 60, lift: 4 });
export const OBJECTIVE_LABELS = Object.freeze({
  APPROACH_ARENA: 'Dekati arena penjaga.', DEFEAT_GUARDS: 'Kalahkan semua penjaga wajib.',
  UNLOCK_KOPDES: 'Gerbang KOPDES sedang dibuka.', ENTER_KOPDES: 'Masuk ke KOPDES.',
  INTERACT_WITH_PRODUCT: 'Dekati rak beras, tekan E untuk mengambil 1 Beras 1kg.',
  PRODUCT_COLLECTED: 'Beras masuk keranjang sementara. Checkout belum tersedia.',
});

export function createObjectives(requiredGuards = ['guard']) {
  return { tick: 0, stage: 'APPROACH_ARENA', requiredGuards: [...new Set(requiredGuards)], deadGuards: new Set(),
    eventCursor: 0, clearCount: 0, gate: 'LOCKED', gateAge: 0, openedAt: null,
    stock: PRODUCT.stock, cart: { quantity: 0, total: 0 }, prompt: null };
}

export function canInteract(player, tick) {
  return player?.hp > 0 && ['IDLE', 'MOVE'].includes(player.state) && !player.attack && !player.dash &&
    !(player.stunUntil > tick) && !(player._hurtUntil > tick);
}

// Radius is three-dimensional; ID order breaks exact distance ties independently of registration order.
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
  if (state.stage !== 'INTERACT_WITH_PRODUCT' || state.gate !== 'OPEN' || id !== PRODUCT.id || quantity !== PRODUCT.quantity ||
    !Number.isSafeInteger(state.stock) || state.stock < quantity || state.stock > PRODUCT.stock ||
    !Number.isSafeInteger(state.cart.quantity) || state.cart.quantity !== 0 ||
    !Number.isSafeInteger(state.cart.total) || state.cart.total !== 0) return false;
  const total = PRODUCT.price * quantity;
  if (!Number.isSafeInteger(total)) return false;
  state.stock -= quantity;
  state.cart = { quantity, total };
  state.stage = 'PRODUCT_COLLECTED';
  state.prompt = null;
  return true;
}

export function gatePose(state) {
  return { x: GATE.position[0], y: GATE.position[1] + (state.gate === 'OPEN' ? GATE.lift : 0.12 * Math.sin(Math.PI * state.gateAge / GATE.duration)),
    z: GATE.position[2] };
}

// Called exactly once after each authoritative combat/physics tick. Replays never advance timers.
export function advanceObjectives(state, { tick, player, events = [], interact = false }, visible) {
  if (!Number.isSafeInteger(tick) || tick <= state.tick) return;
  state.tick = tick;
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
  if (state.stage === 'ENTER_KOPDES' && Math.abs(p.x) < 7.7 && p.z > 28.4 && p.z < 39.8) state.stage = 'INTERACT_WITH_PRODUCT';
  state.prompt = canInteract(player, tick) && state.stage === 'INTERACT_WITH_PRODUCT' && state.stock > 0
    ? nearestInteraction(player, [PRODUCT], visible)?.id ?? null : null;
  if (interact && state.prompt) collectProduct(state, state.prompt);
}

export function objectiveSnapshot(state) {
  return { stage: state.stage, label: OBJECTIVE_LABELS[state.stage], remaining: state.requiredGuards.length - state.deadGuards.size,
    gate: state.gate, notification: state.openedAt !== null && state.tick - state.openedAt < 180,
    prompt: state.prompt, stock: state.stock, cart: { ...state.cart } };
}
