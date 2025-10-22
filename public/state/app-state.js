const state = {
  currentDate: new Date(),
  currentMonthData: null,
  expenseChart: null,
  categories: [],
  templates: [],
  incomeSortOption: "date-desc",
  expenseSortOption: "date-desc",
  expenseCategoryFilter: "all",
};

export const defaultCategories = [
  {
    id: "savings",
    name: "💰 Tabungan & Investasi",
    color: "#4CAF50",
    isDefault: true,
  },
  {
    id: "family",
    name: "👨‍👩‍👧‍👦 Keluarga",
    color: "#E91E63",
    isDefault: true,
  },
  {
    id: "subscriptions",
    name: "📱 Langganan",
    color: "#2196F3",
    isDefault: true,
  },
  {
    id: "debt",
    name: "💳 Hutang & Paylater",
    color: "#F44336",
    isDefault: true,
  },
  {
    id: "needs",
    name: "🛒 Kebutuhan Pokok",
    color: "#FF9800",
    isDefault: true,
  },
  {
    id: "lifestyle",
    name: "🎉 Gaya Hidup",
    color: "#9C27B0",
    isDefault: true,
  },
  {
    id: "transport",
    name: "🚗 Transportasi",
    color: "#607D8B",
    isDefault: true,
  },
  {
    id: "shopping",
    name: "🛍️ Belanja",
    color: "#795548",
    isDefault: true,
  },
];

export const defaultCategoryColor = defaultCategories[0]?.color ?? "#4CAF50";

export const DEFAULT_CATEGORY_BADGE_PALETTE = {
  background: "rgba(11, 87, 208, 0.12)",
  text: "var(--primary-color-strong)",
  border: "var(--primary-color-strong)",
};

export const TABLE_SORT_CONFIG = {
  income: {
    date: { asc: "date-asc", desc: "date-desc", defaultDirection: "desc" },
    amount: { asc: "amount-asc", desc: "amount-desc", defaultDirection: "desc" },
    source: { asc: "alpha-asc", desc: "alpha-desc", defaultDirection: "asc" },
  },
  expense: {
    date: { asc: "date-asc", desc: "date-desc", defaultDirection: "desc" },
    amount: { asc: "amount-asc", desc: "amount-desc", defaultDirection: "desc" },
    description: {
      asc: "alpha-asc",
      desc: "alpha-desc",
      defaultDirection: "asc",
    },
    category: {
      asc: "category-asc",
      desc: "category-desc",
      defaultDirection: "asc",
    },
  },
};

export const TABLE_SORT_LABELS = {
  income: {
    date: "Tanggal",
    amount: "Jumlah",
    source: "Sumber",
  },
  expense: {
    date: "Tanggal",
    amount: "Jumlah",
    description: "Keterangan",
    category: "Kategori",
  },
};

export const SUMMARY_CARD_INFO = {
  income: {
    description: "Jumlah seluruh pemasukan yang sudah kamu catat untuk bulan ini.",
  },
  expensePlanned: {
    description:
      "Total semua pengeluaran yang direncanakan atau sudah diinput tanpa melihat status selesai.",
  },
  expenseActual: {
    description:
      "Total pengeluaran yang sudah ditandai selesai (status \"done\") pada bulan ini.",
  },
  balanceActual: {
    description:
      "Selisih antara total pemasukan dan pengeluaran aktual—menunjukkan uang yang benar-benar tersisa saat ini.",
  },
  balancePlanned: {
    description:
      "Perkiraan sisa uang jika semua pengeluaran yang direncanakan terealisasi (pemasukan dikurangi seluruh pengeluaran).",
  },
  savingsRatio: {
    description:
      "Persentase pemasukan yang dialokasikan ke kategori Tabungan dibandingkan total pemasukan bulan ini.",
  },
};

export function getCurrentDate() {
  return state.currentDate;
}

export function setCurrentDate(value) {
  state.currentDate = value instanceof Date ? value : new Date(value ?? Date.now());
}

export function getCurrentMonthKey() {
  const date = getCurrentDate();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getDefaultEntryDate() {
  const reference = getCurrentDate();
  const today = new Date();

  if (
    reference instanceof Date &&
    reference.getFullYear() === today.getFullYear() &&
    reference.getMonth() === today.getMonth()
  ) {
    return today;
  }

  if (reference instanceof Date) {
    return new Date(reference);
  }

  return today;
}

export function getCurrentMonthData() {
  return state.currentMonthData;
}

export function setCurrentMonthData(value) {
  state.currentMonthData = value ?? null;
}

export function getExpenseChart() {
  return state.expenseChart;
}

export function setExpenseChart(chart) {
  state.expenseChart = chart ?? null;
}

export function getCategories() {
  return state.categories;
}

export function setCategories(value) {
  state.categories = Array.isArray(value) ? value : [];
}

export function getTemplates() {
  return state.templates;
}

export function setTemplates(value) {
  state.templates = Array.isArray(value) ? value : [];
}

export function getIncomeSortOption() {
  return state.incomeSortOption;
}

export function setIncomeSortOption(value) {
  state.incomeSortOption = value || "date-desc";
}

export function getExpenseSortOption() {
  return state.expenseSortOption;
}

export function setExpenseSortOption(value) {
  state.expenseSortOption = value || "date-desc";
}

export function getExpenseCategoryFilter() {
  return state.expenseCategoryFilter;
}

export function setExpenseCategoryFilter(value) {
  state.expenseCategoryFilter = value || "all";
}

export function resetTableControls() {
  state.incomeSortOption = "date-desc";
  state.expenseSortOption = "date-desc";
  state.expenseCategoryFilter = "all";
}

export function getStateSnapshot() {
  return {
    currentDate: getCurrentDate(),
    currentMonthData: getCurrentMonthData(),
    expenseChart: getExpenseChart(),
    categories: [...getCategories()],
    templates: [...getTemplates()],
    incomeSortOption: getIncomeSortOption(),
    expenseSortOption: getExpenseSortOption(),
    expenseCategoryFilter: getExpenseCategoryFilter(),
  };
}
