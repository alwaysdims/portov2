# Desain pengalaman KOPDES 3D

Status: rancangan Phase 1. Angka adalah baseline balancing, belum hasil playtest.

## Alur dan identitas

Owi, pemuda desa dengan kemeja putih, celana gelap, sepatu, dan ransel, menerima daftar belanja dari NPC di rumah. Penjaga fiktif menghalangi jalan menuju KOPDES merah-putih. Owi memakai tinju atau ompreng untuk membuka akses, kemudian membeli kebutuhan warga sesuai anggaran. Kekerasan kartun tanpa darah; musuh kalah dengan jatuh atau mundur.

Urutan sesi: `BRIEFING`, `TRAVEL`, `ENCOUNTER`, `SHOPPING`, `CHECKOUT`, `RESULT`. `PAUSED` dan `FAILED` adalah mode sesi, bukan state combat. Misi harus diterima sebelum encounter aktif. KOPDES tidak terbuka hanya karena pemain memasuki trigger pintu. Boss yang kalah tetap diikuti fase belanja.

Desa memakai rumah genteng, teras, pepohonan, jalan sempit, bendera, pagar, peti, dan lapak. KOPDES mempunyai fasad merah-putih, lorong rak, label barang, pintu masuk, dan kasir. Pencahayaan siang hangat; siluet karakter dan telegraph lebih penting daripada detail foto. Skala Owi sekitar 1,7 meter, proporsi stylized sekitar 5,5 kepala.

## Kontrol dan prioritas input

| Aksi | Keyboard/mouse | Gamepad usulan setelah slice |
|---|---|---|
| Bergerak | WASD relatif yaw kamera | Left stick, deadzone radial 0,15 |
| Melihat | Mouse, pointer lock setelah klik Mulai | Right stick |
| Sprint | Shift tahan | L3 |
| Interaksi | E | A |
| Serangan | Klik kiri | X |
| Ganti stance | Q | Y |
| Directional Dash | 1 | B |
| Penjara Ompreng | 2 | LB |
| Ultimate | R | RB |
| Pause/tutup | Escape | Menu |

Escape pertama keluar pointer lock dan pause, bukan langsung kembali ke portofolio. Blur, tab tersembunyi, dan gamepad disconnect mem-pause serta mengosongkan input tertahan. Resume butuh tindakan pengguna; timer simulasi tidak mengejar waktu tab tersembunyi.

Mode `WORLD` menerima combat hanya selama travel/encounter; mode `SHOPPING_WORLD` menerima gerak dan interaksi, tanpa serangan. Mode `UI` menangkap pointer dan keyboard, mengosongkan buffer attack/dash, serta menghentikan gerak. Menutup keranjang tidak otomatis menyerang dari klik yang sama. Menekan E berulang tidak membuka beberapa dialog. Rak dan kasir terpilih melalui jarak maksimal 1,8 meter, arah pandang, line-of-sight, lalu ID stabil untuk tie-break.

Kamera berada sekitar 4,5 meter di belakang dan 2,2 meter di atas pemain, FOV awal 60 derajat. Pitch dibatasi -25 sampai 65 derajat. Follow memakai damping berbasis delta; posisi ideal disapu dengan sphere radius 0,2 meter terhadap collision dunia. Kamera masuk cepat saat terhalang dan kembali perlahan setelah bebas. Abaikan collider pemain, sensor, dan VFX pada query kamera. Di ruang sempit kamera boleh mendekat; jangan melewati tembok. Screen shake dapat dimatikan.

## Belanja

Harga simulasi tetap dalam satu run, bukan data pasar. Katalog awal:

| ID | Produk per unit | Harga Rupiah | Stok minimum per run |
|---|---|---:|---:|
| BR | Beras kemasan 1 kg | 14000 | 6 |
| MY | Minyak goreng 1 L | 18000 | 4 |
| GU | Gula 1 kg | 17000 | 4 |
| TL | Telur kemasan 0,5 kg | 15000 | 4 |
| MI | Mi instan 1 bungkus | 3000 | 10 |
| SU | Susu UHT 1 L | 19000 | 4 |
| SB | Sabun 1 batang | 6000 | 4 |
| TE | Teh 1 kotak | 5000 | 4 |

Phase 2 mengekspos BR saja dengan misi satu unit dan budget Rp25.000. Katalog lengkap mulai Phase 4. Item kemasan tidak menerima quantity pecahan. Pemain boleh membawa barang ekstra, tetapi total tidak boleh melebihi budget. UI menampilkan item wajib, subtotal, sisa budget, stok tersedia, dan jumlah yang belum lengkap. Menghapus item mengembalikan reservasi stok.

Dalam desain full, stok tersedia = stok awal dikurangi keranjang dan pembelian sah. Keranjang mereservasi unit dalam run, bukan transaksi keuangan. Produk tidak bisa ditambahkan sebelum gate terbuka, saat pause, sesudah pembayaran, atau dari ID tidak dikenal. Total dihitung dari katalog, tidak menerima harga kiriman UI. Quantity harus safe integer positif pada tambah; nol berarti baris dihapus melalui aksi hapus.

