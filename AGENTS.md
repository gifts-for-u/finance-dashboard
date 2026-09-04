# AGENTS.md — Panduan untuk AI Agent / Kontributor

> Dokumen ini ditujukan untuk **AI coding agent** (dan kontributor manusia) yang bekerja di repositori `finance-dashboard`. Ikuti panduan ini saat memodifikasi kode, rules, dependency, atau workflow CI/CD.

---

## 1. Tentang Proyek

`finance-dashboard` adalah aplikasi *personal finance* berbasis web:
- **Frontend (aktif):** React 19 + Vite + Tailwind v4 di `remaster/`.
- **Frontend (legacy):** Vanilla JS + HTML + CSS di `public/` — sedang dalam proses deprecation.
- **Backend:** Firebase Authentication + Cloud Firestore (BaaS, tanpa server API).
- **Hosting:** Firebase Hosting (`https://finance-dashboard-10nfl.web.app`).
- **CI/CD:** GitHub Actions → Firebase Hosting.

Baca [`PRD.md`](./PRD.md) sebelum mulai perubahan apa pun.

---

## 2. Aturan Mutlak (Hard Rules)

### 2.1 Firestore Rules adalah otoritas tunggal
- **JANGAN** menambahkan collection/field baru di kode tanpa update `firestore.rules` di PR yang sama.
- **JANGAN** menulis logika "security" di client yang sebenarnya harus jadi aturan rules.
- **JANGAN** menggunakan `allow read, write: if true` di mana pun.
- Setiap perubahan rules **wajib** dites via Firebase Emulator sebelum di-merge.

### 2.2 Tidak boleh hardcode kredensial
- **JANGAN** menambahkan API key, project ID, atau secret Firebase lainnya ke source code.
- `FALLBACK_CONFIG` yang ada di `public/firebase-config.js` dan `remaster/src/firebase-config.js` adalah **tech debt** yang harus dihapus/diisolasi.
- Pakai chain resolusi yang ada: `VITE_FIREBASE_*` → `window.__FIREBASE_CONFIG__` → meta tag → `__/firebase/init.json`.

### 2.3 Sanitasi output
- **JANGAN** menggunakan `innerHTML` dengan data dinamis di folder `public/` (vanilla).
- **JANGAN** menggunakan `dangerouslySetInnerHTML` di React kecuali dengan sanitizer eksplisit (DOMPurify) + komentar alasan.
- Pakai `textContent` (vanilla) atau interpolasi JSX (React) — keduanya auto-escape.

### 2.4 Dependency hygiene
- **JANGAN** menambahkan dependency baru tanpa cek `npm audit`.
- **JANGAN** downgrade dependency yang sudah di-patch terhadap CVE aktif.
- Setidaknya jalankan `npm audit --audit-level=high` di akhir setiap perubahan dependency. CI menjalankan ini — PR akan gagal jika high/critical muncul.

### 2.5 Struktur folder
- `remaster/` adalah **satu-satunya** source of truth untuk aplikasi aktif.
- `public/` lama adalah legacy; tidak boleh ada fitur baru di sana.
- Jangan pindahkan file dari `public/` ke `remaster/` kecuali Anda juga menghapus versi lawasnya.

---

## 3. Arsitektur & Batasan Teknis

### 3.1 Serverless = Rules = Validasi
Tidak ada Cloud Functions, tidak ada backend API. Semua validasi data **harus** ada di:
1. Client (UX hints) — `FinanceContext.validateAmount`, dsb.
3. **Firestore Security Rules** (satu-satunya paksa) — `firestore.rules`.

### 3.2 State management
- Pakai React Context (`AuthContext`, `FinanceContext`) saja. **Jangan** menambah Redux/Zustand/Recoil untuk fitur ringan.
- Pakai `useState`/`useEffect` lokal untuk UI state per komponen.
- Untuk Firestore, pakai `onSnapshot` agar UI reaktif — jangan polling manual.

### 3.3 Routing
- `react-router-dom` v7 sudah dikonfigurasi. Rute yang ada: `/login`, `/`, `/income`, `/expenses`, `/budget`, `/reports`.
- Setiap halaman **wajib** dibungkus `<ProtectedRoute>` kecuali `/login`.
- SPA — `firebase.json` sudah punya rewrites `** → /index.html`.

### 3.4 Styling
- Tailwind v4 + PostCSS. **Jangan** menambah file CSS global kecuali benar-benar diperlukan.
- Pakai utility class. Untuk komponen kompleks dengan banyak state, ekstrak ke `components/`.
- Tema: light/dark lewat `data-theme` di `<body>` + class `dark` di `<html>`. Konsultasikan dengan `Layout.jsx` dulu sebelum menambah token tema baru.

