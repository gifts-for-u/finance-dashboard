import {
  getCurrentMonthData,
  getCategories,
  getTemplates,
  getExpenseChart,
  setExpenseChart,
  getIncomeSortOption,
  setIncomeSortOption,
  getExpenseSortOption,
  setExpenseSortOption,
  getExpenseCategoryFilter,
  setExpenseCategoryFilter,
  defaultCategoryColor,
  TABLE_SORT_CONFIG,
  TABLE_SORT_LABELS,
} from "../state/app-state.js";
import {
  formatCurrency,
  formatPercentageText,
  normalizeAmount,
  formatShortDate,
  getComparableDateValue,
  isExpenseDone,
  isSavingsCategory,
  getCategoryBadgePalette,
} from "../state/derivations.js";

function getSelectValue(selectId, fallback) {
  const select = document.getElementById(selectId);
  if (select && select.value) {
    return select.value;
  }
  return fallback;
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
    target === "income" ? getIncomeSortOption() : getExpenseSortOption();

  if (currentOption === config.asc) {
    return config.desc;
  }

  if (currentOption === config.desc) {
    return config.asc;
  }

  return config[config.defaultDirection] ?? config.asc;
}

export function toggleSortOption(target, key) {
  const nextOption = determineNextSortOption(target, key);
  if (!nextOption) {
    return;
  }

  if (target === "income") {
    setIncomeSortOption(nextOption);
    const select = document.getElementById("incomeSort");
    if (select && select.value !== nextOption) {
      select.value = nextOption;
    }
    updateIncomeTable();
  } else if (target === "expense") {
    setExpenseSortOption(nextOption);
    const select = document.getElementById("expenseSort");
    if (select && select.value !== nextOption) {
      select.value = nextOption;
    }
    updateExpenseTable();
  }
}

export function registerTableSortButtons() {
  const buttons = document.querySelectorAll(".table-sort-button");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.sortTarget;
      const key = button.dataset.sortKey;
      toggleSortOption(target, key);
    });
  });
}

export function updateSortIndicators(target, selectedOption) {
  const config = TABLE_SORT_CONFIG[target];
  if (!config) {
    return;
  }

  Object.entries(config).forEach(([key, value]) => {
    const button = document.querySelector(
      `.table-sort-button[data-sort-target="${target}"][data-sort-key="${key}"]`
    );

    if (!button) {
      return;
    }

    const label = TABLE_SORT_LABELS[target]?.[key] ?? key;
    button.querySelector(".sort-label").textContent = label;

    button.classList.remove("is-active", "is-desc");

    if (selectedOption === value.asc) {
      button.classList.add("is-active");
      button.classList.remove("is-desc");
    } else if (selectedOption === value.desc) {
      button.classList.add("is-active", "is-desc");
    }
  });
}

