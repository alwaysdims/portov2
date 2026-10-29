# Performance investigation — Checkpoint 3.1.1

Status: PARTIAL. Tidak ada klaim regresi skill 3.1 terbukti atau pemulihan produksi menyeluruh. Angka berikut adalah observasi lokal, bukan hasil perangkat pengguna secara umum.

## Metodologi dan lingkungan

Chrome 156.0.8078.49, Windows 11, Intel Core i3-1115G4, Intel UHD Graphics (driver 31.0.101.4255), RAM terdeteksi 8.269.701.120 byte. Browser terisolasi, tanpa menonaktifkan keamanan. Viewport emulasi 1280×800, DPR 1; drawing buffer aktual 960×610 pada benchmark utama. Canvas bukan seluruh viewport. Mode production static preview pada port 4173; baseline Phase 2.7 pada 4174. Baseline dibangun dari detached worktree commit `5aa7334dc332884bae75e5d774796c574b4b4dfc`; source utama sebelum optimasi `4c2e880ff28cf3d48f570ce14fec1952547f0884`. Tidak melakukan checkout destruktif.

Warmup minimum 5 detik, sampel rAF berurutan sekitar 60 detik per skenario. FPS = 1000 × jumlah interval / jumlah milidetik interval. Mean menggunakan interval yang sama; median/p95/p99 memakai distribusi interval, bukan rerata FPS sesaat. Long frame berarti interval >50 ms; raw JSON juga menyimpan >100 ms. Tidak ada build atau test suite dijalankan bersama benchmark. CDP menaruh tab di depan; focus/visibility tercatat pada batas sampel, bukan bukti tidak berubah sepanjang sampel. Refresh aktual tidak diukur secara terpisah; plateau sekitar 60 FPS konsisten dengan pacing rAF, bukan bukti refresh panel tepat 60 Hz.

Idle dan interior adalah posisi tetap. Movement berganti W/S. Guard, Penjara dan ultimate adalah workload encounter campuran: input, retry/remount, aktivasi pointer lock, pendekatan arena, cast dan waktu tunggu. Bukan biaya skill terisolasi selama 60 detik. Harness awal tidak mengassert hit/cast setiap siklus. Ultimate dapat membunuh satu guard; sisa siklus bukan skill aktif. Baseline 2.7 tidak mempunyai R/F, sehingga tidak ada padanan skill identik. Jumlah siklus berbeda antar run dan dicatat pada evidence; perbandingan bukan eksperimen kausal sempurna.

Run current pertama berhenti setelah empat sampel karena `Controls lost`; run resume menyimpan ultimate lalu gagal `Movement blocked z`; percobaan interior berikut juga gagal. Run pengganti interior/retry lulus setelah menunggu aktivasi input. Sampel tersimpan yang lengkap dipertahankan, bukan menyebut seluruh run awal PASS.

## Root cause dan optimasi terbatas

VERIFIED dari source dan runtime: publish snapshot combat merender parent; subtree Environment statis ikut dirender. Boxes membuat array filter baru; effect BoxBatch mengisi ulang matrix dan menghitung bounding sphere. Delta `instanceMatrix.version` pada batch kotak mencapai 1.202 selama sampel produksi, 675 pada dev. Dua foliage batch sudah tetap nol. Ini versi/dirty-mark buffer, BUKAN jumlah transfer GPU yang diukur.

Perubahan runtime hanya `memo(Environment)` tanpa props/comparator. Gate, aktor, highlight, kamera dan simulation clock tetap di luar subtree statis. Context Rapier tetap diperbarui; pergantian key Physics tetap meremount dan membersihkan world. Tidak menurunkan DPR, shadow, jumlah objek, kualitas visual atau fixed-step.

| Probe 60 detik | FPS | Mean ms | p95 ms | CPU gl.render mean ms | Delta versi batch kotak |
|---|---:|---:|---:|---:|---:|
| Production sebelum |56.318|17.756|18.3|2.488|1202|
| Dev sebelum |19.078|52.415|125.0|2.516|675|
| Dev sesudah |45.188|22.130|35.9|2.232|0|
| Dev sesudah ulang |45.423|22.015|36.0|2.221|0|
| Production sesudah |48.775|20.502|18.5|4.016|0|

`gl.render` di atas adalah durasi sinkron CPU, bukan waktu GPU ataupun seluruh frame. Dev membaik dalam pasangan tersebut dan pekerjaan matrix berulang hilang. Produksi tidak menunjukkan kemenangan FPS; jangan memasarkan hasil sebagai percepatan produksi. Memo dipertahankan karena penghilangan kerja statis terverifikasi dan perbaikan dev besar, bukan karena target produksi tercapai.

Host pada run sesudah menunjukkan CPU total 96%. Pengukuran delta proses dua detik memperlihatkan Brave 1,421875 CPU-seconds, Node 0,671875, Chrome renderer/GPU sekitar 0,42/0,41; Roblox juga aktif. Tidak menghentikan aplikasi pengguna. Bukti ini menunjukkan beban tak terisolasi, bukan atribusi semua spike kepada satu proses. GPU bottleneck, thermal throttling, GC sebagai penyebab utama, biaya double camera cast, dan overhead React dev detail belum terisolasi. CPU profile dan retry trace tersedia; kategori trace nested tidak boleh dijumlahkan sebagai biaya eksklusif.

