# Langkah-Langkah Perbaikan — `finance-dashboard`

Urutan eksekusi disusun berdasarkan dampak vs effort, dimulai dari yang menutup celah paling besar.

## Langkah 1 — Tulis ulang `firestore.rules` (paling berdampak)
1. Buat rules baru dengan scoping per-`uid`:
   ```
   match /users/{userId}/{document=**} {
     allow read, write: if request.auth != null && request.auth.uid == userId;
   }
   ```
2. Sesuaikan dengan struktur data yang dipakai saat ini: `users/{uid}/categories`, `users/{uid}/months`, `users/{uid}/templates`.
3. Tambahkan validasi tipe data dasar (`amount is number`, field wajib ada, dst).
4. Uji rules memakai Firebase Emulator Suite (`firebase emulators:start`) sebelum deploy ke production.

## Langkah 2 — Deploy rules ke production & perbaiki CI
1. Deploy manual dulu sebagai mitigasi darurat:
   ```
   firebase deploy --only firestore:rules
   ```
2. Tambahkan step deploy rules ke workflow CI (`.github/workflows`) supaya tidak terulang configuration drift.
3. Verifikasi rules yang live di Firebase Console sama persis dengan yang ada di repo.

## Langkah 3 — Tutup celah XSS
1. Audit semua pemakaian `innerHTML` di `public/views/expenses.js`, `public/views/budgets.js`, `public/ui/modals.js`.
2. Ganti dengan `textContent` atau buat/gunakan helper `escapeHtml()` untuk semua data dinamis dari Firestore.
3. Untuk `remaster/` (React), cek apakah ada `dangerouslySetInnerHTML` — kalau ada, sanitasi juga.

## Langkah 4 — Update dependency
1. Jalankan `npm audit` di `remaster/`.
2. `npm audit fix` untuk yang bisa otomatis; upgrade manual untuk `react-router`, `websocket-driver`, `protobufjs` (via update Firebase SDK) jika perlu major bump.
3. Jalankan test/build ulang untuk memastikan tidak ada breaking change.
4. Tambahkan `npm audit` sebagai check wajib di CI (gagal build kalau ada kerentanan high/critical baru).

## Langkah 5 — Lengkapi validasi & keamanan tambahan
1. Tambahkan validasi tipe/nilai lebih lengkap di `firestore.rules` (batas atas `amount`, format field, dsb).
2. Aktifkan Firebase App Check (`initializeAppCheck`) di `firebase-core.js` / `lib/firebase.js`.
3. Evaluasi kebutuhan rate limiting tambahan (Cloud Functions atau kuota Firestore).

## Langkah 6 — Bersih-bersih konfigurasi & housekeeping
1. Hapus hardcoded `FALLBACK_CONFIG` (API key) dari source; pastikan runtime-config jadi satu-satunya sumber, atau pindah ke `.env` untuk local dev.
2. Perbaiki `session-manager.js` agar menggunakan mekanisme server-side (custom claims + Cloud Function, atau minimal jangan diklaim sebagai kontrol keamanan).
3. Putuskan nasib folder `public/` (vanilla) vs `remaster/` (React) — hapus salah satu yang sudah dead code, update README/CI.

## Checklist Verifikasi Akhir
- [ ] Rules baru sudah di-deploy dan diverifikasi lewat Firebase Console.
- [ ] CI otomatis men-deploy rules setiap ada perubahan di `firestore.rules`.
- [ ] Tidak ada lagi `innerHTML` dengan data dinamis tanpa sanitasi.
- [ ] `npm audit` bersih dari kerentanan critical/high, dan jadi bagian dari CI.
- [ ] App Check aktif.
- [ ] Tidak ada hardcoded secret/API key fallback di source.
- [ ] Session management memakai mekanisme server-side yang sebenarnya.
- [ ] Duplikasi `public/` vs `remaster/` sudah diselesaikan.
