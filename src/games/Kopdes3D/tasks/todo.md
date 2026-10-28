# Task vertical slice berikutnya

## Checkpoint 2.5 — status terbaru

- [x] Audit dokumen/source dan perubahan lokal pengguna sebelum edit; scope hanya Kopdes3D.
- [x] Objective enam state, required guard death dedupe dan clear sekali.
- [x] Gate LOCKED/UNLOCKING/OPEN 60 tick; collider/mesh satu pose, menutup bypass perimeter.
- [x] Selector nearest radius 1,8 m/LOS/stable ID; E edge shared listener, state combat lockout.
- [x] BR Beras 1kg Rp14.000 stok6 qty1, temporary cart safe integer dan duplicate reject.
- [x] HUD objective/remaining/gate/open notification/prompt/cart, highlight placeholder dan retry reset.
- [x] 148 tests PASS / 0 FAIL / 0 SKIPPED; focused lint/build/diff check PASS. Lint global baseline tetap gagal (8 errors + 1 warning).
- [x] Browser scene/HUD awal smoke nyata; bukti dan batas dicatat pada [laporan 2.5](../reports/CHECKPOINT_2_5.md).
- [ ] Browser final defeat/open/prompt/pickup/retry dan native Esc: NOT TESTED.
- [x] Review independen read-only: 0 P0/P1/P2; parent full verify 148 PASS.
- [x] Feature `6f18ee912c896a488c140a83ec8a66f7da2af5c2` committed/pushed branch kerja; remote hash cocok. Receipt tersimpan pada laporan.
- [ ] 2.6: rekomendasi saja; tunggu izin checkout/hasil. Tidak ada boss/save/checkout 2.5.

Bagian checkpoint sebelumnya berikut historis; bukan status terbaru 2.5.

## Checkpoint 2.3

- [x] Audit scene/controller 2.2 dan referensi pengguna; baseline 55 tests PASS.
- [x] Desa kecil: rumah, halaman, jalan, pepohonan/semak, tiang/kabel, lampu jalan, warung, pagar dan arena 14 × 14.
- [x] KOPDES exterior merah-putih, atap/kanopi, jendela dan entrance terbuka dengan signage tekstur valid.
- [x] Interior: kebutuhan pokok, minuman, makanan ringan, beras, kasir, antrean, penyimpanan dan panel lampu.
- [x] Komponen terpisah, instancing, colliders primitive, checkpoint dan 13 named anchors.
- [x] Config, Rapier navigation/collision/camera tests; 48 existing + 25 KOPDES PASS; focused lint/build PASS; global lint baseline unchanged.
- [x] Review CLI read-only; dua P2 atap diperbaiki, review ulang tanpa P0/P1/P2.
- [x] Browser WebGL2 render dan perjalanan rumah sampai toko/area kasir pada production preview; bukan sekadar HTTP 200.
- [ ] Full browser visual acceptance, native Esc/mouse orbit/sudut ekstrem dan lifecycle tanpa reload. Status PARTIAL; tidak mengklaim 60 FPS.
- [x] Asset manifest dan [laporan 2.3](../reports/CHECKPOINT_2_3.md) tersedia; feature commit `45044c1fa522a412dfbbadd11a617198c5fb106a` dipush dan hash remote cocok.
- [x] Checkpoint 2.4 diizinkan; handover dan baseline diverifikasi.
- [x] Combat dua stance, dash, satu guard, HP/hit/stun/death/HUD placeholder; 114 tests dan focused lint/build PASS.
- [x] Code review dieksekusi; tiga P2 scene dan dua P2 engine diperbaiki dengan regression tests.
- [x] Browser smoke combat Q/chase/HP50–0/dash VERIFIED; release Escape tool VERIFIED.
- [ ] Full visual/native Esc/retry browser 2.4: NOT VERIFIED; manual QA di [laporan 2.4](../reports/CHECKPOINT_2_4.md).
- [x] Commit/push feature 2.4 `f2fb51fa262f77fbe596e109f36ec736b9510575`; remote hash cocok. Checkpoint 2.5 kini dicatat pada bagian status terbaru di atas.

