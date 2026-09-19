# PROMPT PRD — PEMBUATAN GAME WOWOJUMP

Kamu bertindak sebagai **Senior Game Developer dengan pengalaman 7+ tahun membuat game web**, khususnya game 2D menggunakan JavaScript, React.js, Phaser, dan Vite.

Saya sedang mengembangkan sebuah game browser bernama:

# WOWOJUMP

WowoJump adalah game **Endless Jumper 2D** yang dimainkan di dalam website portfolio saya.

Untuk pekerjaan ini, **JANGAN mengubah struktur aplikasi portfolio utama**. Fokus hanya pada:

```text
src/games/WowoJump/
```

Struktur saat ini:

```text
src/
└── games/
    └── WowoJump/
        ├── assets/
        │   ├── coin.jpeg
        │   ├── kopdes.png
        │   ├── lompat.jpeg
        │   ├── nyawa.jpeg
        │   └── rintangan-kopdes.png
        │
        └── WowoJump.jsx
```

Game harus dibuat modular agar nantinya mudah dikembangkan.

---

# 1. KONSEP GAME

WowoJump adalah endless vertical jumping game.

Player mengendalikan karakter Wowo yang harus terus melompat dari satu platform ke platform lainnya.

Tujuan utama:

> Bertahan selama mungkin, naik setinggi mungkin, mengumpulkan coin sebanyak mungkin, dan mempertahankan seluruh nyawa.

Gameplay harus terasa:

* sederhana untuk dipahami
* cepat dimainkan
* lucu
* ringan
* responsive
* cocok untuk browser
* memiliki replay value
* tidak membutuhkan tutorial panjang

Inspirasi mekanik boleh mengambil referensi umum dari game endless jumper seperti Doodle Jump, tetapi **JANGAN menyalin aset, karakter, nama, UI, kode, atau desain spesifik game lain**.

WowoJump harus mempunyai identitas visual dan gameplay sendiri.

---

# 2. TEMA

Tema utama:

**Endless Jumper bertema Wowo + sawit + Kopdes.**

Gunakan nuansa visual yang ringan, lucu, dan arcade.

Elemen utama:

```text
Wowo
↓
melompat
↓
Kopdes sebagai platform
↓
mengumpulkan coin
↓
menghindari pohon sawit
↓
naik semakin tinggi
↓
score semakin tinggi
```

Jangan membuat game terlalu realistis.

Prioritaskan gameplay dan keterbacaan objek.

---

# 3. ASSET

Gunakan asset yang sudah tersedia di:

```text
src/games/WowoJump/assets/
```

Asset:

```text
coin.jpeg
kopdes.png
lompat.jpeg
nyawa.jpeg
rintangan-kopdes.png
```

Jangan mengganti asset dengan asset dari internet tanpa instruksi.

Jangan menghapus asset yang sudah tersedia.

Jika suatu asset belum ideal untuk digunakan sebagai sprite, buat wrapper/logic di dalam game agar asset tetap bisa digunakan.

Jika asset JPEG memiliki background yang tidak transparan, lakukan penyesuaian rendering secara aman jika memungkinkan tanpa merusak asset asli.

---

# 4. FUNGSI MASING-MASING ASSET

Gunakan asumsi fungsi awal berikut:

## coin.jpeg

Digunakan sebagai collectible.

Ketika Wowo menyentuh coin:

```text
coin hilang
score/coin bertambah
```

Contoh:

```text
COIN: 15
```

Coin dapat ditempatkan secara random di atas atau sekitar platform.

---

## kopdes.png

Digunakan sebagai platform utama.

Wowo dapat mendarat di atas platform Kopdes.

Platform harus mempunyai collision dengan player.

Contoh:

```text
        Wowo
         ↓
        🧍
    ┌──────────┐
    │  KOPDES  │
    └──────────┘
```

---

## lompat.jpeg

Gunakan sebagai referensi/asset terkait mekanik lompat sesuai isi asset.

Jika asset ini ternyata merupakan tombol/icon lompat, gunakan sebagai kontrol mobile.

Untuk desktop, keyboard tetap harus tersedia.

---

## nyawa.jpeg

Digunakan sebagai visual indikator nyawa.

Contoh:

```text
NYAWA
🌴 🌴 🌴
```

Jumlah nyawa default:

```text
3
```

Jangan menggunakan sistem HP yang rumit.

Gunakan konsep:

```text
3 nyawa
↓
kena obstacle
↓
2 nyawa
↓
kena obstacle
↓
1 nyawa
↓
kena obstacle
↓
GAME OVER
```

---

## rintangan-kopdes.png

Digunakan sebagai obstacle.

