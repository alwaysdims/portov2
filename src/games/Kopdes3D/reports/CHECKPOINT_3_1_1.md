# Checkpoint 3.1.1 — Performance recovery & combat balancing

## A. Status dan Git

Status: PARTIAL — PERFORMANCE WORK REQUIRED. Branch `docs/kopdes3d-phase1`. Initial HEAD `4c2e880ff28cf3d48f570ce14fec1952547f0884`. Optimasi runtime terbatas memoization Environment statis; tidak ada boss, NPC baru, perubahan grafis, dependency, parameter combat atau deployment. Feature commit `c56808235d7dd59f60e4703a21b9f7cad039853a` dibuat setelah quality gates. Push pertama ditolak GitHub `Internal Server Error`; retry biasa berhasil dan remote feature SHA cocok. Receipt dokumentasi dan remote final tersedia pada laporan chat setelah commit dokumentasi. URL feature: https://github.com/alwaysdims/portov2/commit/c56808235d7dd59f60e4703a21b9f7cad039853a .

## B. Root cause dan batas bukti

Snapshot combat merender ulang subtree statis; array filter baru memicu layout effect batch kotak dan penandaan buffer matrix berulang. Delta versi instanceMatrix pada probe produksi 1202 menjadi nol; ini bukan jumlah transfer GPU. Dev probe 19,078 menjadi 45,188 FPS, p95 125 menjadi 35,9 ms. Production probe 56,318 menjadi 48,775 FPS, bukan peningkatan. CPU gl.render bukan GPU time. Detail hipotesis, trace, host CPU96%, hardware, warmup, viewport dan caveat berada di [PERFORMANCE_INVESTIGATION.md](PERFORMANCE_INVESTIGATION.md).

## C. Performance sebelum/sesudah

Semua baris adalah workload produksi sekitar60detik. Before dari tiga file current tersimpan, after dari optimized satu run. Combat/skill mencakup retry, remount dan approach; bukan skill aktif terisolasi. Host tak terisolasi dan jumlah siklus berbeda. MB=10^6byte; heap akhir bukan peak/retained heap. Angka after yang lebih buruk tetap dilaporkan, bukan dipilih ulang agar terlihat baik.

| Scenario | FPS before | FPS after | p95 before/after ms | Calls before/after | Heap before/after MB |
|---|---:|---:|---:|---|---|
|idle|60.008|50.755|16.9 / 18.4|74–74 / 74–74|55.80 / 119.66|
|movement|59.991|27.865|17.0 / 71.2|73–74 / 71–75|41.61 / 21.11|
|guard-combat|54.508|34.535|16.9 / 54.1|72–75 / 72–75|36.45 / 36.37|
|prison|55.924|39.146|16.8 / 36.7|72–83 / 72–83|51.41 / 42.09|
|ultimate|48.267|47.682|18.6 / 18.7|72–84 / 72–84|42.84 / 39.66|
|shopping|54.928|54.151|18.4 / 18.4|52–52 / 52–53|30.26 / 22.11|
|retry|41.905|33.254|36.3 / 71.2|74–74 / 74–74|35.05 / 27.50|

| Build | Scenario | N | Duration ms | FPS | Mean | Median | p95 | p99 | >50ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
|2.7|idle|2992|60373.0|49.559|20.18|17.8|18.5|54.1|41|
|2.7|movement|3344|60006.2|55.728|17.94|17.8|18.3|18.6|2|
|2.7|guard-combat|3295|60008.9|54.909|18.21|17.8|18.3|35.2|17|
|2.7|shopping|2571|60002.9|42.848|23.34|17.8|34.8|178.7|77|
|2.7|retry|2932|59997.0|48.869|20.46|17.8|18.7|89.0|69|
|3.1|idle|3601|60009.1|60.008|16.66|16.7|16.9|17.3|0|
|3.1|movement|3600|60009.0|59.991|16.67|16.7|17.0|17.3|0|
|3.1|guard-combat|3271|60009.0|54.508|18.35|16.7|16.9|33.2|23|
|3.1|prison|3355|59992.3|55.924|17.88|16.7|16.8|33.2|26|
|3.1|ultimate|2896|59999.7|48.267|20.72|17.8|18.6|89.3|51|
|3.1|shopping|3296|60005.5|54.928|18.21|17.8|18.4|18.7|7|
|3.1|retry|2514|59992.4|41.905|23.86|17.8|36.3|178.1|108|
|3.1.1|idle|3046|60013.4|50.755|19.70|17.7|18.4|54.6|44|
|3.1.1|movement|1672|60003.2|27.865|35.89|17.9|71.2|445.5|131|
|3.1.1|guard-combat|2072|59997.1|34.535|28.96|17.9|54.1|358.4|132|
|3.1.1|prison|2349|60006.7|39.146|25.55|17.8|36.7|250.3|115|
|3.1.1|ultimate|2861|60002.0|47.682|20.97|17.8|18.7|105.6|60|
|3.1.1|shopping|3249|59998.4|54.151|18.47|17.8|18.4|18.9|14|
|3.1.1|retry|1997|60053.2|33.254|30.07|17.9|71.2|409.1|157|

Baseline2.7 tidak mempunyai skillR/F. FPS idle49,559/movement55,728/combat54,909/interior42,848/retry48,869; rincian seluruh interval di tabel. Kesetaraan metode lebih baik daripada angka historis tetapi beban host, siklus dan state aktif belum dikunci penuh. Tidak menyimpulkan regresi skill atau pemulihan produksi terverifikasi.

## D. Combat balancing

