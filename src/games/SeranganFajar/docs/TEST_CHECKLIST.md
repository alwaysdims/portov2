# TEST CHECKLIST — SERANGAN FAJAR: THE LAST STAND

Dokumen pengujian berkala setiap tahap pengembangan *Serangan Fajar: The Last Stand*.  
Status pengujian:
- `[x] VERIFIED` : Teruji langsung dengan verifikasi teknis/eksekusi valid.
- `[ ] NOT IMPLEMENTED` : Fitur belum dibuat.
- `[ ] IMPLEMENTED - NOT VERIFIED` : Kode sudah dibuat namun belum diverifikasi runtime.
- `[!] BLOCKED` : Terhalang dependensi atau masalah kritis.

---

## Tahap 1 — Audit Proyek dan Perencanaan Teknis

- [x] VERIFIED: PRD ditemukan di `src/games/SeranganFajar/PRD.md` dan dibaca lengkap.
- [x] VERIFIED: Struktur proyek, package.json, dan engine Phaser 3 diidentifikasi.
- [x] VERIFIED: Gambar papan aset (`Papan Aset Game Serangan Fajar.png`) & sheet karakter (`assets.jpg`) dianalisis dimensi dan karakteristik alphanya.
- [x] VERIFIED: Status file `AssetLoader.ts` diidentifikasi merujuk aset fiktif di `public/assets/...`.
- [x] VERIFIED: Dokumen `ASSET_INVENTORY.md` dibuat.
- [x] VERIFIED: Dokumen `IMPLEMENTATION_PLAN.md` dibuat.
- [x] VERIFIED: Dokumen `TEST_CHECKLIST.md` dibuat.
- [x] VERIFIED: Dokumen `KNOWN_ISSUES.md` dibuat.
- [x] VERIFIED: Baseline build dijalankan (`npm run build` sukses dalam 3.07s).

---

## Tahap 2 — Fondasi Game dan Game Loop

- [x] VERIFIED: React container `SeranganFajar.jsx` terpasang di routing aplikasi (`/games/serangan-fajar`).
- [x] VERIFIED: Canvas Phaser terpasang tanpa double-instance di React 19 (`canvasCount === 1`, `0` saat unmounted).
- [x] VERIFIED: Arena survival terbentuk dengan batas area (world bounds 2400x2400).
- [x] VERIFIED: Karakter Wowo muncul di tengah arena (1200, 1200) dengan scaling pixel tajam.
- [x] VERIFIED: Input keyboard WASD / Arrow Keys menggerakkan Wowo pada kecepatan 220 px/s (PRD 6.2).
- [x] VERIFIED: Normalisasi kecepatan gerak diagonal berfungsi (kecepatan resultan tetap 220 px/s, vx=155.56, vy=155.56).
- [x] VERIFIED: Kamera mengikuti (smooth follow) karakter Wowo dan terkunci di dalam world bounds.
- [x] VERIFIED: Sistem pause & resume menghentikan dan melanjutkan update Phaser serta menampilkan UI pause modal.
- [x] VERIFIED: Sistem restart mengembalikan posisi Wowo ke (1200, 1200) tanpa duplikasi objek.
- [x] VERIFIED: Cleanup listener dan destroy instance saat unmount komponen React (DOM canvas dihapus bersih).
- [x] VERIFIED: Build production `npm run build` berhasil tanpa error (bundle `SeranganFajar` terpisah 13.7 kB).

---

## Tahap 3 — Karakter dan Sistem Status

- [x] VERIFIED: Baseline stats Wowo (HP 1000, Mana 100, Mana Regen 5/s, Speed 220, Energy 100).
- [x] VERIFIED: Sistem regenerasi Mana per delta time (5/dtk) tanpa melebihi Max Mana (100).
- [x] VERIFIED: Sistem pengurangan HP dan deteksi kematian saat HP <= 0.
- [x] VERIFIED: Invulnerability frames (i-frames) 0.7 detik dengan efek visual blink/flicker dan proteksi damage.
- [x] VERIFIED: Input dan pergerakan dinonaktifkan saat karakter masuk status mati (`status: 'dead'`).
- [x] VERIFIED: Integrasi HUD React status bar (HP gradient bar, Mana blue bar, Energy amber bar, HIDUP/MATI badge).
- [x] VERIFIED: Integrasi fisik PNG true alpha untuk Wowo (`wowo-idle.png`, `wowo-walk.png`, `wowo-hurt.png`, `wowo-death.png`).
- [x] VERIFIED: Integrasi fisik PNG lingkungan (`grass-tile.png`, `tps-tent.png`, `tree.png`, `baliho.png`).

