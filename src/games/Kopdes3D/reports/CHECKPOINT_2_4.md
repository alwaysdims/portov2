# Checkpoint 2.4 — Basic combat

Status: **PARTIAL — automated gates VERIFIED, browser combat smoke VERIFIED, full browser visual/lifecycle acceptance NOT VERIFIED**. Publikasi menunggu receipt di bawah. Checkpoint 2.5 tidak dimulai.

## Handover

Audit aktual pada 28 Oktober 2026: branch `docs/kopdes3d-phase1`, HEAD lokal dan remote `8564613fac9fc7bb3b61502d4c583b1095173d5a`, cocok dengan handover. Feature 2.3 `45044c1fa522a412dfbbadd11a617198c5fb106a` tetap menjadi riwayat, tidak diimplementasikan ulang.

PRD, design, technical_architecture, combat_design, level_design, asset_manifest, plan, todo dan laporan 2.1–2.3 telah dibaca. React Three Fiber menyajikan scene; Rapier memakai capsule kinematic dan collider lingkungan primitive. Kamera sphere-sweep serta controller produksi digunakan kembali. Belum ada game store/progression; combat memakai data mutable terpisah dari snapshot HUD React.

Perubahan lokal pengguna yang tidak termasuk checkpoint: `src/games/SeranganFajar/SeranganFajar.jsx`, `src/games/SeranganFajar/components/GameOverPanel.jsx`, `src/games/SeranganFajar/components/UpgradeIcon.jsx`, `src/games/Kopdes3D/tools/setup-phase2.ps1`. Tidak dihapus atau distage. Subagent sempat membuat tes combat pada root `tests/combat.test.js`; tes tersebut dipindah ke `src/games/Kopdes3D/tests/combat.test.js`, dikonversi ke runner Vitest existing, dan salinan yang dibuat subagent saja dihapus.

Baseline sebelum perubahan: 48 tes existing SeranganFajar + 25 tes KOPDES lulus, focused lint dan build lulus. Global ESLint mempunyai 8 errors dan 1 warning existing; tidak diklaim bersih.

## Implementasi

- Combat murni fixed-tick 60 Hz: HP, timeline windup/active/recovery, hit set tiap swing, hurt, i-frame, death event dan encounter clear tanpa reward/progression.
- Tinju tiga pukulan dan Ompreng MBG dua pukulan, satu buffer combo pada recovery. Pergantian stance langsung saat idle/move, diantrekan saat aksi terkunci.
- Dash input delapan arah, fallback arah hadap, 12 tick/2,8 m, cooldown 120 tick, i-frame tick 2–8. Gerak melalui controller Rapier yang sama, bukan teleport.
- Satu Pasukan Jas Hitam dengan jas, kemeja putih, dasi merah dan peci procedural. AI idle/detect/chase/attack/hurt/dead; tidak ada boss.
- Broadphase sphere Rapier, sector/range/height/faction/i-frame/dedup filter murni, ray line-of-sight terhadap geometry dunia static. Tidak ada damage kedua dari event collider.
- `Physics` automatic loop dijeda; satu panggilan `step` manual memberi accumulator Rapier fixed 1/60 dengan delta maksimal 5/60 per render. Before-step menyiapkan aksi/movement; after-step mengambil posisi physics aktual dan resolve damage. Unlock/blur/hidden membekukan seluruh simulasi, bukan hanya gerak player.
- HUD DOM HP, stance/pending, combo, cooldown dash, state musuh, defeat dan retry. Placeholder punch/swing, trail, flash, billboard damage number dan death pose. Bukan animasi final.
- Input: WASD, Shift sprint, klik kiri/J serang, Q stance, 1/Space dash, Esc jeda. Sprint 6 m/s mempertahankan controller 2.2; angka 5,5 pada desain awal belum diterapkan.

## File

Dibuat: `combat.js`, `combatPhysics.js`, `combatInput.js`, `combatVisuals.js`, `CombatActors.jsx`, `tests/combat.test.js`, `tests/combatPhysics.test.js`, `tests/combatInput.test.js`, `tests/combatVisuals.test.js`, laporan ini.

Diubah: `GameWorld.jsx`, `gameLogic.js`, `Kopdes3D.jsx`, `Kopdes3D.css`, `asset_manifest.md`, `tasks/plan.md`, `tasks/todo.md`.

## Bukti pengujian sementara