Bagian Recovery/Phase 1 di bawah adalah catatan historis, bukan status acceptance terbaru.

## Recovery 2026-10-28

Checkpoint 2.1: automated checks VERIFIED; overall PARTIAL because browser smoke test is unavailable. HTTP VERIFIED / BROWSER NOT TESTED. See [checkpoint report](../reports/CHECKPOINT_2_1.md), [security audit](../reports/DEPENDENCY_SECURITY_AUDIT.md), and repository `docs/reviews/2026-10-28-kopdes3d-checkpoint-2.1.md`.

- [x] Exact 3D/Vitest versions and Node 26.9.0 installed; manifest/lock aligned; peer compatibility checked.
- [x] Lazy route and GameGates entry, primitive Rapier scene, loading/error/retry/exit implemented.
- [x] Existing 48 tests, focused lint, build, dependency audit and automated review pass; global lint baseline unchanged.
- [ ] Browser Canvas, Console, assets, direct refresh and navigation acceptance (environment limitation).
- [x] Checkpoint 2.1 committed/pushed: `3111915142873a255416ccbdaddf04a12e6bf32b`; remote hash matched.
- [x] Checkpoint 2.2 implementation local: Owi, WASD, mouse camera, follow, sprint, ground/wall collision and camera obstruction; 7 real-Rapier Vitest tests pass.
- [x] Checkpoint 2.2 automated gates VERIFIED: 48 existing + 7 Rapier tests, focused lint/build, zero-vulnerability audit and final auto-review PASS (3 rounds).
- [ ] Checkpoint 2.2 browser acceptance and full VERIFIED status. Task 4 permits commit/push with overall PARTIAL and browser NOT TESTED recorded. See [2.2 report](../reports/CHECKPOINT_2_2.md). Dash and later gameplay remain separate.

The recovery request authorizes checkpoint commits/pushes on the work branch; no deployment. Original vertical-slice acceptance below remains open until its full behavior is proven.

Semua task belum dimulai. Jalankan hanya setelah checkpoint Phase 1. Path tanpa awalan `src/` relatif terhadap `src/games/Kopdes3D`. Jumlah file adalah perkiraan batas; pecah task bila berkembang. Jangan membuat file kosong sebagai scaffolding.

## T1 — Reproduksibilitas dependensi

- [ ] Tetapkan runtime Node dan selesaikan selisih manifest/lock melalui perubahan yang ditinjau.
- [ ] Periksa official docs dan peer/engine React, R3F, Drei, Rapier, Three, Zustand, Vitest; instal versi kompatibel dan lock hasilnya.
- [ ] Build dan tes existing dapat diulang; catat status lint global tanpa menonaktifkan aturan.

Dependencies: checkpoint Phase 1 dan izin filesystem root. Files: root `package.json`, `package-lock.json`; maksimal dua file konfigurasi tambahan hanya bila perlu. Verify: versi runtime eksplisit, npm dependency tree tidak invalid, `npm run build`, perintah tes baseline di technical_architecture. Simpan hasil audit versi baru di dokumen.

## T2 — Entry game dan fallback

- [ ] Route `/games/kopdes-3d` memakai lazy import dan tampil di `/games`.
- [ ] Loading, error, retry, keluar, direct URL/refresh, Back/Forward bekerja.
- [ ] Portofolio dan dua game lama tetap dapat dibuka; halaman utama tidak memuat engine 3D.

Dependencies: T1. Files: `src/App.jsx`, `src/games/GameGates.jsx`, `Kopdes3D.jsx`, `Kopdes3D.css`. Verify: build dan browser Network/navigation; jangan mengubah implementasi Serangan Fajar.

## T3 — Owi bergerak di dunia placeholder

- [ ] Capsule Owi, lantai, rumah, pintu, kamera third-person dan collider statis berjalan.
- [ ] WASD, sprint, mouse look, pause/blur dan pointer lock tidak meninggalkan input tertahan.
- [ ] Kamera tidak menembus tembok; dash delapan arah diblokir collider dan mengikuti cooldown/i-frame.

