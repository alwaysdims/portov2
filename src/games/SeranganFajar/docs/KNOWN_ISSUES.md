# KNOWN ISSUES & TECHNICAL DEBT — SERANGAN FAJAR

Dokumen pencatatan kendala teknis, aset placeholder, dan risiko performa *Serangan Fajar: The Last Stand*.  
Status per audit Tahap 1: 19 Oktober 2026.

---

## 1. Kendala Aset dan Media

1. **Aset Gambar Bersifat Lembar Konsep (Komposit) Tanpa Channel Alpha**:
   - `Papan Aset Game Serangan Fajar.png` (1536x1024) dan `assets.jpg` (2400x1792) merupakan poster/board desain referensi, bukan spritesheet individual.
   - Latar belakang kotak-kotak pada `assets.jpg` merupakan *baked-in pixels* (gambar raster kotak abu-putih), bukan transparansi PNG alpha asli.
   - *Solusi/Mitigasi*: Tahap 2–11 menggunakan generator canvas pixel art prosedural di memori browser (`TextureFactory`) yang membangkitkan sprite tajam ber-alpha murni. Ekstraksi atau penggantian aset individual dari artist dapat dihubungkan di Tahap 12 tanpa merombak logika combat.

2. **Integrasi Aset Fisik PNG Karakter Wowo & Lingkungan**:
   - Status: **TERSELESAIKAN DI TAHAP 3**.
   - Berhasil dibuat file PNG fisik beralfa murni (RGBA) tanpa artefak checkerboard:
     - `src/games/SeranganFajar/assets/characters/wowo/wowo-idle.png` (48x48)
     - `src/games/SeranganFajar/assets/characters/wowo/wowo-walk.png` (48x48)
     - `src/games/SeranganFajar/assets/characters/wowo/wowo-hurt.png` (48x48)
     - `src/games/SeranganFajar/assets/characters/wowo/wowo-death.png` (48x48)
     - `src/games/SeranganFajar/assets/environment/grass-tile.png` (64x64)
     - `src/games/SeranganFajar/assets/environment/road-tile.png` (64x64)
     - `src/games/SeranganFajar/assets/environment/tps-tent.png` (128x80)
     - `src/games/SeranganFajar/assets/environment/tree.png` (64x80)
     - `src/games/SeranganFajar/assets/environment/baliho.png` (80x100)
   - Karakter Wowo tampil dengan topi pith/safari, kemeja safari krem bersaku ganda, celana utilitas cokelat, dan tongkat komando kayu beraksen emas.

---

## 2. Batasan Teknis dan Risiko Arsitektur

1. **Siklus Lifecycle React 19 / StrictMode**:
   - Status: **TERSELESAIKAN DI TAHAP 2**.
   - Komponen React `SeranganFajar.jsx` mengelola referensi mount dan menghancurkan instance via `game.destroy(true)` secara sinkron saat unmount. Teruji di DOM: 1 canvas saat aktif, 0 canvas saat keluar ke `/games`.

2. **Status Player Wowo & Regenerasi Mana**:
   - Status: **TERSELESAIKAN DI TAHAP 3**.
   - Modul `PlayerStats.js` mengelola HP (1000), Mana (100, regen 5/s delta-time), Energy (100), Speed (220), i-frames (0.7s dengan feedback blink & hurt texture), serta penguncian aksi saat death state.
   - Sinkronisasi React HUD dilakukan via event listener callbacks (`onStatsUpdate`), menghindari re-render per frame.

2. **Missing Asset Files pada `AssetLoader.ts`**:
   - Status: **TERSELESAIKAN DI TAHAP 2**.
   - Seluruh tekstur inisial dibangkitkan secara prosedural oleh `TextureFactory.js` tanpa request aset eksternal yang memicu 404.