Obstacle memiliki bentuk:

```text
     KOPDES
    ┌───────┐
    │       │
    └───────┘
        │
       🌴
       🌴
```

Bagian pohon sawit di bawah Kopdes adalah bagian berbahaya.

Jika Wowo menyentuh pohon sawit:

```text
nyawa - 1
```

Collision harus dibuat terutama pada area pohon sawit, bukan seluruh area asset secara membabi buta.

---

# 5. CORE GAMEPLAY LOOP

Gameplay utama:

```text
START
  ↓
Wowo mulai melompat
  ↓
Cari platform
  ↓
Mendarat
  ↓
Melompat lagi
  ↓
Ambil coin
  ↓
Hindari obstacle
  ↓
Naik semakin tinggi
  ↓
Difficulty meningkat
  ↓
Nyawa habis?
  ├── Tidak → lanjut
  └── Ya → Game Over
```

Game tidak mempunyai level yang selesai.

Game harus terus berjalan sampai player kehilangan seluruh nyawa.

---

# 6. PLAYER

Player adalah karakter Wowo.

Player harus mempunyai:

```text
position
velocity
gravity
jumpForce
movementSpeed
lives
score
coins
```

Minimal state:

```javascript
{
  x,
  y,
  velocityX,
  velocityY,
  lives: 3,
  score: 0,
  coins: 0,
  isInvulnerable: false
}
```

---

# 7. MEKANIK GERAK

Wowo dapat bergerak:

```text
← → 
```

Desktop:

```text
ArrowLeft
ArrowRight
A
D
```

Mobile:

Gunakan tombol kiri/kanan yang nyaman disentuh.

Jika memungkinkan, tombol menggunakan asset:

```text
lompat.jpeg
```

hanya jika asset tersebut memang sesuai.

Jangan membuat kontrol mobile terlalu besar sampai menutupi gameplay.

---

# 8. JUMP MECHANIC

Wowo menggunakan sistem auto-jump.

Player tidak harus menekan tombol setiap kali ingin melompat.

Ketika Wowo mendarat di platform:

```text
velocityY = -jumpForce
```

Kemudian:

```text
gravity
↓
Wowo turun
↓
mendarat
↓
auto jump
```

Tujuannya membuat game terasa seperti endless jumper.

---

# 9. CAMERA

Gunakan kamera vertical scrolling.

Ketika Wowo mencapai area tertentu di bagian atas layar:

```text
camera mengikuti Wowo
```

Dunia/game map bergerak ke bawah.

Player terlihat seperti terus naik.

Jangan membuat seluruh dunia dibuat sekaligus.

Gunakan procedural/platform generation.

---

# 10. PLATFORM GENERATION

Platform Kopdes harus dibuat secara dinamis.

Platform baru dibuat ketika player naik.

Contoh:

```text
          KOPDES
             ↑

       KOPDES
             ↑

   KOPDES
             ↑

        Wowo
          ↓
       KOPDES
```

Jarak antar platform harus tetap memungkinkan untuk dicapai player.

**JANGAN membuat platform random sepenuhnya tanpa mempertimbangkan kemampuan lompatan player.**

Setiap platform berikutnya harus mempunyai kemungkinan untuk dijangkau.

---

# 11. PROCEDURAL GENERATION

Platform harus mempunyai variasi:

* posisi X
* jarak Y
* kemungkinan coin
* kemungkinan obstacle

Contoh:

```javascript
generatePlatform()
```

dan:

```javascript
generateObstacle()
```

Pisahkan logic generator dari component utama jika sudah mulai kompleks.

---

# 12. OBSTACLE

Obstacle menggunakan:

```text
rintangan-kopdes.png
```

Konsep visual:

```text
      KOPDES
   ┌─────────┐
   │         │
   └─────────┘
       🌴
       🌴
       🌴
```

Area pohon sawit adalah damage area.

Jika player menyentuh pohon:

```text
lives -= 1
```

---

# 13. DAMAGE SYSTEM

Ketika terkena obstacle:

```text
nyawa - 1
```

Setelah terkena:

```text
player menjadi invulnerable sementara
```

Durasi contoh:

```text
1000–1500 ms
```

Selama invulnerable:

* player berkedip
* collision damage tidak dihitung berkali-kali
* player tetap dapat bergerak

Tujuannya mencegah satu collision menghabiskan semua nyawa sekaligus.

---

# 14. COIN SYSTEM

Coin dapat muncul secara random.

Ketika player menyentuh coin:

```text
coins += 1
score += coinScore
```

Contoh:

```text
COIN +1
SCORE +10
```

Coin kemudian dihapus/dinonaktifkan.

