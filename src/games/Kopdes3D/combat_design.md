# Combat, enemy AI, dan boss

## Kontrak aktif Checkpoint 3.1

Instruksi 3.1 menggantikan angka usulan Phase 1 untuk dua skill saja. `combatConfig.js` menjadi sumber balancing runtime; tabel historis berikut tetap referensi rancangan, bukan konfigurasi aktif.

| Skill | Windup/active/recovery | Cooldown | Efek |
|---|---|---|---|
| R · Penjara Ompreng | 18/1/18 tick | 720 tick / 12 detik | Stun 120 tick / 2 detik, range 5 m, cone depan half-angle 75°, toleransi tinggi 1 m, LOS statis |
| F · Pukulan Keras Ompreng MBG | 39/3/36 tick | 1500 tick / 25 detik | Damage 66 (3× pukulan ompreng pertama), radius 3 m, toleransi tinggi 1 m, LOS; knockback 1,2 m selama 12 tick melalui character controller |

Q tetap ganti stance; 1/Space tetap dash; E tetap interaksi; klik kiri/J basic. `KEY_BINDINGS` dalam `combatInput.js` adalah sumber binding dan hint HUD. Tidak ada remapping Q ke dash. Penjara memilih musuh hidup terdekat dalam cone hadap dan LOS; ID stabil memecah jarak sama. Core menerima targetId eksplisit untuk pemanggil/test, bukan sistem lock-on UI baru.

Cooldown dibayar ketika CAST diterima; HURT/STUNNED/DEAD membatalkan marker tanpa refund. ATTACK/DASH tidak memotong CAST; Q mengantre stance hingga recovery legal. Aktif simulation ticks menghitung cooldown, stun, cast dan VFX; pause, pointer unlock, blur dan modal membekukan seluruh timeline tanpa catch-up wall time. Saat SHOPPING, input skill ditolak pada listener dan command adapter.

Target yang sudah stun tidak menerima perpanjangan stun. `stunResistance` 0..1 mengurangi durasi secara deterministik; 0 menghasilkan tepat120 tick, 1 kebal. Mekanisme diminishing120/60/30/immunity dari rancangan boss lama belum diaktifkan: kebijakan boss diputuskan pada3.2, tanpa boss pada3.1. Ultimate memakai hitTargets per cast; tiga active ticks tidak memberi damage ganda. Knockback ditahan collider, bukan teleport.

Semua bentuk kurungan, pose, glow, ring, hit flash dan damage number adalah PROCEDURAL PLACEHOLDER. Efek tidak mengubah damage; marker fixed-step menjadi otoritas. Shake kecil melalui clamp kamera, dapat dimatikan lewat Kurangi gerak kamera. Tidak ada aset final/audio/boss/level baru. Detail pengujian, rekonsiliasi baseline2.7 dan keterbatasan ada pada laporan3.1.


Status: spesifikasi, bukan sistem yang sudah berjalan. Durasi dinyatakan dalam tick simulasi 60 Hz; jarak dalam meter.

## Simulasi dan hit detection

Satu fixed-step 1/60 detik menjadi sumber waktu combat, cooldown, AI, timer level, dan marker animasi. Input dikumpulkan ke command dengan nomor tick. Batasi catch-up lima tick/frame dan pause pada kehilangan fokus; jangan memakai `Date.now()`, `setTimeout`, atau callback animation mixer sebagai otoritas damage.

Urutan tick: baca input, resolve transition/cancel, gerak kinematic dan physics, snapshot transform, advance timeline attack/skill, kumpulkan kandidat overlap, filter, terapkan damage berurutan berdasarkan attackerId/attackId/targetId, lalu resolve death/gate/reward. Query hit menggunakan pose setelah physics pada tick yang sama. Transform dan ID tidak dibaca dari React render yang terlambat.

Setiap swing mempunyai `attackId`, owner, hitIndex, faction, tick awal, windup, active, recovery, range, half-angle, damage, dan set target yang sudah terkena. Hitbox sederhana berupa swept sphere/capsule dari socket sebelumnya ke socket sekarang, dengan batas sektor pada bidang XZ, toleransi tinggi, dan line-of-sight terhadap dunia. Damage hanya pada active ticks. Perhitungan sektor memakai dot product, bukan hasil visual mesh. Query broadphase Rapier mencari kandidat; fungsi murni memfilter jarak, sudut, tinggi, faction, invulnerability, obstruction, dan deduplikasi. Collider senjata tidak memberi damage lewat event fisika kedua.

