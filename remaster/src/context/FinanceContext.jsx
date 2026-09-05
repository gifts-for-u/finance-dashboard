import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { IconMap, ShoppingBag, HomeIcon, Car, CreditCard, Coffee, Briefcase, Layers, BarChart, Gift, ReceiptText } from '../lib/iconMap';

import { db } from '../lib/firebase';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { extractDate, parseDateString, getMonthKey } from '../utils/dates';

const FinanceContext = createContext();

export const FinanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const totalIncome = useMemo(
    () => incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
    [incomes]
  );
  const totalExpense = useMemo(
    () => expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0),
    [expenses]
  );

  // Apply theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Helper Functions
  // Use crypto.randomUUID if available, else fallback
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // extractDate, parseDateString, getMonthKey di-import dari utils/dates.js

  // Auto-inject icons on read
  const injectIcon = (type, categoryOrTitle, rawCategoryId = null) => {
    const term = (categoryOrTitle || '').toLowerCase();
    if (type === 'expense') {
      const catObj = expenseCategories.find(c => c.name.toLowerCase() === term || c.id === rawCategoryId);
      if (catObj && catObj.icon && IconMap[catObj.icon]) {
        return IconMap[catObj.icon];
      }
      if (term.includes('dapur') || term.includes('food')) return ShoppingBag;
      if (term.includes('rumah')) return HomeIcon;
      if (term.includes('transport')) return Car;
      if (term.includes('langganan')) return CreditCard;
      return Coffee;
    }
    if (type === 'income') {
      if (term.includes('gaji')) return Briefcase;
      if (term.includes('project')) return Layers;
      if (term.includes('dividend')) return BarChart;
      if (term.includes('gift')) return Gift;
      return Briefcase;
    }
    return ReceiptText;
  };

  const mapBudgetIcon = (categoryId) => {
    const term = (categoryId || '').toLowerCase();
    if (term.includes('dapur') || term.includes('food')) return ShoppingBag;
    if (term.includes('rumah')) return HomeIcon;
    if (term.includes('transport')) return Car;
    if (term.includes('langganan')) return BarChart;
    return Coffee;
  };

  // 1. Firebase Category Subscription
  useEffect(() => {
    if (!user?.uid) {
      setExpenseCategories([]);
      return;
    }

    const catRef = doc(db, "users", user.uid, "categories", "main");
    const unsubCat = onSnapshot(catRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().categories) {
        setExpenseCategories(docSnap.data().categories);
      } else {
        // Fallback default categories
        setExpenseCategories([
          { id: 'kebutuhan-dapur', name: 'Kebutuhan Dapur', color: '#FF647C', icon: 'ShoppingBag', isDefault: true },
          { id: 'kebutuhan-rumah', name: 'Kebutuhan Rumah', color: '#4BC0C0', icon: 'Home', isDefault: true },
          { id: 'transportasi', name: 'Transportasi', color: '#94A3B8', icon: 'Car', isDefault: true },
          { id: 'lainnya', name: 'Lainnya', color: '#94A3B8', icon: 'Coffee', isDefault: true }
        ]);
      }
    });

    return () => unsubCat();
  }, [user]);

  // 2. Firebase Month Data Subscription
  useEffect(() => {
    if (!user?.uid) {
      setIncomes([]); setExpenses([]); setBudgets([]);
      return;
    }

    const monthKey = getMonthKey(currentDate);
    const monthRef = doc(db, "users", user.uid, "months", monthKey);
    const unsubMonth = onSnapshot(monthRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        const loadedIncomes = (data.incomes || []).filter(Boolean).map(inc => ({
          ...inc,
          id: inc.id || generateId(),
          date: extractDate(inc.date),
          title: inc.source || inc.description || inc.title || 'Pemasukan',
          icon: injectIcon('income', inc.source || inc.description),
          status: inc.status || 'Paid'
        }));
        
        const loadedExpenses = (data.expenses || []).filter(Boolean).map(exp => {
          const categoryName = expenseCategories.find(c => c.id === exp.category)?.name || exp.category;
          
          let mappedStatus = 'done';
          if (exp.status) {
            const ls = exp.status.toLowerCase();
            if (ls === 'planned' || ls === 'pending' || ls === 'unpaid') mappedStatus = 'planned';
          }

          return {
            ...exp,
            id: exp.id || generateId(),
            date: extractDate(exp.date),
            title: exp.description || exp.title || 'Pengeluaran',
            categoryName: categoryName,
            category: categoryName, 
            categoryId: exp.category,
            status: mappedStatus,
            icon: injectIcon('expense', categoryName || exp.description, exp.category),
            hex: expenseCategories.find(c => c.id === exp.category)?.color || '#94A3B8'
          };
        });

        setIncomes(loadedIncomes);
        setExpenses(loadedExpenses);

        // Map Budgets Object to Array
        if (data.budgets) {
          const budgetArr = Object.entries(data.budgets)
            .filter(([_, limit]) => Number(limit) > 0)
            .map(([catId, limit]) => ({
            id: catId,
            category: catId, 
            name: expenseCategories.find(c => c.id === catId)?.name || catId,
            limit: Number(limit),
            icon: mapBudgetIcon(catId),
            color: expenseCategories.find(c => c.id === catId)?.color || '#1E56D1'
          }));
          setBudgets(budgetArr);
        } else {
          setBudgets([]);
        }
      } else {
        setIncomes([]);
        setExpenses([]);
        setBudgets([]);
      }
    }, (err) => {
      console.error("Firebase Sync Error:", err);
      toast.error("Gagal sinkronisasi data bulanan.");
    });

    return () => unsubMonth();
  }, [user, currentDate, expenseCategories]);

  // Generic Month Updater
  const updateMonthDoc = async (payload) => {
    if (!user?.uid) return;
    const monthKey = getMonthKey(currentDate);
    const monthRef = doc(db, 'users', user.uid, 'months', monthKey);
    try {
      await setDoc(monthRef, payload, { merge: true });
    } catch (err) {
      console.error("Error updating doc", err);
      throw err;
    }
  };

  // Generic Categories Updater
  const updateCategoriesDoc = async (newCategoriesArray) => {
    if (!user?.uid) return;
    const catRef = doc(db, 'users', user.uid, 'categories', 'main');
    try {
      await setDoc(catRef, { categories: newCategoriesArray }, { merge: true });
    } catch (err) {
      console.error("Error updating categories", err);
      throw err;
    }
  };

  // Input validation helper
  const validateAmount = (amount) => {
    const num = Number(amount);
    if (!Number.isFinite(num) || isNaN(num) || num <= 0) {
      throw new Error("Nominal harus berupa angka valid lebih dari 0.");
    }
    if (num > 1000000000000) {
      throw new Error("Nominal melebihi batas maksimum.");
    }
    return num;
  };

  // --- INCOMES ---
  const addIncome = async (income) => {
    try {
      const validAmount = validateAmount(income.amount);
      const sourceName = (income.title || income.source || 'Pemasukan').trim().slice(0, 100);
      const descriptionText = (income.description || '').trim().slice(0, 255);

      const payload = {
        ...income,
        source: sourceName,
        description: descriptionText,
        amount: validAmount,
        id: generateId(),
        date: parseDateString(income.date),
      };
      delete payload.icon;
      delete payload.title;
      delete payload.hex;
      const newArr = [...incomes.map(i => {
        const clean = {...i};
        delete clean.icon; delete clean.hex; delete clean.title;
        if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
        return clean;
      }), payload];

      await updateMonthDoc({ incomes: newArr });
      toast.success("Pemasukan berhasil ditambahkan!");
    } catch (err) {
      toast.error(err.message || "Gagal menambah pemasukan.");
    }
  };

  const updateIncome = async (id, updatedIncome) => {
    try {
      const newArr = incomes.map(i => {
        const clean = {...i};
        delete clean.icon; delete clean.title; delete clean.hex;
        if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
        if (clean.id === id) {
          const rawAmount = updatedIncome.amount !== undefined ? updatedIncome.amount : clean.amount;
          const validAmount = validateAmount(rawAmount);
          const sourceName = (updatedIncome.title || updatedIncome.source || clean.source || 'Pemasukan').trim().slice(0, 100);

          const updated = { 
            ...clean, 
            ...updatedIncome, 
            source: sourceName, 
            amount: validAmount,
            date: updatedIncome.date ? parseDateString(updatedIncome.date) : clean.date
          };
          delete updated.icon; delete updated.title; delete updated.hex;
          return updated;
        }
        return clean;
      });

      await updateMonthDoc({ incomes: newArr });
      toast.success("Pemasukan diupdate!");
    } catch (err) {
      toast.error(err.message || "Gagal update pemasukan.");
    }
  };

  const deleteIncome = async (id) => {
    const newArr = incomes.filter(i => i.id !== id).map(i => {
      const clean = {...i};
      delete clean.icon; delete clean.title; delete clean.hex;
      if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
      return clean;
    });
    try {
      await updateMonthDoc({ incomes: newArr });
      toast.success("Pemasukan dihapus.");
    } catch { toast.error("Gagal hapus."); }
  };

  // --- EXPENSES ---
  const addExpense = async (expense) => {
    try {
      const validAmount = validateAmount(expense.amount);
      const catObj = expenseCategories.find(c => c.name === expense.category);
      const catId = catObj ? catObj.id : (expense.category || "lainnya").toLowerCase().replace(/\s+/g, '-');
      const descText = (expense.title || expense.description || 'Pengeluaran').trim().slice(0, 255);

      const payload = {
        amount: validAmount,
        category: catId,
        date: parseDateString(expense.date),
        description: descText,
        isRecurring: false,
        id: generateId(),
        status: (expense.status || 'done').toLowerCase()
      };

      const newArr = [...expenses.map(e => {
        const clean = {...e};
        clean.category = e.categoryId || e.category;
        if (clean.status) clean.status = clean.status.toLowerCase();
        delete clean.icon; delete clean.hex; delete clean.title; delete clean.categoryName; delete clean.categoryId;
        if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
        return clean;
      }), payload];

      await updateMonthDoc({ expenses: newArr });
      toast.success("Pengeluaran ditambahkan!");
    } catch (err) {
      toast.error(err.message || "Gagal tambah pengeluaran.");
    }
  };

  const updateExpense = async (id, updatedExpense) => {
    try {
      const newArr = expenses.map(e => {
        const clean = {...e};
        clean.category = e.categoryId || e.category;
        if (clean.status) clean.status = clean.status.toLowerCase();
        delete clean.icon; delete clean.hex; delete clean.title; delete clean.categoryName; delete clean.categoryId;
        if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
        
        if (clean.id === id) {
          const rawAmount = updatedExpense.amount !== undefined ? updatedExpense.amount : clean.amount;
          const validAmount = validateAmount(rawAmount);
          const catObj = expenseCategories.find(c => c.name === updatedExpense.category);
          const catId = catObj ? catObj.id : clean.category;
          
          let writeStatus = clean.status;
          if (updatedExpense.status) {
            writeStatus = updatedExpense.status.toLowerCase();
          }

          return { 
            ...clean, 
            amount: validAmount,
            description: (updatedExpense.title || clean.description || 'Pengeluaran').trim().slice(0, 255),
            category: catId,
            status: writeStatus,
            date: updatedExpense.date ? parseDateString(updatedExpense.date) : clean.date
          };
        }
        return clean;
      });

      await updateMonthDoc({ expenses: newArr });
      toast.success("Pengeluaran diupdate!");
    } catch (err) {
      toast.error(err.message || "Gagal update.");
    }
  };

  const deleteExpense = async (id) => {
    const newArr = expenses.filter(e => e.id !== id).map(e => {
      const clean = {...e};
      clean.category = e.categoryId || e.category; // Restore Category ID
      if (clean.status) clean.status = clean.status.toLowerCase();
      delete clean.icon; delete clean.hex; delete clean.title; delete clean.categoryId; delete clean.categoryName;
      if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
      return clean;
    });
    try {
      await updateMonthDoc({ expenses: newArr });
      toast.success("Pengeluaran dihapus.");
    } catch { toast.error("Gagal hapus."); }
  };

  const toggleExpenseStatus = async (id) => {
    const expense = expenses.find(ex => ex.id === id);
    if (!expense) return;
    const newStatus = (expense.status === 'done') ? 'planned' : 'done'; // Cycle logic
    
    // Quick inline update
    await updateExpense(id, { status: newStatus });
  };

  // --- CATEGORIES ---
  const addExpenseCategory = async (category) => {
    try {
      const catName = (category.name || '').trim();
      if (!catName) {
        throw new Error("Nama kategori tidak boleh kosong.");
      }
      const id = catName.toLowerCase().replace(/\s+/g, '-');
      const payload = {
        color: category.color || '#94A3B8',
        icon: category.icon || 'Tag',
        id: id,
        isDefault: false,
        name: catName.slice(0, 50)
      };
      const newArr = [...expenseCategories, payload];
      await updateCategoriesDoc(newArr);
      toast.success("Kategori ditambahkan!");
    } catch (err) {
      toast.error(err.message || "Gagal ditambah.");
    }
  };

  const updateExpenseCategory = async (id, updatedCategory) => {
    try {
      const newArr = expenseCategories.map(c => {
        if (c.id === id) {
          const newName = (updatedCategory.name !== undefined ? updatedCategory.name : c.name).trim();
          if (!newName) {
            throw new Error("Nama kategori tidak boleh kosong.");
          }
          return {
            ...c,
            color: updatedCategory.color || c.color,
            name: newName.slice(0, 50),
            icon: updatedCategory.icon || c.icon
          };
        }
        return c;
      });

      await updateCategoriesDoc(newArr);
      toast.success("Kategori diupdate!");
    } catch (err) {
      toast.error(err.message || "Gagal update.");
    }
  };

  const deleteExpenseCategory = async (id) => {
    const cat = expenseCategories.find(c => c.id === id);
    if (cat?.isDefault) return toast.error("Kategori bawaan tidak dapat dihapus.");
    
    const newArr = expenseCategories.filter(c => c.id !== id);
    try {
      await updateCategoriesDoc(newArr);
      toast.success("Kategori dihapus.");
    } catch { toast.error("Gagal hapus."); }
  };

  // --- BUDGETS ---
  const addBudget = async ({ category, limit }) => {
    try {
      const numLimit = Number(limit);
      if (!Number.isFinite(numLimit) || isNaN(numLimit) || numLimit < 0) {
        throw new Error("Target budget harus berupa angka valid 0 atau lebih.");
      }
      if (numLimit > 1000000000000) {
        throw new Error("Target budget melebihi batas maksimum.");
      }

      // category can be name or id depending on what UI passes, safely resolve to ID
      const catObj = expenseCategories.find(c => c.name === category || c.id === category);
      const catId = catObj ? catObj.id : category.toLowerCase().replace(/\s+/g, '-');

      // Firebase {merge:true} automatically merges nested fields inside `budgets`
      await updateMonthDoc({ budgets: { [catId]: numLimit } });
      toast.success("Anggaran berhasil ditetapkan!");
    } catch (err) {
      toast.error(err.message || "Gagal menetapkan anggaran.");
    }
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleMigration = async () => { return { status: 'completed' }; };

  return (
    <FinanceContext.Provider value={{ 
      incomes, setIncomes, totalIncome, 
      expenses, setExpenses, totalExpense,
      currentDate, changeMonth,
      isLoading, setIsLoading,
      handleMigration,
      theme, toggleTheme,
      addIncome, updateIncome, deleteIncome,
      addExpense, updateExpense, deleteExpense, toggleExpenseStatus,
      budgets, setBudgets, addBudget,
      expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory
    }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
