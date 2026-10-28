# Rancangan level 1–30

Status: spesifikasi konfigurasi, bukan 30 komponen atau level yang sudah dibuat. Hanya level 1 diaktifkan saat Phase 2.

## Kontrak konfigurasi

Setiap level memuat `id`, `chapter`, `environmentId`, `enemyComposition`, `enemySpawns`, `obstacles`, `bossId`, `shoppingList`, `budget`, `timerSeconds`, `difficultyMultiplier`, `reward`, dan `unlockRequirements`. Catalog dan preset diekspansi menjadi data biasa sebelum validasi; tidak ada logic per-level dalam JSX.

Contoh level 1 setelah ekspansi; ID produk sesuai [design.md](design.md):

```js
const level1 = {
  id: 1,
  chapter: 1,
  environmentId: 'desa-a',
  enemyComposition: [{ type: 'melee', count: 1 }],
  enemySpawns: [{ id: 'l1-m1', type: 'melee', wave: 1, position: [0, 0, 12] }],
  obstacles: [{ id: 'fence-left', position: [-4, 0, 10], size: [1, 1, 4] }],
  bossId: null,
  shoppingList: [{ productId: 'BR', quantity: 1 }],
  budget: 25000,
  timerSeconds: 300,
  difficultyMultiplier: 1,
  reward: { exp: 120 },
  unlockRequirements: { completedLevelIds: [] },
};
```

World memakai Y-up, meter, dan posisi spawn adalah titik lantai; controller menambahkan setengah tinggi capsule. Rumah `(0,0,0)`, arena sekitar `(0,0,16)`, pintu `(0,0,28)`, rak `(0,0,33)`, kasir `(3,0,35)` pada preset A. Layout B/C menggunakan titik interaksi bernama yang sama dengan posisi berbeda; bukan menyalin controller.

## Preset environment dan spawn

| ID | Geometri dan jalur | Spawn berurutan pada arena lokal, wave otomatis |
|---|---|---|
| desa-a | Rumah teras, jalan lurus, arena 14x14 m, KOPDES kecil | S1 `(0,0,-4)`, S2 `(-4,0,0)`, S3 `(4,0,0)` |
| desa-b | Jalan pasar membelok, arena 18x18 m, KOPDES dua lorong | S1 `(0,0,-5)`, S2 `(-5,0,0)`, S3 `(5,0,0)`, S4 `(0,0,5)` |
| desa-c | Alun-alun 24x24 m, KOPDES tiga lorong | S1 `(0,0,-7)`, S2 `(-7,0,0)`, S3 `(7,0,0)`, S4 `(-5,0,5)`, S5 `(5,0,5)` |

Koordinat spawn tabel relatif pusat arena; contoh level 1 memakai pusat `(0,0,16)` sehingga S1 menjadi `(0,0,12)`. Titik boss adalah pusat arena; dua titik summon berada di sisi luar dengan akses menghindar tetap terbuka. Spawn divalidasi ulang terhadap pemain dan collider sebelum diaktifkan. Jika titik tidak aman, tunda dan pilih titik aman lain, jangan memaksa spawn.

Komposisi `2M+1F` berarti dua melee dan satu fast. Urutan jenis: melee, fast, elite; ID stabil `l{level}-{type}-{ordinal}`. Distribusikan ke slot spawn preset, sisanya wave berikutnya setelah slot tersedia. Cap aktif ditentukan chapter: 3/4/5 termasuk boss; level 1 khusus satu. Boss level mempunyai satu encounter boss, tanpa penjaga awal; summon dihitung dari pola boss, bukan musuh wajib terpisah.

Preset obstacle: `O0` pagar sisi tutorial, `O1` peti pinggir, `O2` gerobak menyisakan dua jalur, `O3` zigzag pagar, `O4` lapak pasar, `O5` barikade rendah, `O6` kombinasi peti/lapak. Semua statis dan solid; tanpa motor bergerak pada slice. Setiap preset menyisakan jalur minimal 2 meter dan spawn bebas collider. Boss memakai `OA` arena tengah kosong, pembatas di tepi, serta ruang aman di luar radius serangan. Tidak ada obstacle acak yang memblokir rak, kasir, atau pintu.

