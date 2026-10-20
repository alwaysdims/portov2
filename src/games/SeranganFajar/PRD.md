# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# SERANGAN FAJAR: THE LAST STAND

**Versi:** 1.0.0
**Status:** Dokumen Perencanaan Pengembangan
**Genre:** Top-Down Survival Action / Bullet Heaven / Hero-Based Survival
**Platform:** Browser Desktop, Laptop, Tablet, dan Mobile
**Framework UI:** React.js + Vite
**Game Engine:** Phaser 3
**Bahasa UI:** Bahasa Indonesia dengan istilah game yang familiar
**Mode:** Single Player
**Penyimpanan:** Browser LocalStorage
**Backend:** Tidak diperlukan untuk versi awal

---

# 1. RINGKASAN PROYEK

## 1.1 Nama Game

**Serangan Fajar: The Last Stand**

## 1.2 Konsep Utama

Serangan Fajar: The Last Stand adalah game 2D top-down survival yang menggabungkan mekanik arena survival seperti Vampire Survivors dengan sistem kemampuan aktif yang terinspirasi dari game MOBA seperti Mobile Legends.

Pemain mengendalikan karakter utama bernama Wowo yang harus bertahan hidup dari gelombang musuh yang datang dari segala arah.

Berbeda dari game survival biasa yang sebagian besar mengandalkan serangan otomatis, game ini memiliki empat kemampuan tempur:

1. Basic Attack.
2. Skill 1.
3. Skill 2.
4. Ultimate.

Basic Attack menyerang secara otomatis, sedangkan Skill 1, Skill 2, dan Ultimate digunakan secara aktif oleh pemain.

Pemain harus mengatur posisi, menghindari musuh, mengelola Mana, memperhatikan cooldown, mengumpulkan Suara, menaikkan level, memilih upgrade, dan menentukan waktu yang tepat untuk menggunakan Ultimate.

Tema permainan menggunakan satire pemilu Indonesia yang bersifat fiktif dan humoris.

## 1.3 Elevator Pitch

> Bertahanlah di tengah kekacauan politik! Kumpulkan Suara, gunakan kemampuan tempur, tingkatkan kekuatan Wowo, dan hadapi gelombang musuh yang semakin brutal. Ketika keadaan semakin genting, lepaskan Ultimate Serangan Fajar dan buktikan siapa yang mampu bertahan paling lama.

## 1.4 Referensi Gameplay

Game ini mengambil inspirasi mekanik dari beberapa jenis permainan:

- Vampire Survivors: gelombang musuh, collectible, XP, dan perkembangan karakter selama permainan.
- Brotato: arena survival, banyak musuh, serta kombinasi kemampuan.
- 20 Minutes Till Dawn: combat aktif dan pengembangan build.
- Mobile Legends: Basic Attack, Skill 1, Skill 2, Ultimate, Mana, cooldown, dan identitas kemampuan karakter.

Referensi tersebut hanya digunakan untuk memahami mekanik. Aset, karakter, nama, dan desain final harus dibuat sendiri.

---

# 2. TUJUAN PROYEK

## 2.1 Tujuan Utama

Mengembangkan game browser yang:

- Memiliki gameplay survival yang seru dan dapat dimainkan berulang kali.
- Memiliki kontrol karakter yang responsif.
- Memiliki sistem combat aktif yang terasa seperti memainkan hero MOBA.
- Memiliki Basic Attack, Skill 1, Skill 2, dan Ultimate yang berbeda fungsi.
- Memiliki sistem Mana dan cooldown yang membutuhkan strategi.
- Memiliki sistem progression melalui XP dan upgrade.
- Memiliki musuh yang semakin sulit seiring waktu.
- Memiliki visual pixel art yang konsisten.
- Berjalan dengan baik di desktop maupun mobile.
- Tidak memerlukan backend untuk menjalankan permainan.
- Dapat diintegrasikan ke website portfolio yang sudah ada.

## 2.2 Prinsip Pengembangan

Urutan prioritas pengembangan:

1. **Stabilitas:** game tidak crash, hang, atau mengalami bug kritis.
2. **Gameplay:** kontrol, collision, damage, dan skill berfungsi dengan benar.
3. **Game balance:** pemain memiliki peluang bertahan tanpa membuat permainan terlalu mudah.
4. **Responsivitas:** game dapat dimainkan pada berbagai ukuran layar.
5. **Visual feedback:** serangan, damage, pickup, dan Ultimate terasa memuaskan.
6. **Performa:** jumlah musuh dan projectile tidak membuat game tersendat.
7. **Konten tambahan:** boss, power-up, variasi musuh, dan kosmetik.

Fitur tambahan tidak boleh mengorbankan stabilitas dan kualitas core gameplay.

---

# 3. TARGET PENGGUNA

## 3.1 Target Pemain

- Pemain yang menyukai game survival dan action.
- Pemain yang menyukai sistem skill ala MOBA.
- Pemain casual yang ingin bermain melalui browser.
- Pengunjung website portfolio yang ingin mencoba game interaktif.

## 3.2 Pengalaman yang Diinginkan

Pemain harus merasakan tiga hal:

**Pertama: kontrol yang responsif.**

Wowo harus langsung merespons input gerakan.

**Kedua: kemampuan yang memuaskan.**

Basic Attack terasa cepat, Skill 1 terasa agresif, Skill 2 memberikan kontrol area, dan Ultimate memberikan momen serangan besar.

**Ketiga: perkembangan yang terasa.**

Pada awal permainan, pemain relatif lemah. Setelah memperoleh XP dan memilih upgrade, karakter menjadi semakin kuat sehingga mampu menghadapi gelombang musuh yang lebih besar.

---

# 4. BATASAN SCOPE

## 4.1 Fitur Versi Pertama

Versi pertama wajib memiliki:

- Satu karakter playable: Wowo.
- Satu arena survival.
- Pergerakan karakter.
- Basic Attack otomatis.
- Skill 1 aktif.
- Skill 2 aktif.
- Ultimate berbasis Energy.
- HP dan damage.
- Mana dan regenerasi Mana.
- Cooldown kemampuan.
- Musuh yang muncul dari berbagai arah.
- XP berupa collectible Suara.
- Sistem level up.
- Pilihan upgrade.
- Sistem waktu survival.
- Scaling kesulitan.
- Game Over.
- Statistik hasil permainan.
- Leaderboard lokal.
- Penyimpanan high score.
- Efek suara dan visual dasar.
- Kontrol desktop dan mobile.
- Restart permainan.

## 4.2 Fitur Pengembangan Lanjutan

Fitur berikut dirancang agar dapat ditambahkan setelah core gameplay stabil:

- Hero tambahan.
- Variasi Ultimate.
- Enemy elite.
- Boss dengan beberapa fase.
- Power-up.
- Variasi arena.
- Sistem kosmetik.
- Shop kosmetik.
- Achievement.
- Quest.
- Mode permainan tambahan.

Fitur tersebut tidak boleh menunda penyelesaian core gameplay.

---

# 5. GAME DESIGN

## 5.1 Gameplay Loop

Alur utama permainan:

START
↓
Pemain masuk ke arena
↓
Musuh mulai muncul
↓
Wowo bergerak menghindari musuh
↓
Basic Attack menyerang otomatis
↓
Pemain menggunakan Skill 1 dan Skill 2
↓
Musuh mati dan menjatuhkan Suara
↓
Pemain mengumpulkan Suara
↓
XP bertambah
↓
Level Up
↓
Pemain memilih upgrade
↓
Kemampuan karakter semakin kuat
↓
Ultimate digunakan ketika Energy penuh
↓
Musuh semakin banyak dan kuat
↓
Elite atau boss muncul sesuai perkembangan permainan
↓
HP habis
↓
Game Over
↓
Hasil permainan disimpan
↓
Leaderboard ditampilkan
↓
Pemain dapat bermain kembali

## 5.2 Perspektif Kamera

Game menggunakan perspektif 2D top-down.

Karakter dilihat dari atas atau sudut top-down 3/4 yang konsisten dengan aset.

Kamera mengikuti karakter utama.

Ketentuan:

- Wowo menjadi fokus utama.
- Kamera bergerak mengikuti pemain.
- Arena tidak harus dibatasi ukuran layar.
- Musuh dapat muncul dari luar area pandang.
- Collectible dapat tersebar di seluruh arena.
- UI tidak ikut bergerak bersama dunia game.
- Efek visual tidak boleh menghalangi pemain melihat ancaman penting.

## 5.3 Durasi Permainan

Game menggunakan survival tanpa batas waktu tetap.

Pemain bertahan selama mungkin hingga HP habis.

Target balancing awal:

- 0–1 menit: fase pengenalan.
- 1–3 menit: jumlah musuh mulai meningkat.
- 3–5 menit: variasi musuh dan elite mulai diperkenalkan.
- 5 menit ke atas: tekanan survival meningkat.
- Durasi selanjutnya bergantung pada kemampuan pemain dan build.

Angka tersebut adalah target balancing awal, bukan batas teknis.

---

# 6. KARAKTER UTAMA: WOWO

## 6.1 Identitas

Nama: Wowo

Peran: Survival Fighter

Gaya bermain: Seimbang, dengan kemampuan menyerang dan mengendalikan kerumunan musuh.

## 6.2 Statistik Awal

Statistik berikut menjadi baseline awal yang dapat disesuaikan saat playtesting.

| Statistik                  |     Nilai Awal |
| -------------------------- | -------------: |
| Max HP                     |          1.000 |
| HP awal                    |          1.000 |
| Max Mana                   |            100 |
| Mana awal                  |            100 |
| Mana Regen                 |        5/detik |
| Movement Speed             | 220 unit/detik |
| Basic Attack Damage        |             25 |
| Basic Attack Interval      |      1,2 detik |
| Basic Attack Range         |       300 unit |
| Critical Chance            |             5% |
| Critical Damage Multiplier |           1,5x |
| Damage Reduction           |             0% |

Statistik harus disimpan dalam konfigurasi karakter, bukan disebarkan sebagai angka hardcoded di berbagai file.

## 6.3 Animasi Wowo

Aset karakter idealnya menyediakan:

- Idle.
- Walk Up.
- Walk Down.
- Walk Left.
- Walk Right.
- Basic Attack.
- Skill 1 Cast.
- Skill 2 Cast.
- Ultimate Cast.
- Hurt.
- Death.

Jika animasi arah belum lengkap, gunakan animasi yang tersedia dengan cara yang konsisten.

Jangan membuat animasi placeholder yang tidak memiliki file aset hanya untuk memenuhi nama animasi.

## 6.4 Aturan Gerakan

- Wowo bergerak menggunakan WASD atau tombol arah.
- Input diagonal harus dinormalisasi agar tidak lebih cepat daripada gerakan horizontal.
- Karakter tidak boleh menembus objek yang memang memiliki collision.
- Gerakan tidak boleh terpengaruh secara tidak sengaja oleh FPS.
- Saat Game Over, input gameplay dihentikan.
- Animasi kematian boleh tetap berjalan setelah kontrol dinonaktifkan.

---

# 7. SISTEM COMBAT

Combat merupakan bagian paling penting dalam game.

Empat kemampuan Wowo harus mempunyai perbedaan fungsi, animasi, efek, damage, dan aturan penggunaan.

## 7.1 BASIC ATTACK — SURAT SUARA

### Konsep

Wowo secara otomatis meluncurkan satu projectile berbentuk surat suara ke musuh terdekat.

Basic Attack merupakan sumber damage utama yang selalu tersedia selama Wowo masih hidup.

### Mekanik

1. Sistem mencari musuh yang masih hidup dan berada dalam attack range.
2. Sistem memilih target yang valid.
3. Wowo meluncurkan projectile menuju target.
4. Projectile memberikan damage saat collision.
5. Jika projectile tidak mengenai target, projectile dibersihkan ketika melewati batas jarak atau masa hidupnya.
6. Setelah attack interval selesai, serangan berikutnya dapat dilakukan.
7. Serangan berhenti ketika tidak ada target valid dalam jangkauan.
8. Basic Attack tidak mengonsumsi Mana.

### Statistik Awal

| Statistik       |     Nilai |
| --------------- | --------: |
| Damage          |        25 |
| Attack Interval | 1,2 detik |
| Range           |       300 |
| Projectile awal |         1 |
| Mana Cost       |         0 |

### Upgrade Basic Attack

Basic Attack dapat ditingkatkan melalui:

- Damage.
- Attack Speed.
- Projectile Count.
- Projectile Speed.
- Critical Chance.
- Critical Damage.
- Projectile Pierce.
- Range.

### Persyaratan

- Basic Attack tidak boleh tertukar dengan Skill 1.
- Sistem target harus mengabaikan musuh yang sudah mati.
- Serangan tidak boleh menghasilkan projectile tanpa batas.
- Attack interval harus mengikuti cooldown internal.
- Basic Attack harus tetap bekerja ketika Skill 1 dan Skill 2 sedang cooldown.
- Basic Attack tidak boleh mengurangi Mana.

---

# 8. SKILL 1 — SERANGAN AMPLOP

## 8.1 Konsep

Wowo melempar beberapa amplop ke arah musuh.

Skill ini berfungsi sebagai serangan ofensif cepat untuk menghasilkan burst damage.

## 8.2 Mekanik

- Menggunakan Mana.
- Memiliki cooldown.
- Menembakkan beberapa projectile.
- Dapat menyerang lebih dari satu musuh.
- Bisa mendapatkan upgrade projectile, damage, dan penetrasi.

## 8.3 Statistik Awal

| Statistik             |                                             Nilai |
| --------------------- | ------------------------------------------------: |
| Damage per Projectile |                                                80 |
| Projectile Count      |                                                 3 |
| Mana Cost             |                                                20 |
| Cooldown              |                                           5 detik |
| Projectile Pierce     | 1 target tambahan, jika implementasinya mendukung |
| Cast Animation        |                                               Ada |
| Impact Effect         |                                               Ada |

Nilai penetrasi harus didefinisikan dengan jelas. Jika angka 1 berarti dapat menembus satu target tambahan, projectile dapat mengenai maksimal dua target sebelum hilang.

## 8.4 Arah Serangan

Jika tersedia target valid:

- Sistem menentukan arah ke target.
- Projectile diluncurkan ke arah target.
- Beberapa projectile dapat menyebar dengan sudut yang berbeda.

Jika tidak ada target valid:

- Skill tetap dapat digunakan hanya jika desain mengizinkan arah bebas.
- Jika arah bebas belum tersedia, skill tidak digunakan dan Mana tidak berkurang.

Untuk versi awal, disarankan Skill 1 hanya dapat digunakan ketika ada target valid.

## 8.5 Upgrade Skill 1

| Level | Contoh Perubahan                                        |
| ----- | ------------------------------------------------------- |
| Lv. 1 | Tiga amplop                                             |
| Lv. 2 | Damage meningkat                                        |
| Lv. 3 | Projectile tambahan                                     |
| Lv. 4 | Penetrasi meningkat                                     |
| Lv. 5 | Projectile dapat memantul atau memberikan efek tambahan |

Upgrade merupakan contoh rancangan awal dan dapat diseimbangkan melalui playtesting.

---

# 9. SKILL 2 — GELOMBANG KAMPANYE

## 9.1 Konsep

Wowo melepaskan gelombang energi berbentuk lingkaran yang memberikan damage dan mendorong musuh menjauh.

Skill ini digunakan ketika Wowo dikepung.

## 9.2 Mekanik

- Mengonsumsi Mana.
- Memiliki cooldown.
- Menyerang musuh di dalam radius.
- Memberikan knockback.
- Tidak memerlukan target tunggal.
- Menghasilkan efek lingkaran di sekitar Wowo.

## 9.3 Statistik Awal

| Statistik      |                              Nilai |
| -------------- | ---------------------------------: |
| Damage         |                                150 |
| Radius         |                           180 unit |
| Mana Cost      |                                 35 |
| Cooldown       |                            8 detik |
| Knockback      | 250 unit/detik sebagai target awal |
| Damage Type    |                                AoE |
| Cast Animation |                                Ada |

