# Design System — Finance Dashboard

> **Panduan Desain & Standar Elemen Visual**
> Mengacu pada prinsip **/ponytail** *(minimalis, tanpa bloatware)* dan **/frontend-a11y** *(inklusif, WCAG 2.2 AA compliant)*.

---

## 1. Tipografi (Typography)

| Elemen | Font Family | Weight & Size | Penggunaan |
|---|---|---|---|
| **Primary Sans** | `Google Sans Flex`, sans-serif | `wght 300..900` | Seluruh heading, body text, label form, tombol |
| **Monospace** | `Geist Mono`, monospace | `wght 400, 700` | Nominal uang (Rupiah), angka metrik, persentase |

### Skala Hierarki:
- **Display / Page Header:** `text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100`
- **Card / Section Header:** `text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100`
- **Body Regular:** `text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300`
- **Label / Overline:** `text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500`
- **Caption / Subtitle:** `text-xs font-medium text-slate-400 dark:text-slate-500`

---

## 2. Palet Warna & Semantic Tokens (Color Tokens)

Semua komponen wajib menggunakan variabel semantik Tailwind dari `index.css` (bukan *hardcoded hex* liar seperti `#3f3f3f` atau `#1e1e1e`):

| Token | Light Mode | Dark Mode | Fungsi |
|---|---|---|---|
| `--background` | `hsl(226 50% 98%)` (Slight cool slate) | `hsl(224 25% 10%)` (Deep slate) | Kanvas latar belakang utama |
| `--card` | `hsl(0 0% 100%)` (Putih bersih) | `hsl(224 20% 14%)` (Dark surface) | Kontainer kartu, modal, popover |
| `--border` | `hsl(214 32% 91%)` (`slate-100`) | `hsl(224 14% 22%)` (`slate-800`) | Garis tepi kartu & input |
| `--primary` | `hsl(221 83% 53%)` (Blue) | `hsl(217 91% 60%)` (Accessible Bright Blue) | Aksi utama, pemasukan, tautan |
| `--destructive` | `hsl(0 84% 60%)` (Rose red) | `hsl(0 84% 60%)` (Rose red) | Aksi bahaya, pengeluaran, peringatan |
| `--muted` | `hsl(210 40% 96%)` (`slate-50`) | `hsl(224 16% 20%)` | Latar belakang input & pill netral |

---

## 3. Sistem Radius Sudut (Border Radius Scale)

Keseragaman sudut lengkung disusun berdasarkan skala hierarki wadah:

1. **`rounded-[32px]` (Surfaces & Modals):**
   - Modal popup dialog (`Modal.jsx`)
   - Card grafik utama (`ChartCard`)
   - Kontainer navigasi desktop (`Layout.jsx`)
2. **`rounded-3xl` / 24px (Inputs & Stat Cards):**
   - Input teks & angka (`input-base`, `input-amount-*`)
   - Dropdown tanggal (`CustomDatePicker`)
   - Dropdown seleksi (`CustomSelect`)
   - Kartu metrik KPI (`StatCard`)
3. **`rounded-2xl` / 16px (Controls & Search):**
   - Input pencarian (Search bar)
   - Tombol sort (`IconSortDropdown`)
   - Quick preset pills ("Hari Ini", "Kemarin")
4. **`rounded-xl` / 12px (Small Badges & Buttons):**
   - Icon wrappers dalam baris tabel
   - Select dropdown bulan/tahun di kalender
   - Tombol pagination / navigasi bulan
5. **`rounded-full` (Action Buttons & Avatars):**
   - Tombol CTA utama (Simpan, Update, Tambah)
   - Foto profil / avatar pengguna
   - Tombol toggle tema (Sun/Moon)

---

## 4. Standar Komponen UI (Component Conventions)

### 4.1 Tombol (Buttons)
- **Primary CTA (`.btn-primary`):**
  `px-8 py-3.5 bg-primary text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary/20`
- **Destructive CTA (`.btn-destructive`):**
  `px-8 py-3.5 bg-destructive text-destructive-foreground rounded-full font-bold shadow-lg shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-destructive/20`
- **Ghost Button (`.btn-ghost`):**
  `px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer`

### 4.2 Form Inputs
- **Text Input (`.input-base`):**
  `w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-3xl font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500`
- **Label (`.label-overline`):**
  `text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 block`

### 4.3 Modal
- Backdrop: `fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300`
- Dialog container: `bg-card text-card-foreground rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300`
- Selalu dukung keyboard `Escape` untuk menutup dan atribut `role="dialog"` + `aria-modal="true"`.

---

## 5. Aksesibilitas (WCAG 2.2 AA)
1. **Interactive Elements:** Semua tombol dan link menggunakan elemen semantik (`<button>` atau `<a>`), bukan `<div>` tanpa keyboard listener.
2. **Focus States:** Selalu sediakan `focus:outline-none focus:ring-4 focus:ring-primary/20` yang terlihat jelas.
3. **Color Contrast:** Rasio kontras teks terhadap latar belakang $\ge 4.5:1$ baik di Light Mode maupun Dark Mode.
4. **Screen Reader Labels:** Ikon murni visual dilengkapi `aria-hidden="true"`, sedangkan tombol berbasis ikon wajib memiliki `aria-label`.
