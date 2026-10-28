# Audit repository dan arsitektur teknis

Audit lokal: 28 Oktober 2026. Status keputusan: **PROPOSED**, menunggu checkpoint Phase 1. Tidak ada dependensi atau runtime yang diubah.

## Temuan repository

Git root: `E:/Portofolio/portov2`, branch saat audit `main`, HEAD `1dca14e`, origin `https://github.com/alwaysdims/portov2.git`. Folder kerja `src/games/Kopdes3D` kosong sebelum dokumentasi ini. Tidak ditemukan AGENTS.md pada jalur ancestor yang diperiksa atau dalam sumber repository. Tidak ditemukan konvensi ADR khusus; keputusan di bawah direkam inline agar enam dokumen desain tetap menjadi pusat referensi.

```text
portov2/
  package.json, package-lock.json     npm, ESM, lockfileVersion 3
  vite.config.js                     React, Tailwind; port dev 3000
  eslint.config.js                   ESLint flat config untuk JS/JSX
  vercel.json                        rewrite seluruh URL ke index.html
  src/
    App.jsx                          Router manual pathname/hash + React.lazy
    main.jsx, index.css, App.css
    components/, context/, hooks/     UI, theme, bahasa
    sections/, data/, locales/        Konten portofolio
    games/
      GameGates.jsx                  Daftar game pada /games
      GameContainer.jsx, HelloWorld.jsx
      index.js                       Barrel game lama
      WowoJump/                      Game Phaser dan aset 2D
      SeranganFajar/                  Game Phaser, konfigurasi, node:test
      Kopdes3D/                      Dokumen Phase 1 ini
  public/                            Gambar, CV, sitemap, favicon
  dist/                              Output build, diabaikan Git
```

`src/App.jsx:13–16` sudah lazy-load game. Pemilihan route berada sekitar baris 40–53, mendukung pathname `/games`, `/games/wowo-jump`, `/games/serangan-fajar`, serta alias `/game`. Cabang hash membandingkan `window.location.hash` dengan awalan `/games`, padahal nilai browser biasanya berawalan `#`; dukungan alias hash belum terbukti dan tidak dijanjikan. Unknown game route saat ini jatuh ke GameContainer, sehingga `/games/kopdes-3d` belum menjadi Kopdes3D. `GameGates.jsx` menyediakan dua game aktif dan dua placeholder. Navbar sudah menautkan `/games`. Tidak ada react-router; jangan menambah router untuk satu halaman.

Perubahan yang sudah ada sebelum pekerjaan ini: `SeranganFajar.jsx`, `components/GameOverPanel.jsx`, untracked `components/UpgradeIcon.jsx`, dan `.claude/settings.local.json`. Jangan ikutkan ke commit Kopdes3D. File settings lokal tidak dibaca. `.gitignore` sudah mengabaikan node_modules, dist, dan `*.local`.

## Dependensi dan versi teramati

Versi declared berasal dari package.json; resolved berasal dari package-lock.json dan cocok dengan paket terpasang untuk seluruh paket berikut.

| Paket | Declared | Resolved/installed |
|---|---|---|
| react / react-dom | ^19.2.5 | 19.2.5 |
| vite | ^8.0.10 | 8.0.10 |
| @vitejs/plugin-react | ^6.0.1 | 6.0.1 |
| tailwindcss / @tailwindcss/vite | ^4.2.4 | 4.2.4 |
| phaser | ^4.2.1 | 4.2.1 |
| framer-motion | ^12.38.0 | 12.38.0 |
| react-icons | ^5.6.0 | 5.6.0 |
| dotenv | ^18.0.0 | 18.0.0 |
| openai | ^7.18.0 | 7.18.0 |
| @eslint/js | ^10.0.1 | 10.0.1 |
| eslint | ^10.2.1 | 10.2.1 |
| eslint-plugin-react-hooks | ^7.1.1 | 7.1.1 |
| eslint-plugin-react-refresh | ^0.5.2 | 0.5.2 |
| globals | ^17.5.0 | 17.5.0 |
| @types/react | ^19.2.14 | 19.2.14 |
| @types/react-dom | ^19.2.3 | 19.2.3 |

Belum ada pada manifest maupun lockfile: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `zustand`, dan `vitest`. Tidak ada TypeScript config atau test script npm. Tes Serangan Fajar memakai `node:test` dan assert bawaan Node.