---

## Tahap 4 — Musuh dan AI Dasar

- [x] VERIFIED: Tim Amplop (melee swarm: HP 60, speed 140, damage 15, attack interval 800ms) mengejar Wowo.
- [x] VERIFIED: Bot Kampanye (tank: HP 200, speed 90, damage 30, attack interval 1200ms) berbaris mantap mengejar Wowo.
- [x] VERIFIED: Penyebar Hoaks (ranged: HP 80, speed 110, damage 10, sweet spot distance 170-260px) kiting & menembakkan peluru hoaks.
- [x] VERIFIED: ProjectileSystem mengelola peluru hoaks (speed 220, garis lurus, masa hidup 2.5s, damage 10 ke Wowo).
- [x] VERIFIED: Collision & overlap damage musuh terintegrasi dengan PlayerStats (i-frames 0.7s, blink, camera shake).
- [x] VERIFIED: Overlap tidak memberikan damage setiap frame (dibatasi interval cooldown per musuh).
- [x] VERIFIED: Spawner berkala (1.8s) di luar viewport (420-620px), dibatasi batas kuota maksimum 35 musuh aktif.
- [x] VERIFIED: Anti-stacking separation repulsion menjaga musuh menyebar secara organik mengitari Wowo.
- [x] VERIFIED: Musuh menerima damage (`takeDamage`), menampilkan flash merah, HP bar dinamis, dan mati saat HP <= 0 (disable body, fade-shrink, destroy).
- [x] VERIFIED: Pause menghentikan pergerakan musuh, proyektil, dan timer spawner.
- [x] VERIFIED: Wowo mati (`status === 'dead'`) menghentikan serangan musuh dan spawner.
- [x] VERIFIED: Restart membersihkan seluruh musuh dan proyektil aktif secara menyeluruh.

---

## Tahap 5 — Basic Attack (Surat Suara)

- [x] VERIFIED: Auto-targeting mencari musuh hidup terdekat dalam radius 300 unit dunia Phaser (`findNearestTarget`).
- [x] VERIFIED: Musuh mati (`isDead: true`), di luar radius (> 300), atau body nonaktif diabaikan.
- [x] VERIFIED: Interval serangan otomatis 1.200 ms (1.2 detik cooldown) konsisten tanpa dependensi FPS.
- [x] VERIFIED: Proyektil Surat Suara meluncur lurus ke arah target dengan kecepatan 400 unit/detik.
- [x] VERIFIED: Proyektil memberikan tepat 25 damage saat kena musuh lalu hancur seketika (1 hit per proyektil).
- [x] VERIFIED: Pembersihan proyektil yang melebihi batas jarak jelajah (450 unit) atau keluar dari batas arena.
- [x] VERIFIED: Basic attack tidak memakan Mana (Mana tetap 100/100).
- [x] VERIFIED: Serangan berhenti saat game pause atau Wowo gugur (`status === 'dead'`).
- [x] VERIFIED: Restart membersihkan seluruh proyektil Surat Suara dan mereset sistem serangan.

---

## Tahap 6 — Skill 1, Skill 2, dan Ultimate

- [x] VERIFIED: Skill 1 (Tebar Pesona / Amplop Burst): menembakkan 3 proyektil menyebar (arc -18°, 0°, +18°), 80 damage/peluru, cost 20 Mana, CD 5.000 ms.
- [x] VERIFIED: Skill 1 ditolak jika target tidak tersedia dalam radius 400 unit atau Mana < 20 (tanpa pemotongan Mana & tanpa memicu cooldown).
- [x] VERIFIED: Skill 2 (Orasi Akbar / Gelombang Kampanye): AoE melingkar radius 180 unit, 150 damage ke seluruh musuh dalam radius, cost 35 Mana, CD 8.000 ms.
- [x] VERIFIED: Efek knockback 250 px/s mendorong musuh menjauh dari posisi Wowo dengan aman.
- [x] VERIFIED: Fajar Energy meter terisi dari hit basic attack (+0.5) dan kill musuh (+2) hingga batas 100.
- [x] VERIFIED: Ultimate (Serangan Fajar): ditolak bila Energy < 100; aktif bila Energy = 100 dengan biaya 0 Mana.
- [x] VERIFIED: Ultimate blast memberikan 500 damage instan pada area radius 500 unit, camera shake 300ms, dan me-reset Energy ke 0.
- [x] VERIFIED: Cooldown masing-masing skill berjalan independen dan berhenti saat game di-pause.
- [x] VERIFIED: Tombol skill HUD React (Q, E, R) dan shortcut keyboard sinkron dengan status ketersediaan dan cooldown.
- [x] VERIFIED: Wowo gugur mengunci seluruh input skill; restart membersihkan proyektil dan me-reset cooldown.

