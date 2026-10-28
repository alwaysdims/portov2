# Checkpoint 2.3 — Village & KOPDES Environment

Tanggal: 2026-10-28. Branch: `docs/kopdes3d-phase1`. Base: `4c7971b` (Checkpoint 2.2).

Status: **PARTIAL — automated gates VERIFIED; browser smoke VERIFIED; full browser visual acceptance PENDING**. Tidak mengklaim aset final, 60 FPS, atau seluruh QA hijau. Tidak melanjutkan 2.4.

## Implementasi dan arsitektur

Controller, input listener, fixed-step Rapier, capsule Owi dan kamera third-person 2.2 dipakai kembali. `GameWorld.jsx` kini memasang `Environment` dan mengambil spawn/yaw dari konfigurasi. `Kopdes3D.jsx` memakai lighting terpisah dan shadow `percentage` (PCFShadowMap yang didukung versi Three terpasang).

Komponen baru, relatif `src/games/Kopdes3D/`:

- `environment/Environment.jsx`: komposisi desa, exterior, interior, colliders dan named anchor groups.
- `environment/Village.jsx`: rumah, halaman, jalan, warung, pagar, vegetasi, infrastruktur dan gerbang.
- `environment/KopdesExterior.jsx`: bangunan satu lantai merah-putih, atap/kanopi, signage dan portal masuk.
- `environment/KopdesInterior.jsx`: rak, display beras, kasir, antrean, storage dan label kategori.
- `environment/Props.jsx`: box instancing per warna, foliage instancing, roof dan CanvasTexture signage.
- `environment/Lighting.jsx`: warm daylight dan satu directional shadow 1024; panel lampu interior tanpa dynamic light per fixture.
- `environment/EnvironmentColliders.jsx`: satu fixed rigid body, explicit primitive CuboidCollider.
- `environment/config.js`: layout, colliders, checkpoints, shelves, arena bounds dan anchor data.
- `tests/environment.test.js`: 18 focused tests, menggunakan Rapier WASM asli dan fungsi controller/kamera produksi.
- `reports/CHECKPOINT_2_3.md`: laporan ini.

File dimodifikasi: `GameWorld.jsx`, `Kopdes3D.jsx`, `asset_manifest.md`, `tasks/plan.md`, `tasks/todo.md`. Tidak mengubah route lazy, dependencies/lockfile, `gameLogic.js`, tes 2.2, maupun kode game lain. `WORLD_BOXES` lama tetap fixture tes regresi 2.2, bukan layout runtime baru.

## Layout environment

Meter, Y-up, floor pada Y=0. Capsule existing tinggi 1.7 m dengan radius 0.35 m. Anchor/checkpoint adalah titik lantai; spawn menambahkan half-height dan clearance 0.05 m.

| Area | Koordinat / ukuran |
|---|---|
| Batas slice | X sekitar -12..12, Z -8..43; satu jalur, bukan open world |
| Rumah Owi | Pusat `(0,0,-2)`, footprint sekitar 6 × 6 m; halaman dan teras di +Z |
| Jalan desa | Lebar 4.5 m; warung dan vegetasi di pinggir |
| Arena | Pusat `(0,0,16)`, bounds X -7..7, Z 9..23, 14 × 14 m |
| Gerbang | Z=25; dua tiang, header dan pagar samping, tengah sengaja terbuka |
| KOPDES | Footprint 16 × 12 m, X -8..8, Z 28..40; tinggi dinding 5 m |
| Pintu | Rumah clear width 2.4 m, lintel bawah 2.7 m; KOPDES width 4 m, tinggi 3.5 m |
| Rak | Kebutuhan pokok `(-4.5,0,33)`, minuman `(4.5,0,32)`, makanan ringan `(-4.5,0,37.5)` |
| Beras | `(0,0,39)`, pendek 0.8 m; tidak menutup kamera |
| Kasir | Counter `(4.5,0,37.7)`, antrean di depannya; storage kanan belakang |

Aisle tengah lebar 7.6 m antara badan rak samping; rak utama tinggi 1.8 m. Jalur konfigurasi melewati rumah, jalan, arena, gerbang, portal dan kasir. Pendekatan rak disiapkan dalam jarak surface maksimal 1.8 m, dengan arah pandang stabil. Angka koordinat Phase 1 bersifat usulan; layout ini mempertahankan urutan dan orientasi +Z.

## Collider dan navigation

- Ground continuous, perimeter, dinding, lintel, tiang, pagar, batang, rak, counter dan storage memakai cuboid, tanpa trimesh.
- Mesh dekorasi seperti produk, kabel tinggi, label, marka antrean dan foliage tidak membuat collider kompleks.
- Ceiling dan conservative roof cuboids membatasi sweep kamera agar tidak masuk atap. Proxy atap sengaja lebih konservatif daripada kemiringan mesh.
- Rumah dan KOPDES punya portal fisik terbuka; jendela teal opaque adalah placeholder, bukan glass pintu yang memblokir jalur.
- `CHECKPOINTS`: home, arena, shop; spawn memakai home. Belum ada persistence/resume UI.
- `ANCHORS`: player, Ibu, guard, boss, combat bounds, gate, empat shelf interaction, cashier NPC, checkout trigger, level exit. Total 13 groups bernama, dengan metadata. Belum ada NPC, sensor atau callback gameplay.
- Gerbang terbuka untuk eksplorasi checkpoint ini; encounter locking baru checkpoint gameplay berikutnya.