Knockback dapat diimplementasikan menggunakan kecepatan dorong dan durasi. Nilai final perlu disesuaikan agar tidak membuat musuh terpental secara tidak wajar.

## 9.4 Urutan Efek

1. Wowo memainkan animasi cast.
2. Lingkaran energi muncul.
3. Radius serangan berkembang.
4. Musuh dalam radius menerima damage.
5. Musuh terdorong menjauh.
6. Efek menghilang.

Damage harus diberikan sesuai aturan satu kali per cast, kecuali desain skill nantinya diubah menjadi damage berkala.

## 9.5 Upgrade Skill 2

- Radius lebih besar.
- Damage meningkat.
- Knockback lebih kuat.
- Cooldown berkurang.
- Efek slow.
- Damage berkala untuk versi upgrade tertentu.

---

# 10. ULTIMATE — SERANGAN FAJAR

## 10.1 Konsep

Ultimate merupakan kemampuan terkuat Wowo.

Wowo mengumpulkan energi, lalu melepaskan gelombang cahaya emas yang menyerang musuh dalam area besar.

Ultimate harus terasa berbeda dari Skill 2, baik dari skala efek maupun kekuatan serangan.

## 10.2 Sistem Ultimate Energy

Ultimate tidak menggunakan Mana seperti Skill 1 dan Skill 2.

Ultimate menggunakan resource tersendiri bernama Fajar Energy.

| Properti          | Aturan                                      |
| ----------------- | ------------------------------------------- |
| Maximum Energy    | 100                                         |
| Initial Energy    | 0                                           |
| Energy Gain       | Dari combat, kill, dan collectible tertentu |
| Minimum Energy    | 0                                           |
| Maximum Energy    | 100                                         |
| Mana Cost         | 0                                           |
| Penggunaan        | Energy harus penuh                          |
| Setelah Digunakan | Energy kembali ke 0                         |

Ultimate tidak perlu memiliki cooldown panjang terpisah pada versi awal karena Energy sudah membatasi frekuensi penggunaan.

Cooldown lockout pendek boleh diterapkan untuk mencegah input berulang ketika animasi Ultimate berlangsung.

## 10.3 Sumber Fajar Energy

Nilai awal yang dapat digunakan:

| Aktivitas                   | Energy |
| --------------------------- | -----: |
| Basic Attack mengenai musuh |   +0,5 |
| Musuh mati                  |     +2 |
| Elite mati                  |    +10 |
| Mengambil item Fajar Energy |    +15 |

Semua nilai adalah baseline untuk balancing.

Sumber Energy harus jelas. Jangan memberikan Energy berkali-kali karena satu musuh menerima damage dari beberapa projectile jika desain tidak menginginkannya.

## 10.4 Statistik Ultimate

| Statistik       |                           Nilai Awal |
| --------------- | -----------------------------------: |
| Damage          |                                  500 |
| Radius          |                             500 unit |
| Mana Cost       |                                    0 |
| Energy Required |                                  100 |
| Invulnerability | Maksimal 1 detik sebagai target awal |
| Cooldown        |                   Berdasarkan Energy |
| Visual          |                  Ledakan cahaya emas |

## 10.5 Urutan Ultimate

1. Pemain menekan tombol Ultimate.
2. Sistem memvalidasi Energy.
3. Jika Energy kurang dari 100, Ultimate tidak aktif.
4. Jika Energy penuh, gameplay memasuki fase cast.
5. Wowo memainkan animasi charging.
6. Efek cahaya muncul.
7. Gelombang serangan dilepaskan.
8. Musuh dalam radius menerima damage.
9. Efek knockback diterapkan jika diaktifkan.
10. Energy dikembalikan ke 0.
11. Gameplay dilanjutkan setelah fase cast selesai.

Jika Wowo mati ketika Ultimate belum dilepaskan, sistem harus mengikuti satu aturan yang konsisten. Untuk versi awal, kematian membatalkan cast yang belum menghasilkan damage.

## 10.6 Upgrade Ultimate

- Damage lebih tinggi.
- Radius lebih luas.
- Knockback lebih kuat.
- Tambahan projectile atau gelombang energi.
- Pengisian Energy lebih cepat.
- Pengurangan Energy yang diperlukan melalui upgrade khusus, jika balancing mendukung.

---

# 11. SISTEM MANA

## 11.1 Aturan Mana

Mana digunakan oleh Skill 1 dan Skill 2.

Mana tidak digunakan oleh Basic Attack maupun Ultimate.

| Properti     | Nilai Awal |
| ------------ | ---------: |
| Maximum Mana |        100 |
| Initial Mana |        100 |
| Regeneration |    5/detik |
| Skill 1 Cost |         20 |
| Skill 2 Cost |         35 |

Mana tidak boleh melebihi nilai maksimum.

## 11.2 Formula Regenerasi

Mana bertambah berdasarkan waktu permainan:

Mana Baru = min(Max Mana, Mana Saat Ini + Mana Regen × Delta Time)

Contoh:

Mana saat ini: 50
Mana Regen: 5 per detik
Waktu berlalu: 2 detik

Mana baru = min(100, 50 + 5 × 2)

Hasil: 60 Mana.

## 11.3 Validasi Penggunaan

Skill hanya boleh digunakan jika:

- Wowo masih hidup.
- Game sedang berjalan.
- Skill tidak sedang cooldown.
- Mana mencukupi.
- Tidak ada status yang melarang penggunaan skill.

Jika Mana tidak cukup:

- Skill tidak dijalankan.
- Mana tidak berubah.
- Cooldown tidak dimulai.
- Berikan feedback singkat kepada pemain.

---

# 12. SISTEM COOLDOWN

## 12.1 Aturan

Skill 1 dan Skill 2 mempunyai cooldown masing-masing.

Cooldown harus berjalan secara independen.

Contoh:

- Skill 1 sedang cooldown selama 5 detik.
- Skill 2 tetap dapat digunakan jika Mana mencukupi dan cooldown-nya selesai.
- Ultimate tetap dapat digunakan jika Energy penuh.

## 12.2 UI Cooldown

Tiap tombol skill menampilkan:

- Ikon skill.
- Overlay gelap ketika cooldown.
- Angka countdown.
- Tampilan READY ketika siap.
- Indikator Mana yang tidak mencukupi.
- Efek visual saat skill siap digunakan.

Ultimate menampilkan persentase Energy.

Ketika Energy penuh:

- Ikon Ultimate menyala.
- Terdapat animasi glow ringan.
- Tombol menjadi aktif.

## 12.3 Cooldown Reduction

Cooldown Reduction dapat ditambahkan melalui upgrade.

Batas awal yang disarankan: 40%.

Formula:

Cooldown Akhir = Cooldown Dasar × (1 - CDR)

Contoh:

Cooldown dasar = 5 detik
CDR = 20%

Cooldown akhir = 5 × (1 - 0,2) = 4 detik.

Semua skill harus menggunakan formula yang konsisten.

---

# 13. SISTEM ENEMY

## 13.1 Jenis Musuh

Versi pertama memiliki tiga musuh dasar.

### A. Tim Amplop

Peran: Basic Melee Enemy.

Karakteristik:

- HP rendah.
- Damage rendah.
- Bergerak menuju Wowo.
- Jumlah spawn relatif banyak.

### B. Bot Kampanye

Peran: Tank Enemy.

Karakteristik:

- HP lebih tinggi.
- Movement lebih lambat.
- Damage sedang.
- Memerlukan lebih banyak serangan untuk dikalahkan.

### C. Penyebar Hoaks

Peran: Ranged Enemy.

Karakteristik:

- Berusaha menjaga jarak.
- Menembakkan projectile.
- HP relatif rendah.
- Menambah tekanan terhadap pemain.

Setelah ketiganya stabil, tambahkan:

- Massa Kampanye: musuh cepat dalam kelompok.
- Pengawal Politik: musuh dengan HP tinggi.
- Bos Amplop: elite.
- Kandidat Fiktif: boss utama.

## 13.2 Enemy AI

AI dasar:

1. Enemy muncul di posisi spawn yang valid.
2. Enemy mencari posisi Wowo.
3. Enemy bergerak menuju atau mengatur jarak terhadap Wowo sesuai tipe.
4. Enemy menyerang ketika memenuhi kondisi serang.
5. Enemy menerima damage.
6. Jika HP habis, enemy masuk ke state death.
7. Enemy menjatuhkan collectible sesuai peluang.
8. Entity dibersihkan setelah tidak lagi dibutuhkan.

## 13.3 Spawn System

Musuh dapat muncul dari berbagai arah.

Spawn harus:

- Menghindari spawn tepat di atas pemain.
- Memperhatikan batas area permainan.
- Membatasi jumlah musuh aktif.
- Menggunakan konfigurasi spawn berdasarkan waktu.
- Menghindari lonjakan jumlah musuh yang tidak terkendali.

Jumlah musuh maksimum harus dapat dikonfigurasi.

---

# 14. SISTEM DAMAGE DAN HP

## 14.1 HP Pemain

Wowo mempunyai HP maksimum dan HP saat ini.

Ketika menerima damage:

1. HP dikurangi.
2. Animasi hurt dimainkan.
3. Efek visual damage muncul.
4. Knockback diterapkan jika sesuai.
5. Jika HP mencapai 0, Game Over dimulai.

HP tidak boleh menjadi negatif.

## 14.2 Invulnerability Frames

Setelah menerima damage, Wowo dapat memperoleh invulnerability singkat.

Target awal: 0,7 detik.

Selama periode tersebut:

- Damage berulang dari kontak yang sama tidak diterapkan.
- Wowo dapat berkedip.
- Sistem collision tetap bekerja sesuai kebutuhan.
- Status invulnerability tidak boleh aktif tanpa batas.

Ultimate dapat memiliki invulnerability tambahan jika ditentukan oleh konfigurasi.

## 14.3 Damage Feedback

Saat Wowo terkena serangan:

- HP bar berubah.
- Wowo berkedip.
- Screen shake ringan.
- SFX damage dimainkan.
- Feedback tidak boleh membuat pemain kehilangan kendali terlalu lama.

---

# 15. COLLECTIBLE

## 15.1 Suara

Surat Suara berfungsi sebagai XP.

Ketika enemy mati:

- Enemy menjatuhkan Suara berdasarkan konfigurasi.
- Suara berada di arena.
- Pemain dapat mengambilnya dengan mendekati item.
- XP bertambah ketika item diambil.
- Item dihapus setelah pickup.

## 15.2 Dana

Dana berfungsi sebagai currency.

Pada versi awal, Dana dapat dikumpulkan untuk statistik dan sistem kosmetik masa depan.

Dana tidak digunakan sebagai pengganti XP.

## 15.3 Health Pickup

Memulihkan sebagian HP.

Health Pickup tidak boleh meningkatkan HP melebihi maksimum.

## 15.4 Mana Pickup

Memulihkan Mana.

Jumlah pemulihan harus mengikuti konfigurasi.

## 15.5 Fajar Energy Pickup

Menambah Ultimate Energy.

Energy tidak boleh melebihi 100.

## 15.6 Pickup Feedback

Ketika item diambil:

- Item menghilang.
- Efek pickup muncul.
- SFX diputar.
- Angka resource diperbarui.
- XP bar atau Energy bar diperbarui.

---

# 16. LEVEL DAN XP

## 16.1 Level Up

Setiap kali XP mencapai ambang level berikutnya:

1. XP dikurangi sesuai kebutuhan progression.
2. Level bertambah.
3. Permainan dijeda.
4. Upgrade panel ditampilkan.
5. Pemain memilih satu upgrade.
6. Upgrade diterapkan.
7. Panel ditutup.
8. Permainan dilanjutkan.

## 16.2 XP Curve

XP yang dibutuhkan harus meningkat seiring level.

Gunakan formula atau tabel konfigurasi, bukan angka acak tanpa batas.

Contoh formula awal:

XP Required = 100 + (Level - 1) × 50

Contoh:

| Level | XP yang Dibutuhkan |
| ----- | -----------------: |
| 1 → 2 |                100 |
| 2 → 3 |                150 |
| 3 → 4 |                200 |
| 4 → 5 |                250 |
| 5 → 6 |                300 |

Formula dapat disesuaikan setelah pengujian.

## 16.3 Upgrade Selection

Ketika naik level, tampilkan tiga pilihan upgrade yang dipilih dari pool yang valid.

Contoh:

- Basic Attack Damage +15%.
- Attack Speed +10%.
- Skill 1 Damage +20%.
- Skill 2 Radius +15%.
- Maximum HP +100.
- Mana Regen +1/detik.
- Cooldown Reduction +5%.
- Ultimate Energy Gain +10%.

Aturan:

- Upgrade tidak boleh muncul jika sudah mencapai batas maksimum.
- Pilihan tidak boleh menampilkan upgrade yang tidak relevan.
- Efek upgrade harus benar-benar diterapkan ke gameplay.
- Upgrade tidak boleh menghasilkan nilai stat tidak valid.

---

# 17. DIFFICULTY SCALING

Kesulitan meningkat berdasarkan waktu survival.

Parameter yang dapat berubah:

- Spawn rate.
- Jumlah musuh.
- HP enemy.
- Damage enemy.
- Movement speed enemy.
- Peluang enemy elite.
- Variasi musuh.

Kesulitan tidak boleh meningkat terlalu cepat.

Batas harus diterapkan pada setiap parameter.

Contoh kebijakan:

- Spawn rate mempunyai nilai minimum interval.
- Enemy HP mempunyai multiplier maksimum.
- Enemy speed memiliki batas maksimum.
- Jumlah musuh aktif dibatasi.
- Musuh ranged tidak boleh menembakkan projectile dalam jumlah tak terbatas.

Tujuannya membuat permainan semakin menantang tanpa menjadi tidak adil.

---

# 18. LEADERBOARD LOKAL

## 18.1 Penyimpanan

Leaderboard disimpan menggunakan LocalStorage browser.

Key:

seranganFajarLeaderboard

High score disimpan menggunakan key terpisah:

seranganFajarHighScore

Tidak diperlukan backend, database, akun, atau API.

## 18.2 Data Hasil Permainan

Setiap permainan yang selesai dapat menyimpan:

- Score.
- Survival Time.
- Level.
- Total Suara.
- Total Dana.
- Jumlah Kill.
- Tanggal permainan.

Contoh struktur data:

{
"score": 2450,
"survivalTime": 420,
"level": 18,
"votesCollected": 125,
"fundsCollected": 25000,
"kills": 320,
"date": "2026-10-18T12:00:00.000Z"
}

Tanggal tersebut hanya contoh format.

## 18.3 Aturan Leaderboard

- Tampilkan maksimal 10 hasil terbaik.
- Urutkan berdasarkan score tertinggi.
- Jika score sama, prioritaskan survival time yang lebih lama.
- High score tidak boleh hilang ketika game di-restart.
- Restart permainan tidak boleh menghapus leaderboard.
- Jika LocalStorage gagal dibaca atau ditulis, gunakan fallback memori selama sesi berjalan.
- Data rusak harus ditangani tanpa menyebabkan game crash.

Leaderboard bersifat lokal pada browser dan perangkat yang sama. Data tidak otomatis tersinkronisasi antarperangkat.

---

# 19. GAME OVER

Ketika HP mencapai 0:

1. Hentikan kontrol pemain.
2. Hentikan spawn enemy.
3. Hentikan Basic Attack.
4. Hentikan penggunaan skill.
5. Hentikan update damage gameplay.
6. Selesaikan animasi death jika memungkinkan.
7. Hitung statistik akhir.
8. Simpan hasil permainan.
9. Perbarui high score.
10. Tampilkan panel Game Over.

Informasi yang ditampilkan:

- GAME OVER.
- Score.
- Survival Time.
- Level.
- Total Suara.
- Total Dana.
- Jumlah Kill.
- Best Score.
- Leaderboard.
- Tombol Restart.
- Tombol kembali ke menu jika disediakan.

Tidak boleh ada damage baru setelah Game Over.