## Aturan bersama seluruh level

- `chapter = ceil(id / 10)`. Boss hanya 10/Lilbah, 20/Kabdy, 30/Wowo; selain itu `bossId: null`.
- `difficultyMultiplier = 1 + 0.035 * (id - 1)`, dibulatkan empat desimal. HP musuh = round(HP dasar * multiplier), damage = round(damage dasar * (1 + 0.2 * (multiplier - 1))). Speed, windup, recovery, cooldown, dan harga tidak ikut dikali.
- `reward.exp = 100 + 20 * id + (bossId ? 300 : 0)`; bonus bintang di design. Tidak ada uang yang dibawa antarlevel: budget adalah uang titipan misi.
- `unlockRequirements.completedLevelIds` kosong untuk level 1; selain itu `[id - 1]`. Replay level terbuka tidak mencabut hasil terbaik.
- Timer dimulai saat misi diterima, meliputi jalan/combat/belanja, berhenti saat pause/loading/dialog briefing dan checkout sah. Dialog keranjang saat bermain tidak menghentikan timer; panel pause terpisah.
- Semua barang wajib tersedia minimal sesuai quantity misi; stok katalog cukup untuk seluruh daftar di bawah. Harga tetap dalam satu run. Budget selalu >= requiredCost.
- Chapter 1 mengajari dasar, chapter 2 menguji jarak dan keranjang, chapter 3 menguji komposisi dan disiplin belanja. Harga tidak naik acak hanya untuk menyulitkan.

## Tiga chapter

M = Melee, F = Fast, E = Elite. `BR2` berarti dua kemasan beras 1 kg; bukan satu produk beras 2 kg. Budget dan biaya wajib dalam Rupiah, timer dalam detik. Kolom biaya wajib memungkinkan pengecekan feasibility sebelum implementasi.

