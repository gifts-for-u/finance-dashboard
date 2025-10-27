import {
  getCurrentMonthData,
  setCurrentMonthData,
  getCategories,
  setCategories,
  getTemplates,
  setTemplates,
  getDefaultEntryDate,
  defaultCategories,
  defaultCategoryColor,
} from "../state/app-state.js";
import {
  formatDateForInput,
  parseDateInput,
  normalizeAmount,
  generateId,
  sanitizeBudgets,
  calculateBudgetProgress,
} from "../state/derivations.js";
import {
  saveMonthData,
  saveCategories,
  saveTemplates,
  convertFirestoreData,
} from "../data/repositories.js";
import {
  refreshAllViews,
  updateCategoryList,
  updateCategorySelect,
  updateTemplatesList,
} from "../views/expenses.js";

function buildBudgetFormRow(category, value) {
  const normalizedValue = Number.isFinite(value) ? value : 0;

  return `
    <div class="budget-form-item">
      <label class="budget-form-label" for="budget-${category.id}">
        <span class="budget-form-color" style="--budget-color: ${
          category.color || "var(--primary-color)"
        }"></span>
        <span class="budget-form-name">${category.name}</span>
      </label>
      <div class="budget-form-input">
        <span class="budget-form-prefix">Rp</span>
        <input
          type="number"
          min="0"
          step="1000"
          id="budget-${category.id}"
          class="form-input budget-input"
          data-budget-category="${category.id}"
          value="${normalizedValue > 0 ? normalizedValue : ""}"
          placeholder="0"
        />
      </div>
    </div>
  `;
}

export function showModal(modalId) {
  document.getElementById(modalId)?.classList.add("show");
}

export function closeModal(modalId) {
  document.getElementById(modalId)?.classList.remove("show");
}

export function showConfirmDialog(message, callback) {
  const messageElement = document.getElementById("confirmMessage");
  const button = document.getElementById("confirmButton");

  if (messageElement) {
    messageElement.textContent = message;
  }

  if (button) {
    button.onclick = () => {
      callback();
      closeModal("confirmModal");
    };
  }

  showModal("confirmModal");
}

export function showToast(message, type = "info") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) {
    console.warn("Toast container not found");
    return;
  }

  toast.className = `toast ${type} show`;
  toastMessage.textContent = message;

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

export function showLoading() {
  const loading = document.getElementById("mainLoading");
  const content = document.getElementById("mainContent");
  if (loading) loading.style.display = "block";
  if (content) content.style.display = "none";
}

export function hideLoading() {
  const loading = document.getElementById("mainLoading");
  const content = document.getElementById("mainContent");
  if (loading) loading.style.display = "none";
  if (content) content.style.display = "block";
}

export function showIncomeModal(incomeId = null) {
  const data = getCurrentMonthData();
  const incomeAmountInput = document.getElementById("incomeAmount");
  const incomeSourceInput = document.getElementById("incomeSource");
  const modalTitle = document.getElementById("incomeModalTitle");
  const submitText = document.getElementById("incomeSubmitText");
  const incomeHint = document.getElementById("incomeHint");
  const incomeDateInput = document.getElementById("incomeDate");

  document.getElementById("incomeForm")?.reset();

  if (incomeId && data?.incomes) {
    const income = data.incomes.find((inc) => inc.id === incomeId);
    if (income) {
      if (incomeAmountInput) incomeAmountInput.value = income.amount;
      if (incomeSourceInput) incomeSourceInput.value = income.source || "";
      const descriptionInput = document.getElementById("incomeDescription");
      if (descriptionInput) descriptionInput.value = income.description || "";
      if (incomeDateInput) {
        const formattedDate = formatDateForInput(income.date);
        incomeDateInput.value = formattedDate || formatDateForInput(getDefaultEntryDate());
      }

      if (modalTitle) modalTitle.textContent = "Edit Pemasukan";
      if (submitText) submitText.textContent = "Update";
      if (incomeHint) {
        incomeHint.textContent = `Edit pemasukan: ${income.source || "Tidak ada sumber"}`;
        incomeHint.style.display = "block";
      }

      incomeAmountInput?.setAttribute("data-income-id", incomeId);
    }
  } else {
    if (modalTitle) modalTitle.textContent = "Tambah Pemasukan";
    if (submitText) submitText.textContent = "Simpan";
    if (incomeHint) incomeHint.style.display = "none";
    incomeAmountInput?.removeAttribute("data-income-id");
    if (incomeDateInput) {
      incomeDateInput.value = formatDateForInput(getDefaultEntryDate());
    }
  }

  showModal("incomeModal");

  setTimeout(() => {
    incomeAmountInput?.focus();
    if (incomeId) {
      incomeAmountInput?.select();
    }
  }, 100);
}

