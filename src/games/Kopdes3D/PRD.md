# KOPDES 3D: Belanja Hemat

Tanggal: 28 Oktober 2026. Status: rancangan Phase 1 untuk ditinjau, belum diimplementasikan.

## Tujuan dan batas pekerjaan

Game web third-person action adventure dan shopping simulator untuk tugas akhir semester dan portofolio `https://dimszyo.my.id/games`. Tagline: **Lawan, Belanja, Bangun Desa**. Keberhasilan pertama adalah satu level yang dapat diselesaikan dari rumah sampai struk pembayaran, bukan kualitas gambar promosi.

Pekerjaan saat ini hanya audit dan dokumentasi. Phase 2 menunggu checkpoint pengguna. Izin terbaru pengguna mencakup commit dan push hasil pekerjaan ini ke GitHub, tetapi tidak deploy. Semua angka balancing dalam dokumen merupakan nilai awal yang perlu playtest.

Asumsi rancangan: single-player offline; desktop keyboard/mouse menjadi target pertama; bahasa Indonesia; gamepad menyusul setelah alur keyboard stabil. Kemajuan disimpan di browser yang sama. Tidak ada akun, pembayaran sungguhan, backend, multiplayer, ekonomi daring, atau pembangunan desa berbasis crafting. Tema membangun desa diwujudkan lewat akses KOPDES, misi warga, dan epilog chapter.

Gambar pengguna adalah referensi konsep 2D, bukan GLB, model final, atau bukti gameplay. Owi, Lilbah, Kabdy, dan Wowo dibuat sebagai karakter fiktif stylized dengan model sheet orisinal. Tidak menggunakan foto wajah atau suara orang nyata sebagai aset jadi.

## Indeks dokumen

| Dokumen | Isi |
|---|---|
| [design.md](design.md) | Pengalaman pemain, kontrol, belanja, skor, progres |
| [level_design.md](level_design.md) | Schema, preset, dan rancangan seluruh 30 level |
| [combat_design.md](combat_design.md) | State, hit detection, AI, skill, dan ketiga boss |
| [asset_manifest.md](asset_manifest.md) | Manifest, model sheet, animasi, audio, status lisensi |
| [technical_architecture.md](technical_architecture.md) | Bukti audit, dependensi, keputusan, risiko, pengujian |
| [tasks/plan.md](tasks/plan.md) | Urutan fase dan checkpoint |
| [tasks/todo.md](tasks/todo.md) | Task Phase 2 dengan acceptance dan verifikasi |

## Peta kemampuan

Peta ini merupakan usulan untuk checkpoint, bukan pemisahan menjadi paket atau framework baru.

| ID | Tanggung jawab | Bergantung pada |
|---|---|---|
| level-data | Katalog, konfigurasi encounter, mission, dan aturan angka | Tidak ada |
| player-world | Input, kamera, fisika, interaksi ruang | level-data |
| combat | State pemain, AI, damage, skill, boss | player-world, level-data |
| shopping | Rak, keranjang, stok, pembayaran atomik | level-data; menerima akses dari combat |
| progression | Hasil, EXP, unlock, checkpoint, save | combat, shopping |
| game-shell | Route, menu, HUD, aksesibilitas, lifecycle | Seluruh kemampuan di atas |

Implementasi dimulai dari shell minimal dan satu potongan alur end-to-end; tidak membangun semua kemampuan secara horizontal sekaligus. React menyajikan dunia dan UI, sedangkan aturan yang dapat diuji berada dalam fungsi JavaScript murni.

## Scope per milestone

- Phase 1: delapan dokumen ini, audit aktual, dan rencana verifikasi. Tidak ada perubahan runtime.
- Phase 2: level 1, satu penjaga melee, dua stance, satu dash, rumah, satu jalur, KOPDES, satu rak beras, kasir, hasil. Checkpoint minimal agar refresh tidak menghapus penyelesaian.
- Phase 3: Penjara Ompreng, ultimate, tiga tipe penjaga, framework boss, Lilbah.
- Phase 4: katalog penuh, misi, skor lengkap, EXP, unlock, save tervalidasi.
- Phase 5: Kabdy, Wowo, fase dan summon.
- Phase 6: realisasi 30 konfigurasi setelah slice disetujui; variasi environment dan balancing.
- Phase 7: aset final, animasi, VFX/SFX, profiling, browser QA, production build.

## Acceptance vertical slice

| ID | Kondisi lulus | Bukti yang diperlukan |
|---|---|---|
| VS01 | `/games/kopdes-3d` terbuka dari `/games` dan melalui direct URL/refresh | Browser, Back/Forward, refresh, Network |
| VS02 | Owi bergerak dengan kamera third-person; collision pemain dan kamera aman | WASD, sprint, diagonal, sudut tembok |
| VS03 | Tinju dan ompreng dapat diganti tanpa state animasi rusak | Idle, attack recovery, spam switch |
| VS04 | Penjaga memiliki HP dan dapat dikalahkan | Tes damage sekali per hit dan browser |
| VS05 | Pintu terkunci sebelum encounter selesai, terbuka setelahnya | Tes gate dan percobaan interaksi |
| VS06 | Produk dapat diambil setelah akses terbuka | Interaksi rak beras |
| VS07 | Quantity, stok, keranjang, dan total benar | Tambah/hapus, batas stok, anggaran |
| VS08 | Kasir menerima pembayaran valid tepat sekali | Double click, budget kurang, request lama |
| VS09 | Struk dan hasil level muncul setelah transaksi | Skor dasar, retry, refresh hasil |
| VS10 | Tidak ada error runtime selama skenario pengujian | Console, page errors, request gagal dicatat |

Kesepuluh kondisi harus lulus sebelum penambahan level. Bukti browser yang belum tersedia ditulis **NOT TESTED**, bukan dianggap lulus. Save minimal wajib menahan unlock level 1 dan checkpoint sesudah encounter/checkout saat refresh; save lengkap diselesaikan Phase 4.

## Batas kualitas

Selalu validasi input, integer Rupiah, quantity, state transition, katalog, konfigurasi, dan save. Jangan menurunkan threshold, mematikan lint, atau menghapus tes agar hasil hijau. Jangan mengubah Serangan Fajar, WowoJump, fitur portofolio lain, atau perubahan pengguna yang sudah ada.

Phase 1 hanya menulis `src/games/Kopdes3D`. Integrasi Phase 2 memerlukan perubahan terarah pada `src/App.jsx`, `src/games/GameGates.jsx`, serta manifest/lockfile di root; izin filesystem harus mencakupnya. Route baru belum tersedia sekarang. Tidak ada klaim FPS, visual final, atau kompatibilitas browser sebelum pengujian aktual.

## Keputusan pada checkpoint

Tinjau usulan route `/games/kopdes-3d`, target desktop pertama, kontrol Q/1/2/R, dan balancing awal. Setelah Phase 1 ditinjau, pilih pekerjaan berikutnya: **Phase 2 saja**. Seluruh fitur Phase 3–7 tetap backlog sampai checkpoint terkait lulus.