### 3.5 Format uang
- Selalu pakai `formatRupiah` dari `src/utils/formatter.js`. **Jangan** menulis ulang formatter lokal.

---

## 4. Cara Bekerja di Tiap Area

### 4.1 Menambah koleksi/dokumen Firestore
1. Update **schema** di `PRD.md` Section 7.
2. Tambahkan path & aturan di `firestore.rules` (default deny, scope ke `request.auth.uid == userId`).
3. Tambahkan `firestore.indexes.json` jika ada query berbasis field (compound, orderBy).
4. Tambah tipe data & helper di `FinanceContext.jsx`.
5. Test rule via emulator: `firebase emulators:start`.

### 4.2 Menambah field pada dokumen existing
1. Cek apakah field wajib → validasi di rules.
2. Update schema di PRD.
3. Update mapper read di `FinanceContext.useEffect` (mapping field → state React).
4. Update mapper write (`addExpense`, `updateExpense`, dst.) agar field baru ikut tersimpan.

### 4.3 Menambah halaman baru
1. Tambah route di `App.jsx` di bawah `<ProtectedRoute>`.
2. Tambah item navigasi di `Layout.jsx` (`desktopNavItems` & `mobileNavItems`).
3. Pakai `Layout` sebagai wrapper.
4. Kalau halaman baca koleksi tambahan, declare di schema & rules dulu.

### 4.4 Menambah kategori default baru
1. Tambah di `FinanceContext` (fallback default categories).
2. Set `isDefault: true` agar tidak terhapus.
3. Pilih icon dari `lucide-react` yang tersedia (cek `IconMap` di `FinanceContext`).

### 4.5 Modifikasi CI/CD
- File: `.github/workflows/firebase-hosting.yml`.
- **JANGAN** menghapus step `Security audit` atau `Clean up credentials`.
- **JANGAN** menulis ulang service account ke file lain selain `mktemp` temporary.
- Kalau menambah target deploy baru (mis. Firestore Rules, Functions), tambah step setelah build, sebelum cleanup.

### 4.6 Mengubah skema rules
1. Edit `firestore.rules`.
2. **Wajib** test lokal dengan emulator sebelum push.
4. Setelah deploy ke production, verifikasi di Firebase Console bahwa rules live = rules di repo.
5. Update PRD Section 8 jika ada perubahan paradigma.

---

## 5. Konvensi Kode

### 5.1 JavaScript / JSX
- ESM modules (`type: "module"` di `remaster/package.json`).
- Hindari `var`; pakai `const`/`let`.
- Pakai arrow function untuk komponen, kecuali untuk komponen dengan *displayName* untuk debugging.
- Hindari inline function besar di JSX — ekstrak ke `useCallback` atau variabel.
- **Penamaan:**
  - Komponen: `PascalCase` (`DashboardPage`, `StatCard`).
  - Hook/variabel: `camelCase`.
  - Konstanta: `UPPER_SNAKE_CASE` (`FALLBACK_CONFIG`, `CONFIG_SOURCES`).
  - File komponen: `PascalCase.jsx`. File util: `camelCase.js`.

### 5.2 Error handling
- Setiap pemanggilan Firebase SDK di FinanceContext: blok `try/catch` + `toast.error()`.
- Auth context: tangani `auth/popup-closed-by-user`, `auth/popup-blocked`, `auth/network-request-failed` dengan pesan spesifik.
- Validasi nominal:
  ```js
  const num = Number(amount);
  if (!Number.isFinite(num) || isNaN(num) || num <= 0) throw new Error("Nominal harus berupa angka valid lebih dari 0.");
  if (num > 1_000_000_000_000) throw new Error("Nominal melebihi batas maksimum.");
  ```

### 5.3 Date handling
- Disimpan di Firestore sebagai `Timestamp`.
- Tampil di UI sebagai string `"1 Mar 2026"` (Indonesia short-month).
- Konversi via `extractDate` & `parseDateString` di `FinanceContext.jsx`.

### 5.4 Toast
- Sukses: `toast.success("...")`.
- Gagal: `toast.error("...")`.
- Info session: `toast("...", { icon: '⏳', id: 'session-timeout' })`.
- Auto-dismiss default 4000ms (lihat `<Toaster>` di `App.jsx`).

---

## 6. Testing & Verifikasi

Wajib dijalankan sebelum commit:
```bash
cd remaster
npm install
npm run lint       # eslint harus lulus
npm run build      # build harus sukses tanpa warning yang break
```

Untuk perubahan rules/data:
```bash
# di root repo
firebase emulators:start
# buka UI emulator, uji CRUD sebagai user terautentikasi & tidak terautentikasi
```

