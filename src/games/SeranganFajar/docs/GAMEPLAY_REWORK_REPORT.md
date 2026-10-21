# LAPORAN REWORK GAMEPLAY & SISTEM UPGRADE 2.0 (TAHAP 18 & 18.1)
**Game:** Serangan Fajar: The Last Stand  
**Proyek:** `E:\Portofolio\portov2` (`src/games/SeranganFajar/`)  
**Status:** IMPLEMENTED & VERIFIED (Local Runtime & 10-Minute Simulation)

---

## 1. Temuan Audit & Root Causes Terverifikasi

1. **Bug Rekap Total Suara (XP Hilang)**
   - *Root Cause*: `PlayerStats.addXp()` mengurangi `this.xp` setiap kali level naik (`this.xp -= xpReq`). `SurvivalScene.handleGameOver()` membaca `this.stats.xp` sebagai `votesCollected`. Akibatnya pemain yang mencapai level tinggi hanya mendapatkan rekap sisa XP dari level terakhir (sering mendekati 0), bukan akumulasi suara.
   - *Solusi*: Menambahkan `totalXp` pada `PlayerStats.js` yang mengakumulasi seluruh perolehan suara valid dan tidak pernah dipotong saat level up. `votesCollected` pada HUD dan rekap Game Over kini membaca `totalXp`.

2. **Softlock Modal Upgrade Saat Pool Habis**
   - *Root Cause*: Ketika semua 16 kartu upgrade telah mencapai `maxStacks`, `getUpgradeChoices()` mengembalikan array kosong `[]`. Namun `SurvivalScene` tetap menghentikan fisika permainan dan membuka modal, mengunci pemain tanpa tombol pilihan.
   - *Solusi*: `presentNextUpgrade()` memeriksa ketersediaan kartu. Jika pool kartu eligible habis, sistem memberikan fallback terukur (+100 skor per level terantre), mengonsumsi antrean level tanpa siklus XP berulang, menutup modal, dan melanjutkan physics.

3. **Format Prerequisite Modal React Crash**
   - *Root Cause*: Definisi upgrade menyimpan `prerequisite` sebagai objek key-value `{ requirementId: stackCount }`. Di UI `SeranganFajar.jsx`, modal memanggil `choice.prerequisite.length` dan `.map()`, memicu crash runtime saat pemain naik level.
   - *Solusi*: Parsing syarat menggunakan `Object.keys(choice.prerequisite || {})` dan `Object.entries()` dengan format nama kartu yang jelas.

4. **Boss Telemetry Race Condition**
   - *Root Cause*: Saat boss pertama dikalahkan, event defeat memicu spawn boss antrean berikutnya secara sinkron. Callback `takeDamage()` pada boss yang mati memancarkan `emitBossStatus(!this.isDead)` (false), yang menimpa status health bar boss baru di HUD.
   - *Solusi*: `takeDamage()` pada `NagaFajarBoss.js` di-guard jika `this.isDead`. Di `SurvivalScene.js`, listener `handleBossStatus` mengabaikan payload status dari instance boss yang bukan `this.activeBoss`.

5. **Lifecycle Scene Shutdown vs Scene Restart**
   - *Root Cause*: Pemanggilan `shutdown()` me-nullkan `this.scene` pada subsistem (`playerSkillSystem`, `runDirector`, dll). Pada update pasca-shutdown sebelum tick restart Phaser berikutnya, akses properti memicu `TypeError`.
   - *Solusi*: Ditambahkan optional chaining defensive `this.scene?.stats?.isAlive()` dan guard `this.sys?.isActive()` pada loop `SurvivalScene.update()`.

---

## 2. Upgrade System 2.0 & Sinergi Evolusi

