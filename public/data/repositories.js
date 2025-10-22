import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import {
  firebaseReady,
  requireCurrentUser,
  getFirestoreDb,
} from "../services/firebase.js";
import {
  defaultCategories,
  getCategories,
  setCategories,
  getTemplates,
  setTemplates,
  getCurrentMonthKey,
  getCurrentMonthData,
  setCurrentMonthData,
  getDefaultEntryDate,
} from "../state/app-state.js";
import {
  normalizeAmount,
  convertFirestoreDate,
  deriveExpenseStatus,
  generateId,
  sanitizeBudgets,
} from "../state/derivations.js";

export function convertFirestoreData(data) {
  if (!data) return data;

  const normalised = { ...data };

  if (Array.isArray(normalised.incomes)) {
    normalised.incomes = normalised.incomes.filter(Boolean).map((income) => ({
      ...income,
      amount: normalizeAmount(income.amount),
      date: convertFirestoreDate(income.date),
    }));
  }

  if (Array.isArray(normalised.expenses)) {
    normalised.expenses = normalised.expenses.filter(Boolean).map((expense) => {
      const updated = {
        ...expense,
        amount: normalizeAmount(expense.amount),
        date: convertFirestoreDate(expense.date),
      };

      const status = deriveExpenseStatus(updated);
      if (typeof status === "string" && status) {
        updated.status = status;
      } else if (updated.status !== undefined) {
        delete updated.status;
      }

      return updated;
    });
  }

  if (normalised.metadata) {
    const metadata = { ...normalised.metadata };
    if (metadata.createdAt) {
      metadata.createdAt = convertFirestoreDate(metadata.createdAt);
    }
    if (metadata.updatedAt) {
      metadata.updatedAt = convertFirestoreDate(metadata.updatedAt);
    }
    normalised.metadata = metadata;
  }

  normalised.budgets = sanitizeBudgets(normalised.budgets);

  return normalised;
}

export async function loadCategories() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const docRef = doc(db, "users", user.uid, "categories", "main");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const savedCategories = docSnap.data().categories || [];
    setCategories(savedCategories);
  } else {
    const fallback = [...defaultCategories];
    setCategories(fallback);
    await setDoc(docRef, { categories: fallback });
  }
}

export async function saveCategories() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const docRef = doc(db, "users", user.uid, "categories", "main");
  await setDoc(docRef, { categories: getCategories() });
}

export async function loadTemplates() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const docRef = doc(db, "users", user.uid, "templates", "recurring");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const loadedTemplates = (docSnap.data().templates || [])
      .filter(Boolean)
      .map((template) => ({
        ...template,
        amount: normalizeAmount(template.amount),
      }));
    setTemplates(loadedTemplates);
  } else {
    setTemplates([]);
  }
}

export async function saveTemplates() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const docRef = doc(db, "users", user.uid, "templates", "recurring");
  const normalizedTemplates = getTemplates()
    .filter(Boolean)
    .map((template) => ({
      ...template,
      amount: normalizeAmount(template.amount),
    }));
  await setDoc(docRef, { templates: normalizedTemplates });
}

export async function getFirstMonthWithData() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const monthsCollection = collection(db, "users", user.uid, "months");
  const snapshot = await getDocs(monthsCollection);

  const monthKeys = snapshot.docs.map((docSnapshot) => docSnapshot.id).sort();
  return monthKeys[0] ?? null;
}

export async function loadMonthData() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const monthKey = getCurrentMonthKey();
  const docRef = doc(db, "users", user.uid, "months", monthKey);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = convertFirestoreData(docSnap.data());

    if (typeof data.income === "number" && data.income > 0) {
      data.incomes = [
        {
          id: generateId(),
          amount: normalizeAmount(data.income),
          source: "Migrated Income",
          date: getDefaultEntryDate(),
          description: "Data pemasukan lama",
        },
      ];
      delete data.income;
      setCurrentMonthData(data);
      await saveMonthData();
      return getCurrentMonthData();
    }

    setCurrentMonthData(data);
    return data;
  }

  const emptyState = {
    incomes: [],
    expenses: [],
    budgets: {},
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  setCurrentMonthData(emptyState);
  return emptyState;
}