Wajib dicek manual sebelum merge:
- [ ] Login Google → Dashboard tampil.
- [ ] Tambah income/expense → data muncul di Firestore dengan `userId` yang benar.
- [ ] Coba akses koleksi user lain via console → harus ditolak oleh rules.
- [ ] Navigasi prev/next bulan → data ter-load benar.
- [ ] Light/dark theme toggle tidak flicker.
- [ ] Mobile view (≤ 480px) tidak overflow horizontal.

---

## 7. Hal yang DILARANG

- ❌ Menambah `allow read, write: if true` di rules.
- ❌ Hardcode API key baru (rotasi harus via `VITE_FIREBASE_*` env atau runtime config).
- ❌ Pakai `innerHTML` / `dangerouslySetInnerHTML` tanpa sanitasi.
- ❌ Menambah dependency yang punya CVE high/critical belum dipatch.
- ❌ Menambah fitur ke folder `public/` legacy.
- ❌ Menghapus step `Security audit` di CI.
- ❌ Mengubah project ID default di `.firebaserc` tanpa konfirmasi.
- ❌ Commit file `.env` (`.gitignore` sudah blok, tapi tetap verifikasi).
- ❌ Mem-bypass rules lewat query Firestore admin SDK di kode client.
- ❌ Pakai `eval`, `Function()`, atau dynamic import dari string.

---

## 8. Hal yang DIREKOMENDASIKAN

- ✅ Ekstrak helper yang berulang (icon mapping, color, formatter) ke `utils/` atau `lib/`.
- ✅ Tambahkan `console.warn` (bukan `console.error`) untuk fallback config yang disengaja.
- ✅ Pakai `motion`/`framer-motion` untuk transisi yang smooth; hindari animation library tambahan.
- ✅ Tulis komentar di atas blok rules Firestore yang kompleks untuk menjelaskan *invarian* yang dijaga.
- ✅ Update PRD.md setiap kali ada perubahan struktur data, fitur, atau security model.
- ✅ Pakai commit message konvensional: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `security:`.
- ✅ Tutup issue/CVE terkait dengan prefix `security:` di judul PR.

---

## 9. Daftar Berkas Penting

| File | Jangan hapus | Edit hanya jika… |
|---|---|---|
| `firestore.rules` | ✅ | Menambah path/field baru, atau menutup celah keamanan. |
| `firestore.indexes.json` | ✅ | Query Firestore baru butuh compound index. |
| `firebase.json` | ✅ | Hosting config berubah. |
| `.firebaserc` | ✅ | Project ID berganti (jarang). |
| `.github/workflows/firebase-hosting.yml` | ✅ | Tambah step deploy rules, atau update Node version. |
| `remaster/src/context/FinanceContext.jsx` | — | Tambah/ubah transaksi, kategori, budget logic. |
| `remaster/src/context/AuthContext.jsx` | — | Tambah provider (Apple, EmailLink), atau tambah handler error. |
| `remaster/src/firebase-config.js` | — | Tambah sumber konfigurasi baru atau ubah chain. |
| `remaster/src/lib/firebase.js` | — | Tambah inisialisasi service baru (Storage, Functions). |
| `remaster/src/App.jsx` | — | Tambah route baru, atau ubah global wrapper (Toaster, SessionManager). |
| `PRD.md` | ✅ (update, jangan hapus) | Perubahan fitur, schema, atau security model. |
| `AGENTS.md` | ✅ (update, jangan hapus) | Konvensi/aturan baru untuk kontributor. |

---

## 10. Incident Response

Kalau audit keamanan menemukan masalah (lihat [`01-vulnerabilities.md`](./01-vulnerabilities.md) sebagai referensi):

1. **Klasifikasikan** severity (Critical / High / Medium / Low).
2. **Critical/High**: deploy fix rules via `firebase deploy --only firestore:rules` segera, jangan tunggu PR cycle.
3. **Buat PR** dengan judul `security: <singkat>` dan jelaskan root cause + remediation.
4. **Update** `01-vulnerabilities.md`, `02-fixes.md`, `03-langkah-perbaikan.md`, `04-instruksi-agar-tidak-terulang.md` jika masih relevan.
5. **Tambahkan regression test** (rules unit test via emulator) jika applicable.
6. **Review** apakah ada pattern serupa di tempat lain — fix menyeluruh, bukan spot-fix.

---

## 11. Kontak & Escalation

- **Pemilik repo / maintainer:** lihat kolaborator di GitHub repo.
- **Firebase project console:** https://console.firebase.google.com/project/finance-dashboard-10nfl
- **Production site:** https://finance-dashboard-10nfl.web.app
- **Workflow runs:** lihat tab *Actions* di repo.

---

*Dengan mengikuti panduan ini, agent/kontributor diharapkan menjaga kualitas dan keamanan kode, sekaligus tidak memperkenalkan regresi ke arsitektur serverless yang sudah mapan.*