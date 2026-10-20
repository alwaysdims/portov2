# IMPLEMENTATION PLAN — SERANGAN FAJAR: THE LAST STAND

**Versi Rencana:** 1.0.0  
**Tanggal:** 19 Oktober 2026  
**Referensi:** PRD Serangan Fajar v1.0.0 (`src/games/SeranganFajar/PRD.md`)  
**Tujuan Proyek:** Mengembangkan game browser top-down survival satire pemilu Indonesia "Serangan Fajar: The Last Stand" yang responsif, stabil, memiliki core combat ala MOBA (Basic Attack, Skill 1, Skill 2, Ultimate), progression (XP, Level Up, Upgrade), gelombang musuh dinamis, dan terintegrasi aman di website portfolio React+Vite.

---

## 1. Arsitektur Teknis

### Pemisahan Tanggung Jawab (Separation of Concerns)
1. **React (`SeranganFajar.jsx`, `ui/*`)**:
   - Menangani DOM wrapper, mounting Phaser canvas, HUD overlay, Modal Level-Up, Modal Game Over, Pause menu, Settings, dan Virtual Touch Controls untuk mobile.
   - Tidak pernah mengeksekusi kalkulasi fisika, collision, atau pergerakan entitas di React state.
   - Menerima payload gameplay lewat event bus terpusat (`GameBridge.js`).
2. **Phaser 3 (`game/*`, `entities/*`, `combat/*`, `progression/*`)**:
   - Menjalankan Game Loop 60 FPS, Arcade Physics, Camera Follow, Collision, Spawning, Enemy AI, Projectiles, Collectibles.
   - Menyediakan bridge event untuk mengirim snapshot berkala atau event-driven (Health change, Mana change, Ultimate energy change, Cooldowns, Score, Level Up, Game Over) ke UI React.
3. **Audio (`audio/AudioManager.js`)**:
   - Menggunakan Browser Web Audio API terintegrasi (Zero-asset footprint synthesizer) untuk seluruh SFX (Basic Attack, Skill 1, Skill 2, Ultimate, Hit, Hurt, Pickup, Level Up, Game Over) dan retro Chiptune BGM.
4. **Storage (`services/LeaderboardService.js`, `services/StorageService.js`)**:
   - Browser LocalStorage untuk Top 10 Skor Lokal (`seranganFajarLeaderboard`) dan Rekor Tertinggi (`seranganFajarHighScore`) dengan sanitasi fallback aman.
5. **Texture & Asset Registry (`config/assetRegistry.js`, `game/TextureFactory.js`)**:
   - Membangkitkan aset pixel art prosedural beresolusi tajam (Nearest-neighbor) dengan transparansi alpha murni langsung ke Phaser Texture Manager, mencegah 404 error dan memungkinkan transisi instan ke file PNG eksternal saat aset final siap.

---

## 2. Struktur Direktori Implementasi

