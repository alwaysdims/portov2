# Combat Balancing — Checkpoint 3.1.1

## Keputusan dan parameter tetap

Parameter `combatConfig.js` dipertahankan. HP pemain tetap 100 dan HP satu guard tetap 50. Data simulasi menunjukkan kekuatan serta batas strategi, tetapi belum membuktikan kebutuhan nerf untuk pemain manusia. Tidak ada inflasi HP untuk memperpanjang pertarungan atau menutupi masalah tempo.

Semua waktu berikut memakai tick simulasi, dengan acuan 60 tick per detik. Urutan timeline adalah windup/active/recovery; jangkauan memakai satuan dunia.

| Aksi | Damage | Timeline (tick) | Jangkauan | Sudut setengah | Cooldown (tick) |
| --- | --- | --- | --- | --- | --- |
| Fist 1 | 10 | 8/4/10 | 1.2 | 35° | Tidak terpisah; mengikuti timeline |
| Fist 2 | 12 | 7/4/10 | 1.2 | 35° | Tidak terpisah; mengikuti timeline |
| Fist 3 | 16 | 10/5/16 | 1.3 | 40° | Tidak terpisah; mengikuti timeline |
| Tray 1 | 22 | 14/6/18 | 1.8 | 60° | Tidak terpisah; mengikuti timeline |
| Tray 2 | 28 | 18/6/24 | 1.9 | 65° | Tidak terpisah; mengikuti timeline |
| Guard | 10 | 36/6/42 | 1.3 | 45° | Tidak terpisah; mengikuti timeline |
| Prison | Tidak memberi damage | 18/1/18 | 5 | 75° | 720 |
| Ultimate | 66 | 39/3/36 | 3 | 180° | 1500 |

Toleransi tinggi seluruh aksi tersebut tetap 1. Prison memberi stun 120 tick sebelum resistansi target diterapkan. Ultimate memiliki knockback 1.2 selama 12 tick jika target bertahan. Dash tetap menempuh 2.8 selama 12 tick, cooldown 120 tick, dengan iframe pada umur dash 2–8 inklusif. Hurt berlangsung 12 tick; invulnerabilitas pemain setelah terkena hit berlangsung 24 tick.

## Hasil simulasi murni

Sumber hasil adalah `kopdes311-balancing.json` di scratch; logika dibandingkan dengan `combat.js` dan fixture `tests/combatBalancing.test.js`. Tabel memuat 20 hasil deterministik, bukan 20 peserta atau sesi manusia. Jarak adalah jarak awal; guard tetap mengejar.

Kebijakan `fist` dan `tray` menyuntikkan `attack:true` pada setiap tick. Ini kebijakan otomatis maksimal, bukan menahan tombol game: input nyata memakai edge keydown non-repeat. `ultimate` hanya dicoba pada awal duel. `prison-ultimate` membuka dengan prison, lalu mencoba ultimate setelah cast selesai selama guard masih stun. `no-action` tidak memberi perintah. Pemain tidak berjalan atau dash. Tick akhir menunjukkan kematian salah satu pihak, bukan selalu waktu membunuh guard.

| Jarak awal | Strategi | Tick akhir | HP pemain | HP guard | Hasil |
| --- | --- | --- | --- | --- | --- |
| 1 | fist | 104 | 100 | 0 | Guard mati |
| 1 | tray | 57 | 100 | 0 | Guard mati |
| 1 | ultimate | 40 | 100 | 0 | Guard mati |
| 1 | prison-ultimate | 78 | 100 | 0 | Guard mati |
| 1 | no-action | 804 | 0 | 50 | Pemain mati |
| 1.8 | fist | 393 | 70 | 0 | Guard mati |
| 1.8 | tray | 57 | 100 | 0 | Guard mati |
| 1.8 | ultimate | 40 | 100 | 0 | Guard mati |
| 1.8 | prison-ultimate | 78 | 100 | 0 | Guard mati |
| 1.8 | no-action | 817 | 0 | 50 | Pemain mati |
| 3 | fist | 393 | 70 | 0 | Guard mati |
| 3 | tray | 101 | 100 | 0 | Guard mati |
| 3 | ultimate | 40 | 100 | 0 | Guard mati |
| 3 | prison-ultimate | 78 | 100 | 0 | Guard mati |
| 3 | no-action | 847 | 0 | 50 | Pemain mati |
| 4.5 | fist | 532 | 60 | 0 | Guard mati |
| 4.5 | tray | 143 | 100 | 0 | Guard mati |
| 4.5 | ultimate | 884 | 0 | 50 | Ultimate meleset; pemain mati |
| 4.5 | prison-ultimate | 1014 | 0 | 50 | Ultimate meleset; pemain mati |
| 4.5 | no-action | 884 | 0 | 50 | Pemain mati |

## Kekuatan dan counterplay

Ultimate ber-damage 66 dapat membunuh satu guard ber-HP 50 dalam satu hit. Tray juga lethal dalam dua hit yang mengenai target, dengan damage 22 dan 28; seluruh duel tray di atas berakhir tanpa kehilangan HP pemain. Ini kekuatan nyata pada fixture, bukan bukti keseimbangan seluruh permainan. Fist lebih sensitif terhadap jarak dan interupsi: pada jarak awal 1.8 dan 3 pemain berakhir dengan HP 70, sedangkan pada 4.5 tersisa 60.

Windup dan recovery membatasi tempo. Hit yang diterima menghentikan serangan atau cast; cast tidak memberi kekebalan otomatis. Cooldown skill mulai saat cast diterima dan tidak dikembalikan jika meleset atau terinterupsi. Prison dapat menghentikan aksi guard untuk menyiapkan ultimate, tetapi memakai cooldown kedua skill. Pada jarak awal 4.5, stun tidak mendekatkan guard ke jangkauan ultimate; rangkaian tersebut tetap gagal memberi damage. Counterplay interupsi berasal dari mekanik kode, bukan pengukuran perilaku manusia. Dash menyediakan opsi menghindar dengan jendela iframe terbatas dan biaya cooldown, tetapi tidak dipakai dalam 20 simulasi ini.

## Batas bukti dan tindak lanjut

Fixture memakai `LOS=true`, gerak planar, tinggi sejajar, arah awal pemain `yaw=0`, dan tanpa dinding atau collision Rapier. Perintah serang setiap tick merupakan kebijakan ideal otomatis, bukan input hold browser; kamera, reaksi, kesalahan input, keterbacaan telegraph, navigasi, serta pengalaman perangkat belum terukur. Fixture bukan playtest manusia dan tidak mewakili cohort pengguna.

Playtest scripted browser produksi oleh agen induk lulus untuk tinju, ompreng, stun immobility dan gerak guard setelah pulih (`kopdes311-combat-qa2.log`). Kedua kemenangan memakai gerak mendekat dan berakhir HP 100. Trial tinju awal yang hanya berdiri di batas range tidak memberi damage dan berakhir HP 20; trial gagal tidak dihapus. Walkthrough R/F, gate dan checkout juga lulus (`kopdes311-walk.log`). Ini verifikasi browser nyata, bukan playtest cohort manusia. Nerf damage, jangkauan, timeline, cooldown, atau dash baru layak dipertimbangkan setelah kebutuhan pemain manusia terukur. HP tidak dinaikkan sebagai jalan pintas balancing.
