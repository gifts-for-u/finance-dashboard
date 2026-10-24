export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

/**
 * Helper untuk memformat angka dengan pemisah ribuan titik (Indonesian number format).
 * Contoh: 50000 -> "50.000", "1250000" -> "1.250.000"
 */
export const formatNumberWithDots = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/\D/g, '');
  if (!str) return '';
  return str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