Checkout hanya tersedia dekat kasir, setelah encounter clear, mission lengkap, timer tersisa, dan state `SHOPPING`. Kekurangan barang wajib, stok tidak sah, nilai non-finite, atau budget kurang menolak seluruh transaksi tanpa mutasi parsial. Pemain dapat mengurangi keranjang lalu mencoba lagi. Tidak ada pembayaran parsial.

Satu fungsi sinkron melakukan validasi snapshot terkini, menghitung total, membentuk struk immutable, mengurangi stok, menandai transaksi selesai, menghitung hasil, dan mencatat reward. Commit dilakukan sebagai satu state replacement. Token transaksi adalah `runId:checkout`, dengan version/revision keranjang; permintaan lama ditolak. Duplikasi token mengembalikan struk yang sama tanpa mengurangi stok, budget, atau menambah EXP lagi. Tombol disabled adalah bantuan UX, bukan pengaman utama.

Struk memuat runId, levelId, token, produk, harga terkunci, quantity, subtotal, total, uang awal, kembalian, dan waktu simulasi. Tidak ada nama pribadi atau data pembayaran nyata.

## Skor dan progres

Skor akhir 0–100, dibulatkan sekali setelah seluruh komponen dijumlahkan:

- Combat 30: `30 * clamp(1 - damageTaken / maxHP, 0, 1)`. Damage lingkungan masuk hitungan; heal tidak menghapus histori damage.
- Akurasi 40: `40 * matchedRequiredUnits / purchasedUnits`. Karena semua barang wajib harus lengkap, barang ekstra menurunkan skor. Quantity ekstra pada produk wajib tetap dihitung ekstra.
- Anggaran 20: `20 * clamp(1 - (total - requiredCost) / max(1, budget - requiredCost), 0, 1)`. Jika budget tepat requiredCost, pembelian tepat mendapat 20. Penghematan dinilai terhadap daftar, bukan besar budget antarlevel.
- Waktu 10: `10 * clamp(1 - elapsedSeconds / timerSeconds, 0, 1)`.

`requiredCost` berasal dari daftar dan katalog yang sama. Checkout dengan misi kosong tidak sah. Bintang: 3 untuk skor >=85, 2 untuk >=65, 1 untuk checkout sah dengan skor lebih rendah. Gagal tidak mendapat bintang atau unlock. Timer berhenti ketika transaksi sah terjadi. Timer habis atau HP nol sebelum itu membuka retry checkpoint, tanpa hasil sukses.

EXP penyelesaian pertama = reward konfigurasi ditambah `10 * stars`. Reward konfigurasi = `100 + 20 * levelId`, ditambah 300 pada boss level. Retry atau replay tidak memberi EXP berulang; replay boleh meningkatkan best score/bintang. Rank Owi = `1 + floor(totalExp / 500)`, kosmetik/UI saja pada baseline agar level awal tidak rusak akibat power creep. Maksimal level terbuka 30; penyelesaian N membuka N+1. Tracking boss berubah saat boss benar-benar kalah, tetapi unlock level tetap menunggu checkout.

Checkpoint disimpan setelah menerima misi, encounter clear, dan checkout. Checkpoint awal menyimpan misi, budget, HP awal, timer awal; retry mengulang encounter. Checkpoint sesudah encounter menyimpan gate, HP tersisa minimal 1, timer tersisa, dan status boss; keranjang mulai kosong dengan stok awal. Refresh di tengah belanja kembali ke checkpoint itu dengan pesan jelas. Refresh tidak menjanjikan penyimpanan per frame atau posisi persis.

Save versi 1 memakai key `kopdes3d:save:v1`; envelope menyimpan totalExp, completedLevels, bestResults, defeatedBosses, rewardedLevelIds, lastReceipt, dan checkpoint. Update hasil, unlock, EXP, struk, dan token checkout harus masuk envelope yang sama. Persist sebelum menampilkan sukses; kegagalan tulis mempertahankan hasil di memori, menampilkan peringatan, dan menyediakan Coba Simpan Lagi. Jangan mengaku progres aman jika storage penuh atau diblokir. Multi-tab memakai satu penulis aktif dengan Web Locks bila tersedia; fallback tab kedua menjadi read-only dengan pesan, bukan menggabungkan dua checkout secara naif.

JSON rusak, versi tidak dikenal, ID di luar 1–30, angka negatif/non-finite, dan struktur berlebih tidak boleh langsung digunakan. Pertahankan data mentah yang gagal dibaca; tawarkan reset eksplisit, bukan menimpa diam-diam. Save lokal dapat dimanipulasi pengguna dan tidak dipakai sebagai leaderboard tepercaya.

## UI dan aksesibilitas

HUD DOM: HP Owi, stance, uang, daftar belanja, timer, skill cooldown, prompt E; boss bar dan indikator fase hanya saat encounter boss. Telegraph memakai bentuk, gerak, dan ikon selain warna. Menu, keranjang, kasir, hasil, dan error loading dapat digunakan dengan keyboard, focus trap, focus return, label tombol, serta teks Rupiah yang terbaca. Menu menyediakan volume terpisah, mute, sensitivitas mouse, dan reduced motion. Audio aktif setelah gesture pengguna. Aset placeholder ditandai di menu dan laporan build.
