# Rencana implementasi KOPDES 3D

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