Runtime shell `node --version` = **v20.20.2**, npm = **10.8.2**. Tersedia executable lokal `node_modules/node/bin/node.exe` versi **v26.9.0**. Lockfile mencatat dependency root `node: ^26.9.0`, tetapi package.json tidak mencantumkannya: **manifest/lockfile drift**. Jangan melakukan npm ci atau menulis ulang lockfile secara buta; pemilik repo perlu menetapkan runtime dan menyelaraskan deklarasi sebelum instalasi Phase 2. Build npm berhasil dengan runtime lokal; menjalankan `node` langsung memakai versi sistem yang berbeda.

Versi baru belum dipilih atau diverifikasi dari registry. Saat Phase 2, pilih R3F yang peer-compatible dengan React 19, lalu Drei/Rapier/Three yang peer range-nya saling cocok, Zustand, dan Vitest yang mendukung runtime/Vite terpilih. Periksa dokumentasi resmi dan `npm view <package> version peerDependencies engines`, pin hasil di lockfile, kemudian instal sekali. Tidak mengklaim versi latest atau kompatibilitas tanpa pemeriksaan. Drei hanya dipakai untuk helper yang diperlukan, bukan seluruh preset efek.

## Hasil verifikasi baseline

Perintah dijalankan dari Git root, tanpa perubahan sumber runtime:

| Pemeriksaan | Hasil aktual |
|---|---|
| `npm run build` | PASS, 544 modules; warning chunk >500 kB (Phaser sekitar 1.376,51 kB raw / 358,17 kB gzip) dan deprecation/plugin timing |
| `npm run lint` | FAIL, 8 errors dan 1 warning di kode existing |
| Seluruh 6 file tes Serangan Fajar, Node sistem 20 | FAIL, 31 pass + 1 file gagal karena `node:module` tidak mengekspor `registerHooks` |
| Seluruh 6 file tes Serangan Fajar, Node lokal 26.9.0 | PASS, 48 tests, 0 fail; warning experimental localStorage |
| Unit tests Kopdes3D | NOT IMPLEMENTED, tidak ada kode gameplay pada Phase 1 |
| Browser gameplay, runtime Console Kopdes3D | NOT TESTED; game dan route belum diimplementasikan |
| FPS, memory, visual final, gamepad, mobile | NOT TESTED |

Lint existing: `LanguageContext.jsx:7` dan `ThemeContext.jsx:3` melanggar only-export-components; `GameContainer.jsx:82` unused e, `:158` dependency warning, `:163` set-state-in-effect, `:183` dua purity errors; `HelloWorld.jsx:5` parsing error; `Certificates.jsx:61` unused purple. Tidak diperbaiki dalam scope Phase 1. Lint global tetap menjadi blocker hijau penuh; jangan menyatakan seluruh QA lulus hanya karena build lulus.

PowerShell tidak memperluas wildcard pada argumen node sistem seperti shell Unix. Perintah tes baseline yang dapat diulang:

```powershell
Set-Location 'E:\Portofolio\portov2'
$testFiles = @(Get-ChildItem -LiteralPath 'src/games/SeranganFajar/tests' -Filter '*.test.js' | ForEach-Object { $_.FullName })
& '.\node_modules\node\bin\node.exe' --test @testFiles
npm run lint
npm run build
```

Sesudah Vitest terpasang, perintah fokus yang direncanakan: `npx vitest run src/games/Kopdes3D/tests`; lint fokus: `npx eslint src/games/Kopdes3D`. Perintah ini belum dijalankan sebagai QA Kopdes3D. Dev tetap `npm run dev`, preview `npm run preview`. Jangan menjalankan npx untuk mengunduh dependensi tak terpilih secara diam-diam.

## Struktur implementasi minimum yang diusulkan

```text
Kopdes3D/
  Kopdes3D.jsx                 Shell, loading/error boundary, menu/HUD
  Kopdes3D.css                 Scoped UI, tanpa perubahan global
  GameWorld.jsx               Canvas, Rapier, world dan actors awal
  gameLogic.js                Transition, hit filter, keranjang, checkout, skor
  gameStore.js                Zustand, command/hasil dan persistence
  config.js                   Catalog, satu level, parameter combat
  tests/gameLogic.test.js      Skenario aturan murni dan regresi
  assets/                     Hanya file nyata dengan provenance
```