export function updateSummaryCards() {
  const data = getCurrentMonthData();
  const incomes = Array.isArray(data?.incomes) ? data.incomes.filter(Boolean) : [];
  const expenses = Array.isArray(data?.expenses) ? data.expenses.filter(Boolean) : [];

  const totalIncome = incomes.reduce((sum, income) => sum + normalizeAmount(income.amount), 0);
  const totalPlannedExpense = expenses.reduce(
    (sum, expense) => sum + normalizeAmount(expense.amount),
    0,
  );
  const totalActualExpense = expenses
    .filter((expense) => isExpenseDone(expense))
    .reduce((sum, expense) => sum + normalizeAmount(expense.amount), 0);
  const actualBalance = totalIncome - totalActualExpense;
  const plannedRemaining = totalIncome - totalPlannedExpense;
  const totalSavingsExpense = expenses
    .filter((expense) => isSavingsCategory(expense, getCategories()))
    .reduce((sum, expense) => sum + normalizeAmount(expense.amount), 0);
  const savingsRate = totalIncome > 0 ? (totalSavingsExpense / totalIncome) * 100 : null;

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
      savingsRateElement.textContent = formatPercentageText(savingsRate);

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

export function updateIncomeTable() {
  const data = getCurrentMonthData();
  const tbody = document.getElementById("incomeTableBody");
  if (!tbody) {
    return;
  }

  const incomes = Array.isArray(data?.incomes)
    ? data.incomes.filter(Boolean).map((income) => ({
        ...income,
        amount: normalizeAmount(income.amount),
      }))
    : [];

  const selectedSort = getSelectValue("incomeSort", getIncomeSortOption());
  if (selectedSort !== getIncomeSortOption()) {
    setIncomeSortOption(selectedSort);
  }

  updateSortIndicators("income", getIncomeSortOption());

  const sortedIncomes = incomes.sort((a, b) => {
    switch (getIncomeSortOption()) {
      case "date-asc":
        return getComparableDateValue(a.date) - getComparableDateValue(b.date);
      case "amount-desc":
        return normalizeAmount(b.amount) - normalizeAmount(a.amount);
      case "amount-asc":
        return normalizeAmount(a.amount) - normalizeAmount(b.amount);
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
            normalizeAmount(income.amount)
          )}</td>
          <td>${income.description || "-"}</td>
          <td>
            <button class="btn btn-sm btn-secondary" onclick="editIncome('${income.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteIncome('${income.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  reapplyTableSearch("incomeTableBody", "searchIncome");
}

export function updateExpenseTable() {
  const data = getCurrentMonthData();
  const tbody = document.getElementById("expenseTableBody");
  if (!tbody) {
    return;
  }

  const expenses = Array.isArray(data?.expenses)
    ? data.expenses.filter(Boolean).map((expense) => ({
        ...expense,
        amount: normalizeAmount(expense.amount),
      }))
    : [];

  const activeCategoryFilter = getSelectValue(
    "expenseCategoryFilter",
    getExpenseCategoryFilter(),
  );

  if (activeCategoryFilter !== getExpenseCategoryFilter()) {
    setExpenseCategoryFilter(activeCategoryFilter);
  }

  const filteredExpenses = expenses.filter((expense) => {
    if (activeCategoryFilter === "all") {
      return true;
    }
    return expense.category === activeCategoryFilter;
  });

  const selectedSort = getSelectValue("expenseSort", getExpenseSortOption());
  if (selectedSort !== getExpenseSortOption()) {
    setExpenseSortOption(selectedSort);
  }

  updateSortIndicators("expense", getExpenseSortOption());

  const sortedExpenses = filteredExpenses.sort((a, b) => {
    switch (getExpenseSortOption()) {
      case "date-asc":
        return getComparableDateValue(a.date) - getComparableDateValue(b.date);
      case "amount-desc":
        return normalizeAmount(b.amount) - normalizeAmount(a.amount);
      case "amount-asc":
        return normalizeAmount(a.amount) - normalizeAmount(b.amount);
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

  const categories = getCategories();
  tbody.innerHTML = sortedExpenses
    .map((expense) => {
      const category = categories.find((cat) => cat.id === expense.category);
      const categoryName = getCategoryName(expense.category);

      const badgePalette = getCategoryBadgePalette(category?.color);
      const badgeStyle =
        [
          `--category-badge-bg: ${badgePalette.background}`,
          `--category-badge-color: ${badgePalette.text}`,
          `--category-badge-border: ${badgePalette.border}`,
        ].join("; ") + ";";

      let formattedDate = "N/A";
      try {
        formattedDate = formatShortDate(expense.date);
      } catch (error) {
        console.warn("Error formatting date for expense:", expense.id, error);
        formattedDate = "Invalid Date";
      }

      const description = expense.description || "";
      const isDone = isExpenseDone(expense);
      const doneClass = isDone ? "expense-done" : "";
      const toggleLabel = isDone ? "Tandai belum selesai" : "Tandai selesai";
      const toggleButtonClass = isDone
        ? "btn btn-sm btn-success"
        : "btn btn-sm btn-outline-success";
      const toggleIcon = isDone ? "fa-undo" : "fa-check";

      return `
        <tr class="${doneClass}">
          <td>${formattedDate}</td>
          <td>
            <span class="category-badge" style="${badgeStyle}">
              ${categoryName}
            </span>
          </td>
          <td style="font-weight: 600;">${formatCurrency(normalizeAmount(expense.amount))}</td>
          <td>${description || "-"}</td>
          <td>
            <button
              class="${toggleButtonClass}"
              onclick="toggleExpenseStatus('${expense.id}')"
              title="${toggleLabel}"
              aria-label="${toggleLabel}"
            >
              <i class="fas ${toggleIcon}"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editExpense('${expense.id}')">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteExpense('${expense.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  reapplyTableSearch("expenseTableBody", "searchExpense");
}

export function updateChart() {
  try {
    const canvas = document.getElementById("expenseChart");

    if (!canvas) {
      console.warn("Chart canvas not found");
      return;
    }

    const ctx = canvas.getContext("2d");
    const existingChart = getExpenseChart();

    if (existingChart) {
      existingChart.destroy();
      setExpenseChart(null);
    }

    const data = getCurrentMonthData();
    const expenses = Array.isArray(data?.expenses)
      ? data.expenses.filter(Boolean)
      : [];
    if (expenses.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--text-secondary")
        .trim();
      ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Belum ada data untuk ditampilkan", canvas.width / 2, canvas.height / 2);
      return;
    }

    const ChartJs = window.Chart;
    if (!ChartJs) {
      console.warn("Chart.js is not available on the window object");
      return;
    }

    const categoryTotals = {};
    expenses.forEach((expense) => {
      const amount = normalizeAmount(expense.amount);
      if (categoryTotals[expense.category]) {
        categoryTotals[expense.category] += amount;
      } else {
        categoryTotals[expense.category] = amount;
      }
    });

    const labels = [];
    const values = [];
    const colors = [];
    const categories = getCategories();

    Object.entries(categoryTotals).forEach(([categoryId, total]) => {
      const category = categories.find((cat) => cat.id === categoryId);
      labels.push(category ? category.name : categoryId);
      values.push(total);
      colors.push(category?.color || defaultCategoryColor);
    });

    const chart = new ChartJs(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderWidth: 0,
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
              color: getComputedStyle(document.documentElement)
                .getPropertyValue("--text-primary")
                .trim(),
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || "";
                const value = context.parsed || 0;
                return `${label}: ${formatCurrency(value)}`;
              },
            },
          },
        },
      },
    });

    setExpenseChart(chart);
  } catch (error) {
    console.error("Error updating chart:", error);
    try {
      const canvas = document.getElementById("expenseChart");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff6b6b";
        ctx.font = "16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Error loading chart", canvas.width / 2, canvas.height / 2);
      }
    } catch (innerError) {
      console.error("Could not show error on canvas:", innerError);
    }
  }
}

export function updateCategorySelect() {
  const select = document.getElementById("expenseCategory");
  const categories = getCategories();

  if (select) {
    select.innerHTML = categories
      .map((category) => `<option value="${category.id}">${category.name}</option>`)
      .join("");
  }

  const filterSelect = document.getElementById("expenseCategoryFilter");
  if (filterSelect) {
    const previousValue = getExpenseCategoryFilter();
    const options = [
      '<option value="all">Semua Kategori</option>',
      ...categories.map(
        (category) => `<option value="${category.id}">${category.name}</option>`,
      ),
    ];
    filterSelect.innerHTML = options.join("");

    if (
      previousValue !== "all" &&
      !categories.some((category) => category.id === previousValue)
    ) {
      setExpenseCategoryFilter("all");
    }

    filterSelect.value = getExpenseCategoryFilter();
  }
}

export function updateCategoryList() {
  const container = document.getElementById("categoryList");
  if (!container) {
    return;
  }

  const categories = getCategories();
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
            <button class="btn btn-sm btn-secondary" onclick="editCategory('${category.id}')">
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

function getCategoryName(categoryId) {
  const category = getCategories().find((cat) => cat.id === categoryId);
  return category ? category.name : categoryId || "-";
}

export function updateTemplatesList() {
  const container = document.getElementById("templateList");
  if (!container) {
    return;
  }

  const templates = getTemplates();
  const categories = getCategories();

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
            <small>${formatCurrency(template.amount)} - ${template.description}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-danger" onclick="deleteTemplate('${template.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  const templatesContainer = document.getElementById("templatesContainer");
  if (templatesContainer) {
    templatesContainer.innerHTML = container.innerHTML;
  }
}

export function updateTablesAndCharts() {
  updateIncomeTable();
  updateExpenseTable();
  updateChart();
}

export function refreshAllViews() {
  updateSummaryCards();
  updateTablesAndCharts();
  updateCategorySelect();
  updateCategoryList();
  updateTemplatesList();
}
