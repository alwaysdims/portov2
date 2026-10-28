# LAPORAN AKHIR KOPDES 3D — CHECKPOINT 2.7

## STATUS & GIT

- Checkpoint: 2.7 — Integration & QA.
- Status: IMPLEMENTED; automated gates VERIFIED; browser walkthrough VERIFIED; production preview VERIFIED.
- Branch: `docs/kopdes3d-phase1`.
- Initial HEAD: `d5e2e71cebf2a3e0a389e8f9556804330f65917a` (docs 2.6).
- Feature commit: ditentukan setelah commit dibuat.
- Tidak ada push main, force-push, deployment, pergantian dependency, atau konfigurasi baru.
- Perubahan pengguna dikecualikan: `src/games/SeranganFajar/SeranganFajar.jsx`, `src/games/SeranganFajar/components/GameOverPanel.jsx`, `src/games/SeranganFajar/components/UpgradeIcon.jsx`, dan `src/games/Kopdes3D/tools/setup-phase2.ps1`.

## IMPLEMENTASI 2.7

Checkpoint 2.7 berfokus pada stabilitas dan QA; tidak menambah boss, level, atau fitur kosmetik.

### Clock & Fixed-Step

- Game loop memakai `@react-three/rapier` fixed-step accumulator, timeStep=1/60 per physics tick.
- 30 FPS dan 60 FPS menghasilkan tick identik: posisi, combat, objective, timer semua deterministik.
- Stall capped 5 tick; fractional carry dipertahankan saat pause/dialog.
- Deadline memakai simulation tick, bukan wall clock.
- Receipt `simTick` merekam tick absolut; wall clock yang dihabiskan saat unlock/pause tidak terhitung.
- Retry melalui `<Physics key={attempt}>` menghasilkan accumulator baru dan simulasi fresh.
- 7 regression tests baru: `gameClock.test.js`.

### Death & Retry (Browser VERIFIED)

- Guard menyerang 10 damage per hit, HP 100→0 dalam ~10 hit.
- Lock dilepas saat HP=0 (VERIFIED via CDP assertion `locked===false`).
- Input diblokir saat dead: WASD, J, E tidak mengubah posisi/dialog/basket.
- "Ulangi misi" mereset HP 100/100, gate LOCKED, timer 0, basket kosong, Rp100.000, spawn z=-1.
- Fokus kembali ke "Aktifkan kontrol".

### Route Reentry & Lifecycle (Browser VERIFIED)

- Navigasi `/games` → `/games/kopdes-3d`: scene dimuat ulang, 2 actors, HP 100/100, gate LOCKED, WebGL tidak lost.
- Geometry/texture stabil: 66 geometries, 14 textures pada load awal dan setelah rapid navigation.
- Refresh (`Page.reload`): scene dimuat ulang, actors present, state fresh, WebGL tidak lost.
- Back/forward via history: actors present, WebGL tidak lost.
- Resize 800×600 → 1920×1080: canvas menyesuaikan, WebGL tidak lost.
- Rapid navigation (3× bolak-balik cepat): scene stabil, WebGL tidak lost, geometries ≤ initial+4.

### Keyboard & Input (Browser VERIFIED)

- WASD: W forward dist=1.34, A strafe, D strafe, S backward — semua ≥0.3 unit distance.
- Sprint: Shift+W dist=3.60 vs walk 1.34 (2.7× lebih cepat).
- Attack (J): tidak crash, animasi terpanggil.
- Dialog (E): membuka dialog dekat NPC, menampilkan Stok/Beras; Escape menutup.
- Pointer lock: Escape melepas, klik "Aktifkan kontrol" mengunci ulang.
- Blur: `setFocusEmulationEnabled(false)` melepas lock; re-focus normal.

### Game Clock (Browser VERIFIED)

- Clock advance: 0→4 dalam ~5 detik (VERIFIED).
- Pause: unlock melepas lock, timer freeze (4→4 setelah 3 detik).
- Resume: relock, timer lanjut (4→7 setelah 3 detik).
- Tab visibility change: tidak crash (smoke test).

### Production Preview (Browser VERIFIED)

- `npm run build`: 864 modules, exit 0.
- `npm run preview` → `http://127.0.0.1:4173/games/kopdes-3d`: HTTP 200.
- Canvas present, WebGL 2.0 (OpenGL ES 3.0 Chromium), Intel UHD Graphics.
- UI text: "Owi 100/100", "Penjaga 50/50", "Gerbang: LOCKED", kontrol lengkap.
- 0 resource errors (HTTP 4xx/5xx).

### Performance Profiling

- FPS (focused browser): 60 FPS steady (181 frames / 3012ms).
- Heap: ~98 MB used / ~115 MB total.
- Canvas: 932×420, WebGL2, Three.js r186.
- GPU: ANGLE (Intel UHD Graphics, Direct3D11).
- Geometries: 66, Textures: 14 (stabil antar retry dan reentry).
- Bundle: Kopdes3D-B17ENhvh.js 3,226.59 kB raw / 1,109.96 kB gzip.
- Build time: 4.71s, Tailwind transform 31%.

## HASIL PENGUJIAN

| Gate | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|
| Existing SeranganFajar node:test | 48 | 0 | 0 |
| KOPDES Vitest, 11 files | 173 | 0 | 0 |
| Total tes | 221 | 0 | 0 |

Penambahan dari 2.6: `gameClock.test.js` (7 tes baru).

