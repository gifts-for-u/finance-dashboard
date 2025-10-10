import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  enableNetwork,
  disableNetwork,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { ensureFirebase } from "./firebase-core.js";

let db = null;
let auth = null;

const firebaseReady = ensureFirebase().then((services) => {
  db = services.db;
  auth = services.auth;
  return services;
});

// Import session manager
let sessionManager = null;

// Global Variables
let currentDate = new Date();
let currentMonthData = null;
let expenseChart = null; // This will now hold ApexCharts instance
let categories = [];
let templates = [];

function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.__FINANCE_DASHBOARD_CURRENT_USER__ ?? null;
}

function setCurrentUser(user) {
  if (typeof window !== "undefined") {
    window.__FINANCE_DASHBOARD_CURRENT_USER__ = user ?? null;
  }
}

function requireCurrentUser() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("No authenticated user is available for this operation.");
  }
  return user;
}

// Table controls state
let incomeSortOption = "date-desc";
let expenseSortOption = "date-desc";
let expenseCategoryFilter = "all";

function getSelectValue(selectId, fallback) {
  const select = document.getElementById(selectId);
  if (select && select.value) {
    return select.value;
  }
  return fallback;
}

function onDocumentReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

// Default Categories
const defaultCategories = [
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

const defaultCategoryColor = defaultCategories[0]?.color ?? "#4CAF50";

const TABLE_SORT_CONFIG = {
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

const TABLE_SORT_LABELS = {
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

// Initialize session manager
async function initializeSessionManager() {
  try {
    // Load session manager dynamically
    const SessionManager = (await import("./session-manager.js")).default;
    sessionManager = new SessionManager();

    // Initialize session management
    sessionManager.init(auth, signOut);

    // Make session manager available globally for the warning modal
    window.sessionManager = sessionManager;

    console.log("Session management initialized");
  } catch (error) {
    console.warn("Failed to initialize session manager:", error);
    // Continue without session management if it fails
  }
}

// Check Authentication on Page Load
firebaseReady
  .then(({ auth: resolvedAuth }) => {
    onAuthStateChanged(resolvedAuth, async (user) => {
      if (user) {
        setCurrentUser(user);
        updateUserProfile(user);

        await initializeSessionManager();
        await initializeDashboard();
      } else {
        setCurrentUser(null);
        if (sessionManager) {
          sessionManager.destroy();
        }
        window.location.href = "/login.html";
      }
    });
  })
  .catch((error) => {
    console.error("Failed to initialise Firebase auth state listener:", error);
    showToast(
      "Konfigurasi Firebase tidak valid. Perbarui pengaturan Firebase Anda dan muat ulang.",
      "error",
    );
  });

// Update User Profile Display
function updateUserProfile(user) {
  document.getElementById("userInfo").textContent = `Welcome, ${
    user.displayName || user.email
  }`;

  const userProfile = document.getElementById("userProfile");
  userProfile.innerHTML = `
    <img src="${
      user.photoURL || "https://via.placeholder.com/32"
    }" alt="Profile" class="user-avatar">
    <span class="user-name">${user.displayName || user.email}</span>
  `;
}

// Sign Out Function (updated to handle forced logout)
async function signOut(isForced = false) {
  try {
    await firebaseReady;
    // Destroy session manager
    if (sessionManager) {
      sessionManager.destroy();
      sessionManager = null;
    }

    await firebaseSignOut(auth);
    setCurrentUser(null);

    // Clear any stored data
    localStorage.removeItem("userDisplayName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhotoURL");
    localStorage.removeItem("loginTimestamp");
    localStorage.removeItem("lastActivityTimestamp");

    // Show appropriate message
    if (isForced) {
      console.log("Forced logout due to inactivity");
    } else {
      showToast("Berhasil logout", "success");
    }

    // Redirect to login page
    setTimeout(
      () => {
        window.location.href = "/login.html";
      },
      isForced ? 0 : 1000
    );
  } catch (error) {
    console.error("Sign-out error:", error);
    showToast("Gagal logout", "error");
  }
}

// Utility Functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value) {
  return `${value.toFixed(0)}%`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function formatShortDate(date) {
  // Handle Firestore Timestamp objects and invalid dates
  let dateObj = date;

  if (date && date.toDate && typeof date.toDate === "function") {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else if (date && typeof date === "string") {
    // String date
    dateObj = new Date(date);
  } else if (date && typeof date === "object" && date.seconds) {
    // Firestore Timestamp-like object
    dateObj = new Date(date.seconds * 1000);
  } else if (!(date instanceof Date)) {
    // Fallback to current date if invalid
    dateObj = new Date();
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

function formatDateForInput(date) {
  if (!date) return "";
  const parsed = convertFirestoreDate(date);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getComparableDateValue(date) {
  const parsed = convertFirestoreDate(date);
  return parsed.getTime();
}

function getCategoryName(categoryId) {
  const category = categories.find((cat) => cat.id === categoryId);
  return category ? category.name : categoryId || "-";
}

function getDefaultEntryDate() {
  const reference = currentDate instanceof Date ? new Date(currentDate) : null;
  const today = new Date();

  if (reference) {
    if (
      reference.getFullYear() === today.getFullYear() &&
      reference.getMonth() === today.getMonth()
    ) {
      return today;
    }
    return reference;
  }

  return today;
}

function reapplyTableSearch(tableBodyId, searchInputId) {
  const searchInput = document.getElementById(searchInputId);
  if (!searchInput) {
    return;
  }

  const searchTerm = searchInput.value.toLowerCase();
  if (!searchTerm) {
    return;
  }

  const rows = document.querySelectorAll(`#${tableBodyId} tr`);
  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? "" : "none";
  });
}

function getSortKeyFromOption(target, option) {
  const config = TABLE_SORT_CONFIG[target];
  if (!config || !option) {
    return null;
  }

  return (
    Object.entries(config).find(([, values]) =>
      values.asc === option || values.desc === option
    )?.[0] ?? null
  );
}

function determineNextSortOption(target, key) {
  const config = TABLE_SORT_CONFIG[target]?.[key];
  if (!config) {
    return null;
  }

  const currentOption =
    target === "income" ? incomeSortOption : expenseSortOption;

  if (currentOption === config.asc) {
    return config.desc;
  }

  if (currentOption === config.desc) {
    return config.asc;
  }

  const defaultDirection = config.defaultDirection === "asc" ? "asc" : "desc";
  return config[defaultDirection];
}

function updateSortIndicators(target, option) {
  const activeKey = getSortKeyFromOption(target, option);
  const direction = option?.endsWith("-asc") ? "asc" : "desc";

  document
    .querySelectorAll(`.sort-indicator[data-sort-target="${target}"]`)
    .forEach((indicator) => {
      if (indicator.dataset.sortKey === activeKey) {
        indicator.dataset.direction = direction;
        indicator.classList.add("is-active");
      } else {
        delete indicator.dataset.direction;
        indicator.classList.remove("is-active");
      }
    });

  document
    .querySelectorAll(`.table-sort-button[data-sort-target="${target}"]`)
    .forEach((button) => {
      const buttonKey = button.dataset.sortKey;
      const label =
        TABLE_SORT_LABELS[target]?.[buttonKey] ||
        button.textContent.trim() ||
        "Kolom";

      if (buttonKey === activeKey) {
        button.setAttribute("aria-pressed", "true");
        button.dataset.direction = direction;
        const directionLabel = direction === "asc" ? "menaik" : "menurun";
        button.title = `Urutkan ${label} (${directionLabel})`;
      } else {
        button.setAttribute("aria-pressed", "false");
        delete button.dataset.direction;
        button.title = `Urutkan ${label}`;
      }
    });
}

function toggleSortOption(target, key) {
  const nextOption = determineNextSortOption(target, key);
  if (!nextOption) {
    return;
  }

  if (target === "income") {
    incomeSortOption = nextOption;
    const select = document.getElementById("incomeSort");
    if (select && select.value !== nextOption) {
      select.value = nextOption;
    }
    updateIncomeTable();
  } else if (target === "expense") {
    expenseSortOption = nextOption;
    const select = document.getElementById("expenseSort");
    if (select && select.value !== nextOption) {
      select.value = nextOption;
    }
    updateExpenseTable();
  }
}

function registerTableSortButtons() {
  const buttons = document.querySelectorAll(".table-sort-button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.sortTarget;
      const key = button.dataset.sortKey;
      toggleSortOption(target, key);
    });
  });
}

function isDoneDescription(text) {
  if (!text) {
    return false;
  }

  return String(text).toLowerCase().includes("done");
}

function isSavingsCategory(expense) {
  if (!expense) {
    return false;
  }

  const category = categories.find((cat) => cat.id === expense.category);
  if (!category) {
    return false;
  }

  const normalisedName = String(category.name || "").toLowerCase();
  return category.id === "savings" || normalisedName.includes("tabungan");
}

function generateId() {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }

  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2)
  ).replace(/[^a-z0-9]/gi, "");
}