```text
src/games/SeranganFajar/
├── index.js                     # Export komponen utama
├── SeranganFajar.jsx            # React root container & event integration
├── config/
│   ├── gameConfig.js            # Konfigurasi Phaser, dimensi canvas, physics
│   ├── playerConfig.js          # Baseline stat Wowo (HP, Mana, Speed, Range, dll)
│   ├── skillConfig.js           # Stat & cooldown Skill 1, Skill 2, Ultimate
│   ├── enemyConfig.js           # Stat & scaling tipe musuh (Amplop, Bot, Hoaks, dll)
│   ├── progressionConfig.js     # XP threshold curve & pool upgrade
│   ├── balanceConfig.js         # Konstanta balancing terpusat
│   └── assetRegistry.js         # Texture key registry
├── game/
│   ├── createGame.js            # Instansiasi Phaser Game terkontrol (no double instance)
│   ├── GameBridge.js            # Event emitter perantara Phaser <-> React
│   ├── TextureFactory.js        # Generator pixel-sprite prosedural dengan alpha murni
│   └── scenes/
│       ├── BootScene.js         # Registrasi tekstur & transisi
│       ├── SurvivalScene.js     # Main gameplay scene & entity coordinator
│       └── GameOverScene.js     # Transisi akhir sesi
├── entities/
│   ├── player/
│   │   ├── Wowo.js              # Entitas player & komponen kontrol
│   │   ├── PlayerStats.js       # HP, Mana, Energy, CDR, Multipliers
│   │   └── PlayerController.js  # Handler input keyboard WASD & virtual joystick
│   ├── enemies/
│   │   ├── BaseEnemy.js         # Class induk musuh (health, damage, knockback, drop)
│   │   ├── EnvelopeEnemy.js     # Tim Amplop (melee swarm)
│   │   ├── CampaignBotEnemy.js  # Bot Kampanye (tanker HP tebal)
│   │   └── HoaxRangedEnemy.js   # Penyebar Hoaks (ranged shooter)
│   ├── projectiles/
│   │   ├── ProjectileManager.js # Pool & update seluruh peluru
│   │   ├── VoteProjectile.js    # Proyektil basic attack
│   │   ├── EnvelopeProjectile.js# Proyektil Skill 1
│   │   └── HoaxBullet.js        # Proyektil musuh ranged
│   └── collectibles/
│       ├── CollectibleManager.js# Spawning, pickup collision, magnetism
│       └── Collectibles.js      # Suara (XP), Dana (Koin), Heart, Mana, Orb Energy
├── combat/
│   ├── CombatSystem.js          # Koordinasi attack, range check, damage routing
│   ├── BasicAttack.js           # Auto-targeting & shoot timer
│   ├── SkillSystem.js           # Trigger & cooldown validation
│   ├── Skill1Envelope.js        # Logika burst 3 peluru amplop
│   ├── Skill2CampaignWave.js    # Logika AoE shockwave + knockback
│   └── UltimateSeranganFajar.js # Logika blast emas radial 500 unit
├── progression/
│   ├── ExperienceSystem.js      # Akumulasi XP & formula level up
│   ├── UpgradeManager.js        # Seleksi 3 kartu acak & aplikasi stat upgrade
│   └── DifficultyManager.js     # Scaling spawn rate & musuh seiring waktu
├── effects/
│   ├── VFXManager.js            # Hit sparks, ring explosions, screen shake
│   └── DamageNumbers.js         # Floating damage text di canvas
├── audio/
│   └── AudioManager.js          # Web Audio API retro synth (SFX + BGM)
├── services/
│   └── StorageService.js        # LocalStorage wrapper (leaderboard, highscore, audio settings)
├── ui/
│   ├── GameHUD.jsx              # Status bar HP/Mana/Energy, timer, score, vote count
│   ├── SkillBar.jsx             # Skill buttons dengan cooldown radial & status ready
│   ├── VirtualJoystick.jsx      # Mobile touch joystick
│   ├── UpgradeModal.jsx         # Popup pilihan 3 kartu upgrade
│   ├── PauseModal.jsx           # Pause menu & opsi resume/restart
│   └── GameOverModal.jsx        # Rekap hasil skor, survival time, & leaderboard
└── docs/
    ├── ASSET_INVENTORY.md
    ├── IMPLEMENTATION_PLAN.md
    ├── TEST_CHECKLIST.md
    └── KNOWN_ISSUES.md
```

---

## 3. Daftar Tahapan dan Status

| Tahap | Nama Tahap | Target Utama | Status |
|---|---|---|---|
| **Tahap 1** | Audit Proyek & Perencanaan Teknis | Baca PRD, audit aset, analisa dependensi, buat 4 dokumen | **COMPLETED** |
| **Tahap 2** | Fondasi Game & Game Loop | Container React, mount Phaser, arena batas, Wowo move WASD, pause, lifecycle cleanup | **COMPLETED** |
| **Tahap 3** | Karakter & Sistem Status | HP (1000), Mana (100 + 5/s regen), I-frames (0.7s), Hurt/Death sprite & state, HUD bar | **COMPLETED** |
| **Tahap 4** | Musuh & AI Dasar | Tim Amplop (melee swarm), Bot Kampanye (tank), Penyebar Hoaks (ranged), Spawner max 35 cap, Projectile system, damage integration | **COMPLETED** |
| **Tahap 5** | Basic Attack | Auto targeting terdekat, projectile Surat Suara (dmg 25, spd 400, cd 1.2s), hit detection, kill tracking | **COMPLETED** |
| **Tahap 6** | Skill 1, Skill 2, & Ultimate | Tebar Pesona (Q/Skill 1), Orasi Akbar (E/Skill 2), Serangan Fajar (R/Ultimate), Fajar Energy meter, knockback, cooldown & HUD | **COMPLETED** |
| **Tahap 7** | Resource, XP, & Level Up | Collectible Suara/Dana/Health/Mana/Energy, DropSystem, PickupSystem (magnet), formula XP 50*lvl^1.5, Level-up pop-up 3 kartu upgrade stat | **COMPLETED** |
| **Tahap 8** | Arena & Lingkungan | Detail visual arena TPS, jalan paving, tenda TPS, baliho, pohon rimbun, batas collision, camera smooth follow & clamp | **COMPLETED** |
| **Tahap 9** | HUD & UI Gameplay | Health Bar, Mana Bar, Energy Bar, Cooldown badges, Timer, Score, Touch Skill Bar | **COMPLETED** |
| **Tahap 10**| Game Over & Leaderboard | Death sequence, rekap stat, LocalStorage Top 10, Restart bersih | **COMPLETED** |
| **Tahap 11**| Audio & Visual Feedback | Web Audio SFX & BGM, damage numbers, hit spark, ultimate screen shake | **COMPLETED** |
| **Tahap 12**| Integrasi Aset Final | Pematangan sprite/placeholder, registrasi asset key seragam | **COMPLETED** |
| **Tahap 13**| Responsive & Mobile | Virtual joystick, touch buttons, portrait/landscape handling | **COMPLETED** |
| **Tahap 14**| Optimasi & Stabilitas | Object pool, memory leak check, cleanup event listener, build production | **COMPLETED** |
| **Tahap 15**| QA & Polish Akhir | Verifikasi menyeluruh terhadap Acceptance Criteria PRD | **COMPLETED** |
| **Tahap 16**| Production Integration & Deployment | Routing portofolio, Vercel SPA config, build production, preview testing | **COMPLETED (Preview) / READY (Online)** |

