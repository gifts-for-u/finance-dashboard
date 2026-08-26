# Rekomendasi Fix — `finance-dashboard`

Setiap fix di bawah dikelompokkan sesuai temuan di `01-vulnerabilities.md`.

---

## 🔴 Kritis

### Fix #1 — Perbaiki Firestore Rules
Ganti rules terbuka dengan scoping per-`uid`:

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

Tambahkan juga validasi tipe/skema data di dalam rules (mis. `amount` harus `number`), karena **tanpa server backend, rules adalah satu-satunya tempat validasi bisa dipaksakan**. Contoh arah validasi tambahan:

```
match /users/{userId}/months/{monthId}/expenses/{expenseId} {
  allow read, write: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.amount is number
    && request.resource.data.amount >= 0;
}
```

### Fix #2 — Pastikan CI/CD men-deploy Firestore Rules
Tambahkan step deploy rules ke workflow CI, contoh:

```yaml
- name: Deploy Firestore Rules
  run: firebase deploy --only firestore:rules --token "${{ secrets.FIREBASE_TOKEN }}"
```

Jalankan berdampingan dengan `firebase deploy --only hosting`, atau gabungkan jadi satu step `firebase deploy` yang mencakup semua target sekaligus. Pastikan juga rules yang saat ini live di production disamakan/diverifikasi ulang dengan rules di repo (karena drift yang sudah terjadi sebelumnya).

---

## 🟠 Tinggi

### Fix #3 — Hilangkan Stored XSS
Untuk versi vanilla JS (`public/views/expenses.js`, `budgets.js`, `ui/modals.js`), pilih salah satu:
- Gunakan `textContent` untuk data dinamis alih-alih `innerHTML`.
- Atau escape HTML sebelum interpolasi lewat helper `escapeHtml()`.
- Atau (jangka panjang) pindahkan sepenuhnya ke versi `remaster` (React) yang auto-escape via JSX, lalu deprecate `public/` vanilla.

Untuk versi `remaster`, audit setiap pemakaian `dangerouslySetInnerHTML` (kalau ada/ditambahkan nanti) dan pastikan selalu disanitasi.

### Fix #4 — Update dependency yang vulnerable
```
npm audit fix
```
Untuk kerentanan yang tidak bisa di-fix otomatis (mis. major version bump `react-router`), upgrade manual dan uji ulang. Tambahkan `npm audit --audit-level=high` (atau setara) sebagai step di CI supaya kerentanan baru terdeteksi otomatis di setiap PR, bukan hanya saat audit manual.

---

## 🟡 Sedang

### Fix #5 — Validasi tipe/nilai di rules
Lengkapi rules dengan pengecekan seperti:
- `amount` harus `number` dan tidak negatif (atau sesuai batas bisnis yang wajar).
- Field wajib (`source`, `category`, dll.) harus ada dan bertipe `string`.

Ini menjadikan Firestore Rules sebagai *single source of truth* validasi, sehingga tidak perlu diduplikasi jika ada client kedua (mobile, dsb.) di masa depan.

### Fix #6 — Aktifkan Firebase App Check + rate limiting
- Implementasikan `initializeAppCheck()` di `firebase-core.js` / `lib/firebase.js` menggunakan reCAPTCHA v3 atau App Check provider yang sesuai.
- Pertimbangkan Cloud Functions + Firestore quota/rate-limit rules untuk membatasi penulisan berlebihan dari satu client/IP.

### Fix #7 — Hapus hardcoded API key fallback
- Hilangkan `FALLBACK_CONFIG` yang hardcode di `public/` dan `remaster/`.
- Pastikan runtime-config (`/__/firebase/init.json`) selalu tersedia dan dapat dipercaya sebagai satu-satunya sumber konfigurasi.
- Jika fallback tetap diperlukan untuk local dev, pisahkan lewat environment variable (`.env`, tidak di-commit) bukan hardcode di source.

---

## 🟢 Rendah

### Fix #8 — Perbaiki session management
Jika tujuannya benar-benar membatasi sesi secara aman:
- Gunakan custom claims + Cloud Function untuk mengecek `auth_time` di server.
- Terapkan force `signOut()` berbasis waktu server, bukan hanya timestamp `localStorage` di client.
- Pertimbangkan revoke token via Firebase Admin SDK (`revokeRefreshTokens`) untuk sesi yang benar-benar perlu diputus paksa.

### Fix #9 — Bersihkan duplikasi `public/` vs `remaster/`
- Jika `remaster/` (React) memang pengganti resmi, hapus folder `public/` versi vanilla dari branch utama (atau dari git history jika sudah tidak relevan sama sekali).
- Perjelas di README/CI bahwa hanya `remaster/` yang menjadi source of truth, supaya kontributor baru tidak bingung.