function getCurrentMonthKey() {
  return `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}

// Toast Functions
function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  toast.className = `toast ${type} show`;
  toastMessage.textContent = message;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Modal Functions
function showModal(modalId) {
  document.getElementById(modalId).classList.add("show");
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("show");
}

// Confirmation Dialog
function showConfirmDialog(message, callback) {
  document.getElementById("confirmMessage").textContent = message;
  document.getElementById("confirmButton").onclick = () => {
    callback();
    closeModal("confirmModal");
  };
  showModal("confirmModal");
}

// Loading Functions
function showLoading() {
  document.getElementById("mainLoading").style.display = "block";
  document.getElementById("mainContent").style.display = "none";
}

function hideLoading() {
  document.getElementById("mainLoading").style.display = "none";
  document.getElementById("mainContent").style.display = "block";
}

// Theme Functions
function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  // Update theme toggle icon with better error handling
  const themeIcon = document.querySelector(".theme-toggle i");
  if (themeIcon) {
    themeIcon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  } else {
    console.warn("Theme toggle icon not found");
  }

  // Refresh chart to update colors for ApexCharts
  if (expenseChart && currentMonthData?.expenses?.length > 0) {
    updateChart();
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);

  const themeIcon = document.querySelector(".theme-toggle i");
  if (themeIcon) {
    themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  } else {
    console.warn("Theme toggle icon not found during load");
  }
}

// Helper function to convert Firestore data
function convertFirestoreData(data) {
  if (!data) return data;

  if (data.incomes && Array.isArray(data.incomes)) {
    data.incomes = data.incomes.map((income) => ({
      ...income,
      date: convertFirestoreDate(income.date),
    }));
  }

  // Convert expense dates
  if (data.expenses && Array.isArray(data.expenses)) {
    data.expenses = data.expenses.map((expense) => ({
      ...expense,
      date: convertFirestoreDate(expense.date),
    }));
  }

  // Convert metadata dates
  if (data.metadata) {
    if (data.metadata.createdAt) {
      data.metadata.createdAt = convertFirestoreDate(data.metadata.createdAt);
    }
    if (data.metadata.updatedAt) {
      data.metadata.updatedAt = convertFirestoreDate(data.metadata.updatedAt);
    }
  }

  return data;
}

function convertFirestoreDate(date) {
  if (!date) return new Date();

  // If it's already a Date object
  if (date instanceof Date) return date;

  // If it's a Firestore Timestamp
  if (date && date.toDate && typeof date.toDate === "function") {
    return date.toDate();
  }

  // If it's a Firestore Timestamp-like object
  if (date && typeof date === "object" && date.seconds) {
    return new Date(date.seconds * 1000);
  }

  // If it's a string
  if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  // Fallback
  return new Date();
}

// Data Management
async function initializeDashboard() {
  showLoading();
  try {
    await firebaseReady;
    await loadCategories();
    await loadTemplates();
    await loadMonthData();

    // If no data for current month and user is completely new, redirect to first month with data
    if (!currentMonthData) {
      const firstMonth = await getFirstMonthWithData();

      if (firstMonth) {
        // User has data in other months, redirect there
        const [year, month] = firstMonth.split("-");
        currentDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        await loadMonthData();
      } else {
        // Completely new user with no data anywhere - show empty state
        currentMonthData = {
          incomes: [],
          expenses: [],
          budgets: {},
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
      }
    }

    updateUI();
  } catch (error) {
    console.error("Initialization error:", error);
    showToast("Gagal memuat data", "error");
  }
  hideLoading();
}

async function loadCategories() {
  const user = requireCurrentUser();
  const docRef = doc(db, "users", user.uid, "categories", "main");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    categories = docSnap.data().categories || [];
  } else {
    categories = [...defaultCategories];
    await saveCategories();
  }
}

async function saveCategories() {
  const user = requireCurrentUser();
  const docRef = doc(db, "users", user.uid, "categories", "main");
  await setDoc(docRef, { categories });
}

async function loadTemplates() {
  const user = requireCurrentUser();
  const docRef = doc(db, "users", user.uid, "templates", "recurring");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    templates = docSnap.data().templates || [];
  } else {
    templates = [];
  }
}

async function saveTemplates() {
  const user = requireCurrentUser();
  const docRef = doc(db, "users", user.uid, "templates", "recurring");
  await setDoc(docRef, { templates });
}

async function loadMonthData() {
  const monthKey = getCurrentMonthKey();
  const user = requireCurrentUser();
  const docRef = doc(db, "users", user.uid, "months", monthKey);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    // Convert Firestore data properly
    currentMonthData = convertFirestoreData(docSnap.data());

    // Migrate old single income to income array if needed
    if (
      typeof currentMonthData.income === "number" &&
      currentMonthData.income > 0
    ) {
      currentMonthData.incomes = [
        {
          id: generateId(),
          amount: currentMonthData.income,
          source: "Migrated Income",
          date: getDefaultEntryDate(),
          description: "Data pemasukan lama",
        },
      ];
      delete currentMonthData.income;
      await saveMonthData();
    }
  } else {
    // Create new empty month data for all users
    currentMonthData = {
      incomes: [], // Change from income: 0 to incomes: []
      expenses: [],
      budgets: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }
}

// Remove the automatic migration - keep this function for manual migration if needed
async function migrateOctoberDataManually() {
  // Only run if explicitly called and for specific user
  const AUTHORIZED_USER_ID = "YOUR_USER_ID_HERE"; // Replace with your actual user ID
  const user = requireCurrentUser();

  if (user.uid !== AUTHORIZED_USER_ID) {
    showToast("Migration not authorized for this user", "warning");
    return;
  }

  // Check if already migrated
  const migrationRef = doc(db, "users", user.uid, "migration", "status");
  const migrationDoc = await getDoc(migrationRef);

  if (migrationDoc.exists() && migrationDoc.data().completed) {
    showToast("Data sudah dimigrasikan sebelumnya", "info");
    return;
  }

  // Migration logic for October 2025 data (only for authorized user)
  const oldExpenses = [
    { category: "savings", amount: 1200000, description: "Nabung Emas" },
    {
      category: "savings",
      amount: 400000,
      description: "Menabung Mandiri",
    },
    { category: "family", amount: 500000, description: "Mama" },
    { category: "family", amount: 150000, description: "Rakha" },
    { category: "family", amount: 150000, description: "Mbah" },
    { category: "subscriptions", amount: 130000, description: "Kuota" },
    {
      category: "debt",
      amount: 940000,
      description: "Paylater (TikTok+Shopee)",
    },
    {
      category: "subscriptions",
      amount: 30000,
      description: "Shopee VIP",
    },
    {
      category: "subscriptions",
      amount: 20000,
      description: "Gojek Plus",
    },
    { category: "needs", amount: 130000, description: "Dry + Wet Food" },
    {
      category: "needs",
      amount: 200000,
      description: "Lauk (jika mama tidak masak)",
    },
    {
      category: "lifestyle",
      amount: 100000,
      description: "Makan Sashimi",
    },
    { category: "lifestyle", amount: 60000, description: "Barber" },
    {
      category: "needs",
      amount: 150000,
      description: "Persediaan Kebersihan",
    },
    { category: "lifestyle", amount: 200000, description: "Lari" },
    { category: "lifestyle", amount: 300000, description: "Jajan" },
    { category: "transport", amount: 650000, description: "Ongkos" },
    {
      category: "family",
      amount: 150000,
      description: "Tabungan Kado Mama",
    },
    { category: "shopping", amount: 50000, description: "Launcher" },
    {
      category: "shopping",
      amount: 125000,
      description: "Beli Bantal Guling",
    },
  ];

  const currentTimestamp = new Date();

  currentMonthData = {
    income: 6000000,
    expenses: oldExpenses.map((expense, index) => ({
      id: generateId(),
      ...expense,
      date: currentTimestamp,
      isRecurring: false,
    })),
    budgets: {},
    metadata: {
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      migrated: true,
    },
  };

  await saveMonthData();

  // Mark migration as completed
  await setDoc(migrationRef, {
    completed: true,
    completedAt: new Date(),
    userId: user.uid,
  });

  showToast("Data Oktober berhasil dimigrasikan", "success");
}

async function saveMonthData() {
  if (!currentMonthData) return;

  const monthKey = getCurrentMonthKey();
  const user = requireCurrentUser();
  const docRef = doc(db, "users", user.uid, "months", monthKey);

  // Ensure metadata exists for legacy data before saving to Firestore
  if (!currentMonthData.metadata || typeof currentMonthData.metadata !== "object") {
    currentMonthData.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } else {
    if (!currentMonthData.metadata.createdAt) {
      currentMonthData.metadata.createdAt = new Date();
    }
    currentMonthData.metadata.updatedAt = new Date();
  }

  // Normalise potential legacy structures to avoid runtime errors
  if (!Array.isArray(currentMonthData.incomes)) {
    currentMonthData.incomes = [];
  }

  if (!Array.isArray(currentMonthData.expenses)) {
    currentMonthData.expenses = [];
  }

  currentMonthData.incomes = currentMonthData.incomes.map((income) => ({
    ...income,
    date: convertFirestoreDate(income.date),
  }));

  currentMonthData.expenses = currentMonthData.expenses.map((expense) => ({
    ...expense,
    date: convertFirestoreDate(expense.date),
  }));

  await setDoc(docRef, currentMonthData);
}

// UI Update Functions
function updateUI() {
  updateCurrentMonthDisplay();
  updateSummaryCards();
  updateExpenseTable();
  updateIncomeTable(); // Add income table update
  updateChart();
  updateCategorySelect();
  updateCategoryList();
  updateTemplatesList();
}

function updateCurrentMonthDisplay() {
  document.getElementById("currentMonth").textContent = formatDate(currentDate);
}

function updateSummaryCards() {
  const incomes = currentMonthData?.incomes || [];
  const expenses = currentMonthData?.expenses || [];

  const totalIncome = incomes.reduce(
    (sum, income) => sum + Number(income.amount || 0),
    0
  );
  const totalPlannedExpense = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );
  const totalActualExpense = expenses
    .filter((expense) => isDoneDescription(expense?.description))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const actualBalance = totalIncome - totalActualExpense;
  const plannedRemaining = totalIncome - totalPlannedExpense;
  const totalSavingsExpense = expenses
    .filter((expense) => isSavingsCategory(expense))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const savingsRate =
    totalIncome > 0 ? (totalSavingsExpense / totalIncome) * 100 : null;

  const totalIncomeElement = document.getElementById("totalIncome");
  if (totalIncomeElement) {
    totalIncomeElement.textContent = formatCurrency(totalIncome);
  }

  const plannedExpenseElement = document.getElementById("totalExpensePlanned");
  if (plannedExpenseElement) {
    plannedExpenseElement.textContent = formatCurrency(totalPlannedExpense);
  }

  const actualExpenseElement = document.getElementById("totalExpenseActual");
  if (actualExpenseElement) {
    actualExpenseElement.textContent = formatCurrency(totalActualExpense);
  }

  const actualBalanceElement = document.getElementById("actualBalance");
  if (actualBalanceElement) {
    actualBalanceElement.textContent = formatCurrency(actualBalance);

    if (actualBalance > 0) {
      actualBalanceElement.style.color = "var(--success-color)";
    } else if (actualBalance < 0) {
      actualBalanceElement.style.color = "var(--danger-color)";
    } else {
      actualBalanceElement.style.color = "var(--text-primary)";
    }
  }

  const plannedRemainingElement = document.getElementById("plannedRemaining");
  if (plannedRemainingElement) {
    plannedRemainingElement.textContent = formatCurrency(plannedRemaining);

    if (plannedRemaining > 0) {
      plannedRemainingElement.style.color = "var(--success-color)";
    } else if (plannedRemaining < 0) {
      plannedRemainingElement.style.color = "var(--danger-color)";
    } else {
      plannedRemainingElement.style.color = "var(--text-primary)";
    }
  }

  const savingsRateElement = document.getElementById("savingsRate");
  if (savingsRateElement) {
    if (savingsRate === null) {
      savingsRateElement.textContent = "—";
      savingsRateElement.style.color = "var(--text-secondary)";
    } else {
      savingsRateElement.textContent = formatPercentage(savingsRate);

      if (savingsRate >= 20) {
        savingsRateElement.style.color = "var(--success-color)";
      } else if (savingsRate >= 10) {
        savingsRateElement.style.color = "var(--warning-color)";
      } else if (savingsRate >= 0) {
        savingsRateElement.style.color = "var(--text-primary)";
      } else {
        savingsRateElement.style.color = "var(--danger-color)";
      }
    }
  }
}

function updateIncomeTable() {
  const tbody = document.getElementById("incomeTableBody");
  const incomes = Array.isArray(currentMonthData?.incomes)
    ? [...currentMonthData.incomes]
    : [];

  const selectedSort = getSelectValue("incomeSort", incomeSortOption);
  if (selectedSort !== incomeSortOption) {
    incomeSortOption = selectedSort;
  }

  updateSortIndicators("income", incomeSortOption);

  const sortedIncomes = incomes.sort((a, b) => {
    switch (incomeSortOption) {
      case "date-asc":
        return getComparableDateValue(a.date) - getComparableDateValue(b.date);
      case "amount-desc":
        return (b.amount || 0) - (a.amount || 0);
      case "amount-asc":
        return (a.amount || 0) - (b.amount || 0);
      case "alpha-desc": {
        const sourceA = (a.source || "").toLowerCase();
        const sourceB = (b.source || "").toLowerCase();
        return sourceB.localeCompare(sourceA, "id");
      }
      case "alpha-asc": {
        const sourceA = (a.source || "").toLowerCase();
        const sourceB = (b.source || "").toLowerCase();
        return sourceA.localeCompare(sourceB, "id");
      }
      case "date-desc":
      default:
        return getComparableDateValue(b.date) - getComparableDateValue(a.date);
    }
  });

  if (sortedIncomes.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Belum ada pemasukan</td></tr>';
    return;
  }

  tbody.innerHTML = sortedIncomes
    .map((income) => {
      // Safely format the date
      let formattedDate = "N/A";
      try {
        formattedDate = formatShortDate(income.date);
      } catch (error) {
        console.warn("Error formatting date for income:", income.id, error);
        formattedDate = "Invalid Date";
      }

      return `
        <tr>
          <td>${formattedDate}</td>
          <td style="font-weight: 500;">${income.source || "-"}</td>
          <td style="font-weight: 600; color: var(--success-color);">${formatCurrency(
            income.amount
          )}</td>
          <td>${income.description || "-"}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editIncome('${
              income.id
            }')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteIncome('${
              income.id
            }')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  reapplyTableSearch("incomeTableBody", "searchIncome");
}