---

## 4. Keputusan Teknis dan Asumsi

1. **Procedural Pixel Texture Generator (`TextureFactory.js`)**:
   - Gambar papan aset yang ada berformat komposit RGB tanpa channel transparansi alpha dan bukan file sheet terpotong. Untuk menjamin kestabilan Tahap 2–11 tanpa downtime aset, dibuat generator tekstur bitmap internal di memory kanvas.
   - Tekstur memiliki dimensi pixel art yang sesuai (Wowo 48x48, Musuh 36–48px, Proyektil 16–24px, Item 18–20px) dengan palet warna satire yang kontras dan mudah dikenali.
2. **Audio Menggunakan Web Audio API Synthesizer**:
   - Sesuai dengan modul audio `WowoJumpAudio.js` yang sudah sukses di portfolio, Web Audio API menjamin zero-asset network latency, bebas kegagalan pemuatan file ogg/wav di browser yang ketat autoplay, dan ringan ukuran bundle-nya.
3. **Integrasi Routing Portfolio**:
   - Game didaftarkan di `src/games/GameGates.jsx` dengan route `/games/serangan-fajar` dan di-lazyload di `src/App.jsx` agar chunk Phaser tidak membebani halaman landing portofolio.
4. **State Separation**:
   - React state hanya menyimpan data yang perlu dirender ke DOM (HP/Mana/Energy percent, cooldown seconds tersisa, score, wave timer) dengan throttling interval (100ms) atau event-driven dari Phaser.

---

## 5. Daftar Bug & Risiko Teridentifikasi

1. **Double Instance React 19 StrictMode**:
   - Di React 19 / development mode, `useEffect` berjalan dua kali. Handler unmount harus memanggil `game.destroy(true)` secara sinkron dan me-nullified referensi game container agar tidak terjadi kebocoran canvas ganda.
2. **Missing Asset Files pada `AssetLoader.ts`**:
   - `AssetLoader.ts` memuat file di `/assets/games/serangan-fajar/...` yang tidak ada di `public/`. Jika dipakai langsung, game akan crash saat memuat. File ini akan digantikan oleh arsitektur loader berbasis `TextureFactory` dan `assetRegistry.js`.
3. **Pre-existing Lint Errors**:
   - Lint repository memiliki beberapa error di luar folder `SeranganFajar` (`LanguageContext.jsx`, `ThemeContext.jsx`, `GameContainer.jsx`). Kode `SeranganFajar` wajib clean lint 0 warning/error.

---

## 6. Rencana Kerja Selanjutnya (Tahap 2)
1. Buat folder dan modul dasar: `config/`, `game/`, `entities/`, `ui/`, `audio/`.
2. Implementasikan `TextureFactory.js` untuk membangkitkan aset dasar Wowo, lantai arena, dan prop batas.
3. Buat `SurvivalScene.js` dengan player movement (WASD + Arrow Keys, diagonal normalization).
4. Buat `SeranganFajar.jsx` dengan wrapper Phaser, pause/restart handler, dan integrasi route `/games/serangan-fajar`.
5. Uji gameplay fondasi, pastikan Wowo bergerak lancar, tidak tembus batas, game dapat di-pause, unmount bersih, dan `npm run build` berhasil.