3. **Collision Overhead pada Swarm Musuh Banyak**:
   - Jika 100+ musuh mengejar pemain secara bersamaan dan dilakukan deteksi collision O(N^2) antar-musuh, frame rate browser mobile dapat menurun.
   - *Mitigasi*: Musuh hanya mengecek collision terhadap pemain dan proyektil aktif (Arcade Physics QuadTree spatial hash bawaan Phaser). Pemisahan antar musuh menggunakan boids/repulsion ringan berkala, bukan full physics body collision.

4. **Sistem Musuh & AI Dasar (Tahap 4)**:
   - Status: **TERSELESAIKAN DI TAHAP 4**.
   - Spawner terkontrol batas 35 musuh aktif dengan interval 1800ms.
   - Tiga varian musuh terimplementasi: Tim Amplop (melee swarm), Bot Kampanye (tank), Penyebar Hoaks (ranged shooter).
   - Anti-stacking repulsion mencegah tumpukan musuh pada satu titik matematis.
   - ProjectileSystem mengelola peluru hoaks dengan lifetime cleanup dan boundary check.
   - Pause, resume, restart, dan death sequence terintegrasi bersih.

5. **Basic Attack Surat Suara (Tahap 5)**:
   - Status: **TERSELESAIKAN DI TAHAP 5**.
   - Auto-targeting mengidentifikasi musuh terdekat dalam radius 300 unit dunia.
   - Proyektil Surat Suara bergerak lurus (kecepatan 400 unit/detik, damage 25, batas jarak 450 unit) dengan 1 hit per proyektil.
   - Interval tembakan 1.200 ms (1.2s cooldown) dengan 0 Mana cost.
   - Penghentian tembakan saat pause atau Wowo mati; pembersihan total saat restart.

6. **Skill 1, Skill 2, dan Ultimate (Tahap 6)**:
   - Status: **TERSELESAIKAN DI TAHAP 6**.
   - Skill 1 (Tebar Pesona / Q): 3 amplop burst spread arc (-18°, 0°, +18°), 80 damage/amplop, 20 Mana, CD 5s. Tidak menembak / memotong Mana jika tidak ada musuh dalam radius 400.
   - Skill 2 (Orasi Akbar / E): AoE melingkar radius 180, 150 damage, knockback 250 px/s away from player, 35 Mana, CD 8s.
   - Fajar Energy: Akumulasi presisi +0.5 per basic attack hit dan +2 per kill. Baseline awal 0 per PRD 10.2.
   - Ultimate (Serangan Fajar / R): Mengonsumsi 100 Energy (0 Mana), ledakan emas radius 500 dengan 500 damage instan ke seluruh musuh dalam area dan camera shake.
   - HUD React terintegrasi tombol interaktif Q, E, R dengan countdown cooldown, status Mana/Energy, dan visual badge.

7. **Resource, XP, & Level Up (Tahap 7)**:
   - Status: **TERSELESAIKAN DI TAHAP 7**.
   - Sistem drop modular (`DropSystem.js`) dengan proteksi id duplikasi: Suara (XP 100%), Dana (Koin 25-60%), Health (+150 HP), Mana (+30 MP), Bola Energy (+15).
   - Sistem magnet & pickup (`PickupSystem.js`): Jangkauan magnet 140px (kecepatan 340 px/s), auto-pickup 45px, floating feedback pop-up.
   - Formula XP `50 * level^1.5` terimplementasi presisi; kelebihan XP tersimpan dan lonjakan multi-level up terantre rapi tanpa modal bertumpuk.
   - Modal upgrade 3 kartu acak dari pool 6 kategori upgrade: Damage (+15%), Attack Speed (+12%), Max HP (+150 & heal 150), Move Speed (+25 px/s), Mana Regen (+2/s), Cooldown Reduction (-8%).
   - Upgrade yang mencapai level 5 otomatis dikeluarkan dari pool penawaran berikutnya.
   - Integrasi pause khusus level-up membekukan gameplay dan timer; interaksi keyboard [1], [2], [3] dan mouse click berjalan tanpa double-click leak.