export async function saveMonthData() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const monthKey = getCurrentMonthKey();
  const docRef = doc(db, "users", user.uid, "months", monthKey);

  const currentData = getCurrentMonthData();
  if (!currentData) {
    return;
  }

  const metadata = {
    createdAt:
      currentData.metadata && currentData.metadata.createdAt
        ? convertFirestoreDate(currentData.metadata.createdAt)
        : new Date(),
    updatedAt: new Date(),
  };

  const incomes = Array.isArray(currentData.incomes)
    ? currentData.incomes
        .filter(Boolean)
        .map((income) => ({
          ...income,
          amount: normalizeAmount(income.amount),
          date: convertFirestoreDate(income.date),
        }))
    : [];

  const expenses = Array.isArray(currentData.expenses)
    ? currentData.expenses
        .filter(Boolean)
        .map((expense) => {
          const normalizedExpense = {
            ...expense,
            amount: normalizeAmount(expense.amount),
            date: convertFirestoreDate(expense.date),
          };

          const status = deriveExpenseStatus(normalizedExpense);
          if (typeof status === "string" && status) {
            normalizedExpense.status = status;
          } else if (normalizedExpense.status !== undefined) {
            delete normalizedExpense.status;
          }

          return normalizedExpense;
        })
    : [];

  const budgets = sanitizeBudgets(currentData.budgets);

  const payload = {
    incomes,
    expenses,
    budgets,
    metadata,
  };

  setCurrentMonthData({ ...payload });
  await setDoc(docRef, payload);
}

export async function migrateOctoberDataManually() {
  await firebaseReady;
  const user = requireCurrentUser();
  const db = getFirestoreDb();
  const AUTHORIZED_USER_ID = "YOUR_USER_ID_HERE";

  if (user.uid !== AUTHORIZED_USER_ID) {
    return { status: "unauthorized" };
  }

  const migrationRef = doc(db, "users", user.uid, "migration", "status");
  const migrationDoc = await getDoc(migrationRef);

  if (migrationDoc.exists() && migrationDoc.data().completed) {
    return { status: "already-completed" };
  }

  const oldExpenses = [
    { category: "savings", amount: 1200000, description: "Nabung Emas" },
    { category: "savings", amount: 400000, description: "Menabung Mandiri" },
    { category: "family", amount: 500000, description: "Mama" },
    { category: "family", amount: 150000, description: "Rakha" },
    { category: "family", amount: 150000, description: "Mbah" },
    { category: "subscriptions", amount: 130000, description: "Kuota" },
    { category: "debt", amount: 940000, description: "Paylater (TikTok+Shopee)" },
    { category: "subscriptions", amount: 30000, description: "Shopee VIP" },
    { category: "subscriptions", amount: 20000, description: "Gojek Plus" },
    { category: "needs", amount: 130000, description: "Dry + Wet Food" },
    { category: "needs", amount: 200000, description: "Lauk (jika mama tidak masak)" },
    { category: "lifestyle", amount: 100000, description: "Makan Sashimi" },
    { category: "lifestyle", amount: 60000, description: "Barber" },
    { category: "needs", amount: 150000, description: "Persediaan Kebersihan" },
    { category: "lifestyle", amount: 200000, description: "Lari" },
    { category: "lifestyle", amount: 300000, description: "Jajan" },
    { category: "transport", amount: 650000, description: "Ongkos" },
    { category: "family", amount: 150000, description: "Tabungan Kado Mama" },
    { category: "shopping", amount: 50000, description: "Launcher" },
    { category: "shopping", amount: 125000, description: "Beli Bantal Guling" },
  ];

  const currentTimestamp = new Date();

  const migratedData = {
    incomes: [
      {
        id: generateId(),
        amount: 6000000,
        source: "Migrated Income",
        date: currentTimestamp,
        description: "Migrated October data",
      },
    ],
    expenses: oldExpenses.map((expense) => ({
      id: generateId(),
      ...expense,
      date: currentTimestamp,
      isRecurring: false,
      status: "planned",
    })),
    budgets: {},
    metadata: {
      createdAt: currentTimestamp,
      updatedAt: currentTimestamp,
      migrated: true,
    },
  };

  setCurrentMonthData(migratedData);
  await setDoc(doc(db, "users", user.uid, "months", getCurrentMonthKey()), migratedData);
  await setDoc(migrationRef, {
    completed: true,
    completedAt: new Date(),
    userId: user.uid,
  });

  return { status: "completed" };
}