- Rapier contact: target overlap, jangkauan, wall obstruction, sensor nonblocking, delapan arah dash melawan perimeter dan lantai: PASS.
- Input command edge, repeat suppression, clear blur/unlock dan cleanup listener: PASS.
- Regression run sesudah integrasi awal: 48 existing + 36 KOPDES PASS; focused lint/build PASS. Combat unit suite terintegrasi pada runner KOPDES: 25/25 PASS.
- Browser smoke nyata di `http://127.0.0.1:3000/games/kopdes-3d`: WebGL 2.0 Chromium, Owi dan guard render, pointer lock aktif, Q mengubah Tinju menjadi Ompreng MBG, sprint mencapai encounter, guard CHASE/ATTACK, hit Ompreng menurunkan HP 50/28/6/0, DEAD bertahan, dash memindah player z=8,2166 ke z=11,0164. Ini bukan sekadar HTTP 200.
- Browser awal mengungkap HUD di bawah viewport dan corpse bergerak saat controller masih dipanggil. HUD dipindah menjadi overlay; corpse tidak lagi menerima movement controller. Damage number kini billboard menghadap kamera. Perbaikan visual tersebut perlu smoke ulang final.
- Built-in browser kemudian terputus (`os error 10061`). Browser terisolasi alternatif tidak mengubah pengaturan keamanan, tetapi tab kemudian berstatus `hidden`, canvas 300x150 dan aktivasi tidak valid. Percobaan lifecycle tersebut **NOT VERIFIED**, bukan PASS. Native Esc, retry browser dan full visual acceptance tetap terbuka sampai bukti sah tersedia.
- Bukti lokal sementara: `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes24-browser.json` dan `kopdes24-*.png`. Percobaan gagal lifecycle disimpan terpisah pada `kopdes24-lifecycle.json`.

## Review

Review persiapan read-only mengingatkan fixed-step ownership, snapshot setelah physics, cleanup controller, input edge dan sprint design drift.

Codex CLI read-only dieksekusi, exit 0. Tiga P2 ditemukan: query kamera belum siap sebelum physics pertama; tangan berayun ke belakang; ekstensi pukulan mendahului active damage. Ketiganya diperbaiki: prime physics satu tick tanpa combat sebelum kamera, rotasi tangan positif mengarah local -Z, dan `attackExtension` plateau selama active/retract selama recovery. Tes visual geometry/timeline ditambahkan.

Reviewer juga menjalankan headless StrictMode mount/step/retry: dua controller, ticks ulang 6/12, dan seluruh tujuh listener berjumlah nol sesudah unmount (REPORTED oleh reviewer, bukan browser visual acceptance). Review ulang Codex CLI exit 0: tidak ada P0/P1/P2, tiga perbaikan sebelumnya diverifikasi. Reviewer independen engine menemukan dua P2 tambahan: CHASE tidak berhenti setelah target tidak terlihat dan stun singkat menghapus sisa hurt lockout. Timer kehilangan target >180 tick dan pengecekan hurt deadline independen dari nama state telah diperbaiki; dua regression tests ditambahkan dan lulus. Tidak ada temuan diketahui yang belum diperbaiki.

## Quality gates final

`node_modules/node/bin/node.exe src/games/Kopdes3D/tools/verify.mjs` exit 0 sesudah perbaikan review: 48 existing tests + 66 KOPDES tests (114 keseluruhan) PASS. Enam test files KOPDES mencakup 25 baseline, 27 combat unit, 12 Rapier combat, satu input lifecycle, satu visual timeline. Focused ESLint PASS; global lint baseline tetap 8 errors + 1 warning existing. Production build PASS, 862 modules. `git diff --check` PASS.

Built-in browser pulih sementara; kontrol aktif lalu `Escape` melalui browser tool benar-benar melepas pointer lock (read-back false). Ini membuktikan handler keyboard release, bukan tombol Esc fisik OS. Browser final remount/full visual tetap belum terverifikasi karena koneksi automation kembali terputus. Tidak ada pengaturan keamanan browser yang diubah.

## Batas scope

Tidak ada boss, skill Penjara/ultimate, shopping/checkout, save, gate progression atau 30 level. Direct chase belum pathfinding. Knockback combo yang ada pada rancangan Phase 1 belum dibuat pada basic combat ini; damage/hurt tetap berjalan. Analog didukung kontrak engine, tetapi binding gamepad browser belum tersedia. Aset tetap placeholder. Tidak ada klaim 60 FPS, kompatibilitas mobile/gamepad penuh, atau QA global bersih.

## Pengujian manual yang masih diperlukan

1. Buka `/games/kopdes-3d`, aktifkan kontrol, berjalan dari rumah menuju penjaga dan lihat HUD tanpa scroll.
2. Klik/J pada recovery untuk combo tinju 1–2–3, Q untuk Ompreng 1–2; pastikan swing, flash dan angka damage terbaca.
3. Dash WASD/diagonal dengan 1/Space ke pagar, tembok, pintu dan penjaga. Uji cooldown, i-frame dan kamera orbit.
4. Biarkan penjaga mengenai Owi sampai kalah; pastikan HP nol, tidak ada aksi sesudah mati. Lepas kontrol dengan Esc fisik.
5. Ulangi latihan tiga kali tanpa reload, keluar/masuk route, blur/tab lain dan kembali. Periksa console dan input tidak berlipat.

Browser smoke awal tetap bukti sah untuk versi yang diuji; screenshot final hitam/koneksi terputus tidak dipakai sebagai bukti render final. Native Esc, retry browser dan penerimaan visual lengkap tetap terbuka. Tidak ada klaim FPS.

## Publikasi

Commit yang direncanakan: `feat(kopdes3d): implement basic combat system`.
Commit hash, URL GitHub dan remote verification: **PENDING**. Tidak push ke main, force-push atau deploy.