8. **Arena & Lingkungan TPS (Tahap 8)**:
   - Status: **TERSELESAIKAN DI TAHAP 8**.
   - Sistem tata letak arena (`ArenaSystem.js`) mengelola permukaan rumput penuh 2400x2400, jalan paving horizontal & vertikal (128px), alun-alun persimpangan pusat (384x384), serta plaza TPS.
   - Penempatan 37 rintangan bertema pemilu: 4 Tenda TPS (`tps-tent.png`, collider meja 100x32), 8 Baliho kampanye (`baliho.png`, collider tiang 56x20), dan 25 pohon rimbun (`tree.png`, collider batang 20x16).
   - Batas arena perimeter 296 blok batu barrier (`ARENA_BORDER`, 32x32) dengan physical collider aktif pada Wowo dan seluruh musuh.
   - Dynamic 2.5D Y-depth sorting memastikan karakter dapat berjalan di balik atap tenda/tajuk pohon dan di depan alas rintangan secara alami.
   - Deteksi spasial `isPositionBlocked(x, y)` terintegrasi pada `EnemySpawner.js` mencegah musuh muncul di dalam rintangan solid atau di luar batas dunia.
   - Kamera smooth follow (lerp 0.08, 0.08) mengikuti Wowo secara halus dengan camera bounds clamp (0, 0, 2400, 2400) tanpa memperlihatkan area luar world di keempat sudut.

9. **Bug Kontrol Input WASD & Pergerakan Pemain (Sebelum Tahap 9)**:
   - Status: **TERSELESAIKAN & DIVERIFIKASI (VERIFIED)**.
   - *Akar Masalah*:
     1. Kesalahan tanda sumbu Y pada tombol `S` / `DOWN`: `if (down) vy -= 1;` di `SurvivalScene.js` menyebabkan input ke bawah memberikan kecepatan Y negatif (-220 px/s, ke atas). Wowo tidak pernah bergerak ke bawah, dan jika berada di dekat rintangan di sisi utara, dorongan ke atas menabrakkan Wowo ke collider rintangan sehingga Wowo tampak diam terkunci.
     2. Normalisasi diagonal tidak simetris: hanya `vx` yang dikalikan `Math.SQRT1_2`, sehingga gerakan diagonal memiliki kecepatan Y yang tidak ternormalisasi.
     3. Kehilangan fokus kanvas: elemen `<canvas>` default tidak memiliki atribut `tabindex="0"`, sehingga klik tombol UI React mempertahankan fokus pada tombol tersebut dan menahan tombol keyboard tertentu.
     4. Retensi status tombol `isDown` saat transisi UI: ketika pause manual, level up modal, atau window blur terjadi saat tombol ditekan, status `isDown` tidak dibersihkan sehingga karakter terus bergerak sendiri atau mengunci input berlawanan saat kembali ke permainan.
   - *Perbaikan*:
     - `SurvivalScene.js`: Memperbaiki logika pergerakan `if (down) vy += 1;` dan normalisasi diagonal simetris `vx *= Math.SQRT1_2; vy *= Math.SQRT1_2;`.
     - `SurvivalScene.js`: Menambahkan `tabindex="0"` pada canvas, listener `pointerdown` untuk auto-fokus canvas dan auto-blur tombol UI, serta listener `window blur` yang memanggil `resetKeys()`.
     - `SurvivalScene.js`: Memanggil `this.input.keyboard.resetKeys()` pada `togglePause()`, `handleLevelUpTrigger()`, `chooseUpgrade()`, dan `restartGame()`.
     - `SeranganFajar.jsx`: Menambahkan event click pada kontainer mount canvas untuk mengembalikan fokus ke canvas dan me-release fokus elemen UI yang aktif.
   - *Hasil Uji*: Wowo dapat bergerak ke 4 arah dengan lancar (W: -220, S: +220, A: -220, D: +220), diagonal ternormalisasi 220 px/s (156 px/s per sumbu), tombol S berhasil menjauhkan Wowo dari rintangan utara ke jalan terbuka, dan kontrol kembali responsif tanpa terhambat transisi UI/pause/blur.