Jangan membuat coin bisa diambil berkali-kali.

---

# 15. SCORE

Score merupakan ukuran utama performa player.

Score dapat dihitung berdasarkan:

```text
ketinggian yang dicapai
+
coin
```

Score harus meningkat secara konsisten.

Contoh UI:

```text
SCORE
1250
```

High score juga harus disimpan menggunakan:

```javascript
localStorage
```

sehingga ketika browser direfresh, high score tetap tersedia.

---

# 16. NYAWA

Default:

```text
3 lives
```

UI:

```text
NYAWA: 🌴 🌴 🌴
```

Jika terkena obstacle:

```text
NYAWA: 🌴 🌴
```

Jika:

```text
lives === 0
```

maka:

```text
GAME OVER
```

---

# 17. GAME OVER

Ketika player kehilangan seluruh nyawa, hentikan gameplay.

Tampilkan:

```text
╔══════════════════════════╗
║       GAME OVER           ║
║                          ║
║      SCORE: 1250         ║
║      COIN: 35            ║
║                          ║
║  HIGH SCORE: 2500        ║
║                          ║
║      [MAIN LAGI]         ║
╚══════════════════════════╝
```

Tombol:

```text
MAIN LAGI
```

harus mereset:

```text
player
score
coins
lives
platforms
obstacles
```

Tetapi:

```text
high score
```

tetap disimpan.

---

# 18. START SCREEN

Sebelum game dimulai tampilkan:

```text
╔════════════════════════╗
║                        ║
║       WOWOJUMP         ║
║                        ║
║    [ MULAI GAME ]      ║
║                        ║
║  ← → / A D = GERAK     ║
║                        ║
╚════════════════════════╝
```

Jika memungkinkan tampilkan karakter dan beberapa platform sebagai visual background.

---

# 19. HUD

Saat gameplay:

```text
┌──────────────────────────────┐
│ SCORE: 1250     🪙 35        │
│ NYAWA: 🌴 🌴 🌴              │
└──────────────────────────────┘
```

HUD harus:

* tidak menutupi player
* responsive
* mudah dibaca
* tetap terlihat saat scrolling
* tidak ikut bergerak bersama world/camera

---

# 20. DIFFICULTY SYSTEM

Game harus semakin sulit.

Gunakan progression berdasarkan score atau height.

Contoh:

```text
0 - 500
Easy

500 - 1500
Normal

1500 - 3000
Hard

3000+
Very Hard
```

Kesulitan dapat meningkat melalui:

```text
jarak platform
posisi platform
jumlah obstacle
frekuensi obstacle
kecepatan scrolling
```

Tetapi:

**JANGAN meningkatkan difficulty sampai mustahil dimainkan.**

Selalu pastikan platform masih dapat dicapai.

---

# 21. RANDOMNESS

Random harus terasa natural.

Jangan:

```text
random X
random Y
random obstacle
random semuanya
```

tanpa validasi.

Gunakan constraint:

```text
minimum platform distance
maximum platform distance
minimum reachable height
maximum horizontal jump distance
```

Dengan demikian setiap generated platform masih playable.

---

# 22. RESPONSIVE

Game harus dapat dimainkan pada:

```text
Desktop
Laptop
Tablet
Mobile
```

Aspect ratio berbeda harus ditangani.

Gameplay area sebaiknya menggunakan fixed logical resolution, kemudian Phaser/game canvas melakukan scaling.

Pastikan:

```text
player tidak keluar layar
HUD tetap terlihat
kontrol mobile tidak menutupi gameplay
```

---

# 23. AUDIO

Untuk versi pertama, audio tidak wajib.

Namun arsitektur harus memungkinkan penambahan:

```text
jump sound
coin sound
damage sound
game over sound
button sound
background music
```

Jangan membuat audio menjadi dependency wajib jika asset audio belum tersedia.

---

# 24. PARTICLE / FEEDBACK

Jika memungkinkan tambahkan feedback ringan:

Saat mengambil coin:

```text
✨ +1
```

Saat terkena obstacle:

```text
screen shake ringan
player berkedip
```

Saat game over:

```text
fade / transition
```

Jangan berlebihan.

Game harus tetap ringan.

---

# 25. ARSITEKTUR KODE

Gunakan React.js + Phaser.

React digunakan sebagai wrapper/UI.

Phaser digunakan untuk gameplay.

Jangan memasukkan seluruh game loop ke React state karena dapat menyebabkan render berlebihan.

Gunakan pendekatan:

```text
React
│
├── WowoJump.jsx
│
└── Phaser Game
    │
    ├── Scene
    ├── Player
    ├── Platforms
    ├── Obstacles
    ├── Coins
    ├── Collision
    ├── Camera
    └── Game State
```

