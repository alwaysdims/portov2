# ASSET INVENTORY — SERANGAN FAJAR: THE LAST STAND

Dokumen inventarisasi seluruh aset game *Serangan Fajar: The Last Stand*.
Status data per audit Tahap 1: 19 Oktober 2026.

---

## 1. Ringkasan Status Aset Sumber

| File Sumber | Format | Dimensi | Mode | Kondisi & Catatan |
|---|---|---|---|---|
| `Papan Aset Game Serangan Fajar.png` | PNG | 1536 × 1024 | RGB (No Alpha) | Papan komposit/desain referensi HUD, musuh, prop, proyektil, item. Background solid navy, bukan spritesheet individual. |
| `assets.jpg` | JPEG | 2400 × 1792 | RGB (No Alpha) | Lembar konsep karakter Mulyono, Wowo, Fufu Fafa, dan skill badges. Terdapat artefak kompresi JPEG dan fake checkerboard pattern (bukan true alpha). |
| `AssetLoader.ts` | TypeScript | N/A | Code | Konfigurasi mock loader yang merujuk path `/assets/games/serangan-fajar/...` yang belum ada fisiknya di `public/`. |

---

## 2. Inventaris Aset Gameplay & Status Kebutuhan

| Asset ID | Nama Aset | Kategori | Status | Format | Kebutuhan | Ukuran | Alpha | Animasi | Penggunaan | Tindakan |
|---|---|---|---|---|---|---|---|---|---|---|
| `player.wowo.composite` | Wowo Concept Sheet | Character | Needs Review | JPEG | Referensi visual karakter Wowo | 2400x1792 (sheet) | No (Fake grid) | Idle, Walk, Attack, Skill, Ult, Hurt, Death terlukis di sheet | `entities/player/` | Gunakan procedurally-generated canvas sprite / placeholder pixel shape resolusi 48x48 sampai asset diekstraksi |
| `player.wowo.idle` | `wowo-idle.png` | Character | Available (Integrated) | PNG (RGBA) | Sprite diam Wowo | 48x48 | Yes (True Alpha) | Upright stance, batons, shadow | `BootScene.js` / `SurvivalScene.js` | Selesai dibuat & diintegrasikan ke texture key `sf_player_wowo_idle` |
| `player.wowo.walk` | `wowo-walk.png` | Character | Available (Integrated) | PNG (RGBA) | Sprite berjalan Wowo | 48x48 | Yes (True Alpha) | Walk stride, leg split, baton motion | `SurvivalScene.js` | Selesai dibuat & diintegrasikan ke texture key `sf_player_wowo_walk` |
| `player.wowo.hurt` | `wowo-hurt.png` | Character | Available (Integrated) | PNG (RGBA) | Feedback saat terkena damage | 48x48 | Yes (True Alpha) | Recoil pose, hands clutching hat | `SurvivalScene.js` | Selesai dibuat & diintegrasikan ke texture key `sf_player_wowo_hurt` |
| `player.wowo.death` | `wowo-death.png` | Character | Available (Integrated) | PNG (RGBA) | Karakter kalah / knocked out | 48x48 | Yes (True Alpha) | Knockdown flat on ground pose | `SurvivalScene.js` | Selesai dibuat & diintegrasikan ke texture key `sf_player_wowo_death` |
| `enemy.tim_amplop` | `tim-amplop.png` | Enemy | Available (Integrated) | PNG (RGBA) | Musuh dasar melee swarm | 36x36 | Yes (True Alpha) | Bobbing stride, envelope at ready | `MeleeEnemy.js` | Selesai dibuat & diintegrasikan ke texture key `sf_enemy_tim_amplop` |
| `enemy.bot_kampanye` | `bot-kampanye.png` | Enemy | Available (Integrated) | PNG (RGBA) | Musuh tank lambat HP tebal | 48x48 | Yes (True Alpha) | Mechanical tread step, glowing red visor | `TankEnemy.js` | Selesai dibuat & diintegrasikan ke texture key `sf_enemy_bot_kampanye` |
| `enemy.penyebar_hoaks` | `penyebar-hoaks.png` | Enemy | Available (Integrated) | PNG (RGBA) | Musuh ranged proyektil | 36x36 | Yes (True Alpha) | Sunglasses, trench coat, red megaphone aim | `RangedEnemy.js` | Selesai dibuat & diintegrasikan ke texture key `sf_enemy_penyebar_hoaks` |
| `enemy.massa_kampanye` | Massa Kampanye | Enemy | Placeholder | Canvas/Procedural PNG | Musuh swarming cepat | 32x32 | Yes | 2-frame run | Milestone lanjutan | Placeholder red crowd runner |
| `enemy.pengawal_politik` | Pengawal Politik | Enemy | Placeholder | Canvas/Procedural PNG | Musuh elite jas hitam | 44x44 | Yes | 2-frame walk | Milestone lanjutan | Placeholder security suit |
| `projectile.surat_suara` | `vote-projectile.png` | Projectile | Available (Integrated) | PNG (RGBA) | Basic Attack proyektil Wowo | 20x20 | Yes (True Alpha) | Folded white ballot paper with red top banner & checkmark | `ProjectileSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_projectile_surat_suara` |
| `projectile.amplop` | `envelope-projectile.png` | Projectile | Available (Integrated) | PNG (RGBA) | Skill 1 proyektil burst | 24x16 | Yes (True Alpha) | White envelope with slate border, fold lines, & red wax seal | `ProjectileSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_projectile_amplop` |
| `projectile.hoaks` | `hoax-bullet.png` | Projectile | Available (Integrated) | PNG (RGBA) | Tembakan Penyebar Hoaks | 16x16 | Yes (True Alpha) | Spiky violet energy ball with red core | `ProjectileSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_projectile_hoaks` |
| `vfx.gelombang_kampanye` | Gelombang Kampanye | VFX | Placeholder | Procedural Arc/Circle | Skill 2 shockwave AoE | 360x360 | Yes | Expanding ring fade | `Skill2CampaignWave.js` | Cyan-biru shockwave expansion |
| `vfx.serangan_fajar` | Serangan Fajar | VFX | Placeholder | Procedural Arc/Flash | Ultimate golden explosion | 1000x1000 | Yes | Radial rays + gold bloom | `UltimateSeranganFajar.js` | Emas/kuning radial blast + screen flash |
| `vfx.hit_spark` | Hit Spark | VFX | Placeholder | Procedural particle | Feedback serangan kena musuh | 12x12 | Yes | Radial particle burst | `EffectManager.js` | Percikan oranye kuning |
| `vfx.damage_numbers` | Damage Numbers | VFX | Available | Phaser BitmapText/Text | Angka damage melayang | Vector text | Yes | Floating upward fade | `DamageNumbers.js` | Menggunakan font teruji render |
| `item.suara` | `suara.png` | Collectible | Available (Integrated) | PNG (RGBA) | XP drop musuh | 18x18 | Yes (True Alpha) | Ballot paper with green accent | `PickupSystem.js` | Selesai dibuat & diintegrasikan ke key `sf_item_suara` |
| `item.dana` | `dana.png` | Collectible | Available (Integrated) | PNG (RGBA) | Currency drop musuh | 18x18 | Yes (True Alpha) | Golden coin with shine highlight | `PickupSystem.js` | Selesai dibuat & diintegrasikan ke key `sf_item_dana` |
| `item.health` | `health.png` | Collectible | Available (Integrated) | PNG (RGBA) | Restorasi HP Wowo (+150 HP) | 20x20 | Yes (True Alpha) | Red potion bottle with white cross | `PickupSystem.js` | Selesai dibuat & diintegrasikan ke key `sf_item_health` |
| `item.mana` | `mana.png` | Collectible | Available (Integrated) | PNG (RGBA) | Restorasi Mana Wowo (+30 MP) | 18x22 | Yes (True Alpha) | Blue potion flask with shine | `PickupSystem.js` | Selesai dibuat & diintegrasikan ke key `sf_item_mana` |
| `item.fajar_energy` | `fajar-energy.png` | Collectible | Available (Integrated) | PNG (RGBA) | Tambahan Fajar Energy (+15 Energy) | 20x20 | Yes (True Alpha) | Radiant golden 4-point star orb | `PickupSystem.js` | Selesai dibuat & diintegrasikan ke key `sf_item_fajar_energy` |
| `env.tile_grass` | `grass-tile.png` | Environment | Available (Integrated) | PNG (RGBA) | Lantai dasar arena | 64x64 | Yes | Seamless grass | `ArenaSystem.js` / `SurvivalScene.js` | Selesai dibuat & diintegrasikan ke texture key `sf_arena_ground` |
| `env.tile_paving` | `road-tile.png` | Environment | Available (Integrated) | PNG (RGBA) | Paving/jalan arena | 64x64 | Yes | Cobblestone tile | `ArenaSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_arena_road` |
| `env.tile_border` | `border-tile.png` | Environment | Available (Integrated) | PNG (RGBA) | Border rintangan batu pembatas | 32x32 | Yes (True Alpha) | Stone barrier with hazard stripes | `ArenaSystem.js` / `BootScene.js` | Selesai dibuat & diintegrasikan ke texture key `sf_arena_border` |
| `env.prop_tenda_tps` | `tps-tent.png` | Environment | Available (Integrated) | PNG (RGBA) | Peneduh TPS Pemilu | 128x80 | Yes | Tenda merah putih TPS 01 | `ArenaSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_prop_tent` |
| `env.prop_baliho` | `baliho.png` | Environment | Available (Integrated) | PNG (RGBA) | Baliho kampanye satire | 80x100 | Yes | Billboard kayu Coblos Wowo | `ArenaSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_prop_baliho` |
| `env.prop_tree` | `tree.png` | Environment | Available (Integrated) | PNG (RGBA) | Pohon rimbun arena | 64x80 | Yes | Multi-layer canopy | `ArenaSystem.js` | Selesai dibuat & diintegrasikan ke texture key `sf_prop_tree` |
| `ui.icon_basic_attack` | Ikon Basic Attack | UI | Placeholder | SVG / Canvas Icon | Tombol & HUD Attack | 64x64 | Yes | Statis | `GameHUD.jsx` | Ikon surat suara |
| `ui.icon_skill1` | Ikon Amplop (Q) | UI | Placeholder | SVG / Canvas Icon | Tombol & HUD Skill 1 | 64x64 | Yes | Statis + cooldown overlay | `SkillBar.jsx` | Ikon amplop 3 arah |
| `ui.icon_skill2` | Ikon Gelombang (E) | UI | Placeholder | SVG / Canvas Icon | Tombol & HUD Skill 2 | 64x64 | Yes | Statis + cooldown overlay | `SkillBar.jsx` | Ikon megafon & shockwave |
| `ui.icon_ultimate` | Ikon Serangan Fajar (R) | UI | Placeholder | SVG / Canvas Icon | Tombol & HUD Ultimate | 64x64 | Yes | Statis + glow ready | `SkillBar.jsx` | Ikon matahari/fajar keemasan |
| `audio.sfx_all` | Synthesized SFX Kit | Audio | Implemented | Web Audio API | Seluruh SFX combat/pickup | N/A | N/A | Sintesis audio real-time | `AudioManager.js` | Zero external file footprint, 100% reliable |
| `audio.bgm_synth` | Chiptune Retro BGM | Audio | Implemented | Web Audio API | Musik latar bertempo cepat | N/A | N/A | Sintesis bass/arpeggio loop | `AudioManager.js` | BGM loop dinamis tanpa file external |

