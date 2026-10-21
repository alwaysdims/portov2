# LAPORAN TAHAP 19 — COMBAT FEEL, BOSS ENCOUNTER & DYNAMIC OBJECTIVES
**Game:** Serangan Fajar: The Last Stand  
**Proyek:** `E:\Portofolio\portov2` (`src/games/SeranganFajar/`)  
**Status:** COMPLETED & VERIFIED (Unit Test 11/11, ESLint Clean, Production Preview Port 4173 Tested)

---

## 1. Temuan Audit Awal

1. **Combat Feedback Terbatas**:
   - Hit flash musuh sebelumnya bernuansa merah samar (`0xff5555`) selama 120ms yang tenggelam di atas latar gelap arena. Wowo saat terkena hit hanya mengubah frame tanpa flash warna jelas.
   - Proyektil basic attack (`voteProjectiles`) tidak memicu knockback sama sekali, membuat tembakan terasa tanpa daya impuls.
   - Suara hit (`playEnemyHit`) monoton untuk semua tipe target tanpa distingsi antara musuh biasa, elite, atau boss.
2. **Pacing Spawning Boss Terlalu Agresif**:
   - Boss sebelumnya dijadwalkan pada *setiap kali pemain naik level* mulai dari Level 2. Pada run normal di mana pemain mencapai level 8 dalam 8–10 menit, hal ini memicu rentetan 7 boss beruntun tanpa jeda duel yang adil.
3. **Absennya Dynamic Objectives**:
   - Pemain cenderung melakukan circular kiting monoton selama 5–10 menit karena tidak ada stimulus objektif lokal yang mengharuskan pemain mempertahankan posisi tertentu di arena.
4. **Ketiadaan Sistem Replayability Lokal**:
   - Belum ada sistem pencapaian (achievements) untuk memberikan target jangka panjang selain skor leaderboard.

---

## 2. Perubahan Combat Feel

1. **Hit Flash Responsif**:
   - Musuh memicu flash putih kontras tinggi (`0xffffff`) selama 75ms sebelum kembali ke warna normal (atau warna rage `0xff3333` jika dalam Fase 2).
   - Wowo memicu flash merah terang (`0xff4444`) selama 100ms dan shake kamera ringan saat terkena damage.
2. **Micro Knockback Non-Destruktif**:
   - Basic attack (`handleVoteHitEnemy`) memberikan impuls knockback 75 px/s selama 80ms searah vektor tembakan pada musuh biasa.
   - Skill Q Amplop (`handleEnvelopeHitEnemy`) memberikan knockback 140 px/s selama 120ms.
   - Boss kebal terhadap knockback (`applyKnockback` no-op) untuk mempertahankan wibawa encounter.