---

# 26. TARGET STRUKTUR FOLDER

Awalnya:

```text
WowoJump/
├── assets/
│   ├── coin.jpeg
│   ├── kopdes.png
│   ├── lompat.jpeg
│   ├── nyawa.jpeg
│   └── rintangan-kopdes.png
│
└── WowoJump.jsx
```

Jika kode mulai kompleks, refactor menjadi:

```text
WowoJump/
│
├── assets/
│   ├── coin.jpeg
│   ├── kopdes.png
│   ├── lompat.jpeg
│   ├── nyawa.jpeg
│   └── rintangan-kopdes.png
│
├── components/
│   ├── WowoJump.jsx
│   ├── GameHUD.jsx
│   ├── StartScreen.jsx
│   └── GameOverScreen.jsx
│
├── game/
│   ├── config.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── PreloadScene.js
│   │   └── GameScene.js
│   │
│   ├── entities/
│   │   ├── Player.js
│   │   ├── Platform.js
│   │   ├── Obstacle.js
│   │   └── Coin.js
│   │
│   └── systems/
│       ├── PlatformGenerator.js
│       ├── ObstacleGenerator.js
│       ├── ScoreSystem.js
│       └── DifficultySystem.js
│
└── WowoJump.jsx
```

Tetapi:

**Jangan membuat file terlalu banyak jika belum diperlukan.**

Mulai sederhana terlebih dahulu.

---

# 27. GAME STATE

Minimal state:

```javascript
{
  status: "menu",
  score: 0,
  coins: 0,
  lives: 3,
  highScore: 0
}
```

Status:

```text
menu
playing
gameover
paused
```

Jika memungkinkan gunakan event antara Phaser dan React daripada membuat React mengontrol setiap frame gameplay.

---

# 28. PERFORMANCE

Game harus ringan.

Perhatikan:

* jangan membuat object Phaser tanpa batas
* destroy/deactivate platform yang sudah jauh di bawah kamera
* gunakan object pooling jika diperlukan
* jangan melakukan React state update setiap frame
* hindari terlalu banyak collision object
* gunakan asset yang sudah ada
* jangan melakukan operasi berat setiap frame

Target:

```text
smooth gameplay
```

pada browser desktop dan mobile.

---

# 29. CLEAN CODE

Gunakan:

* descriptive variable names
* fungsi kecil
* komentar hanya pada logic penting
* hindari hardcoded value yang tersebar
* gunakan configuration object untuk balancing

Contoh:

```javascript
const GAME_CONFIG = {
  initialLives: 3,
  jumpForce: 500,
  gravity: 1000,
  playerSpeed: 250,
  coinScore: 10,
  damageInvulnerability: 1200
};
```

---

# 30. JANGAN MERUSAK PROJECT UTAMA

Ini sangat penting.

Project saya mempunyai struktur:

```text
portov2/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── games/
│   ├── hooks/
│   ├── locales/
│   └── sections/
├── dist/
├── .agents/
└── .codex/
```

Untuk pekerjaan WowoJump:

**JANGAN mengubah file di luar WowoJump kecuali benar-benar diperlukan agar import game berfungsi.**

Jangan mengubah:

```text
src/components/
src/context/
src/data/
src/hooks/
src/locales/
src/sections/
```

Jangan mengubah portfolio UI.

Jangan mengubah routing utama.

Jangan membuat endpoint backend.

Jangan membutuhkan database.

Jangan membutuhkan login.

Jangan membutuhkan server.

Game harus berjalan client-side.

---

# 31. PRIORITAS DEVELOPMENT

Implementasikan secara bertahap.

## PHASE 1 — PLAYABLE PROTOTYPE

Buat:

```text
Player
+
Gravity
+
Auto Jump
+
Movement
+
Platform
+
Camera
```

Target:

> Wowo dapat melompat dan mendarat di Kopdes.

---

## PHASE 2 — CORE GAMEPLAY

Tambahkan:

```text
Coin
Obstacle
Collision
Lives
Game Over
Score
```

Target:

> Sudah bisa dimainkan dari awal sampai game over.

---

## PHASE 3 — PROCEDURAL GENERATION

Tambahkan:

```text
Infinite platforms
Infinite scrolling
Obstacle generation
Coin generation
Difficulty
```

Target:

> Game tidak mempunyai akhir dan terus menghasilkan platform.

---

## PHASE 4 — UI

Tambahkan:

```text
Start Screen
HUD
Game Over
Restart
High Score
```

---

## PHASE 5 — POLISH

Tambahkan jika memungkinkan:

```text
animations
particles
screen shake
sound
transitions
better feedback
```

---

# 32. ACCEPTANCE CRITERIA — WAJIB 100% TERPENUHI

**SEMUA KRITERIA DI BAWAH INI WAJIB TERPENUHI.**

Jangan menganggap satu pun item sebagai optional.

Jangan menyatakan implementasi selesai sebelum seluruh checklist berikut dapat diverifikasi.

---

## 🎮 GAMEPLAY — WAJIB

* [x] Game dapat dimulai dari Start Screen.
* [x] Wowo dapat bergerak ke kiri.
* [x] Wowo dapat bergerak ke kanan.
* [x] Wowo dapat bergerak menggunakan `ArrowLeft`.
* [x] Wowo dapat bergerak menggunakan `ArrowRight`.
* [x] Wowo dapat bergerak menggunakan `A`.
* [x] Wowo dapat bergerak menggunakan `D`.
* [x] Wowo otomatis melompat.
* [x] Wowo memiliki gravity.
* [x] Wowo dapat mendarat di platform Kopdes.
* [x] Wowo kembali melompat setelah mendarat.
* [x] Kamera mengikuti pergerakan Wowo ke atas.
* [x] Dunia game melakukan vertical scrolling.
* [x] Platform baru terus dibuat ketika Wowo naik.
* [x] Platform lama yang sudah jauh di bawah dibersihkan/dinonaktifkan.
* [x] Game tidak memiliki batas level akhir.
* [x] Game dapat terus dimainkan selama Wowo masih memiliki nyawa.
* [x] Game mempunyai kondisi Game Over.

---

## 🪙 COIN SYSTEM — WAJIB

* [x] Coin menggunakan asset `coin.jpeg`.
* [x] Coin dapat muncul di dalam game.
* [x] Coin dapat ditempatkan secara procedural.
* [x] Coin dapat berada di sekitar platform.
* [x] Wowo dapat mengambil coin.
* [x] Coin menghilang setelah berhasil diambil.
* [x] Satu coin hanya dapat dihitung satu kali.
* [x] Jumlah coin bertambah ketika coin diambil.
* [x] Score bertambah ketika coin diambil.
* [x] HUD menampilkan jumlah coin.
* [x] Coin di-reset ketika game dimulai ulang.

---

## 🌴 LIFE / NYAWA SYSTEM — WAJIB

* [x] Wowo memulai game dengan 3 nyawa.
* [x] Nyawa menggunakan asset `nyawa.jpeg`.
* [x] HUD menampilkan jumlah nyawa.
* [x] Nyawa berkurang ketika Wowo terkena obstacle.
* [x] Satu collision menghasilkan maksimal satu pengurangan nyawa.
* [x] Wowo mendapatkan temporary invulnerability setelah terkena obstacle.
* [x] Wowo berkedip ketika sedang invulnerable.
* [x] Collision damage tidak dapat terjadi berkali-kali selama periode invulnerability.
* [x] Nyawa tidak dapat menjadi angka negatif.
* [x] Jika nyawa = 0 maka game berhenti.
* [x] Jika nyawa = 0 maka Game Over ditampilkan.
* [x] Restart mengembalikan nyawa menjadi 3.

---

## 🌴 OBSTACLE SYSTEM — WAJIB

* [x] Obstacle menggunakan asset `rintangan-kopdes.png`.
* [x] Obstacle dapat muncul secara procedural.
* [x] Obstacle dapat muncul pada platform tertentu.
* [x] Obstacle tidak muncul pada setiap platform.
* [x] Bagian pohon sawit merupakan damage area.
* [x] Area Kopdes tidak otomatis dianggap sebagai damage area.
* [x] Collision obstacle dibuat menggunakan hitbox yang sesuai.
* [x] Wowo kehilangan satu nyawa ketika menyentuh pohon sawit.
* [x] Obstacle dapat dibersihkan ketika sudah jauh dari area permainan.
* [x] Obstacle tidak menghasilkan collision palsu yang tidak terlihat oleh player.

---

## 🏠 PLATFORM SYSTEM — WAJIB

* [x] Platform menggunakan asset `kopdes.png`.
* [x] Wowo dapat berdiri/mendarat di platform.
* [x] Platform mempunyai collision.
* [x] Platform dibuat secara procedural.
* [x] Platform mempunyai variasi posisi X.
* [x] Platform mempunyai variasi jarak vertikal.
* [x] Platform berikutnya selalu mempunyai kemungkinan untuk dicapai.
* [x] Generator platform memperhitungkan kemampuan lompatan Wowo.
* [x] Tidak boleh menghasilkan platform yang mustahil dijangkau.
* [x] Platform lama dibersihkan untuk mencegah memory leak.
* [x] Platform awal selalu aman untuk memulai permainan.

