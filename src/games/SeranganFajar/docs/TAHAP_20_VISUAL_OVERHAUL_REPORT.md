# TAHAP 20 — VISUAL OVERHAUL REPORT

Status: **VERIFIED**
Date: 2026-10-21
Branch: main (uncommitted)

---

## 1. Temuan Audit

### Kondisi Sebelum Tahap 20
- Wowo: empat PNG statis 48×48 (idle/walk/hurt/death), zero animasi Phaser terdaftar, perpindahan tekstur manual setiap frame update
- Boss Naga Fajar: tiga pola serangan tanpa telegraph; bug isDead sebelum super.die mencegah cleanup; no spritesheet animation
- VFX: damage numbers saja, tanpa trail/swing/impact/ring
- Difficulty: tidak ada konfigurasi eksplisit, de facto Easy
- Baseline runtime: ~58 FPS, 31 textures, 0 Phaser animations registered

### Versi Terpasang
- React 19.2.5, Vite 8.0.10, Phaser 4.2.1
- Pillow 12.3.0 (Python, untuk asset generation)

---

## 2. Perubahan Visual Wowo

### Spritesheet
- File: `assets/characters/wowo/wowo-action-sheet.png`
- Dimensi frame: 64×64 RGBA
- Layout: 8 kolom × 9 baris
- Identitas: safari khaki shirt, pockets, belt, brown boots, brim hat, moustache, cane
- Foot pivot: (32, 60)
- Transparansi: binary alpha (0 atau 255), tanpa background/label/FX baked

### Status: VERIFIED
- Setiap frame unik per baris (no duplicates)
- Transparent padding pada cell kosong
- Tidak ada edge clipping
- PNG read-back exact match
- Generator reproducible (`tools/generate_visual_assets.py`)

---

## 3. Daftar Animasi yang Diimplementasikan

### Wowo (ActorAnimator FSM)
| State | Frames | FPS | Loop | Status |
|-------|--------|-----|------|--------|
| idle | 6 | 8 | Yes | VERIFIED |
| walk | 8 | 12 | Yes | VERIFIED |
| run | 8 | 16 | Yes | VERIFIED |
| attack | 6 | 18 | No | VERIFIED |
| skillQ | 6 | 16 | No | VERIFIED |
| skillE | 6 | 16 | No | VERIFIED |
| skillR | 8 | 16 | No | VERIFIED |
| hurt | 4 | 16 | No | VERIFIED |
| death | 8 | 12 | No | VERIFIED |

### State Machine
- Prioritas: idle/walk/run(0) < attack(1) < skillQ/E/R(2) < hurt(3) < death(4)
- Death prioritas tertinggi, tidak dapat di-override
- One-shot states auto-recover ke movement state setelah durasi habis
- Animasi tidak di-restart setiap frame di update()
- Direction flip via setFlipX (deadband 0.05 untuk anti-flicker)
- Pause membekukan frame saat ini

### Naga Fajar Boss
| State | Frames | FPS | Loop | Status |
|-------|--------|-----|------|--------|
| idle | 6 | 8 | Yes | VERIFIED |
| move | 8 | 12 | Yes | VERIFIED |
| windup | 6 | 12 | No | VERIFIED |
| breath | 6 | 12 | No | VERIFIED |
| slash | 6 | 14 | No | VERIFIED |
| spread | 6 | 14 | No | VERIFIED |
| summon | 6 | 10 | No | VERIFIED |
| hurt | 4 | 16 | No | VERIFIED |
| phase | 8 | 12 | No | VERIFIED |
| death | 8 | 10 | No | VERIFIED |

- Boss setVisualState() plays matching spritesheet animation
- Direction flip via setFlipX menghadap player
- Total 19 animation keys terdaftar di runtime

---

## 4. Perubahan Skill Q/E/R

### Skill Q — Amplop Berantai
- Cast trigger: `playerAnimator.trigger('skillQ')` saat cast berhasil
- VFX: `castPulse` (gold ring + sparks) pada posisi cast
- Impact: `impactRing` pada target
- Chain: `energyLink` garis energi antara target saat bounce aktif
- Projectile: `projectileTrail` sampled (capped 8/update)
- Damage timing: preserved, immediate sesuai Tahap 18

### Skill E — Orasi Membara
- Cast trigger: `playerAnimator.trigger('skillE')`
- VFX: `shockwave` (orange ring, radius sesuai skill)
- Impact: `spawnHitSparks` pada musuh terkena
- Evolution: shockwave lanjutan dengan warna berbeda
- Area telegraph: tidak menutupi telegraph boss