Ini rancangan, bukan scaffolding yang harus langsung dibuat seluruhnya. Pisahkan Player/Camera/Enemy/Boss/data files hanya ketika implementasi membuat satu file sulit dipahami atau dipakai ulang. Jangan membuat ECS, plugin framework, event bus global, interface dengan satu implementasi, atau 30 komponen level. Tetap JavaScript/JSX ESM seperti repo, dengan JSDoc untuk kontrak data jika perlu; tidak memigrasikan aplikasi ke TypeScript.

State berbasis enum string uppercase; data ID lowercase/kebab-case kecuali SKU katalog. Fungsi aturan menerima input eksplisit dan mengembalikan snapshot/result, tanpa membaca DOM. Gaya kode mengikuti file JSX sekitar dan eslint. Contoh kontrak: `checkout(snapshot, { runId, cartRevision, transactionId })` mengembalikan `{ ok, reason, nextState, receipt }`; kegagalan mengembalikan state semula. Kontrak ini spesifikasi, belum fungsi tersedia.

## Keputusan arsitektur

### ADR-001: Isolasi route dan lazy loading

Context: portofolio dan game Phaser sudah berjalan; game baru tidak boleh menambah beban halaman utama. Decision PROPOSED: tambah satu `React.lazy(() => import('./games/Kopdes3D/Kopdes3D'))` pada App dan satu entry GameGates untuk `/games/kopdes-3d`. Gunakan Suspense loading dan error boundary lokal dengan retry/keluar. Jangan export game melalui barrel yang mengimpor engine secara eager.

Alternatif route library atau aplikasi terpisah ditolak karena router manual dan SPA rewrite sudah cukup. Konsekuensi: perubahan dua file di luar writable root memerlukan izin filesystem pada Phase 2. Verifikasi pathname, refresh, Back/Forward, keluar game, dan Network: halaman `/` serta `/games` tidak mengunduh Three/Rapier/GLB sebelum game dipilih. Canonical route memakai pathname; alias hash memerlukan normalisasi dan tes terpisah bila kelak diminta. Jangan menambah global preload GLB. Tidak mengubah chunk Phaser existing.

### ADR-002: Satu otoritas simulasi

Context: hitbox, animasi, i-frame, dan physics harus sinkron. Decision PROPOSED: React Three Fiber merender, Rapier memakai fixed step 1/60 dan kinematic capsule controller, sedangkan timeline combat serta input command diintegrasikan melalui hook physics yang sama. Jangan menjalankan physics manual dan wrapper physics bersamaan. Vektor high-frequency disimpan pada ref/simulation object, bukan setState React tiap frame. Zustand hanya menyajikan snapshot HUD dan transaksi pada perubahan bermakna.

Alternatif collider kontak bebas sebagai damage authority ditolak karena hit bisa berulang/tergantung frame. Konsekuensi: uji fungsi hit murni dan query physics secara terpisah; determinisme tidak melampaui jaminan yang ditetapkan combat_design. Kamera collision query berjalan setelah transform physics tersedia; visual interpolasi tidak mengubah sumber damage.

### ADR-003: Transaksi lokal dan save berversi

Context: pembayaran, reward, unlock, dan refresh harus konsisten tanpa backend. Decision PROPOSED: checkout sinkron memvalidasi seluruh snapshot kemudian mengganti satu state, token idempotency stabil, hasil dan progres disimpan dalam satu localStorage envelope berversi. Stance, gerak, dan particle tidak dipersist. Definisi snapshot dan pemulihan mengikuti design.md.

Alternatif backend ditolak karena single-player dan belum ada kebutuhan akun/leaderboard. Mengandalkan tombol disabled ditolak karena tidak melindungi double dispatch. Konsekuensi: local save bukan anti-cheat; storage error dilaporkan, data rusak tidak ditimpa diam-diam. Multi-tab perlu penulis tunggal. Crash antara state memori dan persistence tidak boleh dianggap transaksi tersimpan; load hanya membaca envelope committed terakhir.

## Fisika, lifecycle, dan kinerja