---

## 🧠 PROCEDURAL GENERATION — WAJIB

* [x] Platform dibuat secara procedural.
* [x] Posisi horizontal platform dibuat bervariasi.
* [x] Jarak vertikal platform dibuat bervariasi.
* [x] Coin dibuat secara procedural.
* [x] Obstacle dibuat secara procedural.
* [x] Generator menggunakan minimum horizontal distance.
* [x] Generator menggunakan maximum horizontal distance.
* [x] Generator menggunakan minimum vertical distance.
* [x] Generator menggunakan maximum vertical distance.
* [x] Generator mempertimbangkan jump height.
* [x] Generator mempertimbangkan jump distance.
* [x] Generator mencegah platform yang tidak dapat dicapai.
* [x] Generator tidak membuat pola yang terlalu mudah atau terlalu repetitif.

---

## 📈 SCORE SYSTEM — WAJIB

* [x] Score ditampilkan di HUD.
* [x] Score bertambah berdasarkan progres/ketinggian.
* [x] Score bertambah ketika coin dikumpulkan.
* [x] Score tidak berkurang selama gameplay normal.
* [x] Score di-reset ketika restart.
* [x] High score disimpan menggunakan `localStorage`.
* [x] High score tetap ada setelah browser di-refresh.
* [x] High score ditampilkan pada Game Over.
* [x] High score diperbarui jika score baru lebih tinggi.

---

## 📈 DIFFICULTY SYSTEM — WAJIB

Game harus semakin sulit berdasarkan progres.

### Early Game

* [x] Platform relatif mudah dijangkau.
* [x] Obstacle masih jarang.
* [x] Player mempunyai ruang untuk memahami gameplay.

### Mid Game

* [x] Posisi platform menjadi lebih bervariasi.
* [x] Obstacle mulai lebih sering muncul.
* [x] Jarak platform mulai meningkat secara bertahap.

### Late Game

* [x] Platform menjadi lebih menantang.
* [x] Obstacle menjadi lebih sering.
* [x] Variasi posisi meningkat.
* [x] Game membutuhkan kontrol player yang lebih baik.

### Constraint

* [x] Difficulty tidak boleh membuat game mustahil dimainkan.
* [x] Platform tetap harus reachable.
* [x] Difficulty meningkat secara bertahap.
* [x] Tidak boleh terjadi lonjakan difficulty yang ekstrem.

---

## 📱 RESPONSIVE / MOBILE — WAJIB

* [x] Game dapat dimainkan di desktop.
* [x] Game dapat dimainkan di laptop.
* [x] Game dapat dimainkan di tablet.
* [x] Game dapat dimainkan di mobile.
* [x] Canvas melakukan scaling dengan benar.
* [x] Aspect ratio berbeda ditangani.
* [x] Player tidak keluar dari gameplay area.
* [x] HUD tetap terlihat.
* [x] Start Screen tetap terlihat.
* [x] Game Over Screen tetap terlihat.
* [x] Tombol mobile tersedia.
* [x] Tombol mobile dapat digunakan dengan touch.
* [x] Tombol mobile tidak menutupi area penting gameplay.
* [x] Ukuran tombol nyaman untuk layar sentuh.
* [x] Tidak ada horizontal overflow pada halaman game.

---

## 🖥️ DESKTOP CONTROL — WAJIB

Keyboard harus mendukung:

```text
ArrowLeft
ArrowRight
A
D
```

Semua kontrol tersebut harus:

* [x] dapat digunakan untuk bergerak
* [x] tidak menghasilkan error
* [x] tidak mengganggu scrolling halaman secara berlebihan saat game aktif
* [x] berhenti bekerja untuk gameplay ketika game sudah Game Over

---

## 📱 MOBILE CONTROL — WAJIB

Minimal tersedia:

```text
[ ← ]       [ → ]
```

Ketika tombol ditekan:

```text
← → movement
```

Ketika tombol dilepas:

```text
movement berhenti
```

Touch control tidak boleh menghasilkan movement yang tersangkut.

---

## 🎬 START SCREEN — WAJIB

Sebelum game dimulai:

* [x] Judul `WOWOJUMP` ditampilkan.
* [x] Tombol `MULAI GAME` ditampilkan.
* [x] Instruksi kontrol ditampilkan.
* [x] Player belum bergerak sebelum game dimulai.
* [x] Gameplay baru dimulai setelah tombol Start ditekan.
* [x] Start Screen tidak mengganggu gameplay setelah game dimulai.

---