| Level | Environment | Encounter | Obstacle | Daftar wajib | Biaya wajib | Budget | Timer | Fokus |
|---:|---|---|---|---|---:|---:|---:|---|
| 1 | desa-a | 1M | O0 | BR1 | 14000 | 25000 | 300 | Satu alur playable |
| 2 | desa-a | 1M | O1 | BR2, MY1 | 46000 | 60000 | 300 | Quantity dan budget |
| 3 | desa-a | 2M | O1 | BR2, MY1, GU1 | 63000 | 80000 | 330 | Dua musuh antre |
| 4 | desa-a | 1M+1F | O2 | BR2, TL1, MI3 | 52000 | 65000 | 330 | Fast dan dash |
| 5 | desa-a | 2M+1F | O3 | BR3, MY1, GU1 | 77000 | 90000 | 360 | Dua stance |
| 6 | desa-a | 2F | O2 | BR2, MY1, TL1, MI4 | 73000 | 85000 | 330 | Kurungan dan recovery |
| 7 | desa-a | 2M+1F | O4 | BR3, MY1, GU1, SU1 | 96000 | 110000 | 360 | Rak berbeda |
| 8 | desa-a | 1M+1E | O5 | BR3, MY2, TL1 | 93000 | 105000 | 360 | Elite diperkenalkan |
| 9 | desa-a | 2M+1F+1E | O6 | BR3, MY1, GU1, TL1, MI4 | 104000 | 120000 | 390 | Wave, cap tiga |
| 10 | desa-a | Lilbah | OA | BR3, MY2, GU1, TL1, SU1 | 129000 | 145000 | 480 | Boss dua fase, lalu belanja |
| 11 | desa-b | 2M+2F | O1 | BR3, MY2, GU1, SB1 | 101000 | 115000 | 360 | Jalur pasar |
| 12 | desa-b | 1M+2F+1E | O2 | BR3, MY1, TL2, MI5 | 105000 | 120000 | 360 | Quantity kemasan |
| 13 | desa-b | 2M+1F+1E | O3 | BR4, MY2, GU1 | 109000 | 120000 | 360 | Margin budget kecil |
| 14 | desa-b | 3F+1E | O4 | BR3, MY2, SU2 | 116000 | 130000 | 360 | Hindari overbuy |
| 15 | desa-b | 2M+2E | O5 | BR4, GU2, TL2 | 120000 | 135000 | 390 | Ultimate pada grup |
| 16 | desa-b | 2M+2F+1E | O6 | BR3, MY2, GU1, TL1, MI6 | 128000 | 140000 | 390 | Wave campuran |
| 17 | desa-b | 2F+2E | O3 | BR4, MY2, SU1, SB2 | 123000 | 135000 | 390 | Resistance stun |
| 18 | desa-b | 1M+3F+1E | O4 | BR4, GU2, TL2, TE2 | 130000 | 145000 | 390 | Barang ekstra menggoda |
| 19 | desa-b | 2M+2F+2E | O6 | BR4, MY2, GU1, TL2, MI6 | 157000 | 170000 | 420 | Enam musuh, cap empat |
| 20 | desa-b | Kabdy | OA | BR4, MY2, GU2, TL2, SU1 | 175000 | 190000 | 540 | Combo beruntun, lalu belanja |
| 21 | desa-c | 2M+2F+1E | O2 | BR4, MY2, GU1, TL2, SB2 | 151000 | 165000 | 390 | Arena lebar |
| 22 | desa-c | 3F+2E | O3 | BR4, MY2, GU2, MI8 | 150000 | 160000 | 390 | Budget ketat |
| 23 | desa-c | 2M+1F+3E | O4 | BR5, MY2, TL2, SU1 | 155000 | 170000 | 420 | Posisi melawan elite |
| 24 | desa-c | 2M+3F+1E | O5 | BR4, MY3, GU2, TE2 | 154000 | 165000 | 390 | Mengingat quantity |
| 25 | desa-c | 2F+3E | O6 | BR5, MY2, GU2, TL2 | 170000 | 180000 | 420 | Memilih punish |
| 26 | desa-c | 3M+2F+2E | O3 | BR5, MY2, GU1, TL2, MI8 | 177000 | 190000 | 420 | Tujuh musuh, cap lima |
| 27 | desa-c | 3F+3E | O4 | BR5, MY3, SU2, SB2 | 174000 | 185000 | 420 | Dua lorong belanja |
| 28 | desa-c | 2M+2F+3E | O5 | BR5, MY2, GU2, TL2, TE3 | 185000 | 195000 | 420 | Rute efisien |
| 29 | desa-c | 2M+3F+3E | O6 | BR6, MY3, GU2, TL2, MI8 | 226000 | 240000 | 450 | Delapan musuh bergelombang |
| 30 | desa-c | Wowo | OA | BR6, MY3, GU2, TL2, SU2, MI8 | 264000 | 280000 | 660 | Tiga fase, belanja, epilog |

Belanja setelah boss memakai stok dan katalog yang sama dengan level reguler. Boss mati tidak mengakhiri timer atau memberi level complete. Jika pemain gagal berbelanja setelah boss, checkpoint encounter clear mencegah keharusan mengulang boss kecuali memilih Ulang dari Awal.

## Validasi data dan playtest

Validator Phase 6 harus menolak ID duplikat/hilang, level selain 1–30, referensi environment/product/enemy/boss tidak dikenal, quantity pecahan/negatif, budget kurang, timer nonpositif, spawn tidak aman, reward negatif, cycle unlock, dan boss pada level yang salah. Uji selalu 30 konfigurasi setelah ekspansi preset, bukan hanya tiga contoh.

Hitung ulang `requiredCost` dari katalog dan cocokkan tabel. Pastikan quantity <= stok dan area telegraph punya jalur aman. Uji gate dengan wave tertunda dan minion boss. Mainkan level 1, 9, 10, 19, 20, 29, 30 lebih dahulu untuk mengkalibrasi durasi; angka timer baru boleh disebut seimbang setelah playtest. Level lain belum perlu diimplementasikan sebelum VS01–VS10 lulus.
