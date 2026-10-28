# Task vertical slice berikutnya

## Recovery 2026-10-28

Checkpoint 2.1: automated checks VERIFIED; overall PARTIAL because browser smoke test is unavailable. HTTP VERIFIED / BROWSER NOT TESTED. See [checkpoint report](../reports/CHECKPOINT_2_1.md), [security audit](../reports/DEPENDENCY_SECURITY_AUDIT.md), and repository `docs/reviews/2026-10-28-kopdes3d-checkpoint-2.1.md`.

- [x] Exact 3D/Vitest versions and Node 26.9.0 installed; manifest/lock aligned; peer compatibility checked.
- [x] Lazy route and GameGates entry, primitive Rapier scene, loading/error/retry/exit implemented.
- [x] Existing 48 tests, focused lint, build, dependency audit and automated review pass; global lint baseline unchanged.
- [ ] Browser Canvas, Console, assets, direct refresh and navigation acceptance (environment limitation).
- [ ] Checkpoint 2.2: Owi, WASD, mouse camera, follow, sprint, ground/wall collision and camera obstruction. User authorizes this slice after 2.1 push; dash and later gameplay remain separate.

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