10. **Audio Context Autoplay Policy**:
   - Kebanyakan browser memblokir audio sampai ada interaksi user (klik/sentuhan pertama).
   - *Mitigasi*: `AudioManager` hanya menginisialisasi atau me-resume `AudioContext` saat tombol "Mulai Permainan" atau tombol sentuh pertama ditekan.

---

10. **Implementasi Tahap 9 — HUD & UI Gameplay Selesai**:
    - *Solusi*:
      - Integrasi indikator HP (dengan adaptive color bar, nilai aktual/max, i-frame indicator, dan critical alert <20%).
      - Integrasi indikator Mana (+5/dtk counter, konsumsi instan, sinkronisasi stat).
      - Integrasi Fajar Energy bar dengan golden pulse dan indikator "ULTIMATE SIAP!" saat mencapai 100%.
      - Implementasi Survival Timer (`MM:SS`) terikat waktu delta scene permainan (freeze saat pause dan level up modal, reset saat restart).
      - Implementasi Formula Skor terpadu: survival time (+2 pts/dtk) + musuh gugur (+20 Tim Amplop, +35 Hoaks, +50 Bot Kampanye) + pickup item (+2 pts/XP, +25 pts/koin).
      - Touch Skill Bar mengikuti PRD Section 20.3: `[BASIC ATTACK] [SKILL 1] [SKILL 2] [ULTIMATE]` dengan tombol sentuh nyaman (tinggi 64px, target >48px), cooldown radial sweep overlay, status "NO MANA", pencegahan sticky touch, dan layout responsif untuk desktop dan mobile viewport.

---

11. **Implementasi Tahap 10 — Game Over & Leaderboard Selesai**:
    - *Solusi*:
      - Death Sequence terkontrol: `handleGameOver()` di `SurvivalScene.js` dipanggil tepat satu kali saat HP Wowo mencapai 0 (`stats.isAlive() === false`). Gerakan di-clamp ke nol, body disabled, spawner dihentikan, peluru hoaks dibersihkan (`clearHostileProjectiles()`), screen shake (280ms, 0.008) dan red flash (350ms), serta pose knockdown `wowo-death.png` dikunci.
      - Rekapitulasi Statistik Akhir: snapshot data objektif dibekukan seketika saat gugur (Skor Akhir, Waktu Bertahan `MM:SS`, Level, Kills, Suara/XP, Dana/Koin, Surat Dicoblos, Timestamp).
      - Leaderboard Top 10 LocalStorage (`LeaderboardService.js`):
        - Key: `seranganFajarLeaderboard` dan High Score `seranganFajarHighScore`.
        - Format data terstruktur, batasan maksimal 10 entri, pengurutan skor tertinggi -> waktu terlama -> timestamp tercepat.
        - Sanitasi input nama/inisial pemain (maks 12 karakter, strip HTML tags/karakter terlarang, fallback default `WOWO`).
        - Fallback memori otomatis dan recovery data JSON rusak tanpa crash runtime.
        - Pencegahan duplikasi submit untuk satu sesi permainan yang sama.
      - Komponen `GameOverPanel.jsx`: modal rekap bergaya satir pemilu dengan highlight Skor & Rekor Baru, form input nama aman keyboard (stopPropagation agar tidak memicu kontrol gerakan atau shortcut WASD), tabel Top 10 berperingkat dengan highlight rekor pemain saat ini, dan tombol `MAIN LAGI (R)`.
      - Pembersihan Sesi Bersih: restart mereset state permainan, arena, musuh, proyektil, pickup, dan cooldown, tanpa menghapus rekor skor di leaderboard.

---