## Acceptance

PARTIAL: tidak ada bukti pemulihan stabil 60 FPS atau minimum 30 FPS di seluruh skenario. Movement sesudah 27,865 FPS. p95 ultimate/prison lebih rendah dibanding angka historis 3.1, tetapi mode, viewport dan durasi skill historis tidak setara. Tidak ada klaim kausal dari selisih tersebut. Run sebanding 2.7 juga berfluktuasi; tidak terbukti regresi besar skill baru dari angka historis 60 ke 19,804.

Enam retry dan lima route reentry satu dokumen memulihkan geometries 66/textures 14. Heap sampel bergerak sekitar 25,63–41,11 MB lalu 30,00 MB, bukan tumbuh monoton. Ini tidak membuktikan bebas leak untuk sesi panjang; forced-GC retained heap dan GPU memory belum diukur. Listener document game dilepas ketika route keluar. Browser menangkap nol runtime error pada uji lifecycle, tetapi sembilan warning dependency Clock/Rapier; tidak mengklaim console bersih.

Bundle Phase 2.7: 3.227.034 byte, gzip Node 1.095.896. Sesudah: 3.237.541 byte, gzip Node 1.098.634. Selisih meliputi fitur 3.1, bukan biaya memo sendiri. Default gzip Node bukan pengaturan gzip estimator Vite.

## Bukti dan reproduksi

Evidence lokal: `C:/Users/ASUS/AppData/Local/hermes/cache/scratch/kopdes311-*.json`, `kopdes311-render-*.log`, `kopdes311-current-profile.log`, `kopdes311-retry-trace.json`, dan walkthrough/screenshots. Angka lengkap diringkas dalam tabel evidence laporan checkpoint. Tools benchmark/lifecycle memakai CDP native Node tanpa dependency baru. Gunakan profil Chrome khusus dan production preview; jangan menjalankan build bersamaan. Konfigurasikan `KOPDES_CDP`, `KOPDES_URL`, `KOPDES_OUTPUT` sebagaimana tool terkait. Jangan attach browser harian berisi kredensial.

Tools portabel diuji nyata: `tools/lifecycle.mjs` lulus enam retry/lima same-document reentry, exact listener window/document, matrix tetap, context lost, scene kosong dan geometries nol setelah unmount. Counter internal texture 3/program 7 tersisa pada renderer nonaktif; bukan bukti driver memory direklamasi atau leak. Strict zero-counter trial gagal dan dicatat. Lifecycle final menangkap nol error/14 warning dependency. `tools/benchmark.mjs` diuji idle 60 detik: 49,315 FPS/p95 18,5 ms, nol frame invalid focus/visibility/context, sembilan warning. Mode tujuh skenario tersedia tetapi tool portabel belum dijalankan penuh; tabel utama memakai harness scratch sebelumnya. Kontrol negatif tool lifecycle terhadap build 2.7 tanpa memo gagal tepat pada matrix version (12 menjadi 54), membuktikan assertion menangkap kerja berulang.

Review tools menemukan dua P2: setup root memicu embed eksternal dan sampler bisa tertinggal setelah timeout CDP. Setup kini langsung lobby lokal; network guard tetap aktif. Failure benchmark menavigasi dokumen khusus ke lobby dan memeriksa dokumen siap tanpa canvas, sehingga sampler/observer dokumen lama musnah. Uji real Chrome sesudah fix: idle 60 detik 51,667 FPS/p95 18,5 ms, nol error/tiga warning. Uji injeksi timeout memakai salinan scratch dengan batas CDP 10 detik menghasilkan exit 1 `CDP timeout: Runtime.evaluate` dan `documentTeardown: true`, sesuai harapan. Ini tes jalur gagal, bukan benchmark FPS. Follow-up review menemukan release gagal bisa melewati navigasi. Release kini dicatat secara terpisah; injeksi gabungan timeout dan `injected release failure` menghasilkan exit 1 yang diharapkan serta `documentTeardown: true`.

Reproduksi: buka satu tab Chrome profil terpisah pada URL produksi, lalu jalankan `node src/games/Kopdes3D/tools/benchmark.mjs` dan, secara terpisah, `node src/games/Kopdes3D/tools/lifecycle.mjs`. Set `KOPDES_OUTPUT` ke path JSON absolut atau gunakan `TMPDIR`; `KOPDES_SCENARIOS=idle` memilih subset tanpa mengubah durasi 60 detik. Gunakan `KOPDES_URL` untuk baseline yang tidak memiliki skill dan pilih `idle,movement,guard-combat,shopping,retry`. Tools tidak menambahkan hook state simulasi.

Langkah tersisa: ulangi pasangan sebelum/sesudah bergantian pada host tenang, catat visibility dan beban sepanjang interval, pisahkan active cast dari reset, gunakan repeated trials dan profil CPU/GPU/retained heap. Checkpoint 3.2 belum diizinkan.
