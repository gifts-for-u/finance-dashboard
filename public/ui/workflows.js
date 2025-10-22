import {
  firebaseReady,
  listenToAuthChanges,
  performFirebaseSignOut,
  setCurrentUser,
  getAuthInstance,
} from "../services/firebase.js";
import {
  loadCategories,
  loadTemplates,
  loadMonthData,
  getFirstMonthWithData,
  migrateOctoberDataManually,
} from "../data/repositories.js";
import {
  getCurrentMonthData,
  setCurrentMonthData,
  getCurrentDate,
  setCurrentDate,
  SUMMARY_CARD_INFO,
} from "../state/app-state.js";
import { formatDate } from "../state/derivations.js";
import {
  refreshAllViews,
  registerTableSortButtons,
  updateIncomeTable,
  updateExpenseTable,
} from "../views/expenses.js";
import {
  showModal,
  closeModal,
  showToast,
  showLoading,
  hideLoading,
  showIncomeModal,
  editIncome,
  deleteIncome,
  handleIncomeFormSubmit,
  showExpenseModal,
  editExpense,
  deleteExpense,
  handleExpenseFormSubmit,
  toggleExpenseStatus,
  showCategoryModal,
  editCategory,
  deleteCategory,
  handleCategoryFormSubmit,
  showAddCategoryForm,
  hideAddCategoryForm,
  showTemplateModal,
  deleteTemplate,
  applyTemplates,
  showBudgetModal,
  handleBudgetFormSubmit,
  exportData,
  importData,
} from "./modals.js";

let sessionManager = null;

function getElement(id) {
  return document.getElementById(id);
}

function updateUserProfile(user) {
  const userInfo = getElement("userInfo");
  if (userInfo) {
    userInfo.textContent = `Welcome, ${user.displayName || user.email}`;
  }

  const userProfile = getElement("userProfile");
  if (userProfile) {
    userProfile.innerHTML = `
      <img src="${user.photoURL || "https://via.placeholder.com/32"}" alt="Profile" class="user-avatar">
      <span class="user-name">${user.displayName || user.email}</span>
    `;
  }
}

async function initializeSessionManager() {
  try {
    await firebaseReady;
    const SessionManager = (await import("../session-manager.js")).default;
    sessionManager = new SessionManager();
    sessionManager.init(getAuthInstance(), signOut);
    window.sessionManager = sessionManager;
  } catch (error) {
    console.warn("Failed to initialize session manager:", error);
  }
}

function updateCurrentMonthDisplay() {
  const element = getElement("currentMonth");
  if (element) {
    element.textContent = formatDate(getCurrentDate());
  }
}

function initializeSummaryCardTooltips() {
  const cards = document.querySelectorAll(
    ".summary-card[data-summary-key]",
  );

  if (!cards.length) {
    return;
  }

  const canHover = window.matchMedia
    ? window.matchMedia("(hover: hover)").matches
    : false;

  let activeCard = null;

  const hideCardTooltip = (card) => {
    if (!card) {
      return;
    }

    card.classList.remove("is-tooltip-visible");

    const tooltip = card.querySelector(".summary-info-tooltip");
    if (tooltip) {
      tooltip.setAttribute("aria-hidden", "true");
    }

    const button = card.querySelector(".summary-info-btn");
    if (button) {
      button.setAttribute("aria-expanded", "false");
    }

    if (activeCard === card) {
      activeCard = null;
    }
  };

  const showCardTooltip = (card) => {
    if (!card) {
      return;
    }

    if (activeCard && activeCard !== card) {
      hideCardTooltip(activeCard);
    }

    card.classList.add("is-tooltip-visible");

    const tooltip = card.querySelector(".summary-info-tooltip");
    if (tooltip) {
      tooltip.setAttribute("aria-hidden", "false");
    }

    const button = card.querySelector(".summary-info-btn");
    if (button) {
      button.setAttribute("aria-expanded", "true");
    }

    activeCard = card;
  };

  cards.forEach((card) => {
    const key = card.dataset.summaryKey;
    const infoConfig = SUMMARY_CARD_INFO[key] ?? null;

    const tooltip = card.querySelector(".summary-info-tooltip");
    const titleElement = tooltip?.querySelector(".summary-info-title");
    const descriptionElement = tooltip?.querySelector(
      ".summary-info-description",
    );
    const labelElement = card.querySelector(".summary-label");

    if (tooltip && !tooltip.id && key) {
      tooltip.id = `summary-info-${key}`;
    }

    if (titleElement && labelElement) {
      titleElement.textContent = labelElement.textContent.trim();
    }

    if (descriptionElement && infoConfig?.description) {
      descriptionElement.textContent = infoConfig.description;
    }

    const infoButton = card.querySelector(".summary-info-btn");
    if (infoButton) {
      infoButton.setAttribute("aria-expanded", "false");

      if (tooltip?.id) {
        infoButton.setAttribute("aria-controls", tooltip.id);
      }

      infoButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (card.classList.contains("is-tooltip-visible")) {
          hideCardTooltip(card);
        } else {
          showCardTooltip(card);
        }
      });

      infoButton.addEventListener("focus", () => {
        showCardTooltip(card);
      });

      infoButton.addEventListener("blur", () => {
        if (!card.matches(":hover")) {
          hideCardTooltip(card);
        }
      });

      infoButton.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          hideCardTooltip(card);
          infoButton.blur();
        }
      });
    }

    if (tooltip) {
      tooltip.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    if (canHover) {
      card.addEventListener("mouseenter", () => {
        showCardTooltip(card);
      });

      card.addEventListener("mouseleave", () => {
        hideCardTooltip(card);
      });
    }
  });

  document.addEventListener(
    "click",
    (event) => {
      if (!activeCard) {
        return;
      }

      if (activeCard.contains(event.target)) {
        return;
      }

      hideCardTooltip(activeCard);
    },
    true,
  );
}

