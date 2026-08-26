# Daftar Vulnerabilities — `finance-dashboard`

> Konteks: aplikasi ini **tidak punya backend server** (serverless — client bicara langsung ke Firebase Auth + Firestore). Karena itu, **Firestore Security Rules** berperan sebagai satu-satunya lapisan otorisasi/validasi yang menggantikan backend/API server.

---

## 🔴 Kritis

### 1. Firestore Rules terbuka total (semua orang bisa baca/tulis semua data)
- **Lokasi:** `firestore.rules`
- **Kondisi saat ini:**
  ```
  match /{document=**} {
    allow read, write: if true;
  }
  ```
- **Dampak:** Siapa pun yang tahu `projectId` (ter-expose di `firebase-config.js`) bisa memanggil Firestore REST API/SDK langsung dari luar aplikasi, tanpa login, untuk:
  - Membaca seluruh data keuangan semua pengguna (`users/{uid}/months`, `categories`, dst).
  - Menulis/menghapus/mengubah data siapa saja.
- **Akar masalah:** Path disusun sebagai `users/{uid}/...` di client (`FinanceContext.jsx`), tapi itu hanya konvensi — tidak dipaksakan oleh rules. Client-side validation bukan kontrol keamanan.
- **Kategori:** OWASP A01:2021 – Broken Access Control.

### 2. CI/CD tidak pernah men-deploy Firestore Rules
- **Lokasi:** `.github/workflows`
- **Kondisi saat ini:** Workflow hanya menjalankan `firebase deploy --only hosting`.
- **Dampak:** Perubahan pada `firestore.rules` di repo **tidak otomatis reflect ke production**. Terjadi *configuration drift* — rules yang live di server bisa berbeda dari yang ada di repo, tanpa jaminan rules yang benar pernah ter-deploy.

---

## 🟠 Tinggi

### 3. Stored XSS lewat `innerHTML` tanpa sanitasi
- **Lokasi:** `public/views/expenses.js`, `public/views/budgets.js`, `public/ui/modals.js`
- **Kondisi saat ini:** Data dari Firestore langsung di-interpolate ke `innerHTML` tanpa escaping, contoh:
  ```js
  <td style="font-weight: 500;">${income.source || "-"}</td>
  ...
  <strong>${category.name}</strong>
  ```
- **Dampak:** Payload seperti `<img src=x onerror=...>` pada `income.source` atau `category.name` akan tereksekusi saat data dirender. Digabung dengan Rules yang terbuka (#1), ini menjadi **stored XSS yang bisa dieksploitasi remote tanpa login** — attacker cukup POST payload ke Firestore, korban terkena begitu membuka dashboard.
- **Kategori:** OWASP A03:2021 – Injection / XSS.
- **Catatan:** Versi `remaster` (React) lebih aman karena JSX auto-escape by default — tetap perlu diperiksa jika ada penggunaan `dangerouslySetInnerHTML` di masa depan.

### 4. Dependency vulnerable (hasil `npm audit` di `remaster/`)
- **Total:** 8 kerentanan (2 critical, 5 high, 1 moderate)
- **Rincian:**
  - `react-router` 6–7.18.1: RCE via deserialization, stored XSS via redirect header, open redirect, DoS.
  - `websocket-driver` ≤0.7.4: critical, resource limit bypass & message corruption.
  - `protobufjs`: DoS via unbounded recursion (dependency transitif dari Firebase SDK).

---

## 🟡 Sedang

### 5. Tidak ada validasi input di sisi "backend" (rules)
- **Lokasi:** `ExpensePage.jsx` — `Number(formData.amount)`
- **Dampak:** Tidak ada validasi tipe/nilai (bisa negatif, `NaN`, tanpa batas atas). Karena tidak ada Cloud Function/App Server yang memvalidasi ulang, dan Rules tidak cek tipe/nilai:
  - Client jahat (atau typo pengguna) bisa mengirim `amount: "abc"` atau `amount: -999999999` tanpa hambatan.
  - Tidak ada *single source of truth* untuk validasi — jika ada client kedua nanti, aturan validasi harus diduplikasi lagi.

### 6. Tidak ada Firebase App Check / rate limiting
- **Lokasi:** tidak ditemukan di `firebase-core.js` maupun `lib/firebase.js`
- **Dampak:** Tanpa App Check, tidak ada jaminan request ke Firestore berasal dari aplikasi resmi (rawan scripting/bot abuse). Tidak ada rate limiting terhadap penulisan data → potensi biaya membengkak / DoS terhadap kuota Firestore.

### 7. Firebase API key fallback di-hardcode di source code
- **Lokasi:** duplikat identik di `public/` dan `remaster/`
  ```js
  const FALLBACK_CONFIG = {
    apiKey: "AIzaSyDxmGNxzxbX8UGBm82jn3PmzhiGq0GQT7Y",
    ...
  };
  ```
- **Dampak:** Meski Firebase Web API key secara desain "public" (bukan secret), hardcoding sebagai fallback:
  - Mempersulit rotasi jika proyek Firebase pernah diganti/dipindah.
  - Menandakan mekanisme runtime-config (`/__/firebase/init.json`) tidak sepenuhnya dipercaya, sehingga selalu ada fallback berbahaya jika lupa dihapus.
  - Dikombinasikan dengan Rules terbuka (#1), key ini jadi kunci akses penuh ke seluruh database bagi siapa pun.

---

## 🟢 Rendah

### 8. Session management murni kosmetik
- **Lokasi:** `session-manager.js`
- **Kondisi saat ini:** Hanya mengatur auto-logout di UI berdasarkan timestamp `localStorage`, yang bisa dimanipulasi langsung lewat DevTools console:
  ```js
  localStorage.setItem('lastActivityTimestamp', Date.now())
  ```
- **Dampak:** Bukan kontrol keamanan nyata. Token sesi Firebase Auth sebenarnya punya masa berlaku sendiri di sisi server, tapi `session-manager.js` tidak berinteraksi dengan itu (tidak ada `signOut()` paksa berbasis waktu server, tidak ada revoke token).

### 9. Duplikasi arsitektur (dua aplikasi paralel)
- **Lokasi:** `public/` (vanilla JS, versi lama) vs `remaster/` (React)
- **Kondisi saat ini:** Logic dan konfigurasi Firebase identik/duplikat (`firebase-config.js` sama persis, migrasi data, dsb). CI build sekarang menimpa `public/` dengan hasil build `remaster/` (`rm -rf public && cp -R remaster/dist/* public/`).
- **Dampak:** Folder `public/` versi asli (vanilla JS) sudah jadi *dead code* tapi tetap ada di repo, berpotensi membingungkan kontributor baru. Ini beban maintenance, bukan risiko keamanan inti.

---

## Ringkasan Prioritas

| Prioritas | Isu | Dampak |
|---|---|---|
| Kritis | Firestore rules `allow read, write: if true` | Kebocoran & manipulasi seluruh data pengguna |
| Kritis | CI tidak deploy rules | Rules production tidak terjamin sinkron |
| Tinggi | Stored XSS via `innerHTML` | Eksekusi script arbitrer di browser korban |
| Tinggi | Dependency vulnerable (react-router, websocket-driver) | RCE, XSS, DoS |
| Sedang | Tidak ada validasi tipe/nilai di rules | Data korup, potensi crash UI |
| Sedang | Tidak ada App Check / rate limit | Abuse kuota, bot traffic |
| Rendah | Session manager kosmetik | Fitur "auto-logout" bisa di-bypass, bukan risiko keamanan inti |
| Rendah | Duplikasi `public/` vs `remaster/` | Beban maintenance, bukan keamanan |