function updateExpenseTable() {
  const tbody = document.getElementById("expenseTableBody");
  const expenses = Array.isArray(currentMonthData?.expenses)
    ? [...currentMonthData.expenses]
    : [];

  const activeCategoryFilter = getSelectValue(
    "expenseCategoryFilter",
    expenseCategoryFilter,
  );

  if (activeCategoryFilter !== expenseCategoryFilter) {
    expenseCategoryFilter = activeCategoryFilter;
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (activeCategoryFilter === "all") {
      return true;
    }
    return expense.category === activeCategoryFilter;
  });

  const selectedSort = getSelectValue("expenseSort", expenseSortOption);
  if (selectedSort !== expenseSortOption) {
    expenseSortOption = selectedSort;
  }

  updateSortIndicators("expense", expenseSortOption);

  const sortedExpenses = filteredExpenses.sort((a, b) => {
    switch (expenseSortOption) {
      case "date-asc":
        return getComparableDateValue(a.date) - getComparableDateValue(b.date);
      case "amount-desc":
        return (b.amount || 0) - (a.amount || 0);
      case "amount-asc":
        return (a.amount || 0) - (b.amount || 0);
      case "alpha-desc": {
        const descA = (a.description || getCategoryName(a.category) || "").toLowerCase();
        const descB = (b.description || getCategoryName(b.category) || "").toLowerCase();
        return descB.localeCompare(descA, "id");
      }
      case "alpha-asc": {
        const descA = (a.description || getCategoryName(a.category) || "").toLowerCase();
        const descB = (b.description || getCategoryName(b.category) || "").toLowerCase();
        return descA.localeCompare(descB, "id");
      }
      case "category-desc": {
        const categoryA = getCategoryName(a.category).toLowerCase();
        const categoryB = getCategoryName(b.category).toLowerCase();
        return categoryB.localeCompare(categoryA, "id");
      }
      case "category-asc": {
        const categoryA = getCategoryName(a.category).toLowerCase();
        const categoryB = getCategoryName(b.category).toLowerCase();
        return categoryA.localeCompare(categoryB, "id");
      }
      case "date-desc":
      default:
        return getComparableDateValue(b.date) - getComparableDateValue(a.date);
    }
  });

  if (sortedExpenses.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Belum ada pengeluaran</td></tr>';
    return;
  }

  tbody.innerHTML = sortedExpenses
    .map((expense) => {
      const category = categories.find((cat) => cat.id === expense.category);
      const categoryName = getCategoryName(expense.category);

      // Safely format the date
      let formattedDate = "N/A";
      try {
        formattedDate = formatShortDate(expense.date);
      } catch (error) {
        console.warn("Error formatting date for expense:", expense.id, error);
        formattedDate = "Invalid Date";
      }

      // Check if description contains "Done" or "done" for highlighting
      const description = expense.description || "";
      const isDone = isDoneDescription(description);
      const doneClass = isDone ? "expense-done" : "";

      return `
        <tr class="${doneClass}">
          <td>${formattedDate}</td>
          <td>
            <span class="category-badge" style="background-color: ${
              category?.color
            }20; color: ${category?.color}">
              ${categoryName}
            </span>
          </td>
          <td style="font-weight: 600;">${formatCurrency(expense.amount)}</td>
          <td>${description || "-"}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editExpense('${
              expense.id
            }')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteExpense('${
              expense.id
            }')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  reapplyTableSearch("expenseTableBody", "searchExpense");
}

function updateChart() {
  try {
    const canvas = document.getElementById("expenseChart");

    if (!canvas) {
      console.warn("Chart canvas not found");
      return;
    }

    const ctx = canvas.getContext("2d");

    // Destroy existing chart
    if (expenseChart) {
      expenseChart.destroy();
    }

    const expenses = currentMonthData?.expenses || [];
    if (expenses.length === 0) {
      // Clear canvas and show message
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-secondary")
        .trim();
      ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Belum ada data untuk ditampilkan",
        canvas.width / 2,
        canvas.height / 2
      );
      return;
    }

    // Group expenses by category
    const categoryTotals = {};
    expenses.forEach((expense) => {
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += expense.amount;
      } else {
        categoryTotals[expense.category] = expense.amount;
      }
    });

    const labels = [];
    const data = [];
    const colors = [];

    Object.entries(categoryTotals).forEach(([categoryId, total]) => {
      const category = categories.find((cat) => cat.id === categoryId);
      labels.push(category ? category.name : categoryId);
      data.push(total);
      colors.push(category ? category.color : "#999999");
    });

    // Get current theme colors
    const isDarkMode = document.body.getAttribute("data-theme") === "dark";
    const textColor = isDarkMode ? "#ffffff" : "#333333";
    const gridColor = isDarkMode ? "#444444" : "#e0e0e0";

    // Create chart with theme-aware colors
    expenseChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: isDarkMode ? "#333333" : "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              padding: 15,
              usePointStyle: true,
              font: {
                size: 14,
                family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
              },
            },
          },
          tooltip: {
            backgroundColor: isDarkMode ? "#333333" : "#ffffff",
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                return context.label + ": " + formatCurrency(context.raw);
              },
            },
          },
        },
        elements: {
          arc: {
            borderWidth: 2,
          },
        },
      },
    });
  } catch (error) {
    console.error("Chart update error:", error);
    // Show error message on canvas if possible
    try {
      const canvas = document.getElementById("expenseChart");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f44336";
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          "Error loading chart",
          canvas.width / 2,
          canvas.height / 2
        );
      }
    } catch (e) {
      console.error("Could not show error on canvas:", e);
    }
  }
}

function updateCategorySelect() {
  const select = document.getElementById("expenseCategory");
  if (select) {
    select.innerHTML = categories
      .map(
        (category) => `<option value="${category.id}">${category.name}</option>`
      )
      .join("");
  }

  const filterSelect = document.getElementById("expenseCategoryFilter");
  if (filterSelect) {
    const previousValue = expenseCategoryFilter;
    const options = [
      '<option value="all">Semua Kategori</option>',
      ...categories.map(
        (category) =>
          `<option value="${category.id}">${category.name}</option>`
      ),
    ];
    filterSelect.innerHTML = options.join("");

    if (
      previousValue !== "all" &&
      !categories.some((category) => category.id === previousValue)
    ) {
      expenseCategoryFilter = "all";
    }

    filterSelect.value = expenseCategoryFilter;
  }
}

function updateCategoryList() {
  const container = document.getElementById("categoryList");
  container.innerHTML = categories
    .map((category) => {
      const colorValue = category.color || defaultCategoryColor;
      const colorDisplay = String(colorValue).toUpperCase();
      return `
        <div class="template-item" style="border-left: 4px solid ${colorValue}">
          <div>
            <strong>${category.name}</strong>
            ${
              category.isDefault
                ? '<small style="color: var(--text-secondary)"> (Default)</small>'
                : ""
            }
            <div class="category-meta">
              <span
                class="category-color-chip"
                style="background-color: ${colorValue};"
                aria-hidden="true"
              ></span>
              <small class="category-color-label">${colorDisplay}</small>
            </div>
          </div>
          <div>
            <button class="btn btn-sm btn-secondary" onclick="editCategory('${
              category.id
            }')">
              <i class="fas fa-pen"></i>
            </button>
            ${
              !category.isDefault
                ? `
                <button class="btn btn-sm btn-danger" onclick="deleteCategory('${category.id}')">
                  <i class="fas fa-trash"></i>
                </button>
              `
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function updateTemplatesList() {
  const container = document.getElementById("templateList");

  if (templates.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: var(--text-secondary);">Belum ada template rutin</p>';
    return;
  }

  container.innerHTML = templates
    .map((template) => {
      const category = categories.find((cat) => cat.id === template.category);
      return `
        <div class="template-item">
          <div>
            <strong>${category ? category.name : template.category}</strong><br>
            <small>${formatCurrency(template.amount)} - ${
        template.description
      }</small>
          </div>
          <div>
            <button class="btn btn-sm btn-danger" onclick="deleteTemplate('${
              template.id
            }')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  // Update templates container in main content
  const templatesContainer = document.getElementById("templatesContainer");
  templatesContainer.innerHTML = container.innerHTML;
}

// Month Navigation
function changeMonth(direction) {
  currentDate.setMonth(currentDate.getMonth() + direction);
  loadMonthData().then(() => {
    updateUI();
  });
}

// Income Modal Functions
function showIncomeModal(incomeId = null) {
  const incomeAmountInput = document.getElementById("incomeAmount");
  const incomeSourceInput = document.getElementById("incomeSource");
  const modalTitle = document.getElementById("incomeModalTitle");
  const submitText = document.getElementById("incomeSubmitText");
  const incomeHint = document.getElementById("incomeHint");
  const incomeDateInput = document.getElementById("incomeDate");

  // Reset form
  document.getElementById("incomeForm").reset();

  if (incomeId) {
    // Editing existing income
    const income = currentMonthData.incomes.find((inc) => inc.id === incomeId);
    if (income) {
      incomeAmountInput.value = income.amount;
      incomeSourceInput.value = income.source || "";
      document.getElementById("incomeDescription").value =
        income.description || "";
      if (incomeDateInput) {
        const formattedDate = formatDateForInput(income.date);
        incomeDateInput.value =
          formattedDate || formatDateForInput(getDefaultEntryDate());
      }

      modalTitle.textContent = "Edit Pemasukan";
      submitText.textContent = "Update";
      incomeHint.textContent = `Edit pemasukan: ${
        income.source || "Tidak ada sumber"
      }`;
      incomeHint.style.display = "block";
    }

    // Store income ID for editing
    incomeAmountInput.setAttribute("data-income-id", incomeId);
  } else {
    // Adding new income
    modalTitle.textContent = "Tambah Pemasukan";
    submitText.textContent = "Simpan";
    incomeHint.style.display = "none";

    // Clear income ID
    incomeAmountInput.removeAttribute("data-income-id");
    if (incomeDateInput) {
      incomeDateInput.value = formatDateForInput(getDefaultEntryDate());
    }
  }

  showModal("incomeModal");

  // Focus on the amount input after a short delay
  setTimeout(() => {
    incomeAmountInput.focus();
    if (incomeId) {
      incomeAmountInput.select();
    }
  }, 100);
}

function editIncome(incomeId) {
  showIncomeModal(incomeId);
}

function deleteIncome(incomeId) {
  const income = currentMonthData.incomes.find((inc) => inc.id === incomeId);
  const sourceName = income ? income.source || "Pemasukan" : "Pemasukan";

  showConfirmDialog(
    `Apakah Anda yakin ingin menghapus "${sourceName}"?`,
    async () => {
      try {
        currentMonthData.incomes = currentMonthData.incomes.filter(
          (inc) => inc.id !== incomeId
        );
        await saveMonthData();
        updateUI();
        showToast("Pemasukan berhasil dihapus", "success");
      } catch (error) {
        console.error("Delete income error:", error);
        showToast("Gagal menghapus pemasukan", "error");
      }
    }
  );
}

// Expense Modal Functions
function showExpenseModal(expenseId = null) {
  const form = document.getElementById("expenseForm");
  const expenseDateInput = document.getElementById("expenseDate");

  // Reset form
  form.reset();
  document.getElementById("expenseId").value = expenseId || "";
  if (expenseDateInput) {
    expenseDateInput.value = formatDateForInput(getDefaultEntryDate());
  }

  if (expenseId) {
    const expense = currentMonthData.expenses.find(
      (exp) => exp.id === expenseId
    );
    if (expense) {
      document.getElementById("expenseCategory").value = expense.category;
      document.getElementById("expenseAmount").value = expense.amount;
      document.getElementById("expenseDescription").value =
        expense.description || "";
      document.getElementById("expenseRecurring").checked =
        expense.isRecurring || false;
      if (expenseDateInput) {
        const formattedExpenseDate = formatDateForInput(expense.date);
        expenseDateInput.value =
          formattedExpenseDate || formatDateForInput(getDefaultEntryDate());
      }
    }
  }

  showModal("expenseModal");
}

function editExpense(expenseId) {
  showExpenseModal(expenseId);
}

function deleteExpense(expenseId) {
  showConfirmDialog(
    "Apakah Anda yakin ingin menghapus pengeluaran ini?",
    async () => {
      try {
        currentMonthData.expenses = currentMonthData.expenses.filter(
          (exp) => exp.id !== expenseId
        );
        await saveMonthData();
        updateUI();
        showToast("Pengeluaran berhasil dihapus", "success");
      } catch (error) {
        console.error("Delete expense error:", error);
        showToast("Gagal menghapus pengeluaran", "error");
      }
    }
  );
}

// Category Modal Functions
function configureCategoryForm(mode, category = null) {
  const form = document.getElementById("categoryForm");
  const title = document.getElementById("categoryFormTitle");
  const submitLabel = document.getElementById("categoryFormSubmitLabel");
  const nameInput = document.getElementById("categoryName");
  const colorInput = document.getElementById("categoryColor");
  const idInput = document.getElementById("categoryId");

  if (!form || !title || !submitLabel || !nameInput || !colorInput || !idInput) {
    return;
  }

  if (mode === "edit" && category) {
    form.dataset.mode = "edit";
    idInput.value = category.id;
    nameInput.value = category.name;
    colorInput.value = category.color || defaultCategoryColor;
    title.textContent = "Edit kategori";
    submitLabel.textContent = "Simpan";
  } else {
    form.reset();
    form.dataset.mode = "add";
    idInput.value = "";
    colorInput.value = defaultCategoryColor;
    title.textContent = "Tambah kategori baru";
    submitLabel.textContent = "Tambah";
  }
}

function showCategoryModal() {
  hideAddCategoryForm();
  updateCategoryList();
  showModal("categoryModal");
}

function showAddCategoryForm() {
  configureCategoryForm("add");
  const container = document.getElementById("addCategoryForm");
  if (container) {
    container.style.display = "block";
  }
  const nameInput = document.getElementById("categoryName");
  if (nameInput) {
    nameInput.focus();
  }
}

function hideAddCategoryForm() {
  const container = document.getElementById("addCategoryForm");
  if (container) {
    container.style.display = "none";
  }
  configureCategoryForm("add");
}

function editCategory(categoryId) {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) {
    showToast("Kategori tidak ditemukan", "error");
    return;
  }

  configureCategoryForm("edit", category);
  const container = document.getElementById("addCategoryForm");
  if (container) {
    container.style.display = "block";
  }

  const nameInput = document.getElementById("categoryName");
  if (nameInput) {
    nameInput.focus();
    nameInput.select();
  }
}

function deleteCategory(categoryId) {
  const category = categories.find((cat) => cat.id === categoryId);
  if (!category) return;

  // Check if category is used in expenses
  const isUsed = currentMonthData.expenses.some(
    (exp) => exp.category === categoryId
  );

  if (isUsed) {
    showToast("Kategori tidak dapat dihapus karena masih digunakan", "warning");
    return;
  }

  showConfirmDialog(`Hapus kategori "${category.name}"?`, async () => {
    try {
      categories = categories.filter((cat) => cat.id !== categoryId);
      await saveCategories();
      updateCategoryList();
      updateCategorySelect();
      showToast("Kategori berhasil dihapus", "success");
    } catch (error) {
      console.error("Delete category error:", error);
      showToast("Gagal menghapus kategori", "error");
    }
  });
}

// Template Functions
function showTemplateModal() {
  updateTemplatesList();
  showModal("templateModal");
}

function deleteTemplate(templateId) {
  showConfirmDialog("Hapus template ini?", async () => {
    try {
      templates = templates.filter((template) => template.id !== templateId);
      await saveTemplates();
      updateTemplatesList();
      showToast("Template berhasil dihapus", "success");
    } catch (error) {
      console.error("Delete template error:", error);
      showToast("Gagal menghapus template", "error");
    }
  });
}

async function applyTemplates() {
  if (templates.length === 0) {
    showToast("Tidak ada template untuk diterapkan", "warning");
    return;
  }

  showConfirmDialog(
    `Terapkan ${templates.length} template ke bulan ini?`,
    async () => {
      try {
        const newExpenses = templates.map((template) => ({
          id: generateId(),
          category: template.category,
          amount: template.amount,
          description: template.description,
          date: getDefaultEntryDate(),
          isRecurring: true,
        }));

        currentMonthData.expenses.push(...newExpenses);
        await saveMonthData();
        updateUI();
        closeModal("templateModal");
        showToast(
          `${templates.length} template berhasil diterapkan`,
          "success"
        );
      } catch (error) {
        console.error("Apply templates error:", error);
        showToast("Gagal menerapkan template", "error");
      }
    }
  );
}

// Export/Import Functions
async function exportData() {
  try {
    if (!window.ExcelJS) {
      showToast("Fitur export belum siap, silakan muat ulang halaman", "error");
      return;
    }

    if (!currentMonthData) {
      showToast("Tidak ada data untuk diekspor", "warning");
      return;
    }

    const ExcelJS = window.ExcelJS;
    const workbook = new ExcelJS.Workbook();
    const now = new Date();
    workbook.creator = "Dashboard Keuangan";
    workbook.created = now;
    workbook.modified = now;

    const worksheet = workbook.addWorksheet("Ringkasan Keuangan");

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const toDate = (value) => {
      if (!value) {
        return new Date();
      }

      if (value instanceof Date) {
        return value;
      }

      if (value.toDate && typeof value.toDate === "function") {
        return value.toDate();
      }

      if (typeof value === "object" && value.seconds) {
        return new Date(value.seconds * 1000);
      }

      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    };

    const summaryBorder = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };

    const currencyFormat = '"Rp" #,##0;[Red]-"Rp" #,##0';
    const dateFormat = "dd/mm/yyyy";

    const incomes = Array.isArray(currentMonthData.incomes)
      ? currentMonthData.incomes.filter(Boolean)
      : [];
    const expenses = Array.isArray(currentMonthData.expenses)
      ? currentMonthData.expenses.filter(Boolean)
      : [];

    incomes.sort((a, b) => toDate(a.date) - toDate(b.date));
    expenses.sort((a, b) => toDate(a.date) - toDate(b.date));

    const totalIncome = incomes.reduce(
      (sum, income) => sum + toNumber(income.amount),
      0
    );
    const doneExpenses = expenses.filter((expense) =>
      isDoneDescription(expense?.description)
    );
    const totalDoneExpense = doneExpenses.reduce(
      (sum, expense) => sum + toNumber(expense.amount),
      0
    );
    const balance = totalIncome - totalDoneExpense;

    const summaryRows = [
      { label: "Total Pemasukan", value: totalIncome, color: "FFD1F2C7" },
      {
        label: "Total Pengeluaran",
        value: totalDoneExpense,
        color: "FFF8D7DA",
      },
      { label: "Saldo", value: balance, color: "FFD0E2FF" },
    ];

    summaryRows.forEach((item) => {
      const row = worksheet.addRow([item.label, item.value]);
      row.font = { bold: true };
      row.height = 20;

      const labelCell = row.getCell(1);
      const valueCell = row.getCell(2);

      labelCell.alignment = { vertical: "middle", horizontal: "left" };
      valueCell.alignment = { vertical: "middle", horizontal: "right" };
      valueCell.numFmt = currencyFormat;

      [labelCell, valueCell].forEach((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: item.color },
        };
        cell.border = summaryBorder;
      });
    });

    worksheet.addRow([]);

    const applySectionHeader = (title) => {
      const row = worksheet.addRow([title]);
      worksheet.mergeCells(row.number, 1, row.number, 4);
      row.height = 22;

      const cell = row.getCell(1);
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1F2937" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF1F2937" } },
        left: { style: "thin", color: { argb: "FF1F2937" } },
        bottom: { style: "thin", color: { argb: "FF1F2937" } },
        right: { style: "thin", color: { argb: "FF1F2937" } },
      };

      return row.number;
    };

    applySectionHeader("DAFTAR PEMASUKAN");

    const incomeTableStartRow = worksheet.rowCount + 1;
    const incomeRows =
      incomes.length > 0
        ? incomes.map((income) => [
            toDate(income.date),
            income.source || "-",
            toNumber(income.amount),
            income.description || "-",
          ])
        : [[null, "-", null, "Tidak ada data"]];

    worksheet.addTable({
      name: "IncomeTable",
      ref: `A${incomeTableStartRow}`,
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleLight9", showRowStripes: false },
      columns: [
        { name: "Tanggal" },
        { name: "Sumber" },
        { name: "Jumlah" },
        { name: "Keterangan" },
      ],
      rows: incomeRows,
    });

    const formatTableHeader = (rowNumber) => {
      const row = worksheet.getRow(rowNumber);
      row.height = 20;
      row.font = { bold: true, color: { argb: "FF111827" } };
      row.alignment = { vertical: "middle", horizontal: "center" };
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE2E8F0" },
        };
        cell.border = summaryBorder;
      });
    };

    const formatTableBody = (startRow, count, isExpense = false) => {
      const doneFill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCAFADB" },
      };

      for (let index = 0; index < count; index += 1) {
        const row = worksheet.getRow(startRow + index);
        row.eachCell((cell, colNumber) => {
          if (colNumber === 1) {
            cell.numFmt = dateFormat;
            cell.alignment = { horizontal: "center" };
          } else if (colNumber === 3) {
            cell.numFmt = currencyFormat;
            cell.alignment = { horizontal: "right" };
          } else {
            cell.alignment = { horizontal: "left" };
          }
          cell.border = summaryBorder;
        });

        if (
          isExpense &&
          expenses[index] &&
          typeof expenses[index].description === "string" &&
          isDoneDescription(expenses[index].description)
        ) {
          row.eachCell((cell) => {
            cell.fill = doneFill;
          });
        }
      }
    };

    formatTableHeader(incomeTableStartRow);
    formatTableBody(incomeTableStartRow + 1, incomeRows.length);

    worksheet.views = [{ state: "frozen", ySplit: incomeTableStartRow }];

    worksheet.addRow([]);

    applySectionHeader("DAFTAR PENGELUARAN");

    const categoryMap = new Map(
      (Array.isArray(categories) ? categories : []).map((cat) => [
        cat.id,
        cat.name,
      ])
    );

    const expenseRows =
      expenses.length > 0
        ? expenses.map((expense) => [
            toDate(expense.date),
            categoryMap.get(expense.category) || expense.category || "-",
            toNumber(expense.amount),
            expense.description || "-",
          ])
        : [[null, "-", null, "Tidak ada data"]];

    const expenseTableStartRow = worksheet.rowCount + 1;
    worksheet.addTable({
      name: "ExpenseTable",
      ref: `A${expenseTableStartRow}`,
      headerRow: true,
      totalsRow: false,
      style: { theme: "TableStyleLight9", showRowStripes: false },
      columns: [
        { name: "Tanggal" },
        { name: "Kategori" },
        { name: "Jumlah" },
        { name: "Keterangan" },
      ],
      rows: expenseRows,
    });

    formatTableHeader(expenseTableStartRow);
    formatTableBody(expenseTableStartRow + 1, expenseRows.length, true);

    for (let col = 1; col <= 4; col += 1) {
      const column = worksheet.getColumn(col);
      let maxLength = 0;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const { value } = cell;
        let text = "";

        if (value === null || value === undefined) {
          text = "";
        } else if (value.richText) {
          text = value.richText.map((part) => part.text).join("");
        } else if (value.text !== undefined) {
          text = value.text;
        } else if (value instanceof Date) {
          text = new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }).format(value);
        } else if (typeof value === "object" && value.result !== undefined) {
          text = String(value.result);
        } else {
          text = value.toString();
        }

        if (text.length > maxLength) {
          maxLength = text.length;
        }
      });

      column.width = Math.min(Math.max(maxLength + 2, 14), 40);
    }

    const monthLabel = formatDate(currentDate);
    const safeMonthLabel = monthLabel
      .replace(/\s+/g, "_")
      .replace(/[^\w\-]/g, "");
    const fileName = `Keuangan_${safeMonthLabel}.xlsx`;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    showToast("Data berhasil diekspor ke Excel", "success");
  } catch (error) {
    console.error("Export error:", error);
    showToast("Gagal mengekspor data", "error");
  }
}

function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      const text = await file.text();
      const data = JSON.parse(text);

      if (data.data && data.categories) {
        showConfirmDialog(
          "Import data akan menimpa data bulan ini. Lanjutkan?",
          async () => {
            try {
              currentMonthData = data.data;
              categories = [
                ...defaultCategories,
                ...data.categories.filter((cat) => !cat.isDefault),
              ];
              if (data.templates) {
                templates = data.templates;
              }

              await saveMonthData();
              await saveCategories();
              await saveTemplates();
              updateUI();
              showToast("Data berhasil diimpor", "success");
            } catch (error) {
              console.error("Import save error:", error);
              showToast("Gagal menyimpan data import", "error");
            }
          }
        );
      } else {
        showToast("Format file tidak valid", "error");
      }
    } catch (error) {
      console.error("Import error:", error);
      showToast("Gagal membaca file", "error");
    }
  };

  input.click();
}

// Form Handlers
onDocumentReady(() => {
  registerTableSortButtons();
  updateSortIndicators("income", incomeSortOption);
  updateSortIndicators("expense", expenseSortOption);

  // Income form handler
  document
    .getElementById("incomeForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const amount = parseInt(document.getElementById("incomeAmount").value);
        const source = document.getElementById("incomeSource").value.trim();
        const description = document
          .getElementById("incomeDescription")
          .value.trim();
        const incomeDateElement = document.getElementById("incomeDate");
        const dateValue = incomeDateElement ? incomeDateElement.value : "";
        const date = parseDateInput(dateValue);

        // Get income ID if editing
        const incomeId = document
          .getElementById("incomeAmount")
          .getAttribute("data-income-id");

        if (!currentMonthData) {
          currentMonthData = {
            incomes: [],
            expenses: [],
            budgets: {},
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          };
        }

        if (!currentMonthData.incomes) {
          currentMonthData.incomes = [];
        }

        if (incomeId) {
          // Update existing income
          const incomeIndex = currentMonthData.incomes.findIndex(
            (inc) => inc.id === incomeId
          );
          if (incomeIndex !== -1) {
            currentMonthData.incomes[incomeIndex] = {
              ...currentMonthData.incomes[incomeIndex],
              amount,
              source,
              description,
              date,
            };
            showToast("Pemasukan berhasil diperbarui", "success");
          }
        } else {
          // Add new income
          const newIncome = {
            id: generateId(),
            amount,
            source,
            description,
            date,
          };
          currentMonthData.incomes.push(newIncome);
          showToast("Pemasukan berhasil ditambah", "success");
        }

        await saveMonthData();
        updateUI();
        closeModal("incomeModal");
      } catch (error) {
        console.error("Save income error:", error);
        showToast("Gagal menyimpan pemasukan", "error");
      }
    });

  // Expense form handler
  document
    .getElementById("expenseForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const expenseId = document.getElementById("expenseId").value;
        const category = document.getElementById("expenseCategory").value;
        const amount = parseInt(document.getElementById("expenseAmount").value);
        const description = document.getElementById("expenseDescription").value;
        const isRecurring = document.getElementById("expenseRecurring").checked;
        const expenseDateElement = document.getElementById("expenseDate");
        const expenseDateValue = expenseDateElement
          ? expenseDateElement.value
          : "";
        const date = parseDateInput(expenseDateValue);

        if (!currentMonthData) {
          currentMonthData = {
            income: 0,
            expenses: [],
            budgets: {},
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          };
        }

        if (expenseId) {
          // Update existing expense
          const expenseIndex = currentMonthData.expenses.findIndex(
            (exp) => exp.id === expenseId
          );
          if (expenseIndex !== -1) {
            currentMonthData.expenses[expenseIndex] = {
              ...currentMonthData.expenses[expenseIndex],
              category,
              amount,
              description,
              date,
              isRecurring,
            };
          }
        } else {
          // Add new expense
          const newExpense = {
            id: generateId(),
            category,
            amount,
            description,
            date,
            isRecurring,
          };
          currentMonthData.expenses.push(newExpense);
        }

        // If recurring, add to templates
        if (isRecurring) {
          const existingTemplate = templates.find(
            (t) =>
              t.category === category &&
              t.amount === amount &&
              t.description === description
          );

          if (!existingTemplate) {
            templates.push({
              id: generateId(),
              category,
              amount,
              description,
            });
            await saveTemplates();
          }
        }

        await saveMonthData();
        updateUI();
        closeModal("expenseModal");
        showToast(
          expenseId
            ? "Pengeluaran berhasil diperbarui"
            : "Pengeluaran berhasil ditambah",
          "success"
        );
      } catch (error) {
        console.error("Save expense error:", error);
        showToast("Gagal menyimpan pengeluaran", "error");
      }
    });

  // Category form handler
  const categoryForm = document.getElementById("categoryForm");
  if (categoryForm) {
    categoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      try {
        const name = document.getElementById("categoryName").value.trim();
        const color = document.getElementById("categoryColor").value;
        const mode = categoryForm.dataset.mode || "add";
        const idInput = document.getElementById("categoryId");
        const editingId = idInput ? idInput.value : "";

        const normalizedName = name.toLowerCase();
        const duplicate = categories.some(
          (cat) =>
            cat.name.toLowerCase() === normalizedName &&
            (mode === "add" || cat.id !== editingId),
        );

        if (duplicate) {
          showToast("Nama kategori sudah ada", "warning");
          return;
        }

        if (mode === "edit" && editingId) {
          const categoryIndex = categories.findIndex(
            (cat) => cat.id === editingId,
          );

          if (categoryIndex === -1) {
            showToast("Kategori tidak ditemukan", "error");
            return;
          }

          categories[categoryIndex] = {
            ...categories[categoryIndex],
            name,
            color,
          };

          await saveCategories();
          updateCategoryList();
          updateCategorySelect();
          updateExpenseTable();
          updateChart();
          updateTemplatesList();
          hideAddCategoryForm();
          showToast("Kategori berhasil diperbarui", "success");
        } else {
          const newCategory = {
            id: generateId(),
            name,
            color,
            isDefault: false,
          };

          categories.push(newCategory);
          await saveCategories();
          updateCategoryList();
          updateCategorySelect();
          updateTemplatesList();
          hideAddCategoryForm();
          showToast("Kategori berhasil ditambah", "success");
        }
      } catch (error) {
        console.error("Category save error:", error);
        showToast("Gagal menyimpan kategori", "error");
      }
    });
  }

  // Search functions
  document.getElementById("searchExpense").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#expenseTableBody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

  document.getElementById("searchIncome").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#incomeTableBody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

  const incomeSortSelect = document.getElementById("incomeSort");
  if (incomeSortSelect) {
    incomeSortOption = incomeSortSelect.value || incomeSortOption;
    incomeSortSelect.value = incomeSortOption;
    incomeSortSelect.addEventListener("change", (event) => {
      incomeSortOption = event.target.value;
      updateIncomeTable();
    });
  }

  const expenseSortSelect = document.getElementById("expenseSort");
  if (expenseSortSelect) {
    expenseSortOption = expenseSortSelect.value || expenseSortOption;
    expenseSortSelect.value = expenseSortOption;
    expenseSortSelect.addEventListener("change", (event) => {
      expenseSortOption = event.target.value;
      updateExpenseTable();
    });
  }

  const expenseCategoryFilterSelect = document.getElementById(
    "expenseCategoryFilter"
  );
  if (expenseCategoryFilterSelect) {
    expenseCategoryFilter =
      expenseCategoryFilterSelect.value || expenseCategoryFilter;
    expenseCategoryFilterSelect.value = expenseCategoryFilter;
    expenseCategoryFilterSelect.addEventListener("change", (event) => {
      expenseCategoryFilter = event.target.value;
      updateExpenseTable();
    });
  }

  // Initialize theme
  loadTheme();

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "i":
          e.preventDefault();
          showIncomeModal();
          break;
        case "e":
          e.preventDefault();
          showExpenseModal();
          break;
        case "s":
          e.preventDefault();
          exportData();
          break;
      }
    }

    if (e.key === "Escape") {
      const modals = document.querySelectorAll(".modal.show");
      modals.forEach((modal) => modal.classList.remove("show"));
    }
  });

  // Auto-save when switching tabs/closing window
  window.addEventListener("beforeunload", () => {
    if (currentMonthData) {
      saveMonthData();
    }
  });
});

// Global Functions for HTML onclick events
window.changeMonth = changeMonth;
window.toggleTheme = toggleTheme;
window.showIncomeModal = showIncomeModal;
window.editIncome = editIncome;
window.deleteIncome = deleteIncome;
window.showExpenseModal = showExpenseModal;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.showCategoryModal = showCategoryModal;
window.showAddCategoryForm = showAddCategoryForm;
window.hideAddCategoryForm = hideAddCategoryForm;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.showTemplateModal = showTemplateModal;
window.deleteTemplate = deleteTemplate;
window.applyTemplates = applyTemplates;
window.closeModal = closeModal;
window.exportData = exportData;
window.importData = importData;
window.signOut = signOut;
window.migrateOctoberDataManually = migrateOctoberDataManually;
