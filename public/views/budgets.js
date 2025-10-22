import { getCurrentMonthData, getCategories } from "../state/app-state.js";
import {
  calculateBudgetProgress,
  formatCurrency,
} from "../state/derivations.js";

function formatRemainingText(item) {
  if (item.limit <= 0) {
    return "Tanpa batas";
  }

  const remaining = item.remaining;
  if (remaining < 0) {
    return `Melebihi: ${formatCurrency(Math.abs(remaining))}`;
  }

  return `Sisa: ${formatCurrency(remaining)}`;
}

function getStatusLabel(item) {
  if (item.limit <= 0) {
    return "Tidak ada batas";
  }

  switch (item.status) {
    case "over":
      return "Melebihi batas";
    case "warning":
      return "Hampir penuh";
    case "normal":
      return "Terkendali";
    default:
      return "";
  }
}

function renderBudgetItem(item) {
  const actualPercent = Math.min(item.actualPercent, 150);
  const plannedPercent = Math.min(item.plannedPercent, 150);
  const showPlannedOverlay = plannedPercent > actualPercent;
  const statusLabel = getStatusLabel(item);
  const remainingClass = [
    "budget-meta-remaining",
    item.remaining < 0 ? "is-over" : "",
    item.limit <= 0 ? "is-neutral" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="budget-item">
      <div class="budget-item-header">
        <div class="budget-item-title">
          <span class="budget-color-indicator" style="--budget-color: ${
            item.color || "var(--primary-color)"
          }"></span>
          <span class="budget-item-name">${item.name}</span>
        </div>
        <div class="budget-item-limit">
          Target: ${item.limit > 0 ? formatCurrency(item.limit) : "Tidak ada"}
        </div>
      </div>
      <div class="budget-progress-bar-wrapper">
        <div class="budget-progress-bar-track">
          <div
            class="budget-progress-bar-fill status-${item.status}"
            style="width: ${Math.min(actualPercent, 100)}%;"
          ></div>
          ${
            showPlannedOverlay
              ? `
                <div
                  class="budget-progress-bar-planned"
                  style="width: ${Math.min(plannedPercent, 100)}%;"
                  aria-hidden="true"
                ></div>
              `
              : ""
          }
        </div>
      </div>
      <div class="budget-item-meta">
        <span class="budget-meta-actual">Aktual: ${formatCurrency(
          item.actualSpent,
        )}</span>
        <span class="budget-meta-planned">Rencana: ${formatCurrency(
          item.plannedSpent,
        )}</span>
        <span class="${remainingClass}">${formatRemainingText(item)}</span>
      </div>
      ${
        statusLabel
          ? `<div class="budget-item-status status-${item.status}">${statusLabel}</div>`
          : ""
      }
    </div>
  `;
}

export function updateBudgetProgress() {
  const listElement = document.getElementById("budgetProgressList");
  if (!listElement) {
    return;
  }

  const emptyState = document.getElementById("budgetEmptyState");
  const card = document.getElementById("budgetCard");

  const data = getCurrentMonthData();
  const categories = getCategories();
  const budgets = data?.budgets ?? {};
  const expenses = data?.expenses ?? [];

  const progressItems = calculateBudgetProgress({
    categories,
    expenses,
    budgets,
  }).filter((item) => item.limit > 0 || item.plannedSpent > 0 || item.actualSpent > 0);

  if (progressItems.length === 0) {
    listElement.innerHTML = "";
    if (emptyState) {
      emptyState.style.display = "flex";
    }
    if (card) {
      card.classList.add("is-empty");
    }
    return;
  }

  if (emptyState) {
    emptyState.style.display = "none";
  }
  if (card) {
    card.classList.remove("is-empty");
  }

  listElement.innerHTML = progressItems.map(renderBudgetItem).join("");
}