---

## 3. Rencana Penggantian Aset Final
1. Mengembangkan sistem texture generator berbasis canvas memory (`TextureFactory`) yang membangkitkan placeholder visual pixel art presisi (warna, bentuk, siluet kontras) secara instan saat inisialisasi BootScene tanpa memicu 404 network request.
2. Memisahkan registry aset (`assetRegistry.js`) dari logika gameplay sehingga ketika file PNG/spritesheet transparan asli dipotong dan disimpan ke `public/assets/...`, hanya mapping texture key yang perlu diarahkan.

---

## 4. Audit Lisensi & Status Legalitas Aset (Tahap 15 QA)

| Kategori Aset | Jumlah Item | Format | Sumber | Lisensi | Status Legalitas |
|---|---|---|---|---|---|
| Aset Runtime Fisik | 21 File PNG | RGBA murni | Dibuat khusus secara in-house untuk proyek ini via skrip Python PIL | MIT / Karya Sendiri | **VERIFIED (NOT APPLICABLE)** |
| Efek Suara & Musik | 11 SFX + BGM | Web Audio Synth | Dihasilkan secara prosedural melalui kode Web Audio API | MIT / Kode Sumber | **VERIFIED** |
| Papan Desain Acuan | 2 File (`.png` & `.jpg`) | RGB komposit | Mockup referensi konsep satir pemilu dari pengguna | Belum diverifikasi | **NEEDS REVIEW** (Non-runtime, tidak dibundel) |

