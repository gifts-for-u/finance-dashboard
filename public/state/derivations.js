import { DEFAULT_CATEGORY_BADGE_PALETTE } from "./app-state.js";

export function normalizeHexColor(color) {
  if (typeof color !== "string") {
    return null;
  }

  let value = color.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("#")) {
    value = value.slice(1);
  }

  if (value.length === 3) {
    value = value
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return `#${value.toUpperCase()}`;
}

export function lightenHexColor(color, intensity = 0.85) {
  const normalized = normalizeHexColor(color);
  if (!normalized) {
    return null;
  }

  const hex = normalized.slice(1);
  const numeric = parseInt(hex, 16);
  const r = (numeric >> 16) & 0xff;
  const g = (numeric >> 8) & 0xff;
  const b = numeric & 0xff;
  const clamped = Math.min(Math.max(intensity, 0), 1);

  const lightenChannel = (component) => {
    const value = component / 255;
    const ratio = clamped + (1 - clamped) * value;
    const lightened = value + (1 - value) * ratio;
    return Math.round(Math.min(lightened, 1) * 255);
  };

  const toHex = (component) => component.toString(16).padStart(2, "0").toUpperCase();

  return `#${toHex(lightenChannel(r))}${toHex(lightenChannel(g))}${toHex(lightenChannel(b))}`;
}

export function getCategoryBadgePalette(color) {
  const normalized = normalizeHexColor(color);

  if (!normalized) {
    return DEFAULT_CATEGORY_BADGE_PALETTE;
  }

  const background = lightenHexColor(normalized, 0.85);
  return {
    background: background ?? DEFAULT_CATEGORY_BADGE_PALETTE.background,
    text: normalized,
    border: normalized,
  };
}

export function normalizeAmount(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9-]/g, "");
    if (!cleaned) {
      return 0;
    }

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(amount) {
  const value = normalizeAmount(amount);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercentageText(value) {
  return `${value.toFixed(0)}%`;
}

export function convertFirestoreDate(date) {
  if (!date) return new Date();

  if (date instanceof Date) return date;

  if (date && date.toDate && typeof date.toDate === "function") {
    return date.toDate();
  }

  if (date && typeof date === "object" && date.seconds) {
    return new Date(date.seconds * 1000);
  }

  if (typeof date === "string") {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  return new Date();
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("id-ID", {
    year: "numeric",
    month: "long",
  }).format(date);
}

export function formatShortDate(date) {
  let dateObj = date;

  if (date && date.toDate && typeof date.toDate === "function") {
    dateObj = date.toDate();
  } else if (date && typeof date === "string") {
    dateObj = new Date(date);
  } else if (date && typeof date === "object" && date.seconds) {
    dateObj = new Date(date.seconds * 1000);
  } else if (!(date instanceof Date)) {
    dateObj = new Date();
  }

  if (Number.isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dateObj);
}

export function formatDateForInput(date) {
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

export function parseDateInput(value) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function getComparableDateValue(date) {
  const parsed = convertFirestoreDate(date);
  return parsed.getTime();
}

export function isDoneDescription(text) {
  if (!text) {
    return false;
  }

  return String(text).toLowerCase().includes("done");
}

const VALID_EXPENSE_STATUSES = new Set(["planned", "done"]);

export function normalizeStatusValue(status) {
  if (status === undefined || status === null) {
    return "";
  }

  return String(status).toLowerCase().trim();
}

export function deriveExpenseStatus(expense) {
  if (!expense || typeof expense !== "object") {
    return "planned";
  }

  const normalizedStatus = normalizeStatusValue(expense.status);
  if (normalizedStatus && VALID_EXPENSE_STATUSES.has(normalizedStatus)) {
    return normalizedStatus;
  }

  if (typeof expense.status === "string" && !normalizedStatus) {
    return "planned";
  }

  if (typeof expense.status === "string" && !VALID_EXPENSE_STATUSES.has(normalizedStatus)) {
    return expense.status;
  }

  if (typeof expense.description === "string" && isDoneDescription(expense.description)) {
    return "done";
  }

  return "planned";
}

export function isExpenseDone(expense) {
  const status = deriveExpenseStatus(expense);
  if (typeof status === "string") {
    return status.toLowerCase() === "done";
  }
  return false;
}

export function isSavingsCategory(expense, categories) {
  if (!expense) {
    return false;
  }

  const list = Array.isArray(categories) ? categories : [];
  const category = list.find((cat) => cat.id === expense.category);
  if (!category) {
    return false;
  }

  const normalisedName = String(category.name || "").toLowerCase();
  return category.id === "savings" || normalisedName.includes("tabungan");
}

export function generateId() {
  const cryptoRef = globalThis.crypto;
  if (cryptoRef?.randomUUID) {
    return cryptoRef.randomUUID();
  }

  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2)
  ).replace(/[^a-z0-9]/gi, "");
}