Collider statis box/capsule untuk bangunan/props, capsule kinematic pemain/musuh, sensors untuk interaksi. Collision groups memisahkan dunia, actor, interaction, dan hit query. Karakter tidak menabrak sensor/VFX. Grounding, max slope awal 45 derajat, step height awal 0,25 m, dan arena bounds harus diuji, bukan diasumsikan benar karena Rapier terpasang.

Ketika unmount: lepas pointer lock, input listener, visibility listener, gamepad polling, physics callbacks, audio nodes, dan timers; dispose geometry/material milik scene tanpa merusak aset cache yang masih dipakai. React StrictMode tidak boleh menghasilkan dua world loop atau dua checkout. Context loss/GLB gagal menampilkan pesan, retry, dan kembali menu. Jangan retry unduhan tanpa batas. WebGL tidak tersedia menampilkan fallback teks yang dapat dinavigasi.

Target sementara: 60 FPS desktop 1080p medium dan fallback 30 FPS low, DPR dibatasi 1–1,5, maksimal musuh sesuai cap, <=150 draw calls pada slice, unduhan awal slice <=10 MB compressed. Ini **target belum teruji**, bukan acceptance yang telah lulus. Profil minimal pada perangkat pengembang dan satu perangkat integrated GPU dengan spesifikasi/browser dicatat. Ukur median/p95 frame time selama encounter dan belanja 60 detik, Network transferred, peak memory yang tersedia, serta mount/unmount lima kali. Kurangi shadow map, DPR, particles, dan object count berdasarkan hasil; tidak menambah bloom/SSAO pada slice.

## Risiko dan mitigasi

| Risiko | Dampak | Mitigasi / bukti penutup |
|---|---|---|
| Runtime Node dan lock drift | Install/tes tidak reproducible | Tetapkan runtime, selaraskan root manifest/lock secara terarah; ulang baseline |
| Peer React/R3F/Rapier belum diverifikasi | Build/runtime rusak | Audit official docs, peer range, lock exact resolved sebelum P2 |
| Lint global sudah gagal | Tidak bisa mengklaim semua gate hijau | Catat baseline; perbaikan lint existing dalam scope terpisah bila diizinkan |
| Root folder lain tidak writable | Route/dependency tidak bisa dipasang | Perluasan izin terarah pada P2, bukan bypass dengan symlink/tool lain |
| Asset final belum ada | Ekspektasi visual melebihi slice | Primitive berlabel, asset pipeline dan provenance eksplisit |
| Kamera/collider ruang sempit | Kamera menembus, dash lewat pintu | Shape cast dan browser skenario sudut/pintu/rak |
| Timeline dan animasi divergen | Hit terlambat/duplikat | Fixed tick dan satu sumber marker; uji cancel/death |
| Checkout/save duplikat | Uang/EXP/unlock salah | Pure transaction, token, satu envelope, double click/refresh/multi-tab tests |
| Scope 30 level terlalu dini | Scene banyak, gameplay belum selesai | Gate VS01–VS10 sebelum ekspansi |
| Active AI, VFX, GLB terlalu berat | Frame time buruk | Cap, instance props, aset ringan, profiling nyata |
| localStorage rusak/penuh | Progres hilang | Validasi schema, catch read/write, raw recovery, retry save |
| Perubahan game lain sedang berjalan | Commit mencampur pekerjaan | Stage path eksplisit, branch dokumentasi, periksa staged diff |

## Strategi verifikasi berikutnya

Vitest menguji aturan combat, AI transition, checkout, scoring, validasi level dan save. Query Rapier, kamera, input focus, WebGL, dan animasi memerlukan integrasi/browser; jangan mengeklaim unit test membuktikan collision nyata. Satu file tes fokus awal cukup, berkembang hanya mengikuti logic nontrivial. Setiap bug mendapat regresi pada lapisan penyebab.

Browser walkthrough VS01–VS10 merekam browser/version, resolusi, input, Console errors, failed requests, langkah, expected/actual, screenshot pada encounter/rak/hasil, dan status tiap kriteria. Uji checkout ganda, refresh setelah boss/checkout, budget kurang, stock boundary, pause/blur, death/retry, serta menu keyboard. Bila alat browser tidak tersedia, tulis NOT TESTED dan jangan menutup milestone playable.

Phase 1 diverifikasi lewat kelengkapan dokumen, tautan lokal, 30 baris level, kelayakan budget, dan diff hanya dokumentasi. Build baseline dan tes existing tidak membuktikan game baru playable.