12. **Implementasi Tahap 11 — Audio & Visual Feedback Selesai**:
    - *Solusi*:
      - Arsitektur Audio Mandiri (`AudioManager.js`): implementasi murni Web Audio API tanpa dependensi file eksternal (zero download footprint). Mendukung AudioContext auto-resume pada user gesture, volume control terpisah (Master, BGM, SFX), toggle Mute dengan persistensi LocalStorage (`seranganFajarMuted`), serta throttling frekuensi suara agar tidak terjadi audio clipping saat intensitas serangan tinggi.
      - Sound Effects Sintetis: 11 jenis efek suara arcade sintetis terintegrasi langsung ke event gameplay aktual (basic attack zip, enemy impact, defeat crunch, player hurt, Skill 1 envelope arpeggio, Skill 2 megaphone sonic rumble, Ultimate golden chord fanfare + sub-bass blast, pickup XP/koin, level up fanfare, dan game over jingle).
      - BGM Chiptune Retro: aransemen dual-channel sintetis bertempo riang (~107 BPM) dengan melodi square wave dan bassline triangle wave, sinkron dengan pause, resume, game over, dan restart tanpa tumpukan interval.
      - Sistem VFX Terpadu (`VFXManager.js`):
        - Floating damage numbers dengan batas kapasitas maksimal 35 teks dan pewarnaan kontekstual (kuning/putih basic attack, biru skill, emas 500 damage ultimate, merah damage player).
        - Particle hit sparks & defeat debris dengan batas kapasitas 60 partikel, auto-destroyed via tween.
        - Level up aura visual burst melingkar pada posisi Wowo.
        - Controlled camera shake dengan cooldown pencegah penumpukan getaran kamera.
      - Pembersihan Total: seluruh audio timer, damage text, partikel aktif, dan tweens dibersihkan saat game over, restart, dan unmount komponen.

---

13. **Implementasi Tahap 12 — Integrasi Aset Final Selesai**:
    - *Solusi*:
      - Harmonisasi Registry: seluruh 21 key aset di `assetRegistry.js` menggunakan penamaan namespace standar `sf_`, dimuat terpusat di `BootScene.js` dengan listener protektif `loaderror`.
      - Pembuatan Aset Fisik Lengkap: menambahkan aset fisik `border-tile.png` (32x32 RGBA) di `src/games/SeranganFajar/assets/environment/`, melengkapi 21 dari 21 aset utama dalam bentuk file PNG ber-alpha transparan murni.
      - Perlindungan Fallback 100%: `TextureFactory.js` diperluas dengan generator canvas procedural untuk `PLAYER_WOWO_WALK`, `PLAYER_WOWO_HURT`, dan `PLAYER_WOWO_DEATH`, menjamin tidak ada error missing texture bila salah satu aset fisik terhapus atau gagal dimuat.
      - Standarisasi ESM Import: seluruh import file modul internal game ditambahkan ekstensi `.js` / `.jsx` secara eksplisit untuk kompatibilitas lintas environment.
      - Verifikasi Rendering Pixel Art: konfigurasi `pixelArt: true`, `antialias: false`, dan `roundPixels: true` terkonfirmasi aktif pada canvas Phaser tanpa mengubah dimensi bounding box/hitbox physics.

---

14. **Implementasi Tahap 13 — Responsive & Mobile Controls Selesai**:
    - *Solusi*:
      - Virtual Joystick: Dibuat `VirtualJoystick.jsx` di pojok kiri bawah (`bottom-2.5 left-2.5 sm:bottom-4 sm:left-4`) dengan pointer tracking (`pointerId`), radius deflection 38px, dead-zone 6px, serta spring-back ke (0, 0) saat `pointerup`, `pointercancel`, dan `window blur`.
      - Right-Hand Thumb Skill Cluster: Dibuat kluster tombol sentuh adaptif pada pojok kanan bawah (`md:hidden`) untuk tombol Q (Tebar Pesona), E (Orasi Akbar), Auto (Surat Suara), dan R (Serangan Fajar Ultimate) yang ramah jangkauan jempol kanan, sementara desktop tetap menampilkan Touch Skill Bar horizontal terpusat (`md:flex`).
      - Multi-Touch Isolation: Event pointer terisolasi berdasarkan `pointerId`, memastikan sentuhan pada tombol skill kanan tidak memutus atau menggeser posisi virtual joystick di kiri.
      - Safe-Area & Viewport Scaling: Container dibungkus CSS `env(safe-area-inset-*)`, HUD baris ke-2 (HP/Mana/Energy) dipadatkan ke layout grid responsif, banner orientasi disematkan untuk layar portrait sempit, dan panel debug di-footer dibuat collapsible agar tidak memakan ruang vertikal mobile.
      - Non-Regresi Desktop: Keyboard WASD, Q, E, R, P, ESC, 1, 2, 3 tetap beroperasi 100% tanpa konflik dengan input sentuh.
    - *Keterbatasan & Pengujian*:
      - Pengujian multi-touch fisik pada hardware asli ditandai NOT TESTED (diverifikasi via emulation & synthetic pointer event suite di browser Chromium).

