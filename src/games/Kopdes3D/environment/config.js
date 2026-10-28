// All positions use meters, Y-up. Anchors are floor points, not capsule centers.
export const PLAYER_HALF_HEIGHT = 0.85;
export const CHECKPOINTS = {
  home: { position: [0, 0, -1], yaw: Math.PI },
  arena: { position: [0, 0, 12], yaw: Math.PI },
  shop: { position: [0, 0, 30], yaw: Math.PI },
};
export const ARENA_BOUNDS = { min: [-7, 0, 9], max: [7, 0, 23] };
export const SHELVES = [
  { id: 'staples', label: 'KEBUTUHAN POKOK', position: [-4.5, 0, 33], size: [1.4, 1.8, 4], interaction: [-2.7, 0, 33], facing: [-1, 0, 0], color: '#d7b653' },
  { id: 'drinks', label: 'MINUMAN', position: [4.5, 0, 32], size: [1.4, 1.8, 3], interaction: [2.7, 0, 32], facing: [1, 0, 0], color: '#58a7ad' },
  { id: 'snacks', label: 'MAKANAN RINGAN', position: [-4.5, 0, 37.5], size: [1.4, 1.8, 3], interaction: [-2.7, 0, 37.5], facing: [-1, 0, 0], color: '#dc7656' },
  { id: 'rice', label: 'BERAS', position: [0, 0, 39], size: [2.4, 0.8, 1.2], interaction: [0, 0, 37.3], facing: [0, 0, 1], color: '#e5d6ae' },
];
export const ANCHORS = [
  { id: 'player-spawn', kind: 'player', position: CHECKPOINTS.home.position },
  { id: 'npc-ibu', kind: 'npc', position: [1.8, 0, 0] },
  { id: 'guard-spawn', kind: 'guard', position: [0, 0, 12] },
  { id: 'boss-spawn', kind: 'boss', position: [0, 0, 16] },
  { id: 'combat-arena', kind: 'bounds', position: [0, 0, 16], bounds: ARENA_BOUNDS },
  { id: 'kopdes-gate', kind: 'gate', position: [0, 0, 25] },
  ...SHELVES.map(shelf => ({ id: `shelf-${shelf.id}`, kind: 'product', position: shelf.interaction, facing: shelf.facing, shelfId: shelf.id })),
  { id: 'cashier-npc', kind: 'npc', position: [4.5, 0, 39] },
  { id: 'checkout-trigger', kind: 'checkout', position: [4.5, 0, 36], size: [2, 2, 1.5] },
  { id: 'level-exit', kind: 'exit', position: [0, 0, 27] },
];