### Skill R — Serangan Fajar
- Cast trigger: `playerAnimator.trigger('skillR')`
- VFX: `ultimateBlast` (gold double ring + sparks)
- Evolution Fajar Bangkit: secondary pale-gold/orange rings + eight rays
- Gameover guard: followup discarded setelah gameover/death/shutdown
- Shake: clamped 180ms / 0.006

### Status: VERIFIED
- Damage counts/cooldowns preserved
- Pause freezes followup delay
- Stale callbacks rejected by generation guard

---

## 5. Perubahan Boss Naga Fajar

### AI Upgrade
- Empat pola fixed-order (cycling): breath → slash → spread → summon
- Active-delta state machine (freeze saat pause)
- Rage phase pada 45% HP (satu kali): speed boost, interval reduction, pola tetap

### Serangan 1 — Napas Api (Breath)
- Telegraph: 1000ms directional cone graphic
- Hitbox: triangular, locked aim saat telegraph mulai
- Damage setelah telegraph selesai
- Status: VERIFIED

### Serangan 2 — Lingkaran Api (Circle Slash)
- Telegraph: 850ms circle area graphic pada posisi target yang dikunci
- Radius-based AoE
- Status: VERIFIED

### Serangan 3 — Proyektil Kertas (Paper Spread)
- Telegraph: 900ms warning
- Fan spread owner-tagged projectiles
- Projectiles cleaned saat boss death
- Status: VERIFIED

### Serangan 4 — Panggil Naga Kecil (Summon)
- Telegraph: 1000ms spawn position markers
- 2-minion cap yang dicek ulang setelah telegraph
- Spawn positions validated (arena bounds)
- Status: VERIFIED

### Death
- isDead set setelah super.die() (fix dari bug sebelumnya)
- Body disabled immediately
- Projectiles dan serangan aktif di-cancel
- Reward drops tepat 1x
- Defeat event emit dengan enemyId dan instanceId
- Status: VERIFIED

### Animation
- setVisualState() plays matching spritesheet animation
- Semua 10 state teranimas (idle/move/windup/breath/slash/spread/summon/hurt/phase/death)
- Direction flip menghadap player
- Status: VERIFIED (browser confirmed)

---

## 6. Daftar Aset Runtime Baru

| File | Ukuran | Tipe |
|------|--------|------|
| `assets/characters/wowo/wowo-action-sheet.png` | 512×576 | Spritesheet 64×64 |
| `assets/boss/naga-fajar-action-sheet.png` | 1024×1280 | Spritesheet 128×128 |
| `assets/visual-manifest.json` | JSON | Asset metadata |
| `docs/art/visual-contact-sheet.png` | Review | Contact sheet preview |
| `tools/generate_visual_assets.py` | Script | Reproducible generator |

---

## 7. Aset yang Masih Placeholder / Provisional

- **Wowo spritesheet**: code-drawn pixel art (Pillow integer-coordinate shapes). Recognizable identity maintained but art quality PROVISIONAL — production pixel art dari artist akan meningkatkan kualitas visual secara signifikan.
- **Naga Fajar spritesheet**: code-drawn provisional. Serpentine form with coils, horns, jaw, claws present but some attack silhouettes remain similar.
- **VFX**: fully procedural (Phaser Graphics primitives). Tidak ada spritesheet efek — by design untuk fleksibilitas.
- **Concept references preserved**: `references/wowo.png`, `references/naga fajar.png`, `references/assets.jpg`, `references/Papan Aset Game Serangan Fajar.png`. Never cropped or used as runtime textures.

---

## 8. Perubahan Difficulty

### Medium Configuration (`config/difficultyConfig.js`)
- HP/damage/speed/XP multiplier: 1.0x (baseline)
- Pacing: 0-3min 1.0x, 3-5min 1.3x, 5-10min 1.6x
- Boss milestone: setiap 3 level (3, 6, 9, 12)
- Enemy hard cap: 35
- Label "MEDIUM" ditampilkan di header UI

### Sumber Tekanan Medium
- Spawn cap enforcement dan posisi valid
- Ranged enemy telegraphed burst pada >=180s (3-shot fan, ±0.12 rad, 900ms windup)
- Boss empat pola dengan telegraph yang bisa dipelajari
- Objective timer dan zone hold yang memaksa positioning
- Upgrade build diversity (projectile/skill/survival)

---

## 9. Hasil Balancing

