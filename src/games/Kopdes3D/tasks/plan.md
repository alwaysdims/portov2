# Rencana implementasi KOPDES 3D

## Checkpoint 2.5 — Objective, gate, interaksi (status terbaru)

Scope hanya Kopdes3D, tanpa dependency baru, checkout/boss/save atau commit/push subagent. Implementasi selesai: objective pure, required guard death idempotent, gate fixed-tick solid sampai OPEN, reusable nearest radius/LOS/stable tie, E edge bersama input combat, BR qty1/14000/stok6 dan temporary cart, HUD/highlight/reset.

Verifikasi parent Node v26.9.0: 48 existing + 100 KOPDES = 148 PASS, 0 FAIL, 0 SKIPPED; focused lint/build dan diff whitespace PASS. Global lint tetap 8 errors + 1 warning existing. Real Rapier membuktikan gate blocking/open dan LOS; browser scene/HUD awal smoke VERIFIED, combat/gate/pickup/retry browser final NOT TESTED. Review independen read-only: 0 P0/P1/P2; publication receipt dicatat setelah push. Final browser DOM terbaca, screenshot putih; walkthrough NOT TESTED. Lihat [laporan 2.5](../reports/CHECKPOINT_2_5.md), bagian A–G.

Checkpoint 2.6 hanya rekomendasi checkout atomik sesudah persetujuan berikutnya; belum diimplementasikan. Bagian 2.4 dan sebelumnya di bawah historis.

## Checkpoint 2.4 — Basic combat (aktif)

Handover HEAD `8564613fac9fc7bb3b61502d4c583b1095173d5a` cocok dengan remote. Instruksi terbaru mengizinkan 2.4 dan commit/push setelah quality gates, bukan 2.5 atau deploy.

1. Audit dokumen, Git, perubahan pengguna, controller/physics/environment dan baseline: selesai.
2. Combat fixed-step, combo dua stance, dash dan satu guard: selesai; 27 unit tests combat PASS.
3. Input lifecycle, placeholder visual dan HUD: terintegrasi; lint/build awal PASS.
4. 114 tests, focused lint/build PASS; Codex review tanpa P0/P1/P2 setelah tiga perbaikan; dua temuan engine independen diperbaiki dengan regresi. Browser combat smoke VERIFIED; full visual/lifecycle NOT VERIFIED.
5. Laporan dan scoped feature commit `f2fb51fa262f77fbe596e109f36ec736b9510575` dipush ke branch kerja; hash remote cocok. Status PARTIAL untuk browser acceptance terbuka, bukan klaim visual final.

Lihat [laporan 2.4](../reports/CHECKPOINT_2_4.md). Bagian checkpoint sebelumnya di bawah bersifat historis.

## Checkpoint 2.3 — Village & KOPDES Environment

Permintaan checkpoint ini mengizinkan implementasi 2.3 serta commit/push ke `docs/kopdes3d-phase1`, bukan 2.4, main atau deployment. Controller dan kamera 2.2 digunakan kembali tanpa mengulang fiturnya.

1. Audit aktual controller/scene, dokumen Phase 1 dan gambar referensi pengguna: selesai.
2. Layout desa-a, props instanced, exterior/interior, lighting, primitive colliders dan anchor konfigurasi: selesai.
3. Tes config dan Rapier memakai controller produksi, regression, focused lint dan production build: VERIFIED; 48 existing + 25 KOPDES tests. Lint global tetap 8 errors + 1 warning existing.
4. Code review Codex CLI: dua P2 atap diperbaiki; review ulang tanpa P0/P1/P2. `$auto-codex-review` tidak ditemukan pada lokasi skill yang diperiksa; CLI read-only dipakai sebagai alternatif eksplisit.
5. Browser: WebGL2 dan perjalanan rumah–toko–area kasir VERIFIED pada production preview. Full visual acceptance, native Esc, hardware FPS dan lifecycle tanpa reload tetap terbuka. Status keseluruhan PARTIAL, bukan BROWSER NOT TESTED menyeluruh.
6. Manifest dan laporan checkpoint diperbarui; commit/push serta hash remote dicatat pada laporan/receipt pengiriman.

Rute berskala meter: rumah `(0,0,-2)`, jalan `z=2..9`, arena 14 × 14 pada `(0,0,16)`, gerbang `z=25`, portal `z=28`, interior `z=28..40`, kasir `(4.5,0,37.7)`. Titik Phase 1 adalah usulan; penyesuaian rumah/lorong menjaga arah +Z dan skala yang konsisten. Tidak ada boss AI, belanja, checkout atau 30 level.

Lihat [laporan 2.3](../reports/CHECKPOINT_2_3.md). Berhenti setelah checkpoint ini.

## Recovery checkpoint 2026-10-28

The recovery request approves Phase 2 work through Checkpoint 2.2 and automatic checkpoint commits/pushes on `docs/kopdes3d-phase1`. This supersedes the earlier proposed-only status and per-checkpoint permission text within that scope. No main push, deploy, combat expansion or whole-Phase-2 implementation is authorized.