export function editIncome(incomeId) {
  showIncomeModal(incomeId);
}

export function deleteIncome(incomeId) {
  const data = getCurrentMonthData();
  const income = data?.incomes?.find((inc) => inc.id === incomeId);
  const sourceName = income ? income.source || "Pemasukan" : "Pemasukan";

  showConfirmDialog(`Apakah Anda yakin ingin menghapus "${sourceName}"?`, async () => {
    try {
      const updated = {
        ...data,
        incomes: data?.incomes?.filter((inc) => inc.id !== incomeId) ?? [],
      };
      setCurrentMonthData(updated);
      await saveMonthData();
      refreshAllViews();
      showToast("Pemasukan berhasil dihapus", "success");
    } catch (error) {
      console.error("Delete income error:", error);
      showToast("Gagal menghapus pemasukan", "error");
    }
  });
}

export async function handleIncomeFormSubmit(event) {
  event.preventDefault();

  const data = getCurrentMonthData() ?? { incomes: [], expenses: [], budgets: {} };
  const amountInput = document.getElementById("incomeAmount");
  const sourceInput = document.getElementById("incomeSource");
  const descriptionInput = document.getElementById("incomeDescription");
  const dateInput = document.getElementById("incomeDate");

  const incomeId = amountInput?.getAttribute("data-income-id");
  const incomeAmount = normalizeAmount(amountInput?.value || 0);
  const incomeSource = sourceInput?.value?.trim() || "";
  const incomeDescription = descriptionInput?.value?.trim() || "";
  const incomeDate = dateInput ? parseDateInput(dateInput.value) : getDefaultEntryDate();

  try {
    const incomes = Array.isArray(data.incomes) ? [...data.incomes] : [];

    if (incomeId) {
      const index = incomes.findIndex((income) => income.id === incomeId);
      if (index !== -1) {
        incomes[index] = {
          ...incomes[index],
          amount: incomeAmount,
          source: incomeSource,
          description: incomeDescription,
          date: incomeDate,
        };
      }
    } else {
      incomes.push({
        id: generateId(),
        amount: incomeAmount,
        source: incomeSource,
        description: incomeDescription,
        date: incomeDate,
      });
    }

    setCurrentMonthData({ ...data, incomes });
    await saveMonthData();
    refreshAllViews();

    closeModal("incomeModal");
    showToast(incomeId ? "Pemasukan berhasil diperbarui" : "Pemasukan berhasil ditambah", "success");
  } catch (error) {
    console.error("Save income error:", error);
    showToast("Gagal menyimpan pemasukan", "error");
  }
}

export function showExpenseModal(expenseId = null) {
  const data = getCurrentMonthData();
  const form = document.getElementById("expenseForm");
  const expenseDateInput = document.getElementById("expenseDate");

  form?.reset();
  const idInput = document.getElementById("expenseId");
  if (idInput) {
    idInput.value = expenseId || "";
  }

  if (expenseDateInput) {
    expenseDateInput.value = formatDateForInput(getDefaultEntryDate());
  }

  if (expenseId && data?.expenses) {
    const expense = data.expenses.find((exp) => exp.id === expenseId);
    if (expense) {
      const categoryInput = document.getElementById("expenseCategory");
      const amountInput = document.getElementById("expenseAmount");
      const descriptionInput = document.getElementById("expenseDescription");
      const recurringInput = document.getElementById("expenseRecurring");
      const statusInput = document.getElementById("expenseStatus");
      const tagsInput = document.getElementById("expenseTags");

      if (categoryInput) categoryInput.value = expense.category;
      if (amountInput) amountInput.value = expense.amount;
      if (descriptionInput) descriptionInput.value = expense.description || "";
      if (recurringInput) recurringInput.checked = expense.isRecurring || false;
      if (expenseDateInput) {
        expenseDateInput.value = formatDateForInput(expense.date);
      }
      if (statusInput) {
        statusInput.value = expense.status || "planned";
      }
      if (tagsInput) {
        tagsInput.value = Array.isArray(expense.tags) ? expense.tags.join(", ") : "";
      }
    }
  }

  showModal("expenseModal");
}