async function initializeDashboard() {
  showLoading();
  try {
    await firebaseReady;
    await loadCategories();
    await loadTemplates();
    await loadMonthData();

    if (!getCurrentMonthData()) {
      const firstMonth = await getFirstMonthWithData();
      if (firstMonth) {
        const [year, month] = firstMonth.split("-");
        setCurrentDate(new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1));
        await loadMonthData();
      } else {
        setCurrentMonthData({
          incomes: [],
          expenses: [],
          budgets: {},
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    updateCurrentMonthDisplay();
    refreshAllViews();
  } catch (error) {
    console.error("Initialization error:", error);
    showToast("Gagal memuat data", "error");
  }
  hideLoading();
}

async function handleMigration() {
  try {
    const result = await migrateOctoberDataManually();
    switch (result?.status) {
      case "completed":
        showToast("Data Oktober berhasil dimigrasikan", "success");
        await loadMonthData();
        refreshAllViews();
        break;
      case "already-completed":
        showToast("Data sudah dimigrasikan sebelumnya", "info");
        break;
      case "unauthorized":
        showToast("Migration not authorized for this user", "warning");
        break;
      default:
        showToast("Migrasi tidak dapat dijalankan", "error");
        break;
    }
  } catch (error) {
    console.error("Migration error:", error);
    showToast("Gagal menjalankan migrasi", "error");
  }
}

async function signOut(isForced = false) {
  try {
    await firebaseReady;

    if (sessionManager) {
      sessionManager.destroy();
      sessionManager = null;
    }

    await performFirebaseSignOut();
    setCurrentUser(null);

    localStorage.removeItem("userDisplayName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhotoURL");
    localStorage.removeItem("loginTimestamp");
    localStorage.removeItem("lastActivityTimestamp");

    if (!isForced) {
      showToast("Berhasil logout", "success");
    }

    setTimeout(() => {
      window.location.href = "/login.html";
    }, isForced ? 0 : 1000);
  } catch (error) {
    console.error("Sign-out error:", error);
    showToast("Gagal logout", "error");
  }
}

function toggleTheme() {
  const body = document.body;
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  const themeIcon = document.querySelector(".theme-toggle i");
  if (themeIcon) {
    themeIcon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }

  const chartData = getCurrentMonthData()?.expenses ?? [];
  if (chartData.length > 0) {
    refreshAllViews();
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.setAttribute("data-theme", savedTheme);

  const themeIcon = document.querySelector(".theme-toggle i");
  if (themeIcon) {
    themeIcon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon";
  }
}

async function changeMonth(direction) {
  const date = getCurrentDate();
  const updated = new Date(date);
  updated.setMonth(updated.getMonth() + direction);
  setCurrentDate(updated);
  await loadMonthData();
  updateCurrentMonthDisplay();
  refreshAllViews();
}

function onDocumentReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

function registerFormHandlers() {
  const incomeForm = getElement("incomeForm");
  incomeForm?.addEventListener("submit", handleIncomeFormSubmit);

  const expenseForm = getElement("expenseForm");
  expenseForm?.addEventListener("submit", handleExpenseFormSubmit);

  const categoryForm = getElement("categoryForm");
  categoryForm?.addEventListener("submit", handleCategoryFormSubmit);

  const budgetForm = getElement("budgetForm");
  budgetForm?.addEventListener("submit", handleBudgetFormSubmit);
}

function attachGlobals() {
  Object.assign(window, {
    showModal,
    closeModal,
    showIncomeModal,
    editIncome,
    deleteIncome,
    showExpenseModal,
    editExpense,
    deleteExpense,
    toggleExpenseStatus,
    showCategoryModal,
    editCategory,
    deleteCategory,
    showAddCategoryForm,
    hideAddCategoryForm,
    showTemplateModal,
    deleteTemplate,
    applyTemplates,
    showBudgetModal,
    changeMonth,
    toggleTheme,
    signOut,
    exportData,
    importData,
    migrateOctoberDataManually: handleMigration,
  });
}

function registerSearchHandlers() {
  const applyFilter = (inputId, tableBodyId) => {
    const input = getElement(inputId);
    if (!input) {
      return;
    }

    input.addEventListener("input", (event) => {
      const searchTerm = event.target.value.toLowerCase();
      const rows = document.querySelectorAll(`#${tableBodyId} tr`);
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  };

  applyFilter("searchIncome", "incomeTableBody");
  applyFilter("searchExpense", "expenseTableBody");
}

function registerSortSelectHandlers() {
  const incomeSort = getElement("incomeSort");
  incomeSort?.addEventListener("change", updateIncomeTable);

  const expenseSort = getElement("expenseSort");
  expenseSort?.addEventListener("change", updateExpenseTable);

  const expenseCategoryFilter = getElement("expenseCategoryFilter");
  expenseCategoryFilter?.addEventListener("change", updateExpenseTable);
}

function bootstrap() {
  loadTheme();
  initializeSummaryCardTooltips();
  registerTableSortButtons();
  registerFormHandlers();
  registerSearchHandlers();
  registerSortSelectHandlers();
  attachGlobals();

  firebaseReady
    .then(async () => {
      await listenToAuthChanges(async (user) => {
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
}

onDocumentReady(bootstrap);
