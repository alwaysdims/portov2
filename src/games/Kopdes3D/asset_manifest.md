# Asset manifest dan persyaratan produksi

Status aset final pada tabel produksi di bawah: **PLANNED / NOT AVAILABLE**. Tidak ada model 3D, animasi, audio, atau UI final Kopdes3D di folder saat audit. Nama file merupakan target, bukan file yang sudah tersedia.

Referensi: gambar konsep pengguna `b32ee596-116f-47d2-bbfb-beeff963dfb7.png`, disediakan melalui chat dari folder Downloads. Gambar tidak disalin ke repository dan bukan aset runtime. Hak distribusi gambar belum diverifikasi. Gunakan sebagai arah komposisi, warna, proporsi, dan mekanik; buat bentuk/model sheet sendiri.

## Placeholder runtime Checkpoint 2.3

Status: **PROCEDURAL PLACEHOLDER — bukan aset final**. Pembuat: kode asli proyek pada checkpoint ini, tanpa unduhan model, logo resmi, merek produk, atau salinan piksel referensi. Gambar pengguna telah diperiksa untuk rumah genteng, tiang/kabel, fasad merah-putih, kanopi dan lorong toko; gambar tetap di luar repository. Lisensi distribusi referensi tetap NOT VERIFIED.

| Kelompok | Sumber runtime | Bentuk dan penggunaan |
|---|---|---|
| Rumah/halaman/jalan/arena | `environment/config.js`, `Village.jsx`, `Props.jsx` | Box instanced, atap cone empat sisi, lantai datar; pagar dan gerbang terbuka |
| Vegetasi | `Props.jsx`, `config.js` | Tajuk/semak icosahedron instanced; batang box solid |
| Infrastruktur/warung | `config.js` | Tiang listrik, kabel tipis non-solid di atas pemain, lampu jalan dan kanopi warung; tanpa lampu dinamis per tiang |
| KOPDES exterior | `KopdesExterior.jsx`, `config.js` | Fasad satu lantai merah-putih, atap, kanopi, bay jendela teal opaque dan portal masuk terbuka; tidak ada logo |
| Interior/produk | `KopdesInterior.jsx`, `config.js` | Rak solid, blok kemasan berwarna non-solid, display beras, kasir, register, antrean dan peti penyimpanan |
| Signage/kategori | `Props.jsx` | CanvasTexture 1024 × 128, font sans-serif sistem, teks eksplisit; texture dispose saat cleanup, tanpa font/network request |
| Lighting | `Lighting.jsx` | Daylight hangat, hemisphere + ambient, satu directional shadow 1024; panel interior geometri cerah |
| Marker | `Environment.jsx`, `config.js` | Named groups dan floor anchors dengan ID stabil; tidak terlihat, tanpa sensor/AI/transaksi |

Geometri/material JSX dimiliki scene dan dikelola R3F saat unmount. Signage membuat/membuang texture dalam layout effect, termasuk StrictMode. Produk belum mewakili SKU, stok atau pembelian nyata. Model NPC Ibu/kasir/guard/boss belum dibuat; hanya anchor. Semua entry GLB produksi berikut tetap PLANNED.

## Aturan umum

GLB glTF 2.0, Y-up, skala meter, pivot karakter di lantai, transform diterapkan. Konvensi forward lokal +Z pada aset, dikonversi konsisten di controller. Humanoid memakai satu skeleton bersama bila proporsi memungkinkan, dengan root, hips, spine, head, dua lengan, dan dua kaki; target <=60 deform bones, <=4 influence per vertex. Soket `hand_r`, `hand_l`, `weapon_socket`, `vfx_origin` wajib terdokumentasi. Locomotion in-place; physics menggerakkan root. Jangan memakai root motion sebagai sumber movement kedua.

Target biaya di bawah adalah batas awal authoring, bukan hasil profiling: Owi <=12k triangles, boss <=15k masing-masing, guard <=6k, NPC <=5k, prop kecil <=500, bangunan modular <=8k per modul besar. Maksimal dua material per karakter, atlas 1024 karakter utama/boss dan 512 props; hindari tekstur 4K. Collider primitive terpisah dari mesh render; tidak memakai trimesh pada karakter bergerak. Animasi 30 fps cukup untuk ekspor, timeline gameplay tetap 60 Hz. Compression Meshopt/KTX2 baru dipilih jika pengukuran membuktikan perlu; jangan menambah decoder sebelum slice berjalan.