Target tepat pada batas range/angle termasuk hit dengan epsilon tetap 0,0001 meter. Satu hitIndex hanya mengenai target sekali; combo hit berbeda boleh mengenai target lagi. Snapshot kandidat dan urutan stabil menghindari order render menentukan kill/reward. Deterministik berarti input, konfigurasi, tick, seed, dan snapshot query yang sama menghasilkan hasil sama pada build yang diuji; tidak menjanjikan replay bit-identical lintas browser atau versi Rapier. Tidak ada networking/rollback.

## State pemain

| State | Masuk/keluar dan pembatasan |
|---|---|
| IDLE | Input gerak masuk MOVE; attack/dash/cast hanya jika valid |
| MOVE | Input nol kembali IDLE; sprint bukan state terpisah |
| ATTACK | Timeline windup/active/recovery; buffer satu combo, lalu kembali IDLE/MOVE |
| DASH | Gerak terarah dan i-frame; akhir kembali IDLE/MOVE |
| CAST | Penjara atau ultimate; timeline sendiri, resource dibayar saat cast diterima |
| STUNNED | Gerak/attack/cast terkunci; durasi finite, lalu IDLE |
| HURT | Reaksi hit 12 tick; damage baru tetap mengikuti i-frame |
| DEAD | Terminal sampai retry; collider damage dan input dimatikan |

Prioritas: DEAD, STUNNED, HURT, aksi aktif, MOVE/IDLE. Hit mematikan selalu menang. HURT dapat memutus ATTACK/CAST sebelum marker damage; marker yang dibatalkan tidak boleh tertinggal. Dash kebal damage pada window yang ditentukan, bukan kebal collider. HURT memberi i-frame 24 tick sejak damage sah agar overlap tidak menguras HP per frame. Pemain mulai HP 100; walk 3,5 m/s, sprint 5,5 m/s, tanpa stamina pada slice.

Switch stance langsung ketika IDLE/MOVE. Pada ATTACK/CAST/DASH, simpan satu `pendingStance`, tampilkan indikator antrean, dan terapkan pada batas recovery yang legal. Permintaan berikutnya mengganti pilihan antrean. Input tidak mereset cooldown, hit set, atau attackId. Death membersihkan buffer. UI menampilkan pilihan tertunda agar respons tidak terasa hilang.

## Senjata dan skill

| Aksi | Damage | Windup/active/recovery | Range dan aturan |
|---|---:|---|---|
| Tinju 1 | 10 | 8/4/10 tick | 1,2 m, half-angle 35 derajat |
| Tinju 2 | 12 | 7/4/10 tick | 1,2 m, half-angle 35 derajat |
| Tinju 3 | 16 | 10/5/16 tick | 1,3 m, half-angle 40 derajat, knockback 0,6 m |
| Ompreng 1 | 22 | 14/6/18 tick | 1,8 m, half-angle 60 derajat |
| Ompreng 2 | 28 | 18/6/24 tick | 1,9 m, half-angle 65 derajat, knockback 0,9 m |
| Dash | 0 | total 12 tick | 2,8 m; cooldown 120 tick; i-frame tick 2–8 inklusif |
| Penjara Ompreng | 0 | 24/1/18 tick | target <=5 m, cooldown 600 tick |
| Pukulan Ompreng | 65 | 54/1/36 tick | radius 3,5 m; cooldown 1200 tick; knockback 1,8 m |

Combo buffer menerima satu klik dalam 10 tick terakhir recovery. Window habis memulai combo baru; tahan klik tidak otomatis mengulang seluruh combo. Tidak ada cancel saat active. Dash boleh membatalkan 6 tick terakhir recovery ATTACK; tidak memotong windup ultimate. Cooldown dihitung dari aksi diterima, sehingga interrupt tetap menghabiskannya. Damage skill memakai marker active yang sama dengan VFX/animasi.

