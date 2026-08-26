# Instruksi Agar Tidak Terulang — `finance-dashboard`

Panduan ini ditujukan untuk tim/kontributor proyek, supaya kelas masalah yang sama tidak muncul lagi di masa depan — baik di proyek ini maupun proyek serverless/Firebase lain.

## 1. Prinsip dasar: client tidak pernah dipercaya
- **Jangan pernah** menganggap struktur path atau logic di kode client (`FinanceContext.jsx`, dsb.) sebagai kontrol keamanan. Itu hanya konvensi UI.
- Setiap kali menambahkan collection/field baru di Firestore, **rules HARUS diperbarui bersamaan** — bukan belakangan. Jadikan ini bagian dari checklist PR.
- Anggap Firestore Rules sebagai "backend" proyek ini. Perlakukan perubahannya seserius perubahan API server sungguhan (review wajib, testing, staging).

## 2. Wajibkan deploy rules sinkron dengan kode
- Firestore Rules **tidak boleh** hanya hidup di repo tanpa dipaksa ter-deploy otomatis. Tambahkan step deploy rules ke setiap pipeline CI/CD yang men-deploy hosting/app.
- Tambahkan tahap verifikasi pasca-deploy (mis. script kecil yang mengecek hash/versi rules production vs repo) agar drift terdeteksi otomatis, bukan ditemukan manual saat audit.

## 3. Sanitasi output — jadikan default, bukan opsional
- Untuk kode vanilla JS: standarkan penggunaan `textContent` untuk semua data dinamis, atau wajibkan lewat helper `escapeHtml()` — buat linter/code-review checklist yang menolak PR dengan `innerHTML` + variabel data tanpa sanitasi.
- Untuk kode React: hindari `dangerouslySetInnerHTML` kecuali benar-benar diperlukan, dan kalau dipakai wajib melalui sanitizer (mis. DOMPurify) + review eksplisit.

## 4. Dependency hygiene
- Tambahkan `npm audit` (atau alat setara seperti `npm audit`, Snyk, Dependabot) sebagai **required check** di CI, bukan aktivitas manual sesekali.
- Set kebijakan: PR yang menambahkan kerentanan baru berseverity high/critical otomatis gagal check.
- Jadwalkan review dependency berkala (mis. bulanan) meskipun tidak ada alert otomatis.

## 5. Validasi data — satu sumber kebenaran
- Karena arsitektur serverless, **Firestore Rules adalah satu-satunya tempat validasi bisa dipaksakan**. Setiap field baru di data model wajib punya validasi tipe/nilai di rules, bukan hanya di client.
- Dokumentasikan skema data (field, tipe, batas nilai) di satu tempat (mis. `SCHEMA.md`) supaya rules dan client selalu mengacu ke definisi yang sama.

## 6. Jangan hardcode kredensial/config sebagai fallback
- Semua config (termasuk yang "public" seperti Firebase API key) sebaiknya hanya berasal dari satu sumber runtime yang terpercaya, atau `.env` yang tidak di-commit.
- Kalau butuh fallback untuk local dev, beri komentar eksplisit + pastikan tidak pernah dipakai di production (mis. lewat build-time check).

## 7. Jangan andalkan client untuk kontrol keamanan sesi
- Fitur seperti auto-logout harus divalidasi ulang di server (custom claims, `auth_time`, revoke token), bukan hanya via `localStorage`. Kalau memang hanya UX (bukan security control), beri label jelas di kode/dokumentasi supaya tidak disalahartikan sebagai fitur keamanan.

## 8. Hindari drift arsitektur
- Kalau ada migrasi framework (vanilla → React, dst), tetapkan target tanggal untuk deprecate/hapus versi lama dari branch utama. Jangan biarkan dua implementasi paralel hidup berdampingan tanpa batas waktu — ini sumber bug & kebingungan kontributor.

## 9. Jadikan audit ini bagian dari rutinitas, bukan one-off
- Lakukan security review (minimal terhadap Firestore Rules + dependency) setiap kali:
  - Ada penambahan collection/field baru.
  - Ada penambahan client baru (mobile app, dsb).
  - Sebelum rilis mayor.
- Simpan hasil audit sebelumnya (termasuk dokumen ini) sebagai referensi, dan bandingkan temuan baru dengan checklist di `03-langkah-perbaikan.md` supaya tidak ada regresi ke masalah yang sama.
