/**
 * Validator untuk nominal keuangan.
 *
 * Batas atas: 1e12 (1 triliun IDR). Batas bawah: > 0.
 *
 * Batas 0 di-EXCLUDE karena FinanceContext.addBudget() butuh reset
 * budget ke 0 (= "hapus budget") — untuk budget pakai validator
 * terpisah (lihat validateBudgetAmount).
 *
 * @param {number|string} amount
 * @returns {number} parsed number (jika valid)
 * @throws {Error} jika tidak valid
 */
export function validateAmount(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || isNaN(num) || num <= 0) {
    throw new Error("Nominal harus berupa angka valid lebih dari 0.");
  }
  if (num > 1_000_000_000_000) {
    throw new Error("Nominal melebihi batas maksimum.");
  }
  return num;
}

/**
 * Validator untuk nominal budget — allow 0 untuk reset budget.
 *
 * @param {number|string} amount
 * @returns {number} parsed number
 * @throws {Error} jika tidak valid
 */
export function validateBudgetAmount(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || isNaN(num) || num < 0) {
    throw new Error("Nominal budget harus berupa angka valid (>= 0).");
  }
  if (num > 1_000_000_000_000) {
    throw new Error("Nominal budget melebihi batas maksimum.");
  }
  return num;
}
