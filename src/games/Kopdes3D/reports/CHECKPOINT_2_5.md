# Checkpoint 2.5 — Objective, gerbang, dan satu produk

Status: **IMPLEMENTED; automated gates VERIFIED; browser PARTIAL; review independen selesai**. Publikasi dicatat pada receipt. Tidak ada checkout, boss, save atau perubahan game lain.

## A — Git dan audit

- Workspace `E:/Portofolio/portov2`, branch `docs/kopdes3d-phase1`.
- HEAD awal: `11468211d6bfd48a36a60df6ec0f90686e125bb9`.
- Read-back `git ls-remote origin refs/heads/docs/kopdes3d-phase1` mengembalikan hash sama sebelum laporan ini. Remote tidak ditulis.
- Feature commit hash/URL: **PENDING parent publication**, bukan URL commit yang sudah ada.
- Audit membaca PRD, design, technical_architecture, combat_design, level_design, asset_manifest, plan/todo, laporan 2.3/2.4 serta scene/input/combat/controller/environment aktual. Baseline combat memakai satu guard, event history terbatas, physics manual fixed 60 Hz dan satu listener input bersama.
- Perubahan pengguna tidak disentuh: `src/games/SeranganFajar/SeranganFajar.jsx`, `src/games/SeranganFajar/components/GameOverPanel.jsx`, `src/games/SeranganFajar/components/UpgradeIcon.jsx`, `tools/setup-phase2.ps1`.

## B — Implementasi dan integrasi

Baru: `objectives.js`, `tests/objectives.test.js`, `tests/objectivePhysics.test.js`, laporan ini.

Diubah: `GameWorld.jsx`, `Kopdes3D.jsx`, `combatInput.js`, `combatPhysics.js`, `tests/combatInput.test.js`, `tasks/plan.md`, `tasks/todo.md`, `asset_manifest.md`.

- Mesin murni deterministik: `APPROACH_ARENA`, `DEFEAT_GUARDS`, `UNLOCK_KOPDES`, `ENTER_KOPDES`, `INTERACT_WITH_PRODUCT`, `PRODUCT_COLLECTED`. Required guard IDs unik, death Set dan event cursor mencegah duplikasi clear. Guard runtime tetap satu; kontrak diuji dengan dua required guards.
- `advanceObjectives` sesudah resolve combat/physics, sekali per tick; repeated tick tidak memajukan timer. Hanya event death required guard membuka akses, bukan trigger lokasi/HP yang dikirim UI.
- Gate `LOCKED → UNLOCKING → OPEN`: 60 tick unlocking. Placeholder bergetar vertikal kecil selama unlocking, lalu terangkat 4 m pada tick OPEN. Gate lebar 24 m menutup jalur sampai perimeter agar tidak bisa memutari pagar pendek. Body fixed dan mesh menerima pose sama pada callback tick; `propagateModifiedBodyPositionsToColliders()` memperbarui collider langsung. Tidak memakai snapshot React untuk mengubah collision.
- Registry selector reusable `nearestInteraction`: radius 3D inclusive, LOS static Rapier, stable lexical ID tie. Produk memakai existing shelf-rice interaction anchor. Sensor dan actor bukan dinding. Tidak menambah sensor/listener/render-loop kedua.
- E edge masuk listener combat yang sama: held/repeat suppression, clear consume/blur/unlock dan cleanup. DEAD/ATTACK/DASH/HURT/STUNNED, HP nol, active action serta deadline hurt/stun memblokir prompt/pickup; input ditolak tidak di-buffer.
- BR `Beras 1kg`, Rp14.000, stok awal 6, qty tepat 1. Satu pickup mereservasi stok menjadi 5, cart `{quantity:1,total:14000}`. Unknown SKU, quantity selain 1, stok/cart tidak sah dan duplicate pickup ditolak tanpa mutasi parsial; total dari katalog, safe integer. Bukan transaksi/pembayaran.
- HUD objective/remaining/gate, notifikasi OPEN selama 180 tick, prompt E/nama/harga/stok, cart sementara; ring anchor dan wireframe display beras menandai target aktif. Snapshot pertama diterbitkan saat mount, tidak harus mengaktifkan kontrol dahulu.
- Retry existing keyed Physics remount membangun ulang simulation/objective/input/body: HP guard, event history, gate, stok, cart, notification dan prompt kembali awal.

## C — Tests dan quality gates

Verifikasi parent: `node_modules/node/bin/node.exe src/games/Kopdes3D/tools/verify.mjs`, runtime **Node v26.9.0**, exit 0. `git diff --check` exit 0; warning LF/CRLF Git tetap muncul.

| Suite/gate | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|
| Existing SeranganFajar node:test | 48 | 0 | 0 |
| KOPDES Vitest, 8 files | 100 | 0 | 0 |
| Objective pure, termasuk parameterized cases | 19 | 0 | 0 |
| Objective real Rapier | 15 | 0 | 0 |

Dua baris objective adalah subset 100, bukan tambahan di luar 100. Total keseluruhan **148 tests PASS, 0 FAIL, 0 SKIPPED**. Input lifecycle existing diperluas dengan E held/repeat/release/blur dan tiga remount listener. Sisa 66 tes KOPDES sebelumnya tetap PASS.

Real Rapier memakai controller/collider produksi: 13 lintasan sprint center/seam/perimeter x=-11/-8.5/-7.8/-7.5/-7.2/-6/0/6/7.2/7.5/7.8/8.5/11 tertahan LOCKED; seluruh 59 tick sebelum OPEN tetap memblokir; sesudah OPEN capsule berjalan melewati portal sampai interior. Collider translation diperiksa terhadap pose visual tiap tick dengan toleransi float32. LOS sensor lolos, wall menolak, wall dihapus lolos lagi.