---

## Tahap 7 — Resource, Item, XP, dan Level Up

- [x] VERIFIED: DropSystem: Musuh mati memicu drop item (Suara/XP 100%, Dana/Koin 25-60%, Health 6-18%, Mana 6-18%, Energy 5-15%) dengan proteksi single-drop id aman.
- [x] VERIFIED: PickupSystem: Magnet menarik item dalam radius 140px (340 px/s) dan auto-pickup dalam radius 45px dengan feedback floating text.
- [x] VERIFIED: Resource cap & reward: Potion Health memulihkan 150 HP (maks maxHp), Potion Mana 30 MP (maks maxMana), Bola Energy +15 (maks 100), Dana menambah koin.
- [x] VERIFIED: Formula XP mengikuti `50 * level^1.5` (Lv 1: 50, Lv 2: 141, Lv 3: 260, Lv 4: 400). Excess XP tersimpan akurat dan multi-level up dalam 1 pickup terantre aman.
- [x] VERIFIED: Level Up memicu pause game dan memunculkan modal React 3 kartu upgrade berbeda yang di-shuffle dari pool 6 kategori upgrade.
- [x] VERIFIED: Upgrade diterapkan nyata ke gameplay: Damage (+15%), Attack Speed (+12%), Max HP (+150 & heal 150), Speed (+25 px/s), Mana Regen (+2/s), Cooldown Reduction (-8% maks 40%).
- [x] VERIFIED: Upgrade yang mencapai level maksimal (5) otomatis dikeluarkan dari pool kartu berikutnya.
- [x] VERIFIED: Shortcut keyboard [1], [2], [3] dan mouse click berfungsi memilih kartu upgrade tanpa double trigger.
- [x] VERIFIED: HUD React menampilkan indikator Level, progress bar XP, jumlah Dana/Koin, dan regenerasi Mana ter-update.
- [x] VERIFIED: Pause, Death, dan Restart membersihkan seluruh item di arena, mereset antrean level up, dan mengembalikan level/XP ke nilai awal.

---

## Tahap 8 — Arena dan Lingkungan

