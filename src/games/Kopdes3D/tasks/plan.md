# Rencana implementasi KOPDES 3D

## Recovery checkpoint 2026-10-28

The recovery request approves Phase 2 work through Checkpoint 2.2 and automatic checkpoint commits/pushes on `docs/kopdes3d-phase1`. This supersedes the earlier proposed-only status and per-checkpoint permission text within that scope. No main push, deploy, combat expansion or whole-Phase-2 implementation is authorized.

| Checkpoint | Scope | Current evidence |
|---|---|---|
| 2.1 | Dependencies, lazy entry, scene/loading/error shell, security triage | Automated checks VERIFIED; overall PARTIAL: HTTP VERIFIED / BROWSER NOT TESTED. Audit 9 → 0; auto-review PASS; 48/48 tests; focused lint/build PASS; global lint unchanged. Commit/push permitted with browser limitation documented. |
| 2.2 | Third-person Owi prototype, WASD, mouse look, follow, sprint, ground/wall collision, camera obstruction | Authorized next after 2.1 push. Use fixed-step Rapier character controller, local simulation refs and real-physics tests. Do not claim browser verification from unit tests. |

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