## Manifest

Semua path relatif terhadap `src/games/Kopdes3D/assets/`. Setiap baris memakai status PLANNED sampai file dan pemeriksaan lisensi benar-benar tersedia.

| ID / target file | Kebutuhan visual/fungsi | Placeholder yang diizinkan | Milestone |
|---|---|---|---|
| player-owi / models/owi.glb | Rambut hitam, kemeja putih, ransel, siluet pemuda; rig lengkap | Capsule dan bagian mesh sederhana, label PLACEHOLDER | P2 |
| guard / models/guard.glb | Jas hitam, putih, dasi merah, peci; varian melee/fast/elite | Humanoid primitive; fast ramping, elite lebar | P2/P3 |
| boss-lilbah / models/lilbah.glb | Fiktif stylized, postur ramping, ciri rambut/kostum orisinal | Guard rig dengan proporsi/warna unik | P3 |
| boss-kabdy / models/kabdy.glb | Fiktif stylized, postur atletis, siluet lengan cepat | Primitive lebih pendek/lebar bahu | P5 |
| boss-wowo / models/wowo.glb | Fiktif stylized, tubuh kokoh, peci, gesture heavy | Primitive besar dengan peci berbeda | P5 |
| npc-ibu / models/npc-ibu.glb | NPC pemberi misi di teras rumah | Capsule berwarna dan nama NPC | P2 |
| npc-kasir / models/npc-kasir.glb | Seragam koperasi dan pose di meja kasir | Mesh sederhana di belakang counter | P2 |
| npc-warga / models/npc-warga.glb | Dua varian warga ambient, tanpa AI kompleks | Ditiadakan pada slice | P7 |
| rumah / environment/rumah.glb | Teras, genteng, pintu, trigger briefing | Box/roof primitives dengan collider | P2 |
| desa-kit / environment/desa-kit.glb | Jalan, pagar, pohon, peti, lapak, gerobak statis, bendera | Primitive modular dengan material atlas | P2/P6 |
| kopdes-exterior / environment/kopdes-exterior.glb | Fasad merah-putih, papan KOPDES fiktif, pintu terkunci/terbuka | Bangunan box, signage DOM/tekstur lokal | P2 |
| kopdes-interior / environment/kopdes-interior.glb | Rak, lorong, meja kasir, label, stok visual | Rak box instanced dan counter sederhana | P2/P4 |
| products / products/{BR,MY,GU,TL,MI,SU,SB,TE}.glb | Delapan produk dengan kemasan generik dan ikon terbaca | Box/bag mesh, label nama dan unit | P2 BR, P4 sisanya |
| weapon-ompreng / weapons/ompreng.glb | Baki makan logam membulat, soket genggaman aman | Rounded box perak, tanpa tekstur mahal | P2 |
| vfx-cage / vfx/cage | Kurungan ompreng 2 detik; progres stun terbaca | Batang instanced non-solid, shader sederhana | P3 |
| vfx-ultimate / vfx/ultimate | Windup, lingkaran radius, shock ring, impact | Ring mesh dan partikel dibatasi | P3 |
| vfx-dash-hit / vfx/combat | Trail pendek, hit flash, telegraph lane/cone/ring | Mesh transparan terbatas, tanpa bloom wajib | P2/P3 |
| ui-kit / ui/ | Logo orisinal, stance/skill/product icons, bintang, panel, portrait, struk | HTML/CSS, teks/icon orisinal dengan label | P2/P4 |
| audio-bgm / audio/{village,combat,boss,shop}.ogg | Loop musik orisinal atau berlisensi jelas | Tanpa musik, label belum tersedia | P7 |
| audio-world / audio/{steps,door,pickup,checkout,ui,result}.ogg | Interaksi, langkah, konfirmasi/penolakan | Web Audio tone orisinal dengan volume aman | P2/P7 |
| audio-combat / audio/{fist,ompreng,dash,cage,ultimate,telegraph,hurt,defeat}.ogg | Cue timing attack dan telegraph | Web Audio tone orisinal, bukan suara tokoh nyata | P3/P7 |

Kurungan, ultimate, dan UI dapat tetap procedural pada versi final bila hasil QA memadai; GLB tidak diperlukan untuk setiap efek. Placeholder harus ditandai di menu, inventory aset, dan laporan QA, bukan disamarkan sebagai model final. Tidak mengambil aset Serangan Fajar/WowoJump tanpa audit lisensi dan kebutuhan terpisah.