## Placeholder assets dan resource

Referensi pengguna `b32ee596-116f-47d2-bbfb-beeff963dfb7.png` di Downloads telah diperiksa visual: rumah genteng, tiang/kabel, bangunan koperasi merah-putih, kanopi, jendela dan lorong toko. Tidak menyalin gambar atau emblem, tidak memakai logo resmi.

Semua environment berupa procedural placeholder orisinal; inventaris lengkap pada `asset_manifest.md`. Produk berupa blok warna, tanpa merek/SKU/stok. NPC dan boss hanya anchor. Signage memakai teks eksplisit pada CanvasTexture 1024 × 128 dengan font sistem, bukan generated image text. Texture dibuat/dispose pada layout effect. Geometri/material deklaratif dimiliki R3F dan dibersihkan saat scene unmount. Tidak menambah listener, timer, render loop kedua, atau dependency.

Instancing menggabungkan box berwarna sama per bagian environment; vegetasi juga instanced. Hanya Owi existing yang castShadow; environment menerima shadow. Tidak ada point-light per lampu, postprocessing atau tekstur eksternal besar. Pengukuran frame sampel browser menunjukkan 29–59 render calls sebelum perubahan shadow selector; bukan total worst-case atau benchmark FPS. Memori renderer pada scene settled teramati 53 geometries dan 14 textures. Tidak membuktikan leak-free atau frame budget pada GPU pengguna.

## Hasil pengujian

Baseline sebelum edit: 48 existing node:test + 7 real-Rapier Vitest PASS. Sesudah perbaikan akhir:

| Gate | Hasil |
|---|---|
| Existing/regression Serangan Fajar | VERIFIED: 48/48 PASS |
| Controller regression 2.2 | VERIFIED: 7/7 PASS |
| Environment focused | VERIFIED: 18/18 PASS |
| Total otomatis | VERIFIED: 73 tests PASS |
| Focused ESLint + integration entry files | VERIFIED: PASS |
| Global lint baseline comparison | VERIFIED unchanged: 8 existing errors + 1 warning; global lint tetap FAIL |
| Production build | VERIFIED: PASS, 857 modules; KOPDES sekitar 3,191.50 kB raw / 1,099.08 kB gzip |
| Diff whitespace | VERIFIED: `git diff --check` PASS; Git memberi warning LF/CRLF |
| Security audit baru | NOT RUN; dependencies tidak berubah. Audit 0 sebelumnya hanya bukti historis |

Perintah gate: `node_modules/node/bin/node.exe src/games/Kopdes3D/tools/verify.mjs`; `npm run build` juga dijalankan eksplisit. Runtime Node lokal v26.9.0. Build tetap memberi warning chunk >500 kB dan deprecation/tooling; tidak menyebut build bebas warning.

Environment tests memeriksa ID/transform/ukuran valid, anchor/checkpoint tidak overlap collider, shelf approach/facing/range, arena clear, traversing jalur pergi-pulang memakai controller asli, semua rak reachable dan menahan sprint, dinding/perimeter menahan sprint, camera sphere menahan dinding/rak/ceiling/atap, serta Three geometry bounds sesuai roof proxy.

Dua kegagalan awal tes dinding berasal dari start path yang terkena fixture lebih dahulu (beras/pohon), bukan kegagalan collider. Skenario dipindah ke lintasan dinding yang bersih. Test bounds atap awal memakai transformed local AABB yang terlalu besar; diperbaiki dengan precise vertex bounds (`Box3.setFromObject(group, true)`). Semua tes akhir dijalankan ulang.

## Code review

`$auto-codex-review` tidak ditemukan pada lokasi skill/command yang diperiksa. Alternatif nyata: Codex CLI 0.165.0, `codex exec --sandbox read-only --ephemeral`, tanpa nested reviewer atau write, scope file 2.3 saja.

- Round 1: dua P2. Roof tidak punya collision proxy untuk kamera; nonuniform scaling sebelum rotasi membuat atap rectangular skewed.
- Perbaikan: roof config bersama + conservative cuboid; scale pada parent group dan rotasi pada child mesh; dua regresi ditambahkan.
- Round 2: selesai exit 0, **tidak ada P0/P1/P2**, 18 environment tests lulus menurut reviewer dan diverifikasi lagi oleh gate utama.
- Setelah review, satu perubahan lighting-only memilih `shadows="percentage"`, menghilangkan pemakaian PCFSoftShadowMap yang sudah dihapus. API string dipastikan dari sumber R3F terpasang; gate tests/lint/build dijalankan sesudahnya.