Parameter runtime tidak berubah: tinju10/12/16, ompreng22/28, dashcooldown120tick dan i-frame2–8; Penjara120stun/720cooldown; ultimate66damage/1500cooldown; guard50HP/10damage dengan36/6/42tick attack. Simulasi20kasus memakai LOStrue, gerak planar dan kebijakan attack setiaptick; bukan menahan tombol nyata atau playtest manusia. Fist/tray/ultimate/prison-ultimate jarak1m membunuh pada104/57/40/78tick tanpa damage masuk. Ultimate66mengalahkan satu guard tetapi range/miss/cast interruption tetap risiko. Tidak menaikkan HP untuk menyembunyikan dominasi. Lihat [COMBAT_BALANCING.md](COMBAT_BALANCING.md).

Playtest browser nyata scripted: tinju/tray menang setelah mendekat, HP100; skenario tinju awal hanya berdiri pada batas jangkauan gagal memberi hit dan HPturun20, dipertahankan sebagai trial gagal. Stun immobility dan guard movement recovery lulus. Tidak ada cohort manusia; perubahan balancing belum beralasan kuat.

## E. Automated

Runner `tools/verify.mjs`:200KOPDES/16file +48existing node:test PASS;0FAIL/0SKIPPED. Tambahan5tes kebijakan balancing. Empat tes baru semula gagal karena yaw fixture tidak disamakan; diperbaiki yaw0,5/5lulus, kemudian runner lengkap lulus. Coverage existing mencakup fixed-step/stall, cooldown/stun/dedup, input/listener, physics/gate, checkout dan clock. Browser lifecycle menguji memo/no dirty-mark/retry/unmount.

Focused ESLint dan production build PASS. Global lint tetap8error/1warning existing. Global Vitest benar-benar dijalankan:6suiteFAILED/16passed,200testsPASS; node:test SeranganFajar bukan suiteVitest dan Phaser membutuhkanwindow. Ini bukan klaim globalPASS; runner existing48lulus terpisah. `git diff --check`, syntax check tiga tools CDP dan focused ESLint termasuk tools lulus. Tools portabel benar-benar diuji: lifecycle enam retry/lima reentry PASS (nol error/14 warning); benchmark subset idle 60 detik PASS (49,315 FPS/p95 18,5 ms; nol frame focus/visibility/context invalid). Kontrol negatif lifecycle pada build 2.7 tanpa memo gagal tepat pada versi matrix. Mode tujuh workload tool portabel belum dijalankan penuh; tabel utama berasal harness scratch.

## F. Browser QA

VERIFIED pada Chrome nyata produksi: movement/sprint, switch, tinju, ompreng, dash, Penjara, stun immobility/recovery, ultimate/gate, shopping, checkoutRp78.000, hasil, modal lockout dan retry. Stun tepat120tick dibuktikan coretests; browser mengecek posisi dan recovery, bukan presisi wall-clock. Enamretry dan limareentry satu dokumen mempertahankan timeOrigin, resetgame, nol dirty-mark matrix selama snapshot updates, dan listener game dilepas saat keluar. Geometries66/textures14stabil; heap25,63–41,11MB lalu30,00MB, bukan bukti leak-free sesi panjang.

Console lifecycle nolerror/sembilanwarning dependency THREE.Clock/Rapier. Uji strict warning-free gagal; warning dicatat, tidak disembunyikan. Screenshot cage menampilkan arena/VFX dan dua kartu HUD utuh; crop awal salah menunjukkan clipping. Pointer berbentuk crosshair berada di tombol kontrol; asal cursor/overlay belum dibuktikan sebagai bug game. Browser matrix/nativeEsc fisik tetap terbuka.

## G. Review

Independent subagent read-only: tidak ada P0/P1 pada runtime diff. Tiga P2 pelaporan: definisi metrik matrix/GPU, mixed workload, dan per-tick policy versus hold input. Dokumen diperbaiki oleh parent; re-review dokumentasi independen gagal karena provider HTTP 503/429 usage limit, sehingga tidak dihitung sebagai approval. Review tools menemukan dua P2 tambahan: navigasi root dengan embed eksternal dan sampler tertinggal setelah timeout. Keduanya diperbaiki; lobby lokal serta teardown dokumen diuji nyata. Follow-up P2 release gagal melewati navigasi diperbaiki dan ditutup review independen `deleg_463168d2`; injeksi timeout bersama release gagal tetap membuktikan documentTeardown true. Tiga P2 bukti diperiksa parent, bukan diberi approval palsu dari re-review provider yang gagal. Review balancing terpisah tidak menemukan P0/P1/P2. Memo tanpaprops sesuai subtree statis, context/cleanupRapier dan keyedPhysics tidak ditutup memo.

## H. Known issues

Movement after27,865FPS dan retry33,254FPS; spikes produksi/host belum terisolasi. Tidak ada benchmark GPUtimer atau retainedheap panjang. Dependency warnings dan kegagalan globalVitest/lint existing tetap. VFXplaceholder, bukan aset final. Tidak ada perubahan atau staging SeranganFajar/setup-phase2 pengguna. Tidak ada deployment.

## I. Keputusan

PARTIAL — PERFORMANCE WORK REQUIRED. Penghilangan kerja statis dan dev improvement terukur; produksi tidak membuktikan30FPSstabil seluruhskenario. Ulangi baseline/after bergantian pada host tenang dan workload cast terisolasi sebelum ekspansi boss. Checkpoint3.2 belum dimulai dan memerlukan evaluasi pengguna.

## J. Ringkasan

Laporan chat akhir memuat ringkasan faktual250–400kata beserta commit/remote receipt setelah pengiriman. Dokumen ini tidak menggantikan laporan langsung di chat.