## Model sheet sebelum modeling

Setiap humanoid memerlukan front, back, side, tiga-perempat, A-pose, tinggi dalam meter, skala berdampingan dengan Owi, palet material, detail wajah stylized, tangan/socket, dan siluet grayscale. Tambahkan ekspresi idle, tegang, hurt, dan defeat. Boss mempunyai pose fase dan pose serangan signature; elite/fast mempunyai pembeda proporsi. Rancangan wajah tidak menyalin fotorealisme referensi.

Ompreng memerlukan top/bottom/side, ukuran sekitar 0,45 x 0,32 meter, ketebalan, arah genggaman, pivot, soket, dan jejak hitbox. Kurungan memerlukan radius target, tinggi sekitar 2,2 meter, tampilan sisi/depan, indikator sisa stun, dan cara hilang tanpa menutup pandangan kamera.

Environment memerlukan denah top-down berskala dengan rute pemain, jalan aman, ukuran pintu minimal 1,5 meter, lorong minimal 2 meter, titik spawn/summon, lokasi interaksi, serta collision proxy. Produk memerlukan ikon, warna, unit kemasan, dan label generik tanpa merek pihak ketiga.

## Animation requirements

| Pemilik | Clip wajib | Loop dan marker |
|---|---|---|
| Owi shared | idle_fist, idle_ompreng, walk, run, strafe_left, strafe_right, backpedal | Loop, kaki tidak sliding pada kecepatan target |
| Owi tinju | fist_1, fist_2, fist_3 | One-shot; windup/active/recovery sesuai combat |
| Owi ompreng | ompreng_1, ompreng_2, equip_fist, equip_ompreng | Equip tidak mereset timeline serangan |
| Owi skill | dash_forward/back/left/right, cage_cast, ultimate_windup_impact | Dash diagonal blend; impact marker tetap timeline gameplay |
| Owi reaksi | hurt, stunned_loop, death, interact_shelf, interact_cashier, victory | Death terminal, interact tidak memicu checkout sendiri |
| Guard shared | idle, walk, run, telegraph, attack_1, recover, hurt, stunned_loop, defeat | Elite menambah attack_2; tipe lain berbagi rig |
| Lilbah | idle, move, combo_1/2, dash_windup/attack, summon, phase, hurt, stun, defeat | Dua fase; recovery terlihat dan defeat selesai 120 tick |
| Kabdy | idle, move, combo_1/2/3, slam, summon, phase, hurt, stun, defeat | Jeda tiap hit dan area marker eksplisit |
| Wowo | idle, move, heavy, area, summon, phase, ultimate_windup/impact, hurt, stun, final_defeat | Tiga fase dan final defeat khusus |
| NPC | idle, greet, point, cashier_accept | Loop idle; interaksi one-shot |

Phase 2 boleh memakai animasi procedural placeholder untuk idle/move/dua stance/dash/hurt/death dan interaksi; aktifkan hanya clip yang diperlukan. Final asset harus memiliki blend masuk/keluar 0,08–0,15 detik tanpa menunda hit gameplay. Pakai additive hurt hanya bila pipeline rig mendukungnya; tidak wajib pada slice.

Manifest animasi per clip mencatat file, nama persis, durasi, loop, root motion false, socket, dan marker tick. Footstep/VFX mengikuti timeline yang sama, sementara callback visual tidak boleh mengubah HP. Uji weapon tidak menembus tangan, death tidak kembali idle, dan cancel tidak meninggalkan kurungan/VFX.

## Provenance dan penerimaan aset

Untuk setiap file nyata, catat creator, URL sumber bila ada, tanggal akses, lisensi, izin modifikasi/distribusi, attribution, hash file, ukuran, triangles, materials, texture size, rig, dan status review. Aset buatan sendiri tetap mencatat creator dan pernyataan hak distribusi. File dengan lisensi tidak diketahui tidak masuk build. Attribution disediakan bila lisensi mensyaratkan.

Review produksi: import GLB berhasil tanpa resource hilang, normal/material benar, scale cocok, animation clip lengkap, collision terpisah, ukuran unduhan sesuai target, dan visual di browser diperiksa. Status FINAL hanya setelah model sheet, lisensi, rig, animasi, dan QA lulus. Gambar promosi tidak cukup sebagai bukti.