| Checkpoint | Scope | Current evidence |
|---|---|---|
| 2.1 | Dependencies, lazy entry, scene/loading/error shell, security triage | Automated checks VERIFIED; overall PARTIAL: HTTP VERIFIED / BROWSER NOT TESTED. Audit 9 → 0; auto-review PASS; 48/48 tests; focused lint/build PASS; global lint unchanged. Commit/push permitted with browser limitation documented. |
| 2.2 | Third-person Owi prototype, WASD, mouse look, follow, sprint, ground/wall collision, camera obstruction | Implemented after 2.1 push (`3111915`). Automated gates VERIFIED: 7 real-Rapier + 48 existing tests, focused lint/build, audit and final review pass. Overall PARTIAL: browser input/visual/lifecycle NOT TESTED. Task 4 permits checkpoint commit/push with that limitation recorded. See [2.2 report](../reports/CHECKPOINT_2_2.md). |

See [2.1 report](../reports/CHECKPOINT_2_1.md) and [dependency audit](../reports/DEPENDENCY_SECURITY_AUDIT.md). Historical Phase 1 proposal follows; uncompleted acceptance is not implicitly checked off.

Status: usulan Phase 1. Tidak ada persetujuan untuk melompati checkpoint atau menyelesaikan semua fase dalam satu pekerjaan. Task terperinci slice berada di [todo.md](todo.md).

## Urutan dependensi

Audit dan PRD menjadi dasar kontrak data; shell/input/physics memungkinkan combat; encounter clear memungkinkan belanja; checkout memungkinkan hasil dan progres. Aset final mengikuti kontrak skeleton/timeline setelah gameplay terbukti. Pekerjaan dilakukan berurutan pada slice pertama agar perubahan state dan route tidak bersaing.

| Fase | Hasil konkret | Syarat masuk | Acceptance / verifikasi sebelum checkpoint |
|---|---|---|---|
| 1 Audit & PRD | Enam dokumen desain, dua dokumen task, hasil baseline | Permintaan pengguna | Struktur/versi berdasarkan repo; 30 rancangan valid; review dokumen; tidak ada runtime baru |
| 2 Vertical slice | Level 1 selesai dari rumah sampai kasir dan hasil | Review Phase 1, izin menulis integrasi root | VS01–VS10 lulus; unit tests fokus; lint/build; walkthrough browser; save minimal refresh |
| 3 Combat lengkap | Cage, ultimate, AI tiga guard, Lilbah dua fase | Checkpoint slice disetujui | Timeline/cancel, stun resistance, summon cap, boss defeat sekali, belanja sesudah Lilbah |
| 4 Belanja & progres | Delapan SKU, mission penuh, skor, EXP, unlock/save | Combat framework stabil | Checkout atomik/idempotent; corruption/quota/multi-tab; best score dan reward replay benar |
| 5 Boss expansion | Kabdy dua fase, Wowo tiga fase | Save/progres stabil | Semua threshold/telegraph/recovery, summon, final defeat; checkout masih wajib |
| 6 Level 1–30 | Ekspansi data tiga environment dan balans | Slice dan seluruh mekanik lulus | Validator 30 level; anggaran/stok/unlock; playtest seluruh level, khusus 10/20/30 |
| 7 Polish & QA | Aset final berlisensi, animasi/audio, profil kinerja | Alur lengkap playable | Browser matrix, accessibility, no runtime errors pada skenario uji, production build, daftar batasan |

Setelah setiap baris, laporkan bukti lulus/gagal/NOT TESTED dan tunggu checkpoint sebelum fase berikutnya. Commit/push tidak berarti persetujuan lanjut fase. Deploy tetap memerlukan instruksi terpisah.

## Batas implementasi

Phase 2 hanya membutuhkan satu level, satu guard, satu SKU, dua stance dan dash. Skill 2/ultimate/boss belum diaktifkan. Tidak perlu membeli/menghasilkan aset final, menambah pathfinding, backend, router library, ECS, atau editor level. Bangun paling sedikit file yang membuat slice teruji. Pisahkan task yang melebihi lima file; dependency installation dan wiring route adalah task terpisah.

Checkpoint pertama fase implementasi mengikuti task T1–T3; checkpoint playable mengikuti T4–T7. Detail acceptance bukan pengganti sepuluh VS criteria dalam PRD. Tes global yang sudah gagal dicatat sebagai blocker existing, bukan diabaikan atau diperbaiki diam-diam.

## Risiko yang diselesaikan lebih awal

Sebelum install, selesaikan runtime Node/manifest-lock drift dan peer compatibility. Sebelum menambah art, buktikan kamera/collision/dash pada primitive. Sebelum memperluas katalog, buktikan checkout ganda tidak menggandakan stok/reward dan refresh memulihkan checkpoint. Sebelum menambah level, buktikan satu alur penuh di browser.

Jangan mengunci estimasi tanggal sebelum slice dan pipeline aset terukur. Angka HP, harga simulasi, timer, cap, target unduhan, dan FPS tetap hipotesis sampai tes yang sesuai dijalankan.