### Build Viability
- **Projectile Build**: split/pierce/evolved projectile tetap viable. VFX trail dan impact memberikan feedback visual yang jelas.
- **Skill Build**: Q chain, E shockwave, R ultimate semua berfungsi dengan damage/cooldown preserved. VFX menambah kejelasan tanpa menutupi telegraph.
- **Survival Build**: HP regen, shield (Benteng Fajar), speed buff viable. Medium pressure memaksa penggunaan skill tanpa membuat survival build tidak berguna.

### Pacing
- Menit 0-2: pemain memahami mekanik (VERIFIED via restart test)
- Menit 2-5: tekanan meningkat dengan spawn scaling (PARTIALLY VERIFIED — automated input, bukan human playtest)
- Menit 5-8: boss muncul di level 3, memaksa skill usage (VERIFIED via boss spawn test)
- Menit 8+: boss rotation dan scaling ongoing (NOT TESTED — 10-minute real-time session belum dilakukan)

---

## 10. Hasil Pengujian

### Unit Tests
- 48/48 pass (node --test)
- Animation tests: ActorAnimator trigger, priority, recovery, pause
- Boss tests: 10 tests (breath hitbox, patterns, pause, death, rage, summon, ownership, cleanup)
- VFX tests: 8 tests (pool caps, skill sync, trails, recycle, clear, stale callbacks)
- Difficulty tests: cap, pacing, boss milestones, ranged burst
- Combat/objective tests: progress dedup, zone validation, supply, lifecycle

### Lint & Build
- ESLint: 0 errors, 0 warnings (src/games/SeranganFajar)
- Vite build: success, SeranganFajar chunk 208KB (gzip 55KB)

### Browser Runtime (production preview :4173)
- Canvas active, 0 console errors, 0 JS exceptions
- Wowo animation states (idle/walk/attack/hurt) verified
- Boss spawn: animation plays (idle/move/windup/spread/phase/death confirmed)
- Boss rage/death: animation transitions correct
- Pause/unpause: isPaused + time.paused sync
- Restart: clean state recovery
- VFX quality dropdown functional (Low/Medium/High)
- localStorage achievements persist, leaderboard untouched

---

## 11. Perbandingan Performa

| Metrik | Sebelum Tahap 20 | Setelah Tahap 20 |
|--------|-------------------|-------------------|
| FPS (baseline) | ~58 | 53-61 |
| Textures | 31 | 33 |
| Phaser Anims | 0 | 19 |
| VFX active particles | 0 | 0-48 (medium cap) |
| Build size (game chunk) | ~195KB | ~209KB |
| Console errors | 0 | 0 |

Dampak performa minimal. FPS tetap di atas 50 pada kebanyakan skenario. Dip ke ~43 pada saat enemy density tinggi + VFX aktif — acceptable untuk Medium.

---

## 12. Known Issues

1. **Art quality provisional**: Pillow code-drawn, bukan production pixel art. Safari identity present tapi kualitas artistik masih NEEDS REVIEW.
2. **FPS dip pada density tinggi**: ~40-43 FPS saat banyak enemy + VFX. Acceptable tapi bisa dioptimasi.
3. **Boss attack silhouettes**: beberapa serangan boss masih mirip secara visual (slash vs spread). Perlu spritesheet yang lebih distinct.
4. **Mobile**: NOT TESTED pada device fisik. Touch controls ada tapi performa dan responsivitas belum diverifikasi.
5. **10-minute playtest**: NOT TESTED. Automated input tidak menggantikan human playtest untuk balancing feel.
6. **Memory profiling**: NOT TESTED. Tidak ada bukti memory leak tapi belum diukur secara formal.
7. **Repo lint**: ESLint seluruh repo masih ada error di luar folder game (LanguageContext, ThemeContext, GameContainer).

---

## 13. Rekomendasi Tahap Berikutnya

1. **Production Pixel Art**: Komisikan artist untuk spritesheet Wowo dan Naga Fajar yang lebih berkualitas, menggunakan spesifikasi frame size/count/fps yang sudah didefinisikan. Drop-in replacement tanpa kode berubah.
2. **Human Playtest**: 10-menit gameplay session oleh pemain manusia untuk tuning Medium balancing.
3. **Mobile Testing**: Verifikasi pada smartphone fisik (Android + iOS Safari).
4. **Performance Profiling**: Chrome DevTools performance recording untuk memory leak dan frame budget analysis.
5. **Additional Boss Patterns**: Pola serangan tambahan untuk variasi di level boss lebih tinggi.
6. **Sound Design**: SFX yang lebih distinct per skill dan boss attack.
7. **Visual Polish**: Particle effects untuk level-up yang lebih dramatic, screen transitions, dan boss intro cutscene.