---

# 20. UI/UX

## 20.1 Main Menu

Menampilkan:

- Logo Serangan Fajar: The Last Stand.
- Tombol Play.
- Tombol Settings.
- Kontrol singkat.
- Informasi versi game jika diperlukan.

## 20.2 HUD

HUD menampilkan:

- Level.
- XP bar.
- HP bar.
- Mana bar.
- Ultimate Energy bar.
- Survival time.
- Score.
- Suara.
- Dana.
- Basic Attack.
- Skill 1.
- Skill 2.
- Ultimate.
- Pause.

HUD harus mudah dibaca ketika arena ramai.

## 20.3 Skill Bar

Urutan tombol:

[BASIC ATTACK] [SKILL 1] [SKILL 2] [ULTIMATE]

Basic Attack tetap merupakan kemampuan terpisah.

Pada desktop, Basic Attack otomatis berjalan sehingga tombolnya dapat digunakan sebagai indikator atau informasi serangan.

Jika nanti ditambahkan mode Basic Attack manual, mode tersebut harus menjadi perubahan desain yang disengaja, bukan perilaku default.

## 20.4 Level Up Panel

Menampilkan tiga kartu upgrade.

Setiap kartu berisi:

- Ikon.
- Nama upgrade.
- Deskripsi efek.
- Nilai perubahan.
- Level upgrade jika relevan.

## 20.5 Settings

Pengaturan awal:

- Volume Master.
- Volume SFX.
- Volume BGM.
- Toggle suara.
- Informasi kontrol.

---

# 21. ART DIRECTION

## 21.1 Visual Style

Target visual:

- 2D pixel art.
- Top-down atau top-down 3/4.
- Retro arcade.
- Warna kontras.
- Efek serangan jelas.
- Siluet karakter mudah dibaca.
- UI modern yang tidak bertabrakan dengan pixel art.

## 21.2 Palet Visual Kemampuan

| Kemampuan       | Warna Dominan                       |
| --------------- | ----------------------------------- |
| Basic Attack    | Putih, krem, merah                  |
| Skill 1         | Merah, oranye                       |
| Skill 2         | Biru, cyan, putih                   |
| Ultimate        | Emas, kuning, putih                 |
| HP              | Merah                               |
| Mana            | Biru                                |
| Ultimate Energy | Emas                                |
| XP/Suara        | Hijau atau putih dengan aksen warna |
| Dana            | Kuning atau emas                    |

## 21.3 Konsistensi Aset

Semua aset harus memiliki:

- Perspektif yang sama.
- Skala karakter yang konsisten.
- Pivot yang sesuai.
- Pixel density yang seragam.
- Background transparan untuk sprite.
- Grid spritesheet yang konsisten.
- Nama file yang jelas.

Jangan mencampurkan aset pixel art dengan ilustrasi realistis tanpa alasan desain yang kuat.

---

# 22. AUDIO DAN GAME FEEL

## 22.1 SFX

Efek suara yang dibutuhkan:

- Basic Attack.
- Skill 1.
- Skill 2.
- Ultimate charge.
- Ultimate release.
- Enemy hit.
- Enemy death.
- Player hurt.
- Collect Suara.
- Collect Dana.
- Mana pickup.
- Level Up.
- Game Over.
- UI click.

## 22.2 Background Music

BGM berupa musik retro action yang dapat diputar berulang.

BGM tidak boleh terlalu keras sehingga menutupi SFX.

## 22.3 Visual Feedback

Tambahkan:

- Damage number.
- Projectile trail.
- Hit flash.
- Particle.
- Knockback.
- Pickup sparkle.
- Level Up effect.
- Ultimate screen shake ringan.
- Cooldown ready animation.

Efek harus tetap ringan dan tidak menghalangi gameplay.

---

# 23. TEKNOLOGI

## 23.1 React + Vite

React digunakan untuk:

- Komponen UI.
- Main menu.
- HUD overlay jika menggunakan DOM.
- Settings.
- Upgrade cards jika menggunakan DOM.
- Game Over panel.
- Leaderboard.
- Lifecycle game container.

## 23.2 Phaser 3

Phaser digunakan untuk:

- Game loop.
- Input gameplay.
- Camera.
- Physics.
- Collision.
- Player.
- Enemy.
- Projectile.
- Skill.
- Collectible.
- Spawn system.
- Particle.
- World rendering.
- Animasi gameplay.

## 23.3 Prinsip Integrasi

Jangan menjalankan game loop melalui React state.

Hindari memperbarui React state setiap frame.

Gunakan event atau bridge terkontrol untuk mengirim data penting seperti:

- HP.
- Mana.
- Energy.
- Level.
- XP.
- Score.
- Cooldown.
- Game Over.

Perbarui UI hanya ketika data berubah atau melalui mekanisme yang tidak membebani rendering.

## 23.4 Penyimpanan

Gunakan LocalStorage untuk:

- High score.
- Leaderboard.
- Pengaturan audio.
- Data kosmetik jika fitur tersebut ditambahkan.

Jangan menyimpan seluruh state gameplay setiap frame ke LocalStorage.

---

# 24. STRUKTUR FOLDER PROYEK

## 24.1 Prinsip Struktur

Game dikembangkan secara modular.

Pisahkan:

- Game engine.
- Scene.
- Entities.
- Combat.
- Skills.
- Enemies.
- Collectibles.
- Progression.
- UI.
- Configuration.
- Assets.
- Utilities.
- Persistence.

Struktur ini dibuat untuk memudahkan pengembangan dan debugging.

## 24.2 Struktur Direktori

Struktur yang disarankan untuk game:

src/
└── games/
└── SeranganFajar/
├── index.js
├── SeranganFajar.jsx
├── config/
│   ├── gameConfig.js
│   ├── playerConfig.js
│   ├── skillConfig.js
│   ├── enemyConfig.js
│   ├── progressionConfig.js
│   ├── spawnConfig.js
│   ├── dropConfig.js
│   └── balanceConfig.js
│
├── game/
│   ├── createGame.js
│   ├── GameEvents.js
│   ├── GameBridge.js
│   └── scenes/
│       ├── BootScene.js
│       ├── PreloadScene.js
│       ├── MenuScene.js
│       ├── SurvivalScene.js
│       ├── UIScene.js
│       └── GameOverScene.js
│
├── entities/
│   ├── player/
│   │   ├── Wowo.js
│   │   ├── PlayerController.js
│   │   ├── PlayerStats.js
│   │   ├── PlayerMovement.js
│   │   ├── PlayerHealth.js
│   │   └── PlayerAnimation.js
│   │
│   ├── enemies/
│   │   ├── BaseEnemy.js
│   │   ├── EnvelopeEnemy.js
│   │   ├── CampaignBotEnemy.js
│   │   ├── HoaxRangedEnemy.js
│   │   ├── CrowdEnemy.js
│   │   ├── GuardEnemy.js
│   │   ├── EliteEnvelope.js
│   │   └── BossCandidate.js
│   │
│   └── projectiles/
│       ├── BaseProjectile.js
│       ├── VoteProjectile.js
│       ├── EnvelopeProjectile.js
│       └── EnemyProjectile.js
│
├── combat/
│   ├── CombatSystem.js
│   ├── TargetingSystem.js
│   ├── DamageSystem.js
│   ├── HitboxSystem.js
│   ├── KnockbackSystem.js
│   ├── CriticalSystem.js
│   └── ProjectileSystem.js
│
├── abilities/
│   ├── AbilityManager.js
│   ├── BasicAttack.js
│   ├── SkillBase.js
│   ├── Skill1Envelope.js
│   ├── Skill2CampaignWave.js
│   ├── UltimateSeranganFajar.js
│   ├── ManaSystem.js
│   ├── CooldownSystem.js
│   └── UltimateEnergySystem.js
│
├── progression/
│   ├── XPSystem.js
│   ├── LevelSystem.js
│   ├── UpgradeManager.js
│   ├── UpgradePool.js
│   ├── ScoreSystem.js
│   └── DifficultyManager.js
│
├── collectibles/
│   ├── BaseCollectible.js
│   ├── VoteCollectible.js
│   ├── FundsCollectible.js
│   ├── HealthPickup.js
│   ├── ManaPickup.js
│   └── FajarEnergyPickup.js
│
├── world/
│   ├── ArenaManager.js
│   ├── EnvironmentManager.js
│   ├── SpawnManager.js
│   ├── WaveManager.js
│   └── CameraManager.js
│
├── effects/
│   ├── EffectManager.js
│   ├── DamageNumbers.js
│   ├── HitEffects.js
│   ├── SkillEffects.js
│   ├── PickupEffects.js
│   └── ScreenEffects.js
│
├── audio/
│   ├── AudioManager.js
│   ├── soundConfig.js
│   └── musicConfig.js
│
├── ui/
│   ├── GameHUD.jsx
│   ├── HealthBar.jsx
│   ├── ManaBar.jsx
│   ├── UltimateBar.jsx
│   ├── XPBar.jsx
│   ├── SkillBar.jsx
│   ├── SkillButton.jsx
│   ├── UpgradePanel.jsx
│   ├── GameOverPanel.jsx
│   ├── MainMenu.jsx
│   ├── SettingsPanel.jsx
│   ├── LeaderboardPanel.jsx
│   ├── PausePanel.jsx
│   └── MobileControls.jsx
│
├── hooks/
│   ├── useGameInstance.js
│   ├── useGameEvents.js
│   └── useGameSettings.js
│
├── services/
│   ├── LeaderboardService.js
│   ├── StorageService.js
│   └── SettingsService.js
│
├── utils/
│   ├── math.js
│   ├── random.js
│   ├── collision.js
│   ├── time.js
│   └── cleanup.js
│
├── assets/
│   ├── sprites/
│   │   ├── player/
│   │   │   ├── wowo-idle.png
│   │   │   ├── wowo-walk.png
│   │   │   ├── wowo-basic-attack.png
│   │   │   ├── wowo-skill1.png
│   │   │   ├── wowo-skill2.png
│   │   │   ├── wowo-ultimate.png
│   │   │   ├── wowo-hurt.png
│   │   │   └── wowo-death.png
│   │   │
│   │   ├── enemies/
│   │   │   ├── enemy-amplop.png
│   │   │   ├── enemy-bot-kampanye.png
│   │   │   ├── enemy-hoaks.png
│   │   │   ├── enemy-massa.png
│   │   │   ├── enemy-pengawal.png
│   │   │   ├── elite-amplop.png
│   │   │   └── boss-kandidat.png
│   │   │
│   │   ├── projectiles/
│   │   │   ├── projectile-suara.png
│   │   │   ├── projectile-amplop.png
│   │   │   └── projectile-enemy.png
│   │   │
│   │   └── environment/
│   │       ├── grass-tile.png
│   │       ├── road-tile.png
│   │       ├── dirt-tile.png
│   │       ├── tree.png
│   │       ├── house.png
│   │       ├── fence.png
│   │       ├── tps.png
│   │       ├── baliho.png
│   │       ├── banner.png
│   │       └── posko.png
│   │
│   ├── effects/
│   │   ├── basic-attack-impact.png
│   │   ├── skill1-impact.png
│   │   ├── skill2-wave.png
│   │   ├── ultimate-charge.png
│   │   ├── ultimate-explosion.png
│   │   └── particle.png
│   │
│   ├── collectibles/
│   │   ├── suara.png
│   │   ├── dana.png
│   │   ├── health.png
│   │   ├── mana.png
│   │   └── fajar-energy.png
│   │
│   ├── ui/
│   │   ├── basic-attack-icon.png
│   │   ├── skill1-icon.png
│   │   ├── skill2-icon.png
│   │   ├── ultimate-icon.png
│   │   ├── hp-icon.png
│   │   ├── mana-icon.png
│   │   ├── energy-icon.png
│   │   ├── suara-icon.png
│   │   └── dana-icon.png
│   │
│   └── audio/
│       ├── bgm-survival.ogg
│       ├── sfx-basic-attack.ogg
│       ├── sfx-skill1.ogg
│       ├── sfx-skill2.ogg
│       ├── sfx-ultimate.ogg
│       ├── sfx-hit.ogg
│       ├── sfx-enemy-death.ogg
│       ├── sfx-pickup.ogg
│       ├── sfx-level-up.ogg
│       └── sfx-game-over.ogg
│
├── styles/
│   ├── game.css
│   ├── hud.css
│   ├── menus.css
│   └── mobile.css
│
└── README.md

Struktur ini merupakan target arsitektur, bukan instruksi untuk langsung membuat seluruh file kosong.

File harus dibuat ketika diperlukan oleh implementasi. Hindari membuat terlalu banyak abstraksi sebelum core gameplay bekerja.

---

# 25. TANGGUNG JAWAB FILE PENTING

## 25.1 SeranganFajar.jsx

Tanggung jawab:

- Menyediakan root container game.
- Menyiapkan mount point Phaser.
- Mengelola lifecycle instance.
- Menampilkan UI React.
- Membersihkan instance ketika komponen dilepas.

Tidak boleh menjalankan perhitungan collision atau AI enemy di React.

## 25.2 createGame.js

Tanggung jawab:

- Membuat konfigurasi Phaser.
- Menginisialisasi game.
- Mendaftarkan scene.
- Menyediakan instance untuk container.
- Menghindari pembuatan instance ganda.

## 25.3 SurvivalScene.js

Tanggung jawab:

- Menjalankan sesi permainan.
- Menginisialisasi arena.
- Mengatur player.
- Mengatur enemy.
- Mengatur projectile dan collectible.
- Menangani update gameplay.
- Mengatur Game Over.

Scene ini mengoordinasikan sistem gameplay, tetapi detail combat dan ability tetap berada di modul masing-masing.

## 25.4 Wowo.js

Tanggung jawab:

- Mengelola entity player.
- Menyimpan referensi ke statistik.
- Menyediakan metode movement.
- Menjalankan animasi.
- Menghubungkan player dengan AbilityManager.

## 25.5 BasicAttack.js

Tanggung jawab:

- Menentukan target valid.
- Menjalankan attack interval.
- Menghasilkan projectile.
- Menerapkan konfigurasi damage dan range.
- Memperbarui status serangan otomatis.

## 25.6 Skill1Envelope.js

Tanggung jawab:

- Memvalidasi penggunaan Skill 1.
- Memeriksa Mana dan cooldown.
- Menghasilkan projectile amplop.
- Menjalankan efek hit.
- Menerapkan upgrade Skill 1.

## 25.7 Skill2CampaignWave.js

Tanggung jawab:

- Memvalidasi penggunaan Skill 2.
- Membuat area serangan.
- Mendeteksi enemy dalam radius.
- Memberikan damage dan knockback.
- Mengatur efek visual.

## 25.8 UltimateSeranganFajar.js

Tanggung jawab:

- Memeriksa Energy.
- Memulai animasi Ultimate.
- Menghasilkan damage area.
- Mengatur invulnerability jika diaktifkan.
- Mengosongkan Energy setelah Ultimate digunakan.
- Menghentikan proses ketika game sudah Game Over.

## 25.9 ManaSystem.js

Tanggung jawab:

- Menyimpan Mana saat ini.
- Menyimpan Max Mana.
- Melakukan regenerasi.
- Memvalidasi konsumsi.
- Mengirim event ketika Mana berubah.

## 25.10 CooldownSystem.js

Tanggung jawab:

- Menyimpan cooldown masing-masing ability.
- Menghitung sisa cooldown.
- Menerapkan Cooldown Reduction.
- Memberi tahu UI ketika skill siap digunakan.

## 25.11 UltimateEnergySystem.js

Tanggung jawab:

- Menyimpan Energy.
- Menambah Energy dari event combat.
- Membatasi Energy antara 0–100.
- Mengirim event ketika Energy penuh.
- Mengosongkan Energy setelah Ultimate digunakan.

## 25.12 LeaderboardService.js

Tanggung jawab:

- Menyimpan hasil permainan.
- Mengambil leaderboard.
- Mengurutkan hasil.
- Membatasi hasil menjadi 10.
- Menangani data rusak.
- Menggunakan fallback jika LocalStorage gagal.