export function editExpense(expenseId) {
  showExpenseModal(expenseId);
}

export function deleteExpense(expenseId) {
  const data = getCurrentMonthData();
  if (!data?.expenses) {
    showToast("Pengeluaran tidak ditemukan", "error");
    return;
  }

  const expense = data.expenses.find((exp) => exp.id === expenseId);
  if (!expense) {
    showToast("Pengeluaran tidak ditemukan", "error");
    return;
  }

  const expenseName = expense.description || "Pengeluaran";

  showConfirmDialog(`Hapus pengeluaran "${expenseName}"?`, async () => {
    try {
      const updatedExpenses = data.expenses.filter((exp) => exp.id !== expenseId);
      setCurrentMonthData({ ...data, expenses: updatedExpenses });
      await saveMonthData();
      refreshAllViews();
      showToast("Pengeluaran berhasil dihapus", "success");
    } catch (error) {
      console.error("Delete expense error:", error);
      showToast("Gagal menghapus pengeluaran", "error");
    }
  });
}

export async function toggleExpenseStatus(expenseId) {
  const data = getCurrentMonthData();
  if (!data?.expenses) {
    showToast("Pengeluaran tidak ditemukan", "error");
    return;
  }

  const index = data.expenses.findIndex((expense) => expense.id === expenseId);
  if (index === -1) {
    showToast("Pengeluaran tidak ditemukan", "error");
    return;
  }

  const expenses = [...data.expenses];
  const currentStatus = expenses[index].status === "done" ? "planned" : "done";
  expenses[index] = { ...expenses[index], status: currentStatus };

  try {
    setCurrentMonthData({ ...data, expenses });
    await saveMonthData();
    refreshAllViews();
    showToast(
      currentStatus === "done"
        ? "Pengeluaran ditandai selesai"
        : "Pengeluaran ditandai belum selesai",
      "success",
    );
  } catch (error) {
    console.error("Toggle expense status error:", error);
    showToast("Gagal memperbarui status pengeluaran", "error");
  }
}

export async function handleExpenseFormSubmit(event) {
  event.preventDefault();

  const data = getCurrentMonthData() ?? { incomes: [], expenses: [], budgets: {} };
  const idInput = document.getElementById("expenseId");
  const categoryInput = document.getElementById("expenseCategory");
  const amountInput = document.getElementById("expenseAmount");
  const descriptionInput = document.getElementById("expenseDescription");
  const recurringInput = document.getElementById("expenseRecurring");
  const dateInput = document.getElementById("expenseDate");
  const statusInput = document.getElementById("expenseStatus");
  const tagsInput = document.getElementById("expenseTags");

  const expenseId = idInput?.value || null;
  const category = categoryInput?.value || "other";
  const amount = normalizeAmount(amountInput?.value || 0);
  const description = descriptionInput?.value?.trim() || "";
  const isRecurring = recurringInput?.checked || false;
  const date = dateInput ? parseDateInput(dateInput.value) : getDefaultEntryDate();
  const status = statusInput?.value || "planned";
  const tags = tagsInput?.value
    ? tagsInput.value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  try {
    const expenses = Array.isArray(data.expenses) ? [...data.expenses] : [];

    if (expenseId) {
      const index = expenses.findIndex((expense) => expense.id === expenseId);
      if (index !== -1) {
        expenses[index] = {
          ...expenses[index],
          category,
          amount,
          description,
          isRecurring,
          date,
          status,
          tags,
        };
      }
    } else {
      expenses.push({
        id: generateId(),
        category,
        amount,
        description,
        isRecurring,
        date,
        status,
        tags,
      });
    }

    setCurrentMonthData({ ...data, expenses });
    await saveMonthData();
    refreshAllViews();

    closeModal("expenseModal");
    showToast(
      expenseId ? "Pengeluaran berhasil diperbarui" : "Pengeluaran berhasil ditambah",
      "success",
    );
  } catch (error) {
    console.error("Save expense error:", error);
    showToast("Gagal menyimpan pengeluaran", "error");
  }
}