const village = [];
const exterior = [];
const interior = [];
function box(list, id, position, size, color, solid = true) {
  list.push({ id, position, size, color, solid });
}
const grass = '#8eaa70';
const cream = '#ede0bb';
const red = '#bc4038';
const white = '#f4eee0';
const wood = '#826347';
box(village, 'ground', [0, -0.2, 17.5], [24, 0.4, 51], grass);
box(village, 'road', [0, 0.012, 6], [4.5, 0.024, 8], '#bba980', false);
box(village, 'yard', [0, 0.012, 2], [9, 0.024, 4], '#cbb98f', false);
box(village, 'arena', [0, 0.012, 16], [14, 0.024, 14], '#c9b48a', false);
// Continuous perimeter prevents leaving the small playable slice.
box(village, 'boundary-west', [-11.8, 1.5, 17.5], [0.4, 3, 51], '#718269');
box(village, 'boundary-east', [11.8, 1.5, 17.5], [0.4, 3, 51], '#718269');
box(village, 'boundary-home', [0, 1.5, -7.8], [24, 3, 0.4], '#718269');
box(village, 'boundary-shop', [0, 1.5, 42.8], [24, 3, 0.4], '#718269');
box(village, 'home-left', [-3, 1.6, -2], [0.3, 3.2, 6], cream);
box(village, 'home-right', [3, 1.6, -2], [0.3, 3.2, 6], cream);
box(village, 'home-back', [0, 1.6, -5], [6, 3.2, 0.3], cream);
for (const side of [-1, 1]) {
  box(village, `home-front-${side}`, [side * 2.1, 1.6, 1], [1.8, 3.2, 0.3], cream);
  box(village, `home-window-${side}`, [side * 2.1, 1.7, 1.16], [1, 1.2, 0.025], '#57878b', false);
  box(village, `porch-post-${side}`, [side * 3, 1.5, 2.6], [0.18, 3, 0.18], wood);
  box(village, `yard-fence-${side}`, [side * 5, 0.65, 1], [0.16, 1.3, 7], wood);
}
box(village, 'home-lintel', [0, 2.95, 1], [2.4, 0.5, 0.3], wood);
box(village, 'home-ceiling', [0, 3.2, -2], [6.4, 0.2, 6.4], cream);
box(village, 'porch-canopy', [0, 3.1, 1.9], [6.6, 0.18, 2.4], '#a95940');
box(village, 'warung-counter', [-7.5, 0.65, 5], [3, 1.3, 1.5], wood);
box(village, 'warung-back', [-7.5, 1.2, 6], [3, 2.4, 0.2], cream);
box(village, 'warung-canopy', [-7.5, 2.6, 5], [3.6, 0.2, 3], red);
for (const x of [-9, -6]) box(village, `warung-post-${x}`, [x, 1.3, 4], [0.12, 2.6, 0.12], wood);
for (const x of [-7.5, 7.5]) {
  box(village, `arena-edge-${x}`, [x, 0.55, 16], [0.25, 1.1, 14], wood);
  box(village, `gate-post-${x}`, [x, 1.8, 25], [0.5, 3.6, 0.5], red);
  box(village, `gate-fence-${x}`, [x * 1.28, 0.7, 25], [4, 1.4, 0.2], wood);
}
box(village, 'gate-header', [0, 3.5, 25], [15.5, 0.5, 0.5], white);
export const TREES = [[-8, 0, -3], [8, 0, -1], [9, 0, 8], [-10, 0, 11], [9.5, 0, 20], [-9.5, 0, 29], [10, 0, 37]];
export const SHRUBS = [[-7, 0.4, -5.5], [7, 0.4, 3], [10, 0.4, 13], [-10, 0.4, 21], [9, 0.4, 26]];
for (const [i, [x, , z]] of TREES.entries()) box(village, `tree-trunk-${i}`, [x, 1.3, z], [0.5, 2.6, 0.5], wood);
for (const z of [4, 14, 24]) {
  box(village, `power-pole-${z}`, [10.5, 3, z], [0.22, 6, 0.22], '#777b74');
  box(village, `power-crossbar-${z}`, [10.5, 5.6, z], [1.8, 0.15, 0.18], wood);
  box(village, `streetlight-${z}`, [-9, 2.3, z], [0.16, 4.6, 0.16], '#4d6261');
  box(village, `streetlight-arm-${z}`, [-8.5, 4.55, z], [1, 0.12, 0.12], '#4d6261');
  box(village, `streetlight-bulb-${z}`, [-8, 4.48, z], [0.5, 0.12, 0.4], '#f5dc9c', false);
}
for (const x of [10, 11]) box(village, `power-wire-${x}`, [x, 5.8, 14], [0.025, 0.025, 20], '#434944', false);