## 📊 HUD — WAJIB

HUD harus menampilkan:

```text
SCORE
COIN
NYAWA
```

Contoh:

```text
┌─────────────────────────────┐
│ SCORE: 1250       🪙 35      │
│ NYAWA: 🌴 🌴 🌴             │
└─────────────────────────────┘
```

* [x] HUD selalu terlihat.
* [x] HUD tidak ikut bergerak bersama world.
* [x] HUD tidak menutupi player.
* [x] HUD responsive.
* [x] HUD diperbarui sesuai kondisi game.

---

## 💀 GAME OVER — WAJIB

Game Over terjadi ketika:

```text
lives === 0
```

Game harus:

* [x] menghentikan gameplay.
* [x] menghentikan movement enemy/obstacle jika ada.
* [x] menghentikan spawning.
* [x] menampilkan `GAME OVER`.
* [x] menampilkan score terakhir.
* [x] menampilkan jumlah coin.
* [x] menampilkan high score.
* [x] menyediakan tombol `MAIN LAGI`.

---

## 🔄 RESTART — WAJIB

Ketika `MAIN LAGI` ditekan:

```text
score → 0
coins → 0
lives → 3
player → posisi awal
platform → reset
obstacle → reset
coin → reset
camera → posisi awal
difficulty → awal
```

Namun:

```text
highScore → tetap
```

* [x] Game dapat dimainkan kembali tanpa refresh browser.
* [x] Tidak terjadi duplicate Phaser instance.
* [x] Tidak terjadi duplicate event listener.
* [x] Tidak terjadi duplicate platform.
* [x] Tidak terjadi memory leak yang jelas setelah restart berulang kali.

---

## 💾 LOCAL STORAGE — WAJIB

Gunakan `localStorage` untuk menyimpan minimal:

```javascript
{
  highScore
}
```

* [x] High score tersimpan.
* [x] High score dapat dibaca ketika game dibuka kembali.
* [x] Invalid localStorage value ditangani dengan aman.
* [x] Game tetap berjalan jika localStorage tidak tersedia.

---

## ✨ GAME FEEDBACK — WAJIB

Ketika mengambil coin:

* [x] Ada visual feedback.
* [x] Score/coin berubah langsung.

Ketika terkena obstacle:

* [x] Nyawa langsung berkurang.
* [x] Player berkedip.
* [x] Ada feedback visual.
* [x] Screen shake ringan jika tidak mengganggu gameplay.

Ketika Game Over:

* [x] Ada transition/feedback visual.
* [x] Game tidak langsung terasa seperti error/crash.

---

## 🎨 ASSET — WAJIB

Gunakan asset yang tersedia:

```text
assets/
├── coin.jpeg
├── kopdes.png
├── lompat.jpeg
├── nyawa.jpeg
└── rintangan-kopdes.png
```

* [x] Semua asset diperiksa sebelum digunakan.
* [x] Asset path menggunakan import/path yang benar.
* [x] Tidak ada broken image.
* [x] Tidak ada asset yang sengaja dihapus.
* [x] Tidak mengganti asset dengan asset internet secara otomatis.
* [x] Asset digunakan sesuai fungsi gameplay.
* [x] `rintangan-kopdes.png` memiliki damage hitbox yang sesuai dengan bagian pohon sawit.
* [x] Asset JPEG tetap dapat dirender dengan baik.

---

## ⚡ PERFORMANCE — WAJIB

* [x] Tidak membuat object tanpa batas.
* [x] Platform lama dibersihkan.
* [x] Obstacle lama dibersihkan.
* [x] Coin lama dibersihkan.
* [x] Tidak melakukan React state update setiap frame.
* [x] Tidak membuat Phaser instance berulang tanpa destroy.
* [x] Event listener dibersihkan ketika component unmount.
* [x] Game tidak menyebabkan memory leak yang jelas.
* [x] Gameplay tetap smooth pada perangkat yang wajar.
* [x] Tidak menggunakan operasi berat setiap frame tanpa alasan.

---

## ⚛️ REACT + PHASER — WAJIB

Arsitektur harus memisahkan:

```text
React
↓
UI / lifecycle / wrapper

Phaser
↓
gameplay / physics / collision / game loop
```

* [x] React tidak digunakan untuk game loop per frame.
* [x] Phaser menangani physics.
* [x] Phaser menangani collision.
* [x] Phaser menangani camera.
* [x] Phaser menangani procedural generation.
* [x] React menangani lifecycle/wrapper game.
* [x] Tidak membuat duplicate Phaser game instance.
* [x] Phaser dihancurkan dengan benar ketika component unmount.

---

## 🧹 CLEAN CODE — WAJIB

