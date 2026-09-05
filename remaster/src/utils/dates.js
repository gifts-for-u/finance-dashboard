/**
 * Shared date utilities untuk seluruh aplikasi.
 *
 * Semua manipulasi tanggal harus lewat modul ini — JANGAN duplikasi
 * literal array bulan atau helper konversi di tempat lain.
 * Lihat AGENTS.md Section 5.3 (Date handling).
 */

// Nama bulan singkat dalam Bahasa Indonesia.
// Urutan sesuai dengan Date.prototype.getMonth() (0 = Januari).
export const MONTH_NAMES_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

/**
 * Konversi Date atau Timestamp dari Firestore menjadi string UI
 * dalam format "1 Mar 2026".
 *
 * @param {Date|Timestamp|{toDate: () => Date} | string} dateField
 * @returns {string} formatted date "D MMM YYYY"
 */
export function extractDate(dateField) {
  let d = new Date();
  if (dateField) {
    if (typeof dateField.toDate === "function") d = dateField.toDate();
    else d = new Date(dateField);
  }
  // Handle invalid dates
  if (isNaN(d.getTime())) d = new Date();
  return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Parse string UI ("1 Mar 2026") kembali menjadi Date.
 * Fallback ke Date constructor native atau `new Date()` jika invalid.
 *
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseDateString(dateStr) {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split(" ");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTH_NAMES_ID.indexOf(parts[1]);
    const year = parseInt(parts[2], 10);
    if (month !== -1) {
      return new Date(year, month, day);
    }
  }
  const fallbackD = new Date(dateStr);
  return isNaN(fallbackD.getTime()) ? new Date() : fallbackD;
}

/**
 * Format Date ke "DD MMM YYYY" dengan zero-padded day
 * (contoh: "01 Mar 2026"). Dipakai di form input default value.
 *
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function formatDateIdLong(date = new Date()) {
  const d = String(date.getDate()).padStart(2, "0");
  return `${d} ${MONTH_NAMES_ID[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Parse string "D MMM YYYY" atau "DD MMM YYYY" menjadi timestamp (ms).
 * Mengembalikan 0 untuk invalid input. Dipakai untuk sorting UI.
 *
 * @param {string} dateStr
 * @returns {number} milliseconds since epoch, atau 0
 */
export function parseDateToMs(dateStr) {
  try {
    if (!dateStr) return 0;
    const parts = String(dateStr).split(" ");
    if (parts.length === 3) {
      const [dd, mmm, yyyy] = parts;
      const mIndex = MONTH_NAMES_ID.indexOf(mmm);
      if (mIndex !== -1) {
        return new Date(parseInt(yyyy, 10), mIndex, parseInt(dd, 10)).getTime();
      }
    }
    return new Date(dateStr).getTime() || 0;
  } catch {
    return 0;
  }
}

/**
 * Mendapatkan month key dalam format "YYYY-MM" untuk Firestore document ID.
 *
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Nama bulan panjang dalam Bahasa Indonesia (untuk UI label).
 * Urutan sesuai dengan Date.prototype.getMonth() (0 = Januari).
 */
export const MONTH_NAMES_LONG_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];