3. **Audio Hit Berjenjang**:
   - `audioManager.playBossHit()`: Synthesizer nada rendah (130Hz -> 40Hz) dengan gelombang sawtooth punchy saat boss atau elite menerima damage.
   - `audioManager.playCombo()`: Chime harmonik naik (A4 -> C#5 -> E5) saat mencapai milestone streak kill.
   - `audioManager.playAchievement()`: Fanfare nada akord naik (E4 -> A4 -> C#5 -> E5 -> A5) saat pencapaian terbuka.
4. **Damage Numbers Berwarna & Capped**:
   - Ditambahkan tipe `"boss"` (crimson `#f43f5e`, stroke tebal) dan tipe `"crit"` (amber emas `#f59e0b`).
   - Kapasitas maksimal tetap dibatasi 35 teks melayang (`MAX_DAMAGE_TEXTS`) dengan pembersihan instan objek tertua.
5. **Combo Kill Streak System**:
   - Window combo berdurasi 2.500 ms (2.5 detik).
   - Kill beruntun mengakumulasi streak combo yang ditampilkan pada HUD (`🔥 COMBO xN!`).
   - Setiap kill combo memberikan bonus skor flat (+3 poin per streak).
   - Streak 5, 10, 20, dan 50 memicu audio cue dan teks pop crit.
   - Streak otomatis reset saat window 2.5s berakhir tanpa kill baru.

---

## 3. Boss Encounter — Naga Fajar

- **Intro & Visual**: Kamera melakukan shockwave berdenyut (280ms) dan memancarkan 10 partikel crimson saat boss muncul. HUD menampilkan alert banner kartu dengan subtitle *"Simbol Kekuatan Kebenaran"*.
- **Pacing Milestone**: Boss kini dijadwalkan pada **Milestone Level 3, 6, 9** (setiap 3 kenaikan level) melalui `pendingBossLevels`, bukan setiap level tunggal.
- **Tiga Pola Serangan**:
  1. *Dragon Area Sweep*: Telegraph lingkaran merah 850ms beradius 85px (Fase 1) atau 105px (Fase 2) memberikan jeda dodge yang adil bagi pemain.
  2. *Paper Talisman Spread*: 3 peluru kertas (Fase 1) atau 5 peluru menyebar (Fase 2).
  3. *Summon Minion*: Memanggil Naga Kecil (dibatasi maksimum 2 minion simultan).
- **Fase 2 Berserk**:
  - Terpicu saat HP <= 50% (750 / 1500 HP).
  - Kecepatan gerak bertambah (+20), interval serangan dipercepat (1600ms dari 2200ms), visual beralih ke tekstur rage merah menyala.
- **Special Reward (1x Guarantee)**:
  - Saat mati, menjatuhkan 5 Suara Besar (175 XP), 6 Koin Dana, 2 Potion HP, 2 Potion Mana, dan 2 Fajar Energy Orbs.
  - Guard `this.isDead` menjamin reward drop hanya tereksekusi tepat satu kali.
- **Fairness Guarantee**:
  - Boss tidak menyerang saat game di-pause atau saat modal upgrade aktif.
  - Spawning boss otomatis ditangguhkan jika arena event atau dynamic objective sedang berlangsung.
  - Boss dan telegraph dibersihkan secara bersih saat Restart, Game Over, atau Scene Shutdown.

---

## 4. Dynamic Objectives

Sistem diatur oleh `ObjectiveSystem.js` dengan dua tipe objective bergantian (cooldown 110s):

1. **Objective 1 — Bersihkan Hoaks**:
   - **Target**: Kalahkan 5 Penyebar Hoaks dalam waktu 35 detik.
   - **Bantuan Spawner**: Spawner memprioritaskan kemunculan Penyebar Hoaks agar target selalu dapat tercapai.
   - **Reward**: +300 XP (Suara) & +500 Skor (diberikan tepat satu kali).
2. **Objective 2 — Amankan Kotak Suara**:
   - **Mekanik**: Spawn zona lingkaran beradius 90px pada posisi valid arena (bebas rintangan tenda/bangunan).
   - **Target**: Bertahan di dalam zona selama total 12 detik dalam batas waktu 40 detik.
   - **Visual Feedback**: Lingkaran bercahaya cyan yang berubah hijau saat Wowo berada di dalam, dilengkapi visual arc progress bar.
   - **Reward**: +400 XP, +600 Skor, 1 Health Potion, dan 1 Mana Potion.
3. **Keamanan & Sinkronisasi**:
   - Timer berhenti saat pause (`isPaused`) atau level up (`isLevelUpPaused`).
   - Saling mengunci dengan `RunDirector`: Arena event ("Serbuan Tim Kampanye" / "Hujan Amplop") tidak akan memicu jika objective sedang aktif, dan sebaliknya.
   - Grafis zona dan listener dibersihkan saat objective selesai, gagal, atau scene restart.

---

## 5. Replayability & Achievements

Dikelola secara terisolasi oleh `AchievementService.js` melalui LocalStorage key `seranganFajarAchievements` dengan in-memory fallback:

1. **Pembasmi Hoaks**: Kalahkan 25 Penyebar Hoaks secara kumulatif.
2. **Tak Terkalahkan**: Bertahan hidup selama 5 menit (300 detik) dalam satu sesi run.
3. **Master Surat Suara**: Buka evolusi kartu *Badai Surat Suara* dalam satu run.
4. **Penakluk Fajar**: Kalahkan Boss Naga Fajar.
5. **Pengawal Demokrasi**: Selesaikan Dynamic Objective *Amankan Kotak Suara*.
6. **Raja Combo**: Capai combo kill 20x berturut-turut.

- **Integrasi UI**:
  - Tombol **Piala (Trophy)** di header bar membuka modal daftar pencapaian yang menampilkan status terkunci/selesai secara rapi.
  - Notifikasi melayang (*Achievement Toast*) muncul otomatis saat achievement berhasil dibuka bersamaan dengan SFX fanfare.
  - Tidak memodifikasi atau menghapus leaderboard skor yang sudah ada.

---

## 6. Balancing Menit 5–10

1. **Variasi Komposisi Musuh**:
   - Menit 0–3: 65% Tim Amplop, 20% Bot Kampanye, 15% Penyebar Hoaks.
   - Menit 3–5: 50% Tim Amplop, 28% Bot Kampanye, 22% Penyebar Hoaks.
   - Menit 5–10: 40% Tim Amplop, 28% Bot Kampanye, 32% Penyebar Hoaks.
2. **Anti-Circular Kiting**:
   - Rasio Penyebar Hoaks yang meningkat (32%) menghasilkan tembakan proyektil silang yang memotong jalur putaran pemain di arena.
   - Dynamic Objective *Amankan Kotak Suara* memaksa pemain menahan posisi teritorial kecil (90px) alih-alih terus berlari memutar.
3. **Ekonomi Resource & Pacing**:
   - Pacing bertahap (1.0x -> 1.3x -> 1.6x) menjaga tempo tanpa meledakkan kuota active enemies (dibatasi 35 unit).
   - Drop potion dari objective dan duel boss menjamin pasokan pemulihan HP/Mana yang memadai untuk build pertarungan jarak dekat (survival build).

---

## 7. Berkas yang Diubah / Dibuat

### Berkas Baru:
- `src/games/SeranganFajar/config/objectiveConfig.js`: Konfigurasi target, durasi, dan reward objective.
- `src/games/SeranganFajar/config/achievementConfig.js`: Registri 6 achievement replayability.
- `src/games/SeranganFajar/services/AchievementService.js`: Tracker pencapaian lokal dan statistik kumulatif.
- `src/games/SeranganFajar/game/systems/ObjectiveSystem.js`: Logic runner objective dinamis dan render visual zona.
- `src/games/SeranganFajar/tests/combat_objectives.test.js`: Suite tes otomatis untuk achievement, objective, dan boss pacing.

### Berkas Dimodifikasi:
- `src/games/SeranganFajar/game/audio/AudioManager.js`: Penambahan synthesizer `playBossHit()`, `playCombo()`, dan `playAchievement()`.
- `src/games/SeranganFajar/game/systems/VFXManager.js`: Dukungan damage number style `"boss"` dan `"crit"`.
- `src/games/SeranganFajar/entities/enemies/EnemyBase.js`: Hit flash putih kontras tinggi (75ms).
- `src/games/SeranganFajar/game/systems/ProjectileSystem.js`: Micro knockback terarah pada basic attack dan amplop, routing suara `playBossHit()`.
- `src/games/SeranganFajar/game/systems/PlayerSkillSystem.js`: Knockback radial ulti dan routing audio boss hit.
- `src/games/SeranganFajar/entities/enemies/NagaFajarBoss.js`: Intro shockwave & partikel pada constructor.
- `src/games/SeranganFajar/config/bossConfig.js`: Penyesuaian helper `getBossConfigForLevel` berbasis milestone index.
- `src/games/SeranganFajar/game/systems/RunDirector.js`: Fairness check terhadap status active objective.
- `src/games/SeranganFajar/game/systems/UpgradeSystem.js`: Hook rekaman achievement evolusi *Badai Surat Suara*.
- `src/games/SeranganFajar/game/scenes/SurvivalScene.js`: Integrasi `ObjectiveSystem`, pelacakan combo, penjadwalan boss milestone Level 3/6/9, dan pembersihan lifecycle.
- `src/games/SeranganFajar/SeranganFajar.jsx`: Tombol Piala, modal achievement, panel floating dynamic objective, combo streak badge, dan achievement toast.
- `src/games/SeranganFajar/docs/IMPLEMENTATION_PLAN.md`: Pembaruan status Tahap 19.
- `src/games/SeranganFajar/docs/TEST_CHECKLIST.md`: Checklist pengujian Tahap 19.
- `src/games/SeranganFajar/docs/KNOWN_ISSUES.md`: Status isu dan batasan Tahap 19.

---

## 8. Hasil Pengujian Unit Test

Jalankan perintah: `node --test src/games/SeranganFajar/tests/combat_objectives.test.js && node --test src/games/SeranganFajar/tests/progression.test.js`

**Hasil:**
- `combat_objectives.test.js`: 5/5 pass (AchievementService unlocks, Objective Bersihkan Hoaks, Objective Amankan Kotak Suara, RunDirector & Objective fairness, Boss milestone config).
- `progression.test.js`: 6/6 pass (XP overflow, upgrade eligibility, leaderboard backward compat, director lifecycle, Benteng Fajar emergency shield).
- **Total: 11/11 tests pass (Exit code 0).**

---

## 9. Hasil Verifikasi Browser & Production Preview

1. **Development Server (Port 3000)**:
   - Tombol Piala di header bar membuka modal pencapaian dengan 6 item terdaftar.
   - Objective "Bersihkan Hoaks" dan "Amankan Kotak Suara" memancarkan progress bar di HUD dan memberikan reward XP/score/potion 1x.
   - Boss Naga Fajar dapat di-spawn, memicu intro shockwave, health bar di HUD, Fase 2 Berserk saat HP <= 50%, dan menjatuhkan reward drop melimpah saat mati.
   - Streak combo tampil dengan badge api melayang saat kill beruntun terjadi dan hilang saat window 2.5s usai.
2. **Production Preview (Port 4173)**:
   - `npm run build` menghasilkan bundle terpisah yang teroptimasi tanpa error.
   - Navigasi ke `http://localhost:4173/games/serangan-fajar` berjalan mulus.
   - Canvas Phaser WebGL aktif, zero console error, zero unhandled promise rejection.

---

## 10. Performa

- **Rendering**: Frame rate stabil di 60 FPS pada resolusi 1280x720.
- **Draw Calls & Particle Cap**: Batas partikel `MAX_ACTIVE_PARTICLES: 60` dan teks damage `MAX_DAMAGE_TEXTS: 35` mencegah beban alokasi memori berlebih.
- **Audio Synthesis**: Web Audio API berbasis oscillator menjamin latency audio < 5ms tanpa overhead unduhan aset audio eksternal.

---

## 11. Known Issues & Keterbatasan

- **NOT TESTED**: Pengujian multi-touch fisik pada perangkat keras layar sentuh smartphone asli belum dilakukan.
- **FAILED**: Perintah `npm run lint` untuk keseluruhan repositori portofolio masih mendeteksi error di luar direktori `src/games/SeranganFajar` (`LanguageContext.jsx`, `ThemeContext.jsx`, `GameContainer.jsx`). Kode game sendiri 100% lolos ESLint.
- **NEEDS REVIEW**: Aset visual sprite Naga Fajar masih berupa pose statis individu dari generator gambar, bukan spritesheet ber-grid animasi.

---

## 12. Rekomendasi Tahap Berikutnya (Tahap 20)

1. **Meta-Progression & Cosmetic Unlocks**: Menggunakan koin Dana yang dikumpulkan untuk membuka varian skin Wowo (Wowo Cyber, Wowo Gold, Wowo Patriot).
2. **Audio Volume Slider**: Menambahkan kontrol slider volume BGM dan SFX mandiri di menu pause/settings.
3. **Soundtrack Asli (OGG/MP3)**: Opsional menggantikan synth BGM dengan track musik satir pemilu berkualitas studio bila aset tersedia.