Dependencies: T2. Files: `GameWorld.jsx`, `Kopdes3D.jsx`, `config.js`, `gameLogic.js`, `tests/gameLogic.test.js`. Verify: tes arah/boundary cooldown dan browser sudut/pintu/diagonal. Dasar movement/physics dapat memakai ref lokal sebelum store dibutuhkan.

## Checkpoint A — Fondasi

- [ ] T1–T3 lulus; build berhasil dan status lint dicatat.
- [ ] Rekam browser, kontrol, kamera, collision dan error runtime.
- [ ] Tinjau hasil sebelum combat/shopping berikutnya; belum menambah boss atau level lain.

## T4 — Satu guard dan dua stance

- [ ] Guard mempunyai HP, telegraph, attack, recovery dan death; Owi mempunyai tinju tiga hit dan ompreng dua hit.
- [ ] Switch stance aman ketika idle/attack; marker damage satu kali per hitIndex dan batal saat death/interruption.
- [ ] Gate hanya terbuka setelah guard wajib kalah; enemy cap satu.

Dependencies: T3. Files: `GameWorld.jsx`, `gameLogic.js`, `config.js`, `tests/gameLogic.test.js`, `gameStore.js`. Verify: tes hit sector/boundary/dedupe, state cancel, gate; browser mengalahkan guard dengan masing-masing stance. Gunakan placeholder procedural berlabel.

## T5 — Rak beras dan keranjang

- [ ] NPC memberi misi BR1 budget Rp25.000; interaksi rak hanya setelah gate terbuka.
- [ ] Quantity, reservasi stok, total dan sisa budget mengikuti katalog; tambah/hapus tervalidasi.
- [ ] UI belanja mengisolasi input sehingga klik tombol tidak menyerang/men-dash.

Dependencies: T4. Files: `Kopdes3D.jsx`, `GameWorld.jsx`, `gameLogic.js`, `gameStore.js`, `tests/gameLogic.test.js`. Verify: tes unknown SKU/quantity/stok/budget/gate dan browser add/remove/focus. Scope hanya satu SKU.

## T6 — Checkout, hasil, dan checkpoint minimal

- [ ] Checkout dekat kasir memvalidasi misi/budget/stok/timer secara atomik; token duplikat mengembalikan struk sama.
- [ ] Hasil, skor dasar, EXP pertama, dan level 1 selesai dicatat sekali; refresh memulihkan struk/unlock.
- [ ] Save awal dan encounter-clear dapat dipulihkan; quota/corrupt save mendapat pesan, tidak menimpa data diam-diam.

Dependencies: T5. Files: `gameLogic.js`, `gameStore.js`, `Kopdes3D.jsx`, `tests/gameLogic.test.js`. Verify: tes double checkout/revision lama/gagal tanpa mutasi/refresh/reward replay; browser dari rumah sampai hasil. Jangan mengekspos level 2 sebagai playable sebelum fase ekspansi.

## T7 — Bukti slice playable

- [ ] Jalankan unit tests Kopdes3D dan tes existing, lint fokus/global, production build; laporkan setiap gagal apa adanya.
- [ ] Uji VS01–VS10, refresh checkpoint/hasil, death/retry, keyboard menu, pointer lock dan lifecycle mount/unmount.
- [ ] Catat browser/version, perangkat/resolusi, Console/page errors, failed requests, screenshot dan status tiap acceptance.

Dependencies: T6. Files: laporan QA baru dalam Kopdes3D dan maksimal empat file perbaikan yang berhubungan langsung dengan failure. Verify: command exit code dan bukti walkthrough; bila browser tidak tersedia, tulis NOT TESTED dan biarkan checkpoint playable terbuka.

## Checkpoint B — Vertical slice

- [ ] Semua sepuluh acceptance PRD lulus dengan bukti; placeholder tetap diberi label.
- [ ] Laporan membedakan baseline portofolio yang gagal dari masalah Kopdes3D; tidak ada klaim QA global hijau bila lint global masih gagal.
- [ ] Pengguna meninjau hasil sebelum Phase 3. Belum ada implementasi 30 level, Kabdy, Wowo, atau deploy.