let categoryColorPickerInitialized = false;
let categoryColorPickerInstance = null;
let categoryColorPickerResizeHandler = null;
let categoryColorPickerResizeCallback = null;
let categoryColorPickerFieldElement = null;
let categoryColorPickerPreviewButton = null;
let categoryColorPickerContainerElement = null;
let categoryColorPickerOutsideHandler = null;
let categoryColorPickerEscapeHandler = null;

function normalizeCategoryColor(value) {
  if (typeof value !== "string") {
    return defaultCategoryColor.toUpperCase();
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return defaultCategoryColor.toUpperCase();
  }

  const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const longMatch = /^#([0-9a-f]{6})$/i.exec(prefixed);
  if (longMatch) {
    return `#${longMatch[1].toUpperCase()}`;
  }

  const shortMatch = /^#([0-9a-f]{3})$/i.exec(prefixed);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1].toUpperCase().split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  return defaultCategoryColor.toUpperCase();
}

function applyCategoryColorToFields(colorValue, { updatePicker = true } = {}) {
  const normalized = normalizeCategoryColor(colorValue);
  const colorInput = document.getElementById("categoryColor");
  const previewButton = document.getElementById("categoryColorPreview");

  if (colorInput && colorInput.value !== normalized) {
    colorInput.value = normalized;
  }

  if (previewButton) {
    previewButton.style.setProperty("--selected-category-color", normalized);
    previewButton.setAttribute(
      "aria-label",
      `Warna kategori ${normalized}`,
    );
  }

  if (updatePicker && categoryColorPickerInstance) {
    const currentColor =
      categoryColorPickerInstance.color?.hexString?.toUpperCase() || "";

    if (currentColor !== normalized) {
      categoryColorPickerInstance.color.set(normalized);
    }
  }
}

function setCategoryPickerOpen(shouldOpen) {
  if (
    !categoryColorPickerFieldElement ||
    !categoryColorPickerPreviewButton ||
    !categoryColorPickerContainerElement
  ) {
    return;
  }

  categoryColorPickerFieldElement.classList.toggle("is-open", shouldOpen);
  categoryColorPickerPreviewButton.setAttribute(
    "aria-expanded",
    shouldOpen ? "true" : "false",
  );
  categoryColorPickerContainerElement.setAttribute(
    "aria-hidden",
    shouldOpen ? "false" : "true",
  );

  if (shouldOpen) {
    requestAnimationFrame(() => {
      categoryColorPickerResizeCallback?.();
    });
  }
}