### 10 Upgrade Perilaku & Stat
1. **Kekuatan Opini (Basic/Common)**: +15% damage semua serangan (maxStacks: 5).
2. **Cepat Coblos (Basic/Common)**: +12% frekuensi auto attack (maxStacks: 5).
3. **Rompi Tebal (Basic/Common)**: +150 Max HP & heal 150 HP (maxStacks: 5).
4. **Gerak Blusukan (Basic/Common)**: +25 kecepatan gerak (maxStacks: 5).
5. **Kopi Stamina (Basic/Common)**: +2 Mana regen/detik (maxStacks: 5).
6. **Relasi Efisien (Basic/Common)**: -8% cooldown skill Q & E, cap 40% (maxStacks: 5).
7. **Surat Suara Pecah (Rare/Projectiles)**: Hit basic memecah menjadi 2 proyektil (40% damage) (maxStacks: 1).
8. **Tembus Barisan (Rare/Projectiles)**: Basic attack menembus 2 target musuh (maxStacks: 1).
9. **Orasi Membara (Rare/Skill)**: Skill E memicu shockwave susulan 350ms kemudian (35% damage) (maxStacks: 1, syarat: Relasi Efisien Lv.1).
10. **Amplop Berantai (Rare/Skill)**: Proyektil Skill Q memantul 1x ke target musuh terdekat (40% damage) (maxStacks: 1).
11. **Pantang Mundur (Rare/Defense)**: Menerima damage memberikan Shield 60 selama 2 detik (maxStacks: 1).
12. **Magnet Demokrasi (Rare/Utility)**: +25 pickup radius, +80 magnet attraction radius (maxStacks: 1).
13. **Langkah Cepat (Rare/Utility)**: Casting skill memberikan buff +45 movement speed selama 2 detik (maxStacks: 1).

### 3 Sinergi Evolusi Legendaris
1. **Badai Surat Suara (Legendary Evolution - Projectile Build)**:
   - *Prerequisite*: Surat Suara Pecah (Lv.1) + Tembus Barisan (Lv.1).
   - *Behavior*: Mengubah auto attack menembakkan 3 berkas proyektil surat suara sekaligus dengan arc spread.
2. **Fajar Bangkit (Legendary Evolution - Skill Build)**:
   - *Prerequisite*: Orasi Membara (Lv.1) + Relasi Efisien (Lv.1).
   - *Behavior*: Ultimate Serangan Fajar (R) memicu gelombang kedua beradius penuh 350ms setelah ledakan emas pertama (35% damage).
3. **Benteng Fajar (Legendary Evolution - Survival Build)**:
   - *Prerequisite*: Pantang Mundur (Lv.1) + Langkah Cepat (Lv.1).
   - *Behavior*: Saat HP berada di bawah 30% atau menerima serangan mematikan, otomatis memicu perisai darurat 150 HP selama 3 detik (cooldown 30s), menyelamatkan Wowo dari kematian instan.

---

## 3. Variasi Run & RunDirector Pacing (0–10 Menit)

Pacing diatur oleh `RunDirector.js` yang berjalan sinkron dengan waktu aktif `survivalTime`:
- **0–3 Menit**: Pacing 1.0x, spawn interval baseline (1800ms), 65% Tim Amplop, 20% Bot Kampanye, 15% Penyebar Hoaks.
- **3–5 Menit**: Pacing 1.3x, spawn interval ~1385ms, 50% Tim Amplop, 28% Bot Kampanye, 22% Penyebar Hoaks.
- **5–10 Menit**: Pacing 1.6x, spawn interval ~1125ms, 40% Tim Amplop, 28% Bot Kampanye, 32% Penyebar Hoaks.

### Dua Event Arena Terjadwal
- **Peringatan Awal**: 5 detik sebelum event dimulai, muncul alert HUD dan SFX peringatan.
- **Event 1: Serbuan Tim Kampanye** (Durasi: 15 detik, Cooldown: 135 detik)
  - Spawner memfokuskan gelombang gerombolan cepat Tim Amplop dengan batas aman aktif (maks. 20 musuh simultan).
- **Event 2: Hujan Amplop** (Durasi: 15 detik, Cooldown: 135 detik)
  - Menjatuhkan collectible Dana (koin emas) di sekitar Wowo pada posisi yang telah divalidasi bebas rintangan bangunan/tenda.
  - Sisa koin yang tidak diambil otomatis dibersihkan saat event berakhir untuk mencegah penumpukan reward.
- **Fairness Guarantee**: Jika boss aktif atau antrean boss terbuka, event arena langsung ditangguhkan untuk mencegah situasi tempur yang tidak adil.

---

## 4. Perubahan File