## 25.13 config/

Semua nilai balancing utama harus dapat diatur melalui konfigurasi.

Hindari menyimpan angka yang sama berulang kali di banyak file.

---

# 26. ASSET REQUIREMENTS

## 26.1 Asset Prioritas Pertama

Sebelum membuat seluruh aset, prioritaskan:

1. Wowo.
2. Basic Attack projectile.
3. Skill 1 projectile.
4. Skill 2 effect.
5. Ultimate effect.
6. Enemy dasar.
7. Collectible Suara.
8. Tileset rumput.
9. HP, Mana, dan Energy icon.
10. Skill icons.

Dengan aset tersebut, gameplay inti sudah bisa mulai dibuat.

## 26.2 Persyaratan Teknis Aset

- Format PNG untuk sprite.
- Transparansi untuk karakter dan efek.
- Grid spritesheet konsisten.
- Pivot karakter konsisten.
- Skala sprite seragam.
- Ukuran file wajar.
- Tidak ada watermark.
- Tidak ada teks acak hasil generasi AI.
- Nama file deskriptif.
- Animasi tidak memiliki frame yang berubah bentuk secara tidak sengaja.

## 26.3 Aset Placeholder

Jika aset final belum tersedia, gunakan placeholder sederhana.

Namun:

- Placeholder harus mudah diganti.
- Kode tidak boleh bergantung pada nama file yang belum ada.
- Missing asset harus menghasilkan error yang dapat dipahami.
- Placeholder tidak boleh dianggap sebagai aset final.

Jangan membuat file PNG palsu atau kosong untuk memenuhi daftar aset.

---

# 27. RESPONSIVE DAN KONTROL

## 27.1 Desktop

Gerakan:

- W / A / S / D.
- Arrow Keys.

Kemampuan:

- Q: Basic Attack toggle/indicator tidak diperlukan untuk serangan otomatis.
- E: Skill 1.
- R: Skill 2.
- F: Ultimate.

Catatan: pemetaan tombol ini merupakan usulan awal dan harus konsisten antara instruksi UI dan implementasi.

Rekomendasi kontrol final:

- Basic Attack: otomatis.
- Q: Skill 1.
- E: Skill 2.
- R: Ultimate.
- Esc: Pause.

Pemetaan keyboard harus disimpan pada satu konfigurasi agar mudah diubah.

## 27.2 Mobile

Kontrol:

- Virtual joystick di kiri.
- Skill 1 di kanan.
- Skill 2 di kanan.
- Ultimate di kanan dengan ukuran lebih besar.
- Tombol pause di bagian atas.

Basic Attack berjalan otomatis sehingga tidak membutuhkan tombol tembak.

Persyaratan:

- Tombol skill mudah disentuh.
- Tidak menghalangi karakter.
- Cooldown dapat dibaca.
- Layout menyesuaikan orientasi dan ukuran layar.
- Input tidak terganggu oleh scroll halaman.
- Pointer atau touch event dibersihkan ketika game berhenti.

## 27.3 Pause

Ketika permainan dijeda:

- Pergerakan berhenti.
- Enemy berhenti.
- Projectile berhenti.
- Cooldown berhenti.
- Mana regeneration berhenti.
- Survival timer berhenti.
- UI pause muncul.

Audio dapat dijeda atau diturunkan volumenya sesuai implementasi.

---

# 28. PERFORMANCE

Game harus tetap responsif meskipun jumlah musuh meningkat.

Persyaratan:

- Membatasi jumlah enemy aktif.
- Membatasi projectile aktif.
- Menghapus collectible yang tidak lagi diperlukan.
- Membersihkan timer dan event listener.
- Menghindari pembuatan Phaser instance ganda.
- Menghindari React re-render per frame.
- Menggunakan object pooling jika terbukti membantu.
- Mengoptimalkan penggunaan particle.
- Menghindari efek layar penuh yang terlalu berat.
- Menangani resize.
- Membersihkan seluruh event ketika scene berhenti.

Object pooling dapat digunakan untuk projectile, damage numbers, dan particle apabila profiling menunjukkan manfaat.

Jangan menambahkan kompleksitas pooling jika jumlah entity masih kecil dan belum ada masalah performa.

---

# 29. ERROR HANDLING

Game harus menangani:

- Aset hilang.
- Audio tidak dapat dimainkan.
- LocalStorage tidak tersedia.
- Data leaderboard rusak.
- Penggunaan skill saat Mana tidak cukup.
- Penggunaan Ultimate saat Energy belum penuh.
- Input berulang.
- Game Over terpanggil beberapa kali.
- Scene dimulai ulang.
- Resize ketika game berjalan.
- Tab browser berpindah ke background.

Audio tidak boleh menyebabkan game gagal berjalan jika file audio tidak tersedia.

Game Over hanya boleh diproses satu kali untuk satu sesi permainan.

---

# 30. TAHAPAN PENGEMBANGAN

## Milestone 1 — Foundation

Target:

- React container.
- Phaser instance.
- BootScene.
- PreloadScene.
- SurvivalScene.
- Arena.
- Player Wowo.
- Pergerakan.
- Camera follow.

Definition of Done:

- Game dapat dibuka.
- Wowo dapat bergerak.
- Tidak ada Phaser instance ganda.
- Tidak ada error kritis.

## Milestone 2 — Core Combat

Target:

- Basic Attack.
- Targeting.
- Projectile.
- Enemy dasar.
- Damage.
- HP.
- Enemy death.
- Spawn system.

Definition of Done:

- Basic Attack dapat menyerang musuh.
- Enemy dapat menerima damage.
- Enemy mati ketika HP habis.
- Tidak ada projectile tanpa batas.
- Tidak ada damage ganda tanpa alasan.

## Milestone 3 — Active Skills

Target:

- ManaSystem.
- CooldownSystem.
- Skill 1.
- Skill 2.
- Ultimate Energy.
- Ultimate.

Definition of Done:

- Mana berkurang dengan benar.
- Regenerasi Mana bekerja.
- Cooldown independen.
- Skill tidak dapat digunakan saat cooldown.
- Skill tidak dapat digunakan ketika Mana tidak cukup.
- Ultimate hanya dapat digunakan saat Energy penuh.
- Semua skill memiliki feedback visual.

## Milestone 4 — Progression

Target:

- Collectible Suara.
- XP.
- Level Up.
- Upgrade selection.
- Score.
- Difficulty scaling.

Definition of Done:

- Suara dapat dikumpulkan.
- XP bertambah.
- Level Up muncul sesuai ambang.
- Upgrade diterapkan.
- Kesulitan meningkat bertahap.

## Milestone 5 — UI/UX

Target:

- Main Menu.
- HUD.
- Skill bar.
- HP bar.
- Mana bar.
- Ultimate bar.
- Pause.
- Game Over.
- Leaderboard.

Definition of Done:

- Seluruh informasi penting terlihat.
- Cooldown terbaca.
- UI tidak menutupi gameplay secara berlebihan.
- Leaderboard dapat dibaca.
- Restart bekerja.

## Milestone 6 — Audio dan Visual Polish

Target:

- SFX.
- BGM.
- Hit effects.
- Pickup effects.
- Skill effects.
- Ultimate effects.
- Screen shake.
- Damage numbers.

Definition of Done:

- Efek audio sesuai event.
- Efek visual tidak menutupi ancaman.
- Volume dapat dikontrol.
- Performa tetap stabil.

## Milestone 7 — Responsive dan QA

Target:

- Desktop.
- Laptop.
- Tablet.
- Mobile.
- Pengujian gameplay lengkap.
- Pengujian build.

Definition of Done:

- Semua kontrol bekerja.
- Layout tidak rusak.
- Game dapat di-restart.
- Tidak ada error kritis.
- Build berhasil.

---

# 31. ACCEPTANCE CRITERIA

Fitur hanya boleh ditandai selesai jika telah diuji.

## A. Foundation

- [x] Phaser berjalan di dalam React.
- [x] Tidak ada instance game ganda.
- [x] Scene dapat berpindah dengan benar.
- [x] Cleanup bekerja ketika komponen dilepas.
- [x] Resize ditangani.