* [x] Tidak ada variable dengan nama ambigu jika bisa diperjelas.
* [x] Fungsi mempunyai tanggung jawab yang jelas.
* [x] Configuration game dipisahkan dari logic jika diperlukan.
* [x] Tidak menyebarkan magic number ke seluruh kode.
* [x] Collision logic dapat dipahami.
* [x] Generator platform dapat dipahami.
* [x] Generator obstacle dapat dipahami.
* [x] Score/life logic dapat dipahami.
* [x] Tidak ada console error.
* [x] Tidak meninggalkan kode eksperimen yang tidak digunakan.
* [x] Tidak meninggalkan TODO kritis yang belum diselesaikan.

---

## 🗂️ PROJECT SCOPE — WAJIB

Pekerjaan hanya berfokus pada:

```text
src/games/WowoJump/
```

Jangan mengubah:

```text
src/components/
src/context/
src/data/
src/hooks/
src/locales/
src/sections/
```

kecuali perubahan tersebut **benar-benar diperlukan** agar WowoJump dapat bekerja.

Jangan mengubah:

```text
portfolio UI
routing utama
database
backend
authentication
```

WowoJump harus tetap menjadi game client-side.

---

# 33. DEFINITION OF DONE

WowoJump **BELUM BOLEH dianggap selesai** jika masih ada acceptance criteria yang belum terpenuhi.

Sebelum menyatakan selesai, lakukan pemeriksaan:

```text
GAMEPLAY       [x]
COIN           [x]
NYAWA          [x]
OBSTACLE       [x]
PLATFORM       [x]
PROCEDURAL     [x]
SCORE          [x]
DIFFICULTY     [x]
RESPONSIVE     [x]
DESKTOP        [x]
MOBILE         [x]
START SCREEN   [x]
HUD            [x]
GAME OVER      [x]
RESTART        [x]
LOCAL STORAGE  [x]
FEEDBACK       [x]
ASSET          [x]
PERFORMANCE    [x]
REACT/PHASER   [x]
CLEAN CODE     [x]
SCOPE          [x]
```

Jika ada item yang belum terpenuhi:

```text
JANGAN menyatakan project selesai.
```

Perbaiki terlebih dahulu.

Setelah semua terpenuhi, lakukan:

```text
1. npm run build
2. periksa error
3. periksa asset
4. periksa gameplay
5. periksa restart
6. periksa responsive
7. periksa console
8. pastikan project utama tidak rusak
```

Kemudian berikan laporan akhir:

```text
WOWOJUMP IMPLEMENTATION REPORT

Gameplay       [x]
Coin           [x]
Nyawa          [x]
Obstacle       [x]
Platform       [x]
Procedural     [x]
Score          [x]
Difficulty     [x]
Responsive     [x]
Mobile         [x]
Game Over      [x]
Restart        [x]
High Score     [x]
Performance    [x]
Build          [x]

Status:
READY
```

**Jangan memberikan status READY jika masih ada checklist yang belum terpenuhi.**


# 34. OUTPUT YANG SAYA INGINKAN DARI AI CODING AGENT

Sebelum menulis kode:

1. Analisis struktur `src/games/WowoJump/`.
2. Analisis asset yang tersedia.
3. Tentukan arsitektur implementasi.
4. Jelaskan file apa saja yang akan dibuat/diubah.
5. Jangan langsung mengubah file di luar scope.

Kemudian implementasikan secara bertahap.

Setelah implementasi:

1. Jalankan/check build.
2. Periksa error import.
3. Periksa asset path.
4. Periksa collision.
5. Periksa restart.
6. Periksa high score.
7. Periksa responsive.
8. Pastikan tidak ada perubahan yang tidak diperlukan pada project utama.

Jika menemukan masalah pada asset atau struktur existing project, **jangan menebak-nebak perubahan besar**.

Tampilkan masalah dan gunakan solusi paling kecil yang aman.

---

# 35. PRINSIP UTAMA GAME

WowoJump harus terasa seperti:

```text
"Main 30 detik"
       ↓
"Ah gampang"
       ↓
"Naik lagi"
       ↓
"Ambil coin"
       ↓
"Waduh ada Kopdes + sawit!"
       ↓
"KENAA!"
       ↓
"Masih punya 2 nyawa"
       ↓
"Naik lagi"
       ↓
"Score saya harus lebih tinggi"
       ↓
"MAIN LAGI"
```

Target utama bukan kompleksitas.

Target utama adalah:

**simple → fun → challenging → replayable.**

Implementasikan game dengan pendekatan yang bersih, modular, maintainable, dan mudah dikembangkan pada fase berikutnya.