- [x] VERIFIED: Latar rumput (`grass-tile.png`, 64x64) mengisi penuh world 2400x2400 tanpa celah hitam/transparan (depth 0).
- [x] VERIFIED: Jaringan jalan paving (`road-tile.png`, 64x64) tersusun rapi: jalan raya Timur-Barat (128px), jalan raya Utara-Selatan (128px), alun-alun persimpangan pusat (384x384), serta 4 area paving tenda TPS (depth 1).
- [x] VERIFIED: 4 Tenda TPS (`tps-tent.png`, 128x80) ditempatkan sebagai landmark TPS 01 (Utara), TPS 02 (Selatan), TPS 03 (Barat), TPS 04 (Timur) dengan collider presisi pada meja/alas (100x32, offset 14, 48).
- [x] VERIFIED: 8 Baliho kampanye satire (`baliho.png`, 80x100) terpasang di persimpangan jalan dengan collider kaki kayu (56x20, offset 12, 78).
- [x] VERIFIED: 25 Pohon rimbun (`tree.png`, 64x80) tertata di 4 sektor taman (Barat Laut, Timur Laut, Barat Daya, Tenggara) dengan collider batang bawah (20x16, offset 22, 62).
- [x] VERIFIED: Batas perimeter arena dilindungi 296 blok batu barrier (`ARENA_BORDER`, 32x32) dengan physical collider aktif pada Wowo dan seluruh musuh.
- [x] VERIFIED: Dynamic 2.5D depth sorting terimplementasi: Wowo dan musuh dapat berjalan di balik atap tenda/tajuk pohon dan di depan alas rintangan secara alami.
- [x] VERIFIED: Validasi spawn obstacle (`isPositionBlocked`) mencegah musuh dan pemain muncul di dalam rintangan solid atau di luar batas dunia.
- [x] VERIFIED: Kamera smooth follow (lerp 0.08, 0.08) mengikuti Wowo secara halus dan ter-clamp sempurna pada (0, 0, 2400, 2400) tanpa memperlihatkan area luar world di keempat sudut.
- [x] VERIFIED: Restart merekonstruksi arena bersih tanpa duplikasi physics body atau zombie tiles.
- [x] VERIFIED: Kontrol WASD & Arrow Keys 4 arah (W: vy=-220, S: vy=+220, A: vx=-220, D: vx=+220) bekerja konsisten di seluruh arena.
- [x] VERIFIED: Tombol S / ArrowDown menghasilkan pergerakan ke bawah di area terbuka dan menjauh dari rintangan utara.
- [x] VERIFIED: Normalisasi pergerakan diagonal simetris (156 px/s per sumbu, total resultan 220 px/s).
- [x] VERIFIED: Pemulihan fokus canvas setelah klik tombol UI React (`tabindex="0"`, pointerdown auto-focus & blur tombol aktif).
- [x] VERIFIED: Pembersihan status tombol keyboard (`resetKeys()`) saat window blur, toggle pause, level-up modal, dan restart game.

---

## Tahap 9 — HUD dan UI Gameplay

- [x] VERIFIED: HP Bar (gradient emerald->amber->rose pulse <20%, I-Frame badge, nilai aktual/maksimal) dan Mana Bar (sky-cyan, nilai aktual/maksimal, regen counter +5/dtk) ter-update real-time.
- [x] VERIFIED: Ultimate Energy Bar menampilkan angka 0-100%, animasi golden glow dan ring pulse saat 100%, dan status badge ULTIMATE SIAP! / HIDUP / MATI.
- [x] VERIFIED: Cooldown badges Q (Tebar Pesona), E (Orasi Akbar), R (Serangan Fajar), dan Basic Attack (Surat Suara AUTO) menampilkan timer desimal sweep, status NO MANA jika mana kurang, dan status SIAP.
- [x] VERIFIED: Survival Timer (format MM:SS akurat delta time scene, pause freeze, reset on restart) dan Skor terintegrasi (survival + kills + pickups) tampil menonjol pada header.
- [x] VERIFIED: Touch Skill Bar [BASIC ATTACK] [SKILL 1] [SKILL 2] [ULTIMATE] berukuran sentuh nyaman (tinggi 64px, target >48px), touch-manipulation bebas scroll, pointerdown stopPropagation, dan responsif di desktop maupun mobile viewport.

---

## Tahap 10 — Game Over, Progres, dan Leaderboard

- [x] VERIFIED: Game Over terdeteksi satu kali saat HP Wowo mencapai 0 (`handleGameOver()` freeze pergerakan, stop spawner & peluru hoaks, camera shake-flash, lock death pose).
- [x] VERIFIED: Modal Game Over (`GameOverPanel.jsx`) menampilkan rekap Skor Akhir, Rekor Baru, Rekor Tertinggi, Waktu Bertahan (`MM:SS`), Level, Kills, Suara (XP), dan Dana (Koin).
- [x] VERIFIED: Hasil disimpan ke LocalStorage `seranganFajarLeaderboard` (Top 10) & `seranganFajarHighScore` dengan sanitasi nama (maks 12 karakter), validasi karakter aman, tie-breaking waktu & timestamp, serta fallback in-memory yang tangguh terhadap data korup.
- [x] VERIFIED: Tombol restart membersihkan semua objek game (musuh, proyektil, pickup, arena, timers), mereset HP/status/timer/skor, dan memulai sesi baru yang segar tanpa menghapus rekor leaderboard.

---

## Tahap 11 — Audio dan Visual Feedback