## B. Player

- [x] Wowo dapat bergerak.
- [x] Gerakan diagonal dinormalisasi.
- [x] Camera mengikuti Wowo.
- [x] Animasi sesuai arah.
- [x] Collision bekerja sesuai kebutuhan.

## C. Basic Attack

- [x] Serangan berjalan otomatis.
- [x] Targeting memilih musuh valid.
- [x] Attack interval bekerja.
- [x] Damage sesuai konfigurasi.
- [x] Basic Attack tidak mengonsumsi Mana.
- [x] Basic Attack dapat ditingkatkan.
- [x] Projectile dibersihkan setelah tidak diperlukan.

## D. Skill 1

- [x] Skill hanya aktif ketika kondisi valid.
- [x] Mana berkurang sesuai biaya.
- [x] Cooldown dimulai setelah skill berhasil digunakan.
- [x] Projectile muncul.
- [x] Damage benar.
- [x] Upgrade diterapkan.

## E. Skill 2

- [x] Area damage benar.
- [x] Radius sesuai konfigurasi.
- [x] Knockback bekerja.
- [x] Mana berkurang dengan benar.
- [x] Cooldown bekerja.
- [x] Upgrade diterapkan.

## F. Ultimate

- [x] Ultimate terkunci saat Energy kurang dari 100.
- [x] Ultimate aktif saat Energy penuh.
- [x] Energy bertambah dari sumber valid.
- [x] Energy tidak melebihi 100.
- [x] Ultimate memberikan damage area.
- [x] Energy kembali ke 0 setelah penggunaan.
- [x] Animasi dan efek bekerja.
- [x] Ultimate tidak dapat dipicu berulang selama cast.

## G. Mana dan Cooldown

- [x] Mana regeneration bekerja.
- [x] Mana tidak melebihi maksimum.
- [x] Mana tidak menjadi negatif.
- [x] Cooldown Skill 1 dan Skill 2 independen.
- [x] Cooldown Reduction bekerja.
- [x] Cooldown berhenti ketika pause.
- [x] Cooldown tidak berjalan setelah Game Over.

## H. Enemy

- [x] Enemy muncul dari posisi valid.
- [x] Enemy bergerak sesuai AI.
- [x] Enemy menerima damage.
- [x] Enemy mati sesuai HP.
- [x] Enemy death hanya diproses satu kali.
- [x] Enemy menjatuhkan collectible sesuai konfigurasi.
- [x] Jumlah enemy aktif dibatasi.

## I. Progression

- [x] Suara dapat diambil.
- [x] XP bertambah.
- [x] Level Up berjalan.
- [x] Upgrade ditampilkan.
- [x] Upgrade memengaruhi gameplay.
- [x] XP curve berjalan sesuai konfigurasi.

## J. Game Over dan Leaderboard

- [x] Game Over hanya berjalan sekali.
- [x] Input gameplay berhenti setelah kematian.
- [x] Statistik dihitung benar.
- [x] Hasil tersimpan ke LocalStorage.
- [x] Leaderboard diurutkan dengan benar.
- [x] Maksimal 10 hasil ditampilkan.
- [x] High score bertahan setelah restart.
- [x] Data rusak ditangani.
- [x] Restart membuat sesi baru yang bersih.

## K. UI dan Responsivitas

- [x] HP terlihat.
- [x] Mana terlihat.
- [x] Ultimate Energy terlihat.
- [x] Cooldown terbaca.
- [x] Tombol skill dapat digunakan.
- [x] Mobile joystick bekerja.
- [x] Layout tidak rusak pada layar kecil.
- [x] UI tidak menutupi informasi penting.

## L. Audio dan Performance

- [x] Basic Attack memiliki feedback.
- [x] Skill memiliki SFX.
- [x] Ultimate memiliki feedback audio.
- [x] Volume dapat diatur.
- [x] Tidak ada timer bocor.
- [x] Tidak ada event listener ganda.
- [x] Entity yang tidak diperlukan dibersihkan.
- [x] Build berhasil.

**Catatan:** Semua checkbox di atas merupakan kriteria pengujian, bukan klaim bahwa implementasinya sudah selesai.

---

# 32. DEFINITION OF DONE

Game dapat dinyatakan siap untuk versi pertama apabila:

1. Wowo dapat bergerak dengan responsif.
2. Basic Attack berjalan otomatis.
3. Skill 1 dan Skill 2 dapat digunakan secara aktif.
4. Mana dan cooldown berfungsi benar.
5. Ultimate hanya dapat digunakan ketika Energy penuh.
6. Musuh dapat muncul, menyerang, menerima damage, dan mati.
7. Suara dapat dikumpulkan sebagai XP.
8. Level Up dan upgrade bekerja.
9. Difficulty scaling berjalan.
10. Game Over menghentikan gameplay.
11. Leaderboard lokal bekerja.
12. Restart tidak merusak state.
13. UI desktop dan mobile berfungsi.
14. Tidak ada error kritis.
15. Build berhasil.
16. Semua kriteria penting telah diuji.

---

# 33. INSTRUKSI UNTUK AI CODING AGENT

Jika PRD ini diberikan kepada AI coding agent, ikuti aturan berikut:

1. Periksa struktur proyek yang sudah ada sebelum mengubah file.
2. Jangan mengubah bagian website portfolio di luar `src/games/SeranganFajar/`, kecuali integrasi memang diperlukan.
3. Jangan menghapus file proyek yang tidak terkait.
4. Gunakan React untuk UI dan lifecycle.
5. Gunakan Phaser untuk seluruh loop gameplay.
6. Jangan membuat sistem combat di React state.
7. Gunakan konfigurasi untuk balancing.
8. Implementasikan fitur berdasarkan milestone.
9. Jangan membuat semua file kosong hanya untuk menyesuaikan struktur.
10. Jangan menganggap placeholder sebagai fitur yang selesai.
11. Jangan menandai checklist selesai tanpa verifikasi.
12. Jangan menambahkan dependency tanpa alasan yang jelas.
13. Jangan menambahkan backend atau API untuk leaderboard versi pertama.
14. Jangan membuat aset palsu ketika aset asli belum tersedia.
15. Jika aset belum ada, gunakan placeholder yang jelas dan mudah diganti.
16. Jangan mengklaim testing berhasil jika hanya memeriksa kode tanpa menjalankannya.
17. Jalankan build dan perbaiki error yang ditemukan.
18. Laporkan file yang diubah, fitur yang selesai, pengujian, dan kendala yang tersisa.

## Format Laporan Akhir

AI coding agent harus melaporkan:

### 1. Files Changed

Daftar file yang dibuat atau diubah.

### 2. Features Implemented

Fitur yang benar-benar sudah diimplementasikan.

### 3. Bugs Fixed

Bug yang ditemukan dan diperbaiki.

### 4. Testing

Pengujian yang benar-benar dijalankan dan hasilnya.

### 5. Acceptance Checklist

Gunakan status:

- `[x] VERIFIED`
- `[ ] NOT IMPLEMENTED`
- `[ ] NOT VERIFIED`
- `[!] BLOCKED`

### 6. Known Issues

Masalah yang belum terselesaikan.

### 7. Next Steps

Prioritas pengerjaan berikutnya.

---

# 34. PENUTUP

Serangan Fajar: The Last Stand harus dikembangkan sebagai game survival yang memiliki identitas combat kuat.

Basic Attack menjadi sumber damage yang konsisten.

Skill 1 memberikan burst damage.

Skill 2 memberikan kontrol area.

Ultimate menjadi kemampuan besar yang memerlukan pengisian Energy.

Mana dan cooldown memaksa pemain mengambil keputusan.

XP dan upgrade memberikan perkembangan selama permainan.

Musuh dan difficulty scaling menjaga tantangan.

Leaderboard lokal memberikan motivasi untuk bermain kembali.

**Prinsip final: bangun core gameplay terlebih dahulu, pastikan sistem combat dan skill benar-benar menyenangkan, kemudian tingkatkan kualitas visual, audio, variasi musuh, dan fitur tambahan.**