Tes murni: urutan objective, required guards/unknown death/duplicate history, clear satu kali, repeated tick, OPEN notification expiry, radius/height/tie/invalid target/LOS, semua state lock, satu pickup, quantity/stok/cart invalid, integer total, snapshot isolation dan tiga fresh-run reset combat/objective.

Focused ESLint **PASS**. Global lint **FAIL existing**, baseline comparison PASS: **8 errors + 1 warning unchanged**. Production build **PASS**, 863 modules, KOPDES JS 3.207,43 kB raw / 1.104,69 kB gzip pada run akhir. verify menyaring output build; tidak mengklaim build bebas warning. Tidak ada dependency baru/security audit baru.

## D — Browser classification

**PARTIAL smoke, bukan full acceptance.** Built-in isolated browser membuka `http://127.0.0.1:3000/games/kopdes-3d`. Read-back `document.visibilityState=visible`, canvas 1252×420, pointer lock true sesudah tombol Aktifkan kontrol.

| Area | Hasil |
|---|---|
| Scene/HUD render | VERIFIED smoke: screenshot menampilkan Owi, environment, distant red gate, objective dan cart terbaca dalam viewport |
| Objective awal | VERIFIED DOM: Dekati arena, penjaga tersisa 1, gate LOCKED, BR×0, Rp0, stok 6 |
| Combat 2.5 walkthrough | NOT TESTED; bukti 2.4 historis bukan klaim versi ini |
| Gate locked/open browser traversal | NOT TESTED; real Rapier automated PASS, bukan bukti browser |
| Interaction prompt/highlight dan pickup browser | NOT TESTED; selector/LOS/pickup automated PASS |
| Retry native browser/lifecycle | NOT TESTED; listener unit remount/reset factories PASS |
| Native Esc, FPS/hardware/browser matrix | NOT TESTED |

Screenshot lokal: `C:/Users/ASUS/AppData/Local/hermes/cache/screenshots/browser_screenshot_a77da8c4c5a7495790336bc14fea4be1.png` (cache dapat dipangkas). Setelah hot update dan Escape tool, snapshot berikutnya kosong; percobaan itu tidak dihitung sebagai PASS. Smoke screenshot mendahului tambahan wireframe highlight dan initial mount snapshot terakhir. Parent mengulang browser: DOM final terbaca (LOCKED, remaining 1, cart 0, stok 6), canvas 1252×420 dan document visible, tetapi screenshot final seluruhnya putih. Final render NOT VERIFIED; walkthrough combat/gate/highlight/pickup/retry NOT TESTED. Penyebab screenshot putih belum diketahui. Tidak ada klaim console bebas error/full walkthrough/leak-free/browser final acceptance.

## E — Review

Self-review menemukan **0 P0, 0 P1, 1 P2**: memindahkan fixed body saja dapat membiarkan collider memakai pose sebelumnya sampai step berikutnya. Diperbaiki dengan propagasi collider dalam callback yang sama. Recheck lewat real Rapier pose-per-tick dan full automated gates PASS, known outstanding self-review P0/P1/P2 = **0/0/0**.

Kegagalan test awal delapan kasus adalah assertion equality float64 versus Rapier float32 (`1.7` vs `1.7000000476837158`), bukan bypass; assertion diubah ke toleransi 5 digit. Semua sembilan real Rapier tests kemudian PASS; enam kasus seam tambahan juga PASS pada run akhir.

Review independen Hermes read-only selesai: **0 P0, 0 P1, 0 P2**. Reviewer menjalankan 100 tes KOPDES PASS, probe Rapier immediate ray setelah gate lift, serta replay event-ring overflow: clearCount 1, gate OPEN, PRODUCT_COLLECTED, stok 5, quantity 1, total 14000 (REPORTED reviewer). Parent menjalankan ulang full verify: 148 PASS; focused lint/build/diff check PASS. Tidak ada temuan independen yang memerlukan perubahan. Batas: mounted React retry dan browser walkthrough belum diverifikasi; factory reset dan orchestration Rapier bukan bukti lifecycle browser.

## F — Issues / batas

- Browser acceptance final dan full walkthrough belum terbukti; status PARTIAL diizinkan oleh instruksi terbaru.
- Gate adalah slab procedural selebar perimeter, bergetar lalu lift seketika, bukan gate leaf/animasi final. Sengaja tetap solid sepanjang unlocking agar tidak lolos sebelum OPEN.
- Cart satu SKU/qty1 saja, tanpa remove, budget, NPC briefing, checkout, save, reward, boss atau progression berikutnya. Tidak menutup seluruh VS01–VS10 PRD.
- Interaksi 2.5 memakai radius/LOS/tie sesuai scope terbaru; filter arah pandang rancangan penuh belum diaktifkan.
- Snapshot HUD/highlight maksimal terlambat enam tick; validasi aksi dan gate collider tetap authoritative fixed tick.
- Global lint existing belum bersih; warning dependency/toolchain historis dan bundle besar bukan klaim baru terselesaikan.

## G — Rekomendasi 2.6 (tidak diimplementasikan)

Sesudah parent menyetujui review dan browser acceptance parsial, checkpoint berikutnya dapat merancang checkout atomik/idempotent, budget/mission validation dan hasil minimal. Perlu izin terpisah; jangan menambah boss/checkout/save pada 2.5. Prioritaskan walkthrough defeat → OPEN → E pickup → retry sebelum memperluas transaksi.