- [x] VERIFIED: Web Audio synthesizer (`AudioManager.js`) menghasilkan SFX retro arcade: basic attack Surat Suara, enemy hit, enemy defeat, player hurt, Skill 1 Tebar Pesona arpeggio, Skill 2 Orasi Akbar sonic boom, Ultimate Serangan Fajar sub-bass blast, pickup Suara/XP, pickup Koin, level up fanfare, dan game over jingle.
- [x] VERIFIED: BGM retro chiptune dual-channel (melody square wave + bassline triangle wave) berjalan looping, sinkron dengan pause/resume/restart/game over, serta didukung toggle Mute/Unmute di header UI dengan penyimpanan state `seranganFajarMuted`.
- [x] VERIFIED: Floating damage numbers (`VFXManager.js`) muncul di koordinat benturan, bergerak naik dan memudar halus, dengan skema warna spesifik (putih/kuning untuk serangan biasa, biru langit untuk skill, emas menyala untuk ultimate 500 damage, merah menyala untuk damage pemain), serta dibatasi kapasitas maksimal 35 objek untuk menjaga performa rendering.
- [x] VERIFIED: Particle hit sparks & defeat debris (`VFXManager.js`) memancar radial saat proyektil mengenai target dan saat musuh gugur, auto-destroy via tween, dibatasi maksimal 60 partikel aktif.
- [x] VERIFIED: Controlled camera shake dengan cooldown pencegah penumpukan getaran pada player hurt (120ms, 0.005), Skill 2 Orasi (180ms, 0.008), Ultimate (320ms, 0.015), dan Game Over (280ms, 0.008). Semua objek VFX dan audio loop dibersihkan total saat restart atau scene shutdown.

---

## Tahap 12 — Integrasi Aset Final

- [x] VERIFIED: Mapping asset key konsisten antara seluruh 21 aset file produksi PNG dengan namespace `sf_` di `assetRegistry.js`, dimuat via `BootScene.js` dengan fallback listener `loaderror`.
- [x] VERIFIED: Resolusi dan rendering pixel art murni (nearest-neighbor scaling, `pixelArt: true`, `antialias: false`, `roundPixels: true`) seragam di seluruh sprite entitas, proyektil, pickup, dan arena tanpa mengubah ukuran physics hitbox.
- [x] VERIFIED: Fallback procedural komprehensif di `TextureFactory.js` meliputi 100% key gameplay (termasuk Wowo Walk/Hurt/Death dan Arena Border) dengan idempotensi pencegahan duplikasi tekstur.
- [x] VERIFIED: Aset fisik `border-tile.png` (32x32 RGBA) ditambahkan dan diintegrasikan, melengkapi status 21/21 aset fisik aktif yang terverifikasi termuat (`IMG`) pada runtime Phaser.

---

## Tahap 13 — Responsive dan Mobile

- [x] VERIFIED: Virtual joystick multi-touch (`VirtualJoystick.jsx`) dengan pointerId tracking, dead zone 6px, clamped radius 38px, dan normalisasi pergerakan analog/diagonal 4-arah tanpa overspeed (kecepatan stabil 220 px/s).
- [x] VERIFIED: Tombol aksi skill touch ergonomis untuk ibu jari kanan (`md:hidden` thumb cluster Q, E, R, Auto) dengan touchAction manipulation dan preventDefault/stopPropagation, mencegah double-cast dan scroll halaman.
- [x] VERIFIED: Layout responsif adaptif untuk viewport desktop, tablet, dan smartphone; bar HUD Row 2 compact 3-kolom pada layar kecil; banner orientasi landscape cerdas; safe-area insets (`env(safe-area-inset-*)`).
- [x] VERIFIED: Multi-touch finger isolation: menggerakkan joystick dengan ibu jari kiri tidak mengganggu ketukan tombol skill dengan ibu jari kanan; pointercancel dan window blur menghentikan joystick ke titik pusat (0, 0).
- [x] VERIFIED: Non-regresi kontrol keyboard desktop: tombol WASD, Q, E, R, P, dan tombol debug tetap berfungsi 100% bersamaan dengan joystick virtual.
- [ ] NOT TESTED: Pengujian pada perangkat mobile fisik (hanya diuji melalui simulasi browser headless & emulation suite).

---

## Tahap 14 — Optimasi dan Stabilitas