function initializeCategoryColorPicker() {
  const pickerHost = document.getElementById("categoryColorPicker");
  const colorInput = document.getElementById("categoryColor");
  const previewButton = document.getElementById("categoryColorPreview");
  const fieldElement = previewButton?.closest(".color-picker-field") || null;
  const containerElement = fieldElement?.querySelector(".modern-color-picker") || null;

  if (!pickerHost || !colorInput) {
    return;
  }

  categoryColorPickerFieldElement = fieldElement;
  categoryColorPickerPreviewButton = previewButton;
  categoryColorPickerContainerElement = containerElement;

  if (categoryColorPickerPreviewButton) {
    categoryColorPickerPreviewButton.setAttribute(
      "aria-expanded",
      categoryColorPickerFieldElement?.classList.contains("is-open")
        ? "true"
        : "false",
    );
  }

  if (categoryColorPickerContainerElement) {
    categoryColorPickerContainerElement.setAttribute(
      "aria-hidden",
      categoryColorPickerFieldElement?.classList.contains("is-open")
        ? "false"
        : "true",
    );
  }

  if (previewButton && !previewButton.dataset.toggleBound) {
    previewButton.addEventListener("click", () => {
      const shouldOpen = !categoryColorPickerFieldElement?.classList.contains(
        "is-open",
      );
      setCategoryPickerOpen(shouldOpen);
    });

    previewButton.dataset.toggleBound = "true";
  }

  const desiredColor = normalizeCategoryColor(
    colorInput.value || defaultCategoryColor,
  );

  if (categoryColorPickerInitialized && categoryColorPickerInstance) {
    applyCategoryColorToFields(desiredColor);
    return;
  }

  if (typeof window.iro === "undefined") {
    applyCategoryColorToFields(desiredColor, {
      updatePicker: false,
    });
    setCategoryPickerOpen(false);
    return;
  }

  categoryColorPickerInstance = new window.iro.ColorPicker(pickerHost, {
    color: desiredColor,
    layoutDirection: "vertical",
    layout: [
      { component: window.iro.ui.Box },
      { component: window.iro.ui.Slider, options: { sliderType: "hue" } },
    ],
    borderWidth: 0,
    padding: 8,
  });

  categoryColorPickerInstance.on("color:change", (color) => {
    applyCategoryColorToFields(color?.hexString, {
      updatePicker: false,
    });
  });

  if (!categoryColorPickerOutsideHandler) {
    categoryColorPickerOutsideHandler = (event) => {
      if (!categoryColorPickerFieldElement?.classList.contains("is-open")) {
        return;
      }

      if (categoryColorPickerFieldElement.contains(event.target)) {
        return;
      }

      setCategoryPickerOpen(false);
    };

    document.addEventListener("mousedown", categoryColorPickerOutsideHandler);
    document.addEventListener("touchstart", categoryColorPickerOutsideHandler, {
      passive: true,
    });
  }

  if (!categoryColorPickerEscapeHandler) {
    categoryColorPickerEscapeHandler = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (!categoryColorPickerFieldElement?.classList.contains("is-open")) {
        return;
      }

      event.preventDefault();
      setCategoryPickerOpen(false);
      categoryColorPickerPreviewButton?.focus({ preventScroll: true });
    };

    document.addEventListener("keydown", categoryColorPickerEscapeHandler);
  }

  const resizePicker = () => {
    if (!categoryColorPickerInstance) {
      return;
    }

    const hostRect = pickerHost.getBoundingClientRect();
    if (!hostRect.width) {
      return;
    }

    const computedStyle = window.getComputedStyle(pickerHost);
    const horizontalPadding =
      parseFloat(computedStyle.paddingLeft || "0") +
      parseFloat(computedStyle.paddingRight || "0");
    const availableWidth = Math.max(0, hostRect.width - horizontalPadding);
    const clampedWidth =
      availableWidth <= 0 ? 220 : Math.min(320, availableWidth);
    categoryColorPickerInstance.resize(clampedWidth);
  };

  categoryColorPickerResizeCallback = resizePicker;

  if (categoryColorPickerResizeHandler) {
    window.removeEventListener("resize", categoryColorPickerResizeHandler);
  }

  categoryColorPickerResizeHandler = resizePicker;
  window.addEventListener("resize", categoryColorPickerResizeHandler);
  requestAnimationFrame(resizePicker);

  applyCategoryColorToFields(desiredColor, {
    updatePicker: false,
  });

  setCategoryPickerOpen(false);

  categoryColorPickerInitialized = true;
}

function configureCategoryForm(mode, category = null) {
  initializeCategoryColorPicker();

  const form = document.getElementById("categoryForm");
  const title = document.getElementById("categoryFormTitle");
  const submitLabel = document.getElementById("categoryFormSubmitLabel");
  const nameInput = document.getElementById("categoryName");
  const colorInput = document.getElementById("categoryColor");
  const idInput = document.getElementById("categoryId");
  const hint = document.getElementById("categoryHint");

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
    if (hint) {
      hint.textContent = `Edit kategori: ${category.name}`;
      hint.style.display = "block";
    }
  } else {
    form.reset();
    form.dataset.mode = "add";
    idInput.value = "";
    colorInput.value = defaultCategoryColor;
    title.textContent = "Tambah kategori baru";
    submitLabel.textContent = "Tambah";
    if (hint) {
      hint.style.display = "none";
    }
  }

  applyCategoryColorToFields(colorInput?.value || defaultCategoryColor);

  setCategoryPickerOpen(false);
}