// Door is a genuinely open 4 m x 3.5 m portal; glass is only in adjacent bays.
box(exterior, 'shop-left', [-8, 2.5, 34], [0.3, 5, 12], white);
box(exterior, 'shop-right', [8, 2.5, 34], [0.3, 5, 12], white);
box(exterior, 'shop-back', [0, 2.5, 40], [16, 5, 0.3], white);
for (const side of [-1, 1]) {
  box(exterior, `shop-front-${side}`, [side * 5, 2.5, 28], [6, 5, 0.3], white);
  box(exterior, `shop-glass-${side}`, [side * 5, 1.95, 27.83], [5.3, 2.7, 0.025], '#669da1', false);
  box(exterior, `shop-sill-${side}`, [side * 5, 0.5, 27.78], [5.5, 0.15, 0.1], red, false);
  box(exterior, `shop-column-${side}`, [side * 7, 1.8, 26.8], [0.35, 3.6, 0.35], red);
  box(exterior, `shop-doorframe-${side}`, [side * 2.1, 1.75, 27.78], [0.16, 3.5, 0.12], red);
}
box(exterior, 'shop-lintel', [0, 4.25, 28], [4, 1.5, 0.3], red);
box(exterior, 'shop-canopy', [0, 3.65, 27], [17, 0.18, 3], red);
box(exterior, 'shop-fascia', [0, 4.3, 27.65], [15.5, 0.95, 0.2], white);
box(exterior, 'shop-ceiling', [0, 5, 34], [16.5, 0.2, 12.5], white);
box(exterior, 'forecourt', [0, 0.012, 26], [16, 0.024, 4], '#d1c7af', false);
box(interior, 'shop-floor', [0, 0.014, 34], [15.7, 0.028, 11.7], '#e8ddc7', false);
for (const shelf of SHELVES) {
  const [x, , z] = shelf.position;
  const [w, h, d] = shelf.size;
  box(interior, `fixture-${shelf.id}`, [x, h / 2, z], shelf.size, '#b9a17e');
  for (const y of [0.25, 0.85, 1.45].filter(y => y < h)) {
    box(interior, `${shelf.id}-board-${y}`, [x, y, z], [w + 0.1, 0.08, d + 0.1], '#ece4d0', false);
    for (let i = 0; i < 4; i++) {
      box(interior, `${shelf.id}-product-${y}-${i}`, [x, y + 0.22, z - d / 2 + 0.4 + i * (d - 0.8) / 3], [w + 0.16, 0.35, 0.35], shelf.color, false);
    }
  }
}
box(interior, 'cashier-counter', [4.5, 0.6, 37.7], [3, 1.2, 0.9], wood);
box(interior, 'cashier-register', [4.5, 1.38, 37.7], [0.5, 0.36, 0.4], '#3f5654', false);
box(interior, 'storage-divider', [6.3, 1.3, 38.6], [0.15, 2.6, 2.5], cream);
box(interior, 'storage-crates', [7, 0.55, 39], [1, 1.1, 1.4], wood);
for (const z of [34.5, 35.7]) box(interior, `queue-mark-${z}`, [4.5, 0.035, z], [1.5, 0.012, 0.08], red, false);
for (const x of [-4, 4]) for (const z of [31, 36]) box(interior, `ceiling-light-${x}-${z}`, [x, 4.84, z], [1.8, 0.08, 0.4], '#fff0c3', false);

export const ROOFS = [
  { id: 'home-roof', position: [0, 3.75, -2], width: 7.4, depth: 7.4, height: 1.5 },
  { id: 'shop-roof', position: [0, 5.65, 34], width: 18, depth: 14, height: 1.3 },
];
// Conservative cuboids cover roof slopes as well as ceilings; no camera-only physics loop.
const roofColliders = ROOFS.map(roof => ({ id: roof.id, position: roof.position,
  size: [roof.width, roof.height, roof.depth], solid: true }));
export const VILLAGE_BOXES = village;
export const EXTERIOR_BOXES = exterior;
export const INTERIOR_BOXES = interior;
export const ENVIRONMENT_COLLIDERS = [...village, ...exterior, ...interior, ...roofColliders].filter(item => item.solid);
// ponytail: one hand-authored route; add pathfinding only when NPC travel needs it.
export const NAVIGATION_ROUTE = [[0, 0, -1], [0, 0, 3], [0, 0, 8], [0, 0, 16], [0, 0, 25], [0, 0, 30], [0, 0, 35], [2.7, 0, 35], [4.5, 0, 36]];