Dash memakai vektor input ternormalisasi relatif yaw kamera; tanpa input memakai arah hadap. Diagonal tidak lebih cepat. Gerak tiap tick memakai kinematic character controller dengan shape cast/slide; tidak teleport melewati pintu atau tembok. Ujung dash dihalangi collision, bukan diperpanjang untuk mencapai jarak nominal. Knockback memakai mekanisme collision yang sama.

Penjara memilih target hidup yang terlihat, paling dekat dengan arah bidik dalam cone half-angle 35 derajat; tie-break jarak lalu ID. Pemilihan dikunci saat cast, diverifikasi lagi pada active tick. Target hilang/menjauh menghasilkan miss tanpa refund. Kurungan adalah visual non-solid, tidak menjebak pemain secara fisik. Stun pertama 120 tick (2 detik), berikutnya 60, berikutnya 30 bila diterapkan dalam 600 tick sejak stun terakhir selesai. Target kebal aplikasi baru selama 180 tick setelah stun berakhir; tidak boleh refresh atau menumpuk stun aktif. Setelah 600 tick bebas stun, resistance reset. Boss mengikuti aturan sama pada window rentan; phase transition dan ultimate windup ditandai immune dengan ikon. Maksimum stun tetap 2 detik, tidak ada permanent stun-lock.

Ultimate mengunci pusat saat windup diterima, menampilkan lingkaran dan ompreng membesar. Pada tick 54 satu pulsa damage menggunakan radius dunia yang sama dengan telegraph. Line-of-sight mencegah damage menembus dinding. Pemain yang HURT/DEAD sebelum tick aktif membatalkan pulsa. Tidak ada damage dari frame VFX sesudah pulsa. Tombol cooldown dan audio memberi umpan balik saat cast ditolak.

## Penjaga

Semua penjaga: jas hitam, kemeja putih, dasi merah, peci hitam. Fast lebih ramping, Elite memakai bahu lebih lebar dan emblem berbeda; warna bukan pembeda tunggal.

| Tipe | HP dasar | Speed | Damage | Windup/active/recovery | Peran |
|---|---:|---:|---:|---|---|
| Melee Guard | 50 | 2,4 m/s | 10 | 36/6/42 tick | Mengajari telegraph dan punish |
| Fast Guard | 40 | 3,4 m/s | 8 | 27/4/36 tick | Mendekat cepat, rentan setelah miss |
| Elite Guard | 90 | 2,2 m/s | 18 | 48/8/54 tick | Dua hit dengan jeda 18 tick, indikator tiap hit |

AI: `IDLE`, `PATROL`, `DETECT`, `CHASE`, `TELEGRAPH`, `ATTACK`, `RECOVER`, `STUNNED`, `DEAD`. DETECT butuh line-of-sight <=8 m selama 12 tick; kehilangan target >180 tick atau jarak >14 m kembali patrol lewat waypoint. CHASE berhenti pada jarak serang 1,3 m melee/fast, 1,8 m elite. TELEGRAPH mengunci arah saat mulai, tanpa tracking mendadak pada active. Attack selesai wajib RECOVER sebelum memilih pola baru. STUNNED menghentikan gerak dan membatalkan attack sebelum active; DEAD terminal dan tidak meninggalkan hitbox.

Waypoint preset dan direct steering dengan shape cast/slide cukup untuk slice. Musuh yang macet 120 tick kembali ke waypoint terakhir; jangan teleport dekat pemain. Spawn harus di lantai navigable, di luar collider, >=5 m dari pemain, dan melalui telegraph 60 tick. Encounter mempunyai daftar musuh wajib; musuh antre tetap dihitung agar pintu tidak terbuka sebelum wave selesai.

Cap musuh aktif: 1 pada slice, 3 chapter 1, 4 chapter 2, 5 chapter 3; boss mengisi satu slot. Maksimum dua musuh boleh menyerang serentak; slice satu. AI yang lain mencari posisi tanpa menabrak pemain. Spawn tertunda saat cap penuh, tidak ditumpuk pada satu titik.

## Framework boss