export function showCategoryModal(categoryId = null) {
  hideAddCategoryForm();
  updateCategoryList();

  if (categoryId) {
    const category = getCategories().find((cat) => cat.id === categoryId);
    if (category) {
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
  } else {
    configureCategoryForm("add");
  }

  showModal("categoryModal");
}

export function showAddCategoryForm() {
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

export function hideAddCategoryForm() {
  const container = document.getElementById("addCategoryForm");
  if (container) {
    container.style.display = "none";
  }
  configureCategoryForm("add");
}

export function editCategory(categoryId) {
  showCategoryModal(categoryId);
}

export function deleteCategory(categoryId) {
  const categories = getCategories();
  const data = getCurrentMonthData();
  const category = categories.find((cat) => cat.id === categoryId);

  if (!category) {
    showToast("Kategori tidak ditemukan", "error");
    return;
  }

  const isUsed = data?.expenses?.some((exp) => exp.category === categoryId);
  if (isUsed) {
    showToast("Kategori tidak dapat dihapus karena masih digunakan", "warning");
    return;
  }

  showConfirmDialog(`Hapus kategori "${category.name}"?`, async () => {
    try {
      const updatedCategories = categories.filter((cat) => cat.id !== categoryId);
      setCategories(updatedCategories);
      await saveCategories();
      const monthData = getCurrentMonthData();
      if (monthData?.budgets && monthData.budgets[categoryId] !== undefined) {
        const { [categoryId]: _removed, ...restBudgets } = monthData.budgets;
        setCurrentMonthData({ ...monthData, budgets: restBudgets });
        await saveMonthData();
      }
      updateCategoryList();
      updateCategorySelect();
      refreshAllViews();
      showToast("Kategori berhasil dihapus", "success");
    } catch (error) {
      console.error("Delete category error:", error);
      showToast("Gagal menghapus kategori", "error");
    }
  });
}

export async function handleCategoryFormSubmit(event) {
  event.preventDefault();

  const categories = getCategories();
  const categoryIdInput = document.getElementById("categoryId");
  const categoryNameInput = document.getElementById("categoryName");
  const categoryColorInput = document.getElementById("categoryColor");

  const categoryId = categoryIdInput?.value?.trim() || "";
  const categoryName = categoryNameInput?.value?.trim() || "";
  const categoryColor = categoryColorInput?.value?.trim() || "";

  if (!categoryName) {
    showToast("Nama kategori wajib diisi", "warning");
    return;
  }

  const normalizedName = categoryName.toLowerCase();
  const duplicate = categories.find(
    (category) =>
      category.id !== categoryId && category.name.toLowerCase() === normalizedName,
  );
  if (duplicate) {
    showToast("Nama kategori sudah ada", "warning");
    return;
  }

  try {
    const updatedCategories = [...categories];

    if (categoryId) {
      const index = updatedCategories.findIndex((category) => category.id === categoryId);
      if (index === -1) {
        showToast("Kategori tidak ditemukan", "error");
        return;
      }

      updatedCategories[index] = {
        ...updatedCategories[index],
        name: categoryName,
        color: categoryColor,
      };
    } else {
      const id = normalizedName.replace(/\s+/g, "-");
      updatedCategories.push({
        id,
        name: categoryName,
        color: categoryColor,
        isDefault: false,
      });
    }

    setCategories(updatedCategories);
    await saveCategories();
    updateCategoryList();
    updateCategorySelect();
    refreshAllViews();

    closeModal("categoryModal");
    showToast(categoryId ? "Kategori berhasil diperbarui" : "Kategori berhasil ditambah", "success");
  } catch (error) {
    console.error("Save category error:", error);
    showToast("Gagal menyimpan kategori", "error");
  }
}

export function showTemplateModal() {
  updateTemplatesList();
  showModal("templateModal");
}

export function showBudgetModal(mode = "manage") {
  const categories = getCategories();
  const data = getCurrentMonthData();
  const budgets =
    mode === "create"
      ? categories.reduce((accumulator, category) => {
          accumulator[category.id] = 0;
          return accumulator;
        }, {})
      : sanitizeBudgets(data?.budgets ?? {});
  const container = document.getElementById("budgetFormList");
  const title = document.getElementById("budgetModalTitle");
  const submitButton = document.getElementById("budgetModalSubmitLabel");

  if (container) {
    if (!categories.length) {
      container.innerHTML =
        "<p class=\"budget-form-empty\">Tambahkan kategori terlebih dahulu untuk mengatur budget.</p>";
    } else {
      container.innerHTML = categories
        .map((category) => buildBudgetFormRow(category, budgets[category.id]))
        .join("");
    }
  }

  if (title) {
    title.textContent = mode === "create" ? "Buat Budget Baru" : "Kelola Budget Bulanan";
  }

  if (submitButton) {
    submitButton.textContent = mode === "create" ? "Simpan Budget Baru" : "Simpan Budget";
  }

  showModal("budgetModal");

  setTimeout(() => {
    const firstInput = container?.querySelector(".budget-input");
    firstInput?.focus();
    firstInput?.select();
  }, 100);
}

export function showCreateBudgetModal() {
  showBudgetModal("create");
}

export function deleteTemplate(templateId) {
  showConfirmDialog("Hapus template ini?", async () => {
    try {
      const templates = getTemplates().filter((template) => template.id !== templateId);
      setTemplates(templates);
      await saveTemplates();
      updateTemplatesList();
      showToast("Template berhasil dihapus", "success");
    } catch (error) {
      console.error("Delete template error:", error);
      showToast("Gagal menghapus template", "error");
    }
  });
}

export async function applyTemplates() {
  const templates = getTemplates();
  if (templates.length === 0) {
    showToast("Tidak ada template untuk diterapkan", "warning");
    return;
  }

  showConfirmDialog(`Terapkan ${templates.length} template ke bulan ini?`, async () => {
    try {
      const data = getCurrentMonthData() ?? { incomes: [], expenses: [], budgets: {} };
      const newExpenses = templates.map((template) => ({
        id: generateId(),
        category: template.category,
        amount: normalizeAmount(template.amount),
        description: template.description,
        date: getDefaultEntryDate(),
        isRecurring: true,
        status: "planned",
      }));

      const updatedExpenses = [...(data.expenses ?? []), ...newExpenses];
      setCurrentMonthData({ ...data, expenses: updatedExpenses });

      await saveMonthData();
      refreshAllViews();
      closeModal("templateModal");
      showToast(`${templates.length} template berhasil diterapkan`, "success");
    } catch (error) {
      console.error("Apply templates error:", error);
      showToast("Gagal menerapkan template", "error");
    }
  });
}

export async function handleBudgetFormSubmit(event) {
  event.preventDefault();

  const categories = getCategories();
  if (!categories.length) {
    showToast("Tambahkan kategori terlebih dahulu", "warning");
    closeModal("budgetModal");
    return;
  }

  const data = getCurrentMonthData() ?? { incomes: [], expenses: [], budgets: {} };
  const updatedBudgets = categories.reduce((accumulator, category) => {
    const input = document.querySelector(
      `[data-budget-category="${category.id}"]`,
    );
    if (!input) {
      return accumulator;
    }

    const numericValue = normalizeAmount(input.value || 0);
    accumulator[category.id] = numericValue > 0 ? numericValue : 0;
    return accumulator;
  }, {});

  const sanitized = sanitizeBudgets(updatedBudgets);

  setCurrentMonthData({
    ...data,
    budgets: sanitized,
  });

  try {
    await saveMonthData();
    refreshAllViews();
    closeModal("budgetModal");
    showToast("Budget berhasil disimpan", "success");
  } catch (error) {
    console.error("Save budget error:", error);
    showToast("Gagal menyimpan budget", "error");
  }
}

export async function exportData() {
  try {
    if (!window.ExcelJS) {
      showToast("Fitur export belum siap, silakan muat ulang halaman", "error");
      return;
    }

    const data = getCurrentMonthData();
    if (!data) {
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

    const toNumber = (value) => normalizeAmount(value);

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

    worksheet.columns = [
      { header: "Tanggal", key: "date", width: 15 },
      { header: "Jenis", key: "type", width: 12 },
      { header: "Kategori/Sumber", key: "category", width: 25 },
      { header: "Jumlah", key: "amount", width: 18 },
      { header: "Keterangan", key: "description", width: 40 },
      { header: "Status", key: "status", width: 15 },
    ];

    (data.incomes || []).forEach((income) => {
      worksheet.addRow({
        date: toDate(income.date),
        type: "Pemasukan",
        category: income.source || "-",
        amount: toNumber(income.amount),
        description: income.description || "",
        status: "",
      });
    });

    (data.expenses || []).forEach((expense) => {
      worksheet.addRow({
        date: toDate(expense.date),
        type: "Pengeluaran",
        category: expense.category,
        amount: toNumber(expense.amount),
        description: expense.description || "",
        status: expense.status || "planned",
      });
    });

    worksheet.getColumn("date").numFmt = "dd/mm/yyyy";
    worksheet.getColumn("amount").numFmt = "#,##0";

    const budgetWorksheet = workbook.addWorksheet("Budget");
    budgetWorksheet.columns = [
      { header: "Kategori", key: "category", width: 28 },
      { header: "Limit", key: "limit", width: 18 },
      { header: "Pengeluaran Aktual", key: "actual", width: 22 },
      { header: "Pengeluaran Rencana", key: "planned", width: 22 },
      { header: "Status", key: "status", width: 20 },
      { header: "Sisa", key: "remaining", width: 18 },
    ];

    const budgetProgress = calculateBudgetProgress({
      categories: getCategories(),
      expenses: data.expenses || [],
      budgets: data.budgets || {},
    }).filter((item) => item.limit > 0 || item.actualSpent > 0 || item.plannedSpent > 0);

    budgetProgress.forEach((item) => {
      budgetWorksheet.addRow({
        category: item.name,
        limit: item.limit,
        actual: item.actualSpent,
        planned: item.plannedSpent,
        status:
          item.limit <= 0
            ? "Tidak ada batas"
            : item.status === "over"
            ? "Melebihi batas"
            : item.status === "warning"
            ? "Hampir penuh"
            : "Terkendali",
        remaining: item.limit > 0 ? item.remaining : null,
      });
    });

    ["limit", "actual", "planned", "remaining"].forEach((columnKey) => {
      budgetWorksheet.getColumn(columnKey).numFmt = "#,##0";
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    const fileName = `ringkasan-keuangan-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);

    showToast("Data berhasil diekspor ke Excel", "success");
  } catch (error) {
    console.error("Export data error:", error);
    showToast("Gagal mengekspor data", "error");
  }
}

async function importDataFromFile(file) {
  try {
    if (!file) {
      showToast("Format file tidak valid", "error");
      return;
    }

    const text = await file.text();
    const data = JSON.parse(text);

    if (!data || typeof data !== "object") {
      showToast("Format file tidak valid", "error");
      return;
    }

    if (!data.data) {
      showToast("Format file tidak valid", "error");
      return;
    }

    const normalized = convertFirestoreData(data.data);
    setCurrentMonthData({
      incomes: normalized.incomes || [],
      expenses: normalized.expenses || [],
      budgets: normalized.budgets || {},
      metadata: normalized.metadata || {},
    });

    if (Array.isArray(data.categories)) {
      const customCategories = data.categories
        .filter(Boolean)
        .filter((category) => !category.isDefault);
      const baseCategories = defaultCategories.map((category) => ({ ...category }));
      setCategories([...baseCategories, ...customCategories]);
      await saveCategories();
      updateCategoryList();
      updateCategorySelect();
    }

    if (Array.isArray(data.templates)) {
      setTemplates(data.templates.filter(Boolean));
      await saveTemplates();
      updateTemplatesList();
    }

    await saveMonthData();
    refreshAllViews();
    showToast("Data berhasil diimpor", "success");
  } catch (error) {
    console.error("Import data error:", error);
    showToast("Gagal membaca file", "error");
  }
}

export function importData() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";

  input.onchange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await importDataFromFile(file);
    }
    event.target.value = "";
  };

  input.click();
}