- [x] VERIFIED: Object pooling & recycling proyektil (Surat Suara maxSize: 30, Amplop maxSize: 30, Hoaks maxSize: 40) di `ProjectileSystem.js`: daur ulang inactive sprites via `recycleProjectile()`, zero allocation saat combat stabil.
- [x] VERIFIED: Object pooling & expiration pickup di `PickupSystem.js`: batasan `maxSize: 60`, auto-despawn 25s dengan peringatan blinking 5s, serta batasan floating text aktif (max 8) untuk mencegah akumulasi tak terbatas.
- [x] VERIFIED: Memory leak prevention: penambahan listener lifecycle `Phaser.Scenes.Events.SHUTDOWN` di `SurvivalScene.js` yang membersihkan window listener, event emitter Phaser, timer, dan tweens saat restart dan unmount.
- [x] VERIFIED: Cleanup total pada `ArenaSystem.destroy()` yang menghancurkan seluruh tileSprite jalan raya (`roadTiles`) dan dekorasi statis (`propsList`) dari display list.
- [x] VERIFIED: Bounded collections di `DropSystem.js`: set ID musuh dibatasi maksimal 200 entri untuk mencegah kebocoran memori pada sesi permainan panjang.
- [x] VERIFIED: Uji restart berulang (repeated restarts) 3x berturut-turut pada runtime browser berjalan mulus tanpa duplikasi spawner, audio, atau kebocoran state.
- [x] VERIFIED: Build production Vite dan ESLint lulus 0 error.
- [ ] NOT TESTED: Profiling hardware low-end smartphone nyata (hanya diuji melalui browser runtime & unit test).

---

## Tahap 15 — QA dan Verifikasi Akhir

- [x] VERIFIED: Pengujian end-to-end seluruh 13 siklus permainan dari Inisialisasi, Movement, Spawner, Combat, Skills Q/E/R, Drops/Pickups, Level Up/Upgrade, Pause/Resume, Game Over, Leaderboard, Audio/VFX, 5x Restart berulang, hingga React Mount/Unmount.
- [x] VERIFIED: Verifikasi 82 Acceptance Criteria PRD Seksi 31 dan 16 Kriteria Definition of Done Seksi 32 (79 VERIFIED, 3 NEEDS REVIEW/NOT TESTED untuk hardware fisik & sheet konsep non-runtime). Laporan lengkap tersedia di `docs/FINAL_QA_REPORT.md`.
- [x] VERIFIED: Pengujian responsive 7 viewport (375x667, 390x844, 412x915, 667x375, 768x1024, 1280x720, 1920x1080) dengan rasio 16:9 stabil dan zero horizontal scroll overflow.
- [x] VERIFIED: Audit lisensi aset: 21 file PNG di `assets/` adalah buatan internal in-house beralfa murni (NOT APPLICABLE for 3rd Party copyright). Reference sheets dicatat sebagai NEEDS REVIEW (non-runtime).
- [x] VERIFIED: Audit aksesibilitas UI DOM: pairing label-input dengan `useId()`, `maxLength={12}`, kontras teks tinggi, navigasi keyboard terisolasi dari event game.
- [x] VERIFIED: Audit keamanan penyimpanan: sanitasi regex XSS pada input nama, parsing JSON defensif dengan in-memory fallback.
- [x] VERIFIED: Build production `npm run build` dan linter `npx eslint src/games/SeranganFajar` lulus 0 error.
- [ ] NOT TESTED: Pengujian interaksi multi-touch pada perangkat ponsel fisik nyata (hanya diuji melalui Chromium browser automation suite).

---

## Tahap 16 — Production Integration & Deployment

- [x] VERIFIED: Integrasi lazy-loading di `src/App.jsx` dan kartu navigasi game di `src/games/GameGates.jsx` berfungsi mulus.
- [x] VERIFIED: Siklus mount dan unmount bersih: tombol Kembali menghancurkan instance Phaser, menghentikan loop audio, dan membersihkan memori.
- [x] VERIFIED: Konfigurasi Vercel SPA (`vercel.json`) terverifikasi memiliki rewrite rule `/(.*) -> /index.html`.
- [x] VERIFIED: Production build `npm run build` menghasilkan bundle terpisah yang teroptimasi tanpa error.
- [x] VERIFIED: Production preview port 4173 teruji secara end-to-end: navigasi landing -> GameGates -> Serangan Fajar -> gameplay -> kembali -> zero console errors.
- [ ] NOT TESTED: Deployment online ke hosting live publik (memerlukan otorisasi/kredensial pengguna atau push ke GitHub `main`).