---

15. **Implementasi Tahap 14 — Optimasi & Stabilitas Selesai**:
    - *Solusi*:
      - Object Pooling Proyektil: Menghilangkan pemanggilan `projectile.destroy()` selama pertempuran di `ProjectileSystem.js`. Diganti dengan `recycleProjectile()` yang menonaktifkan fisika dan sprite untuk didaur ulang secara instan oleh pool (Surat Suara cap 30, Amplop cap 30, Hoaks cap 40).
      - Object Pooling & Lifespan Pickup: Menambahkan batas pool `maxSize: 60` pada `PickupSystem.js`, mekanisme reuse `getFirstDead()`, dan timer auto-despawn 25 detik (dengan efek berkedip pada 5 detik terakhir) agar item di ujung map tidak menumpuk tanpa batas.
      - Lifecycle & Shutdown Cleanup: Mendaftarkan listener `Phaser.Scenes.Events.SHUTDOWN` pada `SurvivalScene.js` yang secara eksplisit mencopot listener blur window, membersihkan event emitter kustom, membunuh tweens yang berjalan, dan membersihkan seluruh subsistem sebelum restart maupun unmount.
      - Bounded Collections: Mengunci ukuran Set `processedEnemyIds` di `DropSystem.js` maksimal 200 entri untuk mencegah pemborosan memori pada sesi permainan panjang.
      - Arena Cleanup: Memperbaiki `ArenaSystem.destroy()` agar seluruh GameObject tileSprite jalan dan dekorasi TPS benar-benar dihancurkan dari display list.
    - *Keterbatasan & Pengujian*:
      - Pengujian performa FPS pada ponsel spesifikasi rendah (low-end mobile) belum dapat diukur secara presisi (NOT TESTED).

---

16. **Implementasi Tahap 15 — QA & Polish Akhir Selesai**:
    - *Solusi & Temuan*:
      - Perbaikan Bug In-Memory Fallback High Score: Memperbaiki fungsi `readHighScore()` di `LeaderboardService.js` yang mengembalikan `0` akibat `Number(null)` pada lingkungan tanpa storage persisten, serta menambahkan pembersihan `memoryHighScore = 0` pada `resetLeaderboard()`.
      - Verifikasi 82 Kriteria PRD: Menghasilkan dokumen laporan QA komprehensif di `docs/FINAL_QA_REPORT.md` dengan status 79 VERIFIED dan 3 NEEDS REVIEW/NOT TESTED.
      - Pengujian End-to-End 13 Skenario: Seluruh skenario inti dari Start -> Combat -> Skills -> Upgrades -> Game Over -> Leaderboard -> 5x Restart -> Mount/Unmount berhasil diverifikasi.
    - *Keterbatasan yang Masih Ada*:
      - Pengujian interaksi multi-touch pada layar sentuh ponsel fisik nyata belum dilakukan (NOT TESTED).
      - Dua lembar konsep referensi (`Papan Aset Game Serangan Fajar.png` dan `assets.jpg`) berada di repository sebagai acuan desain; lisensi pihak ketiga untuk redistribusi publik belum dipastikan (NEEDS REVIEW), namun aset ini tidak dibundel atau dimuat di runtime game.