1. `src/games/SeranganFajar/entities/player/PlayerStats.js`: `totalXp`, emergency rescue shield Benteng Fajar, validasi eligibility stat lama.
2. `src/games/SeranganFajar/game/scenes/SurvivalScene.js`: Integrasi `RunDirector`, presentNextUpgrade, fallback score, guard update lifecycle, proteksi status boss.
3. `src/games/SeranganFajar/game/systems/UpgradeSystem.js`: Seleksi data-driven Fisher-Yates, prioritas evolusi kartu, validasi eligibility.
4. `src/games/SeranganFajar/config/upgradeConfig.js`: Registry terpusat 16 kartu upgrade, rarity, icon, dan balance constants.
5. `src/games/SeranganFajar/config/eventConfig.js`: Durasi, interval, cap musuh, dan cooldown event arena.
6. `src/games/SeranganFajar/game/systems/RunDirector.js`: Director mandiri untuk pacing gelombang dan event terjadwal.
7. `src/games/SeranganFajar/entities/enemies/EnemySpawner.js`: Pengaturan pacing dinamis, komposisi musuh berfase, guard level-up pause.
8. `src/games/SeranganFajar/entities/enemies/NagaFajarBoss.js`: Guard status post-mortem.
9. `src/games/SeranganFajar/game/systems/ProjectileSystem.js`: Multi-hit piercing, projectile split, dan chain bouncing.
10. `src/games/SeranganFajar/game/systems/PlayerAttackSystem.js`: Implementasi tembakan multi-projectile Badai Surat Suara.
11. `src/games/SeranganFajar/game/systems/PlayerSkillSystem.js`: Mekanisme delayed followup wave dan buff kecepatan gerak.
12. `src/games/SeranganFajar/SeranganFajar.jsx`: Indikator HUD event arena, formatting prerequisite kartu, sinkronisasi totalXp.
13. `src/games/SeranganFajar/tests/progression.test.js`: Suite tes otomatis progression, eligibility, event director, dan shield.

---

## 5. Hasil Pengujian Aktual

1. **Unit & Integration Suite (`node --test`)**:
   - 6/6 tes lulus:
     - XP threshold, overflow, multi-card queue, death & restart.
     - Deterministic choices, uniqueness, eligibility, & single-apply validation.
     - 1–2 cards, maxed-out pool, invalid ID rejection.
     - Backward compatibility format leaderboard lama.
     - RunDirector warning, activation, boss/pause/death interruption & cleanup.
     - Benteng Fajar emergency fatal hit rescue.

2. **Linter & Build**:
   - `npx eslint src/games/SeranganFajar`: Lulus 0 error.
   - `npm run build`: Lulus exit 0 (533 modules transformed, bundle Phaser terpisah).

3. **Verifikasi Browser Runtime & 10-Minute Simulation**:
   - Uji live browser port 3000 & 4173.
   - Simulasi 600 detik (10 menit) berjalan mulus tanpa error:
     - 180s (3m): Level 5, totalXp 900, pacing 1.3x, active enemies 18.
     - 300s (5m): Level 6, totalXp 1500, pacing 1.6x, active enemies 18.
     - 600s (10m): Level 7, totalXp 3000, pacing 1.6x, active enemies 20.
     - 4 siklus event arena (Serbuan Tim Kampanye & Hujan Amplop) terpicu dengan durasi tepat 15 detik dan peringatan 5 detik.
     - Jumlah proyektil dan musuh stabil dalam batas object pooling (active votes capped at 30, enemies capped at 20-35).
   - Seluruh 3 sinergi evolusi berhasil diuji di browser: Badai Surat Suara (3 peluru spread), Fajar Bangkit (gelombang susulan ulti), dan Benteng Fajar (penyelamatan nyawa kritis).

---

## 6. Dampak Performa & Balancing

- **Object Pooling**: Proyektil basic attack dibatasi 30, amplop 30, peluru musuh 40, pickup 60. Tidak ada memory allocation spike selama 10 menit gameplay intensif.
- **Batas Entitas**: Spawner dan director membatasi musuh aktif maksimum 35 unit, menjaga frame rate 60 FPS pada canvas WebGL.
- **Power Curve**:
  - Menit 0–3: Pemain fokus farming Suara dari mob lemah.
  - Menit 3–5: Mob tank dan ranged mulai menekan, menuntut pemilihan kartu spesialisasi (AoE atau single target DPS).
  - Menit 5–10: Evolusi kartu aktif memberikan lonjakan kekuatan yang seimbang dengan peningkatan kecepatan spawn musuh dan duel boss.

---

## 7. Risiko & Rekomendasi Selanjutnya

1. **Pengujian Perangkat Fisik (Mobile Touch)**:
   - Simulasi touch pointer di browser berfungsi normal. Namun responsivitas joystick pada smartphone fisik dengan berbagai kerapatan layar (DPI) tetap perlu dicoba secara manual oleh tester manusia (ditandai NOT TESTED).
2. **Lint File Luar Game**:
   - `npm run lint` keseluruhan repo masih mendeteksi isu lama di luar folder `SeranganFajar` (`LanguageContext.jsx`, `ThemeContext.jsx`, `GameContainer.jsx`). Kode game sendiri 100% clean lint.
3. **Deployment**:
   - Proyek siap di-push dan di-deploy saat pengguna memberikan otorisasi git commit/push.
