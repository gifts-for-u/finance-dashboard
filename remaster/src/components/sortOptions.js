import {
  SortTimeDesc,
  SortTimeAsc,
  SortAmountDesc,
  SortAmountAsc,
} from './SortControls';

/**
 * Preset opsi sort by date/amount (desc/asc) yang dipakai di
 * Income, Expense, dan Dashboard.
 *
 * Dipisah dari SortControls.jsx untuk遵守 react-refresh/only-export-components
 * (file yang export component harus pure-component).
 */
export const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Terbaru', icon: SortTimeDesc },
  { value: 'date-asc', label: 'Terlama', icon: SortTimeAsc },
  { value: 'amount-desc', label: 'Terbesar', icon: SortAmountDesc },
  { value: 'amount-asc', label: 'Terkecil', icon: SortAmountAsc },
];