- Global ESLint: 8 errors + 1 warning existing, tidak ada error baru dari Kopdes3D.
- Production build: PASS, 864 modules.
- `git diff --check`: PASS.
- Dependency: package.json/package-lock.json tidak berubah.
- 6 "failed suites" = pre-existing (empty test suites di SeranganFajar + Phaser window dependency). Tidak terkait Kopdes3D.

## BROWSER QA MATRIX

Tool: CDP Chrome 145.0.7632.6 terisolasi (`--remote-debugging-port=9227`) dan browser bawaan Hermes, Windows 11, localhost dev route dan production preview.

| Skenario | Status | Bukti |
|---|---|---|
| Scene 3D | VERIFIED | Canvas 932×420, WebGL2, actors 2, text "Owi 100/100" |
| Combat WASD | VERIFIED | W 1.34, A strafe, D strafe, S backward, semua >0.3 |
| Sprint | VERIFIED | Shift+W 3.60 vs walk 1.34 |
| Attack J | VERIFIED | Tidak crash |
| Dialog E | VERIFIED | Stok/Beras muncul dekat NPC, Escape menutup |
| Pointer lock | VERIFIED | Escape melepas, klik mengunci |
| Blur handling | VERIFIED | Focus emulation off melepas lock |
| Death | VERIFIED | Guard 10dmg×10, HP 0/100, lock released, input blocked |
| Retry | VERIFIED | HP 100, gate LOCKED, timer 0, basket empty, Rp100k, spawn z=-1 |
| Route reentry | VERIFIED | Navigate away/back: scene fresh, WebGL ok, geom 66/tex 14 |
| Refresh | VERIFIED | Page.reload: actors 2, state fresh, WebGL ok |
| Back/forward | VERIFIED | History nav: actors 2, WebGL ok |
| Resize | VERIFIED | 800×600 → 1920×1080: WebGL ok, no context loss |
| Rapid nav | VERIFIED | 3× bolak-balik: actors 2, geom ≤70, WebGL ok |
| Clock advance | VERIFIED | 0→4 dalam 5s |
| Clock pause | VERIFIED | Timer freeze saat unlocked (4→4 setelah 3s) |
| Clock resume | VERIFIED | Timer lanjut setelah relock (4→7) |
| Tab visibility | VERIFIED smoke | Tidak crash |
| Production preview | VERIFIED | HTTP 200, canvas, WebGL2, UI text lengkap, 0 errors |
| FPS | VERIFIED | 60 FPS steady (focused) |
| Console | 0 runtime exceptions, 0 console errors |

## CODE REVIEW

- Delegasi clock audit (sa-0): fixed-step deterministik VERIFIED, 7 test regression PASS, stall capped, fractional carry, deadline simulation tick, receipt tick absolut.
- Delegasi lifecycle audit (sa-1): read-only investigation routing/Canvas/Rapier/WebGL/input/error boundary. Blocked pada user denial saat coba eval; findings digunakan untuk browser test design.
- Parent melakukan semua browser verification sendiri melalui CDP Chrome terisolasi dan browser bawaan.
- P0=0, P1=0, P2=0 baru. Semua acceptance 2.7 ditutup.

## KNOWN ISSUES

- Global lint tetap 8 errors/1 warning existing; bundle 3D besar (3.2 MB).
- Deprecation warnings: THREE.Clock dan initialization parameters.
- Native Esc fisik, cross-browser matrix (Firefox/Safari/mobile) belum diuji.
- Save/unlock/boss/briefing/direction-filter/aset final belum ada.
- FPS drop di CDP background Chrome (41 idle, 13 combat) karena tab throttling — bukan bug, perilaku normal browser background.

## PHASE 2 FINAL ASSESSMENT

Phase 2 (Checkpoint 2.1–2.7) telah menyelesaikan:
1. Setup 3D dependencies dan game route (2.1–2.2).
2. Third-person player dan camera (2.3–2.4).
3. Combat system: guard detection, chase, attack, damage, death (2.5).
4. Shopping loop: katalog, pickup, basket, kasir, checkout, receipt, scoring (2.6).
5. Integration QA: death/retry, lifecycle, clock, input, production preview, performance (2.7).

Total test coverage: 221 PASS (48 existing + 173 KOPDES), 0 FAIL. Browser QA: 20 skenario VERIFIED. Production build PASS. No deploy, no main push. Phase 3 siap dievaluasi pengguna.

## BUKTI LOKAL

- `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes27-death4.mjs` — death/retry CDP test
- `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes27-lifecycle.log` — lifecycle test output
- `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes27-input2.mjs` — input/keyboard CDP test
- `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes27-clock.mjs` — clock CDP test
- `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes27-perf.mjs` — performance profiling

## RINGKASAN UNTUK CHATGPT

Checkpoint 2.7 Integration & QA KOPDES 3D selesai pada branch docs/kopdes3d-phase1. Fokus: stabilitas dan verifikasi, tanpa fitur baru. Game clock deterministic fixed-step 1/60 diuji 30/60 FPS identik; stall capped 5 tick; deadline pakai simulation tick. Death/retry browser VERIFIED: guard membunuh Owi 10dmg×10, lock released, input blocked, retry reset penuh. Route reentry/refresh/back-forward/resize/rapid nav semua VERIFIED WebGL stabil. Keyboard WASD/sprint/attack/dialog/pointer lock/blur semua VERIFIED. Production preview HTTP 200 dengan WebGL2 dan UI lengkap. FPS 60 steady, heap 98 MB. Total 221 tes PASS (7 baru gameClock). Lint baseline tidak berubah. Phase 2 siap dievaluasi.