Output review lokal: `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes23-review.txt` dan `kopdes23-review-final.txt`. Klaim review terbatas code; bukan bukti browser acceptance.

## Browser evidence dan batasnya

**BROWSER SMOKE VERIFIED, FULL VISUAL ACCEPTANCE PENDING.** Browser tersedia pada sesi ini: isolated HeadlessChrome/145.0.0.0, Windows user agent, viewport 1258 × 566, canvas 1252 × 420, WebGL 2.0. Tidak mengubah keamanan browser.

- Dev server `http://127.0.0.1:3000/games/kopdes-3d`: Canvas/Owi/rumah terlihat pada screenshot; pointer lock aktif setelah klik tombol.
- Production preview `http://127.0.0.1:4173/games/kopdes-3d`: WebGL scene, 13 anchors, actual CDP keyboard W/Shift dan A menavigasi rumah, jalan, arena, gerbang, toko serta area kasir. Posisi nyata salah satu walkthrough: home `(0,0.87,-1)`, interior sekitar `(0,0.87,35.29)`, area kasir `(4.55,0.86,36.29)`. Tidak teleport atau memanggil controller manual di browser.
- Screenshot memperlihatkan bangunan merah-putih, signage KOPDES, rak dan jalur interior. Label jauh masih kecil; gate berupa frame terbuka, bukan gate leaves. Tidak ada clipping pemain yang jelas pada frame yang ditinjau.
- Lima siklus document navigation keluar/masuk menunjukkan canvas hilang saat keluar, scene/13 anchors kembali saat masuk. Ini document reload, **bukan bukti same-document React unmount leak-free**.
- Halaman portfolio production tidak meminta chunk KOPDES/Rapier pada resource list yang diamati; lazy loading tetap terjaga.
- Console capture tidak mencatat uncaught runtime exception. Ada warning dependency `THREE.Clock`, Rapier initialization dan PCFSoftShadowMap. Selector shadow terakhir mengganti PCFSoft; Clock/Rapier warning tetap known limitation, tidak disembunyikan.
- Mouse click pada tombol release saat pointer-locked tidak melepaskan kontrol melalui CDP; native Esc sintetis juga tidak terbukti. Navigasi keluar melepas lock. Ini batas bukti automation, **bukan PASS untuk native Esc**.
- Ulangan browser terakhir setelah selector shadow berhasil mencapai interior, tetapi putus pada observasi keyboard-release (unsettled top-level await/isolated session). Tidak dihitung sebagai full PASS; walkthrough production sebelumnya tetap bukti traversal.

Bukti lokal (cache dapat dipangkas): `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes23-browser.json`, `kopdes23-lifecycle.json`, dan screenshot `kopdes23-{home,village,arena,exterior,interior,cashier-aisle}.png`. Script probe lokal tidak menjadi dependency aplikasi.

## Manual acceptance yang masih diperlukan

1. Jalankan `npm run dev`, buka `/games/kopdes-3d`, aktifkan kontrol, ikuti jalur sampai kasir lalu kembali.
2. Coba seluruh rak/dinding/pintu, sprint diagonal, rotate mouse dekat sudut dan atap; pastikan kamera tetap nyaman.
3. Tekan Esc fisik, blur/tab-switch, aktifkan lagi; pastikan tidak ada input tertahan. Uji tombol dengan keyboard.
4. Nilai signage dari jarak pendek/jauh, roof silhouette dan gerbang; lakukan same-document mount/unmount tanpa reload bila tersedia.
5. Profil 60 detik pada GPU/resolusi sasaran sebelum klaim FPS. Periksa Console; pisahkan dependency warnings dari error baru.

## Known limitations

Semua art placeholder, jendela opaque, lampu interior panel cerah tanpa shadow sendiri, ambient daylight belum light baking. Roof cuboid konservatif bisa mendekatkan kamera lebih awal. Rak solid sederhana, bukan rak dengan setiap celah fisik; produk tidak punya interaksi. Gate belum terkunci, NPC/boss belum ada, dash/dodge belum diimplementasikan ulang. Tidak ada shopping/checkout/level progression. Full browser visual approval, native Esc, extreme aspect ratios, same-document disposal, dan hardware FPS belum terverifikasi. Lint global existing tetap gagal.

## Git publication

Commit message: `feat(kopdes3d): build village and cooperative environment`.

Commit hash, GitHub commit URL dan hasil `git ls-remote origin refs/heads/docs/kopdes3d-phase1` dicatat pada receipt di bawah setelah feature commit dibuat/dipush. Laporan menggunakan receipt docs terpisah karena commit tidak bisa memuat hash dirinya sendiri. Jangan force-push, push main, deploy Vercel, atau stage perubahan pengguna yang tidak terkait.

Receipt: PENDING sebelum publikasi.