---

17. **Implementasi Tahap 16 — Production Integration & Deployment**:
    - *Solusi & Temuan*:
      - Integrasi routing portofolio terverifikasi: link `🎮 GAME` di Navbar mengarah ke `/games` (`GameGates.jsx`) dan membuka `/games/serangan-fajar` via React `lazy` + `Suspense`.
      - Instance Phaser terverifikasi dihancurkan secara sinkron (`game.destroy(true)`) saat unmount tanpa referensi global menggantung.
      - Konfigurasi `vercel.json` rewrite SPA diverifikasi untuk mencegah HTTP 404 saat direct access URL `/games/serangan-fajar`.
      - Production build Vite lulus 0 error; production preview port 4173 teruji end-to-end tanpa console error.
    - *Keterbatasan yang Masih Ada*:
      - Pengujian interaksi multi-touch pada layar sentuh ponsel fisik nyata belum dilakukan (NOT TESTED).
      - Dua lembar konsep referensi (`Papan Aset Game Serangan Fajar.png` dan `assets.jpg`) berada di repository sebagai acuan desain; lisensi pihak ketiga untuk redistribusi publik belum dipastikan (NEEDS REVIEW), namun aset ini tidak dibundel atau dimuat di runtime game.
      - Deployment online ke live public URL belum diuji / memerlukan otorisasi push Git atau token hosting pengguna (NOT TESTED).

---

## Tahap 18.1 — status baru

- VERIFIED: Rekap Total Suara sebelumnya mengambil XP sisa setelah level-up; kini `totalXp` kumulatif terpisah dan hasil run baru menggunakan nilai tersebut. Catatan lama `votesCollected` di localStorage tetap apa adanya: tidak dapat dikoreksi tanpa riwayat XP per run.
- VERIFIED: Modal pernah crash saat `.map()` dipanggil pada prerequisite berbentuk objek; kontrak modal kini memakai `Object.entries`. Saat tak ada kartu eligible, +100 skor per level terantre lalu tutup modal tanpa menambah XP.
- VERIFIED: RunDirector sekarang terintegrasi dalam update scene, memberi peringatan/event lewat HUD, dan event dilepas saat boss, death, restart dan shutdown.
- NEEDS REVIEW: Riwayat dokumentasi Tahap 14 menyebut dedupe set berkapasitas 200; implementasi kini mempertahankan ID musuh sepanjang run untuk mencegah duplikasi drop. Pemakaian memori sesi sangat panjang belum diprofilkan.
- VERIFIED: 10 menit gameplay simulasi 600s di browser lulus tanpa error; 4 siklus event arena dan 3 sinergi evolusi terverifikasi di runtime. Laporan lengkap di `docs/GAMEPLAY_REWORK_REPORT.md`.
- NOT TESTED: Mobile fisik pada layar sentuh asli dan submit leaderboard lewat UI form.
- FAILED: `npm run lint` seluruh repo masih menemukan error di luar direktori game (`LanguageContext`, `ThemeContext`, `GameContainer`).
- NEEDS REVIEW: Aset visual sprite-sheet boss ber-grid seragam Tahap 17 masih memakai pose individual terpisah.

---

## 3. Fitur yang Belum Selesai (Sesuai Roadmap)

*Semua 16 Tahap Pengembangan & Deployment Telah Selesai (Tahap 1–16 COMPLETED/VERIFIED).*

---

## 4. Keputusan Pengguna yang Diperlukan

Game *Serangan Fajar: The Last Stand* telah siap dideploy ke server publik. Untuk mempublikasikan game ke URL production portofolio, jalankan perintah git berikut:
```bash
git add .
git commit -m "feat: complete Serangan Fajar game development and integration"
git push origin main
```
Pipeline Vercel yang terhubung ke repositori GitHub akan secara otomatis mem-build dan mempublikasikan versi terbaru ke live domain.
