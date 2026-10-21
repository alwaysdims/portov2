# Tahap 18.1 — PARTIALLY COMPLETED

Status berdasarkan pengujian aktual, bukan roadmap. Tidak ada push/deploy.

## Audit awal dan root cause

- VERIFIED: `PlayerStats.xp` dikurangi setiap level-up, tetapi `SurvivalScene.handleGameOver()` dan fallback React Game Over membaca `stats.xp` sebagai `votesCollected`. Total Suara historis jadi hanya sisa XP. PRD menyebut Suara sebagai XP collectible dan Total Suara sebagai hasil; score serta Dana berbeda. Leaderboard lama menyimpan `votesCollected` tanpa versi. Nilai historis tidak dimigrasi karena total aslinya tidak dapat dihitung kembali tanpa seluruh riwayat pickup.
- VERIFIED: Registry upgrade Tahap 18 menyimpan prerequisite sebagai objek `{ id: stacks }`, sedangkan React modal memanggil `.map()` atasnya. Browser sebelum patch menjadi halaman kosong setelah level-up. Eligibility di `eligibleUpgrades()` sudah memfilter prerequisite/max stack saat penawaran, namun modal kosong saat pool habis dan penerapan stat langsung belum memvalidasi batas.
- VERIFIED: `RunDirector.js` tersedia namun belum dibuat/dipanggil oleh scene; `onArenaEvent` tidak ditangani UI. Boss milestone Tahap 18 sudah diantrikan setelah pilihan upgrade. Laporan implementasi Tahap 17 tidak ditemukan di direktori docs; jangan anggap tahap tersebut selesai.
- VERIFIED: `PickupSystem.collectItem()` menandai item terkumpul sebelum `addXp()`. `DropSystem` menggunakan ID instans; game over menolak pickup baru. Level-up XP berlebih memakai `>=` dan while yang mengurangi threshold aktual.

## Perubahan

- `entities/player/PlayerStats.js`: `totalXp` kumulatif dari `addXp()`, snapshot, reset; `xp` tetap progres level. Validasi eligibility juga berlaku saat `applyUpgrade()` stat lama. Benteng Fajar kini memicu emergency shield sebelum damage fatal menembus HP.
- `game/scenes/SurvivalScene.js`: Game Over memakai totalXp; antrean kartu diproses berurutan, ID/efek divalidasi, fallback +100 skor sekali per level terantre saat pool habis, modal ditutup sebelum physics hidup. Telemetri boss diproteksi agar status boss mati tidak menimpa boss baru. Pause/resume tidak membatalkan antrean. RunDirector dibuat, dipanggil memakai detik aktif, dan dihancurkan saat shutdown.
- `entities/enemies/NagaFajarBoss.js`: `takeDamage()` dicegah memancarkan status aktif setelah boss dinyatakan mati.
- `SeranganFajar.jsx`: Total Suara di HUD dan fallback Game Over memakai totalXp; syarat kartu ditampilkan dari objek registry; indikator event/warning di DOM.
- `game/systems/RunDirector.js`, `config/eventConfig.js`, `entities/enemies/EnemySpawner.js`: peringatan 5 detik, durasi 15 detik, cooldown 135 detik. Serbuan mengutamakan musuh Tim Amplop melalui spawner existing (cap aktif); Hujan memunculkan Dana terbatas di sekitar pemain hanya pada titik tidak terhalang. Item event yang tersisa direcycle di akhir; yang terambil tidak ditarik kembali. Boss mengakhiri event dan menggeser jadwal. Tidak ada timer/listener tambahan dalam director.
- `game/systems/DropSystem.js` dan `PickupSystem.js`: perubahan Tahap 18 yang sudah ada di working tree tetap dipertahankan; dedupe ID disimpan sepanjang run; recycle item sinkron mencegah tween lama menimpa pickup baru.
- `tests/progression.test.js`: cakupan XP kumulatif/overflow/death/reset, pilihan 1–2/maxed/prerequisite, data leaderboard lama, dan director pause/boss/event/cleanup. File combat, config upgrade, dan test lain yang sudah diubah Tahap 18 tetap dalam working tree; Tahap 18 secara penuh belum dinyatakan selesai.

## Kontrak upgrade

Sumber tunggal eligibility `eligibleUpgrades(levels)`: ID ada di registry, stack di bawah `maxStacks`, dan tiap entri prerequisite `{ id: requiredStacks }` terpenuhi. Registry saat ini tidak mempunyai incompatibility/exclusion tambahan. Diverifikasi saat membuat pilihan, saat ID dipilih dari choices aktif, dan sebelum menerapkan efek. Pilihan 1–2 tetap 1–2; tidak diduplikasi. Klik berulang pada antrean yang sudah habis tidak menerapkan ulang. Fallback skor tidak menambah XP sehingga tak membuat level-up siklis.

## Hasil pengujian

- VERIFIED: `node --test src/games/SeranganFajar/tests/progression.test.js`: 6/6 lulus.
- VERIFIED: `npx eslint src/games/SeranganFajar`: lulus. `npm run build`: lulus (533 modul; peringatan ukuran chunk Phaser tetap ada).
- FAILED: `npm run lint` repo keseluruhan: 8 error, 1 warning di `src/context/LanguageContext.jsx`, `ThemeContext.jsx`, `src/games/GameContainer.jsx`, `HelloWorld.jsx`, dan `src/sections/Certificates.jsx`. Tidak disentuh karena di luar game.
- VERIFIED (browser dev localhost): naik level setelah XP mencapai threshold; HUD membedakan XP progres dan Total Suara. Modal dapat dipilih tanpa crash. ID invalid/repeat ditolak. Set semua kartu maxed secara test state browser dan beri XP 2000: antrean habis, modal tutup, physics lanjut. Boss aktif membuat event berhenti. Warning/event Serbuan dan Hujan terlihat saat jam gameplay dimajukan lewat console untuk pengujian. Pause menahan elapsed event. Game Over votesCollected sama dengan totalXp; restart menghasilkan instance director baru dan totalXp reset. Browser test memakai state internal development, bukan permainan riil 10 menit.
- NOT TESTED: production preview end-to-end, perangkat mobile fisik, submit leaderboard UI, mount/unmount berulang, projectile/pickup stress dan performa 10 menit penuh.

## Risiko dan sisa Tahap 18

- NEEDS REVIEW: Replay event/wave dan fairness pada build kuat/boss berturut-turut memerlukan 10-minute playtest riil. Spawn fallback EnemySpawner belum menjamin titik bebas rintangan jika delapan percobaan gagal.
- NEEDS REVIEW: Set dedupe drop kini tumbuh per kill sampai run berakhir; profil sesi panjang belum ada. `votesCollected` pada entri leaderboard lama tetap bermakna historis (sisa XP), entri baru kumulatif; tidak dilakukan migrasi destruktif.
- NEEDS REVIEW: Visual/evolusi upgrade dan balancing 0–10 menit Tahap 18 belum diaudit penuh; sprite-sheet Tahap 17 juga belum dibuktikan selesai.
