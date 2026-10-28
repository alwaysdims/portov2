# Checkpoint 2.2 — Third-person player and camera

Date: 2026-10-28. Branch: `docs/kopdes3d-phase1`. Base: pushed checkpoint 2.1, `3111915142873a255416ccbdaddf04a12e6bf32b`.

Status: **PARTIAL — automated code gates VERIFIED; browser acceptance NOT TESTED**. Recovery Task 4 permits committing code that passes the available checks when browser verification is unavailable, provided no browser PASS is claimed. The checkpoint is ready for its authorized commit/push under that exception. No later gameplay phase was started. Final commit hash and remote comparison are recorded in the recovery response.

## Implemented

- Procedural Owi prototype, static floor/perimeter walls and a house with a walkable doorway. Placeholder visuals remain labelled.
- Camera-relative normalized WASD, walking 3.5 m/s and Shift sprint 6 m/s.
- Pointer-lock mouse yaw/pitch, bounded pitch and finite mouse-delta validation. Keyboard-accessible activation/release button, status and error text.
- Input clears on lock changes, blur, hidden document and unmount. Only this game's owned pointer lock is released. Listener removal and controller cleanup are explicit.
- Rapier kinematic capsule, gravity, slide, ground snapping, 45-degree slope settings and 0.25 m autostep. `Physics` owns the 1/60 simulation; movement runs in its before-step callback. No second physics loop or per-frame React state.
- Smooth third-person camera uses the rendered/interpolated model position after physics updates. Sphere sweep clips the smoothed position against world geometry, excluding player and sensors.
- Controller layout cleanup runs before parent Physics passive cleanup frees/resets its lazy world. This avoids accessing a reset world proxy during controller disposal.

Source scope: `GameWorld.jsx`, `gameLogic.js`, `tests/gameLogic.test.js`, `Kopdes3D.jsx`, `Kopdes3D.css`. No added dependencies, global styling, route changes, combat, dash, shopping, persistence or final assets.

## Automated evidence

Tests were written first and initially failed because `gameLogic.js` did not exist. After implementation, **7/7 Vitest tests** pass with real Rapier WASM and the same world geometry/controller/movement/camera functions used by the game. Scenarios cover normalized diagonals, camera-relative direction, sprint, opposing keys and time partitioning, gravity/ground stability, perimeter/corner blocking with sliding, doorway passage, camera obstruction/self exclusion and sensor exclusion. These do not execute browser input events or WebGL.

`node_modules/node/bin/node.exe src/games/Kopdes3D/tools/verify.mjs` also passes **48/48 existing tests**, focused ESLint, exact global lint baseline comparison and production build. Global lint still has **8 existing errors and 1 warning**; no new finding remains. An intermediate new immutability lint error was fixed by setting canvas attributes in `onCreated`, rather than mutating the renderer value returned by a hook.

Vite 8.3.5 build: 849 modules; lazy KOPDES chunk approximately 3,182.93 kB raw / 1,095.74 kB gzip. Chunk-size warnings remain; no performance/FPS claim. Manifest and lockfile were not changed after 2.1. Separate registry audit remains **0 vulnerabilities**.

HTTP verification on loopback `127.0.0.1:3001`: game route, new world/logic modules and both existing game routes return 200. HTTP does not execute these modules in a browser.

Automated review: **PASS after 3 rounds**, final 0 P0/P1/P2. One P2 camera interpolation finding and one primary-review lifecycle issue were fixed. Final tests/lint/build ran after round 3 and passed. See repository `docs/reviews/2026-10-28-kopdes3d-checkpoint-2.2.md` for evidence and backend limitations.

## Open acceptance

**BROWSER NOT TESTED — ENVIRONMENT LIMITATION**. Computer Use stopped at Windows URL verification before interacting with the game; no permitted connected browser/installed Playwright/Puppeteer is available. No browser protection was bypassed.

The following require a permitted browser before declaring 2.2 VERIFIED:

1. Load/refresh game; confirm Canvas and Owi render, assets load and Console has no new errors.
2. Activate controls with mouse and keyboard; walk all directions, sprint, rotate camera and check follow smoothness.
3. Walk against house/perimeter walls and corners; pass doorway; rotate camera beside walls and inside house.
4. Release with Esc, switch windows/tabs, return and reactivate. Verify no held movement or unintended scroll.
5. Exit/re-enter five times under StrictMode; verify pointer-lock/listener/world cleanup and existing routes.

Slope/autostep behavior, high-aspect-ratio camera clearance, touch/gamepad support and hardware performance have not been verified. Do not infer those from flat-world physics tests. Keep later slice tasks open.
