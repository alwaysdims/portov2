# Tahap 20 — audit dan kontrak aset

Status awal VERIFIED dari source/runtime, bukan klaim laporan Tahap 19.

- Versi terpasang: React 19.2.5, Vite 8.0.10, Phaser 4.2.1. PRD masih menyebut Phaser 3 (historis).
- Loader aktif BootScene; TextureFactory fallback. AssetLoader.ts bukan jalur runtime aktif.
- Wowo: empat PNG 48x48 idle/walk/hurt/death; zero animasi terdaftar. update mengganti tekstur dan scale setiap frame.
- Boss sudah AI, bukan konsep saja. Tiga pola sebelumnya; bug isDead sebelum super.die mencegah cleanup/death tween. Status instanceId belum dikirim meski listener memfilternya.
- Tahap 19 laporan 60 FPS/latensi audio <5ms belum didukung profil pengukuran yang dapat diulang. Jangan warisi klaim tersebut.
- Baseline preview lokal: actualFps 57.96997382352686, 31 textures, 383 scene objects, heap 22100439 bytes; 16 enemy, 4 hostile bullets, 0 vote projectiles. Sampel tunggal, bukan benchmark terkontrol.
- Tooling: Python + Pillow 12.3.0 tersedia. Tidak ada tool image-generation terdaftar. Produksi lewat gambar pixel orisinal berbasis kode; kualitas artistik tetap NEEDS REVIEW.
- Referensi terverifikasi: references/assets.jpg (Wowo safari vs Mulyono megafon), references/wowo.png (konsep efek terbaru berbeda kostum), references/naga fajar.png (naga oriental putih/merah/emas), Papan Aset. Tidak dipotong menjadi sprite. Kostum safari/topi/kumis/tongkat sesuai permintaan pengguna menang atas kostum konsep terbaru.
- Perubahan pengguna: assets.jpg di root game terhapus sebelum tugas; tidak direstore atau dihapus lagi. References dipertahankan.

## Aset produksi orisinal

RGBA PNG, tanpa latar/label/bayangan panel. 8 kolom per sheet, frame padding transparan; pivot fisik konsisten.

Wowo: assets/characters/wowo/wowo-action-sheet.png, frame 64x64, foot pivot (32,60), origin runtime (0.5,0.5), body 24x20 offset (20,40). Rows idle6@8, walk8@12, run8@16, attack6@18, skillQ6@16, skillE6@16, skillR8@16, hurt4@16, death8@12. Tidak pakai frame duplikat untuk memenuhi target.

Naga: assets/boss/naga-fajar-action-sheet.png, frame128x128, anchor(64,108), rows idle6@8, move8@12, windup6@12, breath6@12, slash6@14, spread6@14, summon6@10,hurt4@16,phase8@12,death8@10.

Energi/swing/trail/impact/shockwave: prosedural lewat VFXManager, bounded; bukan sheet konsep. Existing projectile pools dipertahankan. Aset lama tidak dihapus.

## File yang direncanakan sebelum implementasi

- config/assetRegistry.js; game/scenes/BootScene.js; game/scenes/SurvivalScene.js.
- game/systems/ActorAnimator.js (baru), PlayerAttackSystem.js, ProjectileSystem.js, PlayerSkillSystem.js, VFXManager.js.
- entities/enemies/EnemyBase.js, NagaFajarBoss.js, EnemySpawner.js, RangedEnemy.js; config/bossConfig.js, bossAttackConfig.js (baru), difficultyConfig.js (baru).
- RunDirector.js, ObjectiveSystem.js, objectiveConfig.js, AchievementService.js hanya koreksi fairness/persistence/lifecycle yang ditemukan.
- SeranganFajar.jsx: VFX quality dan difficulty label, bukan rombak integration.
- tools/generate_visual_assets.py; PNG, manifest, contact sheet; tests; dokumentasi tahap.

## Gerbang verifikasi

B: Wowo idle/walk/attack + collision + state priority + hit VFX di browser sebelum mengklaim slice lolos.
C/D/E: tes per sistem, lalu integrasi sheets dengan AI dan Medium melalui config.
F: production preview, replay 600 detik waktu simulasi berbeda dari gameplay real-time, tiga build, boss, lifecycle, lint/build, baseline comparison. Physical mobile NOT TESTED kecuali benar dilakukan.