Boss memakai state AI yang sama ditambah metadata phase dan pola terjadwal. UI memperlihatkan nama, HP, fase, ikon immunity, dan pola telegraph. Phase hanya maju, satu kali per threshold; pergantian terjadi setelah active selesai atau sebelum attack berikutnya, lalu transisi 90 tick tanpa damage. HP tidak diisi ulang. Phase transition membersihkan marker tertunda dan memakai immunity yang terlihat. Cooldown summon tidak reset oleh fase/stun. Tidak ada damage contact tanpa attack.

| Boss | HP dasar / fase | Pola dan celah |
|---|---|---|
| Lilbah, level 10 | 420; fase 2 pada <=50% | Melee dua hit 12+14 dengan windup 42 tick; dash 18 damage, lane 4 m, windup 60; summon dua melee, cooldown 1200 tick |
| Kabdy, level 20 | 560; fase 2 pada <=50% | Combo 3x10, windup 36 lalu gap 18; slam radius 2,8 m, 22 damage, windup 72; summon melee+fast, cooldown 1080 tick |
| Wowo, level 30 | 760; fase 2 <=65%, fase 3 <=30% | Heavy 26 damage windup 60; area 24 damage radius 3,5 m windup 90; summon dua elite cooldown 1500; ultimate fase 3 radius 5 m, 38 damage, windup 120 dan cooldown 1800 tick |

Lilbah fase 1 berurutan combo, dash, recover; fase 2 menambahkan summon pada siklus legal. Combo memberi recovery 60 tick; dash yang miss memberi 90 tick. Kabdy mengurut combo, area, recover, lalu summon bila siap; fase 2 memakai dua combo terpisah oleh telegraph baru, tidak serangan tanpa jeda. Combo recovery 60 tick; area recovery 90 tick. Wowo fase 1 heavy dan area, fase 2 menambah summon, fase 3 menyisipkan ultimate maksimal sekali per cooldown; ultimate memberi recovery 120 tick. Active heavy 6 tick, dash 12, area/ultimate satu pulsa; setiap combo hit mempunyai hitIndex sendiri. Boss damage dan HP memakai multiplier level pada level_design, bukan perkalian berulang per fase.

Telegraph lane/lingkaran memakai pusat dan ukuran hitbox aktual, dengan countdown dan audio. Tidak memperpendek minimum windup pada fase berikutnya. Arena mempunyai ruang di luar ultimate dan jalur menghindar yang tidak terblokir spawn. Summon memakai dua titik bertanda, <=2 minion milik boss pada satu waktu, serta cap global. Jika cap penuh, lewati summon tanpa membuat antrean tak terbatas; coba lagi setelah cooldown. Tidak boleh spawn ketika DEAD atau transisi.

Pada HP nol: ubah DEAD sekali, hentikan AI dan marker, hilangkan hitbox, hentikan summon, lalu animasi defeat 120 tick. Boss tidak dapat distun atau diberi reward lagi. Minion milik boss mundur/despawn tanpa reward tambahan. Setelah defeat selesai dan tidak ada musuh wajib lain, emit `encounterCleared(runId, levelId, bossId)`, tandai boss defeated, simpan checkpoint, dan buka KOPDES. Reward EXP level tetap hanya saat checkout; boss bonus masuk satu reward konfigurasi. Wowo mempunyai klip defeat khusus dan epilog setelah belanja, bukan akhir permainan sebelum belanja.

## Tes wajib

- Hit pada batas sektor/range, target di belakang, beda tinggi, tertutup tembok, friendly, DEAD, dan i-frame.
- Satu damage per hitIndex, combo berikutnya boleh hit, attack batal tidak memicu marker lama.
- Command dan snapshot identik menghasilkan damage/urutan event identik; render rate 30/60/120 tidak mengubah jumlah tick.
- Dash delapan arah, diagonal sama jauh, tanpa input, menabrak tembok/pintu, cooldown dan i-frame boundary.
- Switch berulang saat attack/cast/death; tidak menggandakan damage atau melewati recovery.
- Stun 120/60/30 tick, immunity 180 tick, reset resistance, target hilang, boss immune, tanpa stun-lock.
- Semua threshold boss, cap summon, cooldown lintas fase, recovery, interruption, reward/gate sekali saja.
