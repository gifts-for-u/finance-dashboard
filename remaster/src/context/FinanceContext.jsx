import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Briefcase, 
  Layers, 
  BarChart, 
  Gift,
  ShoppingBag,
  Home as HomeIcon,
  Coffee,
  Car,
  CreditCard,
  ReceiptText,
  Tag,
  Wallet,
  Heart,
  Smartphone,
  Plane,
  Shirt,
  Music,
  GraduationCap,
  Utensils,
  PiggyBank,
  Landmark,
  HeartHandshake,
  Package,
  Box,
  Archive,
  AlertTriangle,
  Siren,
  Stethoscope,
  Pill
} from 'lucide-react';

export const IconMap = {
  Briefcase, Layers, BarChart, Gift, ShoppingBag, Home: HomeIcon, Coffee, Car, CreditCard, ReceiptText, Tag, Wallet, Heart, Smartphone, Plane, Shirt, Music, GraduationCap, Utensils, PiggyBank, Landmark, HeartHandshake, Package, Box, Archive, AlertTriangle, Siren, Stethoscope, Pill
};
import { db } from '../lib/firebase';
import { onSnapshot, setDoc, doc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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

  const totalIncome = incomes.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const totalExpense = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Apply theme
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Helper Functions
  const getMonthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  
  // Use crypto.randomUUID if available, else fallback
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Convert Firebase Timestamp to UI Formatted string (e.g. "1 Mar 2026")
  const extractDate = (dateField) => {
    let d = new Date();
    if (dateField) {
      if (typeof dateField.toDate === 'function') d = dateField.toDate();
      else d = new Date(dateField);
    }
    // Handle invalid dates
    if (isNaN(d.getTime())) d = new Date();
    
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  // Convert UI String back to Date for Firebase
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const parts = String(dateStr).split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = months.indexOf(parts[1]);
      const year = parseInt(parts[2], 10);
      if (month !== -1) {
        return new Date(year, month, day);
      }
    }
    // Fallback
    const fallbackD = new Date(dateStr);
    return isNaN(fallbackD.getTime()) ? new Date() : fallbackD;
  };

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

  // --- INCOMES ---
  const addIncome = async (income) => {
    const payload = {
      ...income,
      source: income.title || income.source || 'Pemasukan',
      amount: Number(income.amount),
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

    try {
      await updateMonthDoc({ incomes: newArr });
      toast.success("Pemasukan berhasil ditambahkan!");
    } catch { toast.error("Gagal menambah pemasukan."); }
  };

  const updateIncome = async (id, updatedIncome) => {
    const newArr = incomes.map(i => {
      const clean = {...i};
      delete clean.icon; delete clean.title; delete clean.hex;
      if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
      if (clean.id === id) {
        const updated = { 
          ...clean, 
          ...updatedIncome, 
          source: updatedIncome.title || updatedIncome.source || clean.source, 
          amount: Number(updatedIncome.amount || clean.amount),
          date: updatedIncome.date ? parseDateString(updatedIncome.date) : clean.date
        };
        delete updated.icon; delete updated.title; delete updated.hex;
        return updated;
      }
      return clean;
    });
    try {
      await updateMonthDoc({ incomes: newArr });
      toast.success("Pemasukan diupdate!");
    } catch { toast.error("Gagal update pemasukan."); }
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
    // Expense schema map UI input to Legacy Field
    // UI gives: title, amount, category (name string), date
    // Legacy wants: amount, category (id string), date, description, isRecurring, id, status
    
    // Find category ID based on the selected Name in UI
    const catObj = expenseCategories.find(c => c.name === expense.category);
    const catId = catObj ? catObj.id : (expense.category || "lainnya").toLowerCase().replace(/\s+/g, '-');

    const payload = {
      amount: Number(expense.amount),
      category: catId,
      date: parseDateString(expense.date),
      description: expense.title || expense.description || 'Pengeluaran',
      isRecurring: false,
      id: generateId(),
      status: (expense.status || 'done').toLowerCase()
    };

    const newArr = [...expenses.map(e => {
      const clean = {...e};
      clean.category = e.categoryId || e.category; // Restore Category ID!!!
      if (clean.status) clean.status = clean.status.toLowerCase(); // Consistent DB lowercasing
      delete clean.icon; delete clean.hex; delete clean.title; delete clean.categoryName; delete clean.categoryId;
      if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
      return clean;
    }), payload];

    try {
      await updateMonthDoc({ expenses: newArr });
      toast.success("Pengeluaran ditambahkan!");
    } catch { toast.error("Gagal tambah pengeluaran."); }
  };

  const updateExpense = async (id, updatedExpense) => {
    const newArr = expenses.map(e => {
      const clean = {...e};
      clean.category = e.categoryId || e.category; // Restore Category ID
      if (clean.status) clean.status = clean.status.toLowerCase();
      delete clean.icon; delete clean.hex; delete clean.title; delete clean.categoryName; delete clean.categoryId;
      if (clean.date && typeof clean.date === 'string') clean.date = parseDateString(clean.date);
      
      if (clean.id === id) {
        const catObj = expenseCategories.find(c => c.name === updatedExpense.category);
        const catId = catObj ? catObj.id : clean.category;
        
        let writeStatus = clean.status;
        if (updatedExpense.status) {
          writeStatus = updatedExpense.status.toLowerCase();
        }

        return { 
          ...clean, 
          amount: Number(updatedExpense.amount || clean.amount),
          description: updatedExpense.title || clean.description,
          category: catId,
          status: writeStatus,
          date: updatedExpense.date ? parseDateString(updatedExpense.date) : clean.date
        };
      }
      return clean;
    });

    try {
      await updateMonthDoc({ expenses: newArr });
      toast.success("Pengeluaran diupdate!");
    } catch { toast.error("Gagal update."); }
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
    const id = category.name.toLowerCase().replace(/\s+/g, '-');
    const payload = {
      color: category.color || '#94A3B8',
      icon: category.icon || 'Tag',
      id: id,
      isDefault: false,
      name: category.name
    };
    const newArr = [...expenseCategories, payload];
    try {
      await updateCategoriesDoc(newArr);
      toast.success("Kategori ditambahkan!");
    } catch { toast.error("Gagal ditambah."); }
  };

  const updateExpenseCategory = async (id, updatedCategory) => {
    const cat = expenseCategories.find(c => c.id === id);
    
    const newArr = expenseCategories.map(c => {
      if (c.id === id) {
        return { ...c, color: updatedCategory.color || c.color, name: updatedCategory.name || c.name, icon: updatedCategory.icon || c.icon };
      }
      return c;
    });
    try {
      await updateCategoriesDoc(newArr);
      toast.success("Kategori diupdate!");
    } catch { toast.error("Gagal update."); }
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
    // category can be name or id depending on what UI passes, safely resolve to ID
    const catObj = expenseCategories.find(c => c.name === category || c.id === category);
    const catId = catObj ? catObj.id : category.toLowerCase().replace(/\s+/g, '-');

    try {
      // Firebase {merge:true} automatically merges nested fields inside `budgets`
      await updateMonthDoc({ budgets: { [catId]: Number(limit) } });
      toast.success("Anggaran berhasil ditetapkan!");
    } catch {
      toast.error("Gagal menetapkan anggaran.");
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
