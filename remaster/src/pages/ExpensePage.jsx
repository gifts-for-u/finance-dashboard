import React, { useState, useRef, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { StatCard, ChartCard } from '../components/Cards';
import Modal from '../components/Modal';
import FullscreenTable from '../components/FullscreenTable';
import { formatRupiah } from '../utils/formatter';
import { 
  CreditCard, 
  Receipt, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus,
  Trash2,
  Save,
  Tag,
  PenLine,
  CheckCircle2,
  ReceiptText,
  Calendar,
  ArrowUpDown,
  ChevronDown,
  Clock,
  ArrowDown,
  ArrowUp,
  DollarSign
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useFinance, IconMap } from '../context/FinanceContext';
import { CustomSelect, CustomDatePicker, DeferredColorPicker } from '../components/CustomInputs';



const STATUS_OPTIONS = [
  { value: 'done', label: 'Lunas' },
  { value: 'planned', label: 'Belum Lunas' }
];

const SortTimeDesc = ({size}) => <div className="flex items-center gap-0.5"><Clock size={size}/><ArrowDown size={size-4} strokeWidth={3}/></div>;
const SortTimeAsc = ({size}) => <div className="flex items-center gap-0.5"><Clock size={size}/><ArrowUp size={size-4} strokeWidth={3}/></div>;
const SortAmountDesc = ({size}) => <div className="flex items-center gap-0.5"><DollarSign size={size}/><ArrowDown size={size-4} strokeWidth={3}/></div>;
const SortAmountAsc = ({size}) => <div className="flex items-center gap-0.5"><DollarSign size={size}/><ArrowUp size={size-4} strokeWidth={3}/></div>;

const IconSortDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        className={`w-12 h-12 flex items-center justify-center bg-card dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#3f3f3f] rounded-2xl transition-all cursor-pointer active:scale-95 focus:outline-none ${value ? 'text-primary dark:text-[#3b82f6] shadow-md border-primary/30 dark:border-primary/50' : 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-400 dark:text-slate-300'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {(() => {
          const selected = options.find(opt => opt.value === value);
          if (selected && selected.icon) {
            const Icon = selected.icon;
            return <Icon size={18} />;
          }
          return <Filter size={18} />;
        })()}
      </button>
      
      {isOpen && (
        <div className="absolute z-[60] top-[calc(100%+8px)] right-0 w-[160px] bg-card dark:bg-[#2f2f2f] text-card-foreground rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-md dark:shadow-[#1b1b1b] border border-slate-100 dark:border-[#3f3f3f] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {options.map((opt, idx) => {
              const IconOpt = opt.icon || Filter;
              return (
                <div
                  key={idx}
                  className={`w-full text-left px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-3 text-sm font-semibold
                    ${value === opt.value 
                      ? 'bg-primary/10 text-primary dark:text-[#3b82f6]' 
                      : 'hover:bg-slate-50 dark:hover:bg-[#3f3f3f] text-slate-600 dark:text-slate-300'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <IconOpt size={16} />
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const ExpensePage = () => {
  const { expenses, totalExpense, addExpense, updateExpense, deleteExpense, expenseCategories, addExpenseCategory, updateExpenseCategory, deleteExpenseCategory, currentDate } = useFinance();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [isCatEditOpen, setIsCatEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: '', color: '#1E56D1', icon: 'Tag' });
  const [showCatDeleteConfirm, setShowCatDeleteConfirm] = useState(false);
  const [searchExpense, setSearchExpense] = useState('');
  const [sortExpense, setSortExpense] = useState('');
  
  const d = new Date();
  const formattedDateInit = `${d.getDate().toString().padStart(2, '0')} ${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()]} ${d.getFullYear()}`;
  
  const initialFormState = {
    title: '',
    amount: '',
    category: expenseCategories[0]?.name || 'Lainnya',
    date: formattedDateInit,
    status: 'Pending',
    hex: expenseCategories[0]?.color || '#94A3B8'
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleAddClick = () => {
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const categoryOptions = expenseCategories.map(c => ({ value: c.name, label: c.name, color: c.color }));

  const [editingExpense, setEditingExpense] = useState(null);

  const actualExpense = expenses
    .filter(ex => ex.status === 'done')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // planned strictly means Upcoming (Belum Lunas) doesn't enter actual expense
  const pendingExpenses = expenses.filter(ex => ex.status === 'planned');
  const pendingTotal = pendingExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = pendingExpenses.length;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-4 shadow-2xl border border-slate-100 dark:border-[#3f3f3f] rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label || payload[0].name}</p>
          <p className="text-sm font-bold text-destructive">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    if (!user?.uid || !currentDate) return;

    const fetchTrendData = async () => {
      const keys = [];
      const now = new Date(currentDate);
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const monthName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()];
        keys.push({ id: `${yyyy}-${mm}`, name: monthName });
      }

      try {
        const trendResults = await Promise.all(keys.map(async (k) => {
          const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          if (k.id === currentKey) {
            const actualFromContext = expenses
              .filter(ex => ex.status === 'done')
              .reduce((acc, curr) => acc + curr.amount, 0);
            return { name: k.name, expense: actualFromContext };
          }

          const monthRef = doc(db, 'users', user.uid, 'months', k.id);
          const snap = await getDoc(monthRef);
          let expenseTotal = 0;
          if (snap.exists()) {
            const expArr = snap.data().expenses || [];
            expenseTotal = expArr
              .filter(i => {
                const s = (i.status || '').toLowerCase();
                return s === 'done';
              })
              .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);
          }
          return { name: k.name, expense: expenseTotal };
        }));
        setTrendData(trendResults);
      } catch (err) {
        console.error("Error fetching expense trend:", err);
      }
    };
    fetchTrendData();
  }, [user?.uid, currentDate, expenses]);

  const parseDateToMs = (dateStr) => {
    try {
      if (!dateStr) return 0;
      const parts = dateStr.split(' ');
      if (parts.length === 3) {
        let [dd, mmm, yyyy] = parts;
        let pMonthString = "Jan_Feb_Mar_Apr_Mei_Jun_Jul_Agu_Sep_Okt_Nov_Des";
        let mIndex = pMonthString.split("_").indexOf(mmm);
        if (mIndex !== -1) {
          return new Date(parseInt(yyyy), mIndex, parseInt(dd)).getTime();
        }
      }
      return new Date(dateStr).getTime() || 0;
    } catch {
      return 0;
    }
  };

  const getSortedItems = (items, sortMode) => {
    return [...items].sort((a, b) => {
      switch (sortMode) {
        case 'date-desc': return parseDateToMs(b.date) - parseDateToMs(a.date);
        case 'date-asc': return parseDateToMs(a.date) - parseDateToMs(b.date);
        case 'amount-desc': return (b.amount || 0) - (a.amount || 0);
        case 'amount-asc': return (a.amount || 0) - (b.amount || 0);
        default: return 0;
      }
    });
  };

  const filteredAndSortedExpenses = getSortedItems(
    expenses.filter(ex => ex.title.toLowerCase().includes(searchExpense.toLowerCase())),
    sortExpense
  );

  // Categories breakdown
  const categoryData = expenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.rawValue += curr.amount;
    } else {
      acc.push({ name: curr.category, rawValue: curr.amount, color: curr.hex });
    }
    return acc;
  }, []).map(cat => ({
    ...cat,
    value: Math.round((cat.rawValue / totalExpense) * 100)
  }));

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      status: expense.status,
      hex: expense.hex
    });
    setShowDeleteConfirm(false);
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const cat = expenseCategories.find(c => c.name === formData.category);
    updateExpense(editingExpense.id, {
      ...formData,
      amount: Number(formData.amount),
      hex: cat ? cat.color : '#94A3B8'
    });
    setIsEditModalOpen(false);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const cat = expenseCategories.find(c => c.name === formData.category);
    addExpense({
      ...formData,
      amount: Number(formData.amount),
      hex: cat ? cat.color : '#94A3B8',
      id: Date.now()
    });
    setIsModalOpen(false);
    const d = new Date();
    const formattedDateInit = `${d.getDate().toString().padStart(2, '0')} ${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()]} ${d.getFullYear()}`;
    setFormData({
      title: '',
      amount: '',
      category: expenseCategories[0]?.name || 'Lainnya',
      date: formattedDateInit,
      status: 'planned',
      hex: expenseCategories[0]?.color || '#94A3B8'
    });
  };

  return (
    <Layout title="Analisis Pengeluaran">

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <StatCard icon={Receipt} label="Total Perkiraan Pengeluaran" value={formatRupiah(totalExpense)} color="red" trend={-8.2} />
        <StatCard icon={AlertCircle} label="Tagihan Mendatang" value={formatRupiah(pendingTotal)} color="orange" subtext={`${pendingCount} Pending`} />
        <StatCard icon={CreditCard} label="Total Pengeluaran Aktual" value={formatRupiah(actualExpense)} color="purple" />
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Column: Expense Trend */}
          <div className="lg:col-span-2">
            <ChartCard title="Tren Pengeluaran Bulanan" className="h-[650px]">
              <div className="h-full w-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F87171" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94A3B8', fontSize: 12 }}
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                    <Area 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#F87171" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorExpense)" 
                      dot={{ r: 6, fill: '#fff', stroke: '#F87171', strokeWidth: 3 }}
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Right Column: Recent Expenses List */}
          <div className="lg:col-span-1">
            <ChartCard 
              title="Pengeluaran Terbaru"
              className="h-[650px]"
              extra={
                <button 
                  onClick={handleAddClick}
                  className="p-2 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-all active:scale-95 cursor-pointer"
                >
                  <Plus size={20} />
                </button>
              }
            >
              <div className="absolute inset-0 flex flex-col">
                <div className="flex gap-4 mb-8">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Cari pengeluaran..." 
                      value={searchExpense}
                      onChange={(e) => setSearchExpense(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#3f3f3f] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-destructive/20 transition-all dark:text-white"
                    />
                  </div>
                  <IconSortDropdown 
                    value={sortExpense}
                    onChange={setSortExpense}
                    options={[
                      { value: "date-desc", label: "Terbaru", icon: SortTimeDesc },
                      { value: "date-asc", label: "Terlama", icon: SortTimeAsc },
                      { value: "amount-desc", label: "Terbesar", icon: SortAmountDesc },
                      { value: "amount-asc", label: "Terkecil", icon: SortAmountAsc }
                    ]}
                  />
                </div>

                <div className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-4">
                  {filteredAndSortedExpenses.map((expense, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-5 group cursor-pointer hover:bg-slate-500/5 dark:hover:bg-slate-800/50 border border-transparent hover:border-destructive/50 dark:hover:border-destructive hover:shadow-md dark:hover:shadow-destructive/20 p-3 rounded-2xl transition-all"
                      onClick={() => handleEditClick(expense)}
                    >
                      <div className="p-4 rounded-2xl transition-all group-hover:scale-110 shadow-sm" style={{ backgroundColor: `${expense.hex}1A`, color: expense.hex }}>
                        {(() => {
                          const Icon = expense.icon || ReceiptText;
                          return <Icon size={20} />;
                        })()}
                      </div>
                      <div className="flex-1 border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-destructive transition-colors">{expense.title}</h4>
                          <span className="font-black text-destructive text-sm">{formatRupiah(expense.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">{expense.category}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-xs text-slate-400 font-medium">{expense.date}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${expense.status === 'done' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>
                            {expense.status === 'done' ? 'LUNAS' : 'BELUM LUNAS'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setIsTableOpen(true)}
                  className="w-full mt-6 py-4 text-xs font-black text-slate-400 hover:text-destructive transition-all uppercase tracking-[0.2em] border-t border-slate-100 cursor-pointer active:scale-95"
                >
                  Lihat Semua Transaksi
                </button>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Categories Breakdown */}
        <ChartCard 
          title="Kategorisasi Pengeluaran"
          extra={
            <button 
              onClick={() => setIsCatManagerOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-transparent text-[#1E56D1] dark:text-[#3b82f6] rounded-2xl font-bold border border-transparent hover:border-primary/50 dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-[#3b82f6]/10 transition-all cursor-pointer active:scale-95 text-sm whitespace-nowrap"
            >
              <Tag size={18} /> Kelola Kategori
            </button>
          }
        >
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 py-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-12 w-full max-w-5xl">
              {categoryData.map((cat, idx) => (
                <div key={idx} className="flex flex-col items-center gap-5 group">
                  <div className="h-32 w-32 relative transition-transform group-hover:scale-110 duration-300">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: cat.value }, { value: 100 - cat.value }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={60}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={0}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill={cat.color} />
                          <Cell fill="#F1F5F9" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-black text-slate-800">{cat.value}%</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{cat.name}</p>
                    <p className="text-sm font-bold text-slate-700">{formatRupiah(cat.rawValue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Add Expense Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tambah Pengeluaran"
      >
        <form onSubmit={handleAdd} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Pengeluaran</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-destructive/20 transition-all font-medium"
              placeholder="Contoh: Belanja Bulanan"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Jumlah</label>
              <input 
                type="number" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-destructive/20 transition-all font-bold text-destructive"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
              <CustomSelect 
                value={formData.category}
                onChange={(val) => setFormData({...formData, category: val})}
                options={categoryOptions}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tanggal</label>
              <CustomDatePicker 
                value={formData.date}
                onChange={(val) => setFormData({...formData, date: val})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
              <CustomSelect 
                value={formData.status}
                onChange={(val) => setFormData({...formData, status: val})}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
          <button 
            type="submit" 
            className="w-auto px-8 py-4 bg-destructive text-destructive-foreground rounded-full font-bold shadow-lg shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save size={18} />
            Simpan
          </button>
        </form>
      </Modal>

      {/* Edit Expense Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Pengeluaran"
      >
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Pengeluaran</label>
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-destructive/20 transition-all font-medium"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Jumlah</label>
              <input 
                type="number" 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-destructive/20 transition-all font-bold text-destructive"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
              <CustomSelect 
                value={formData.category}
                onChange={(val) => setFormData({...formData, category: val})}
                options={categoryOptions}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tanggal</label>
              <CustomDatePicker 
                value={formData.date}
                onChange={(val) => setFormData({...formData, date: val})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
              <CustomSelect 
                value={formData.status}
                onChange={(val) => setFormData({...formData, status: val})}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <button 
              type="submit" 
              className="w-auto px-10 py-4 bg-destructive text-destructive-foreground rounded-full font-bold shadow-lg shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={18} />
              Update
            </button>
            <div className="relative">
              {showDeleteConfirm && (
                <div className="absolute bottom-full right-0 mb-5 w-64 bg-card text-card-foreground rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 border border-slate-100 animate-in fade-in zoom-in slide-in-from-bottom-3 duration-200 z-50 origin-bottom-right">
                  <p className="text-lg font-bold text-slate-800 mb-6 text-center">Yakin mau hapus?</p>
                  <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 bg-destructive/10 text-destructive rounded-2xl text-sm font-black hover:bg-destructive/20 transition-all cursor-pointer"
                    >
                      Tidak
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        deleteExpense(editingExpense.id);
                        setIsEditModalOpen(false);
                        setShowDeleteConfirm(false);
                      }}
                      className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-destructive/20 cursor-pointer"
                    >
                      Ya
                    </button>
                  </div>
                  {/* Bubble Pointer */}
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card text-card-foreground border-b border-r border-slate-100 rotate-45" />
                </div>
              )}
              <button 
                type="button"
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className={`p-4 rounded-full transition-all cursor-pointer active:scale-95 ${showDeleteConfirm ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 scale-110' : 'bg-card text-card-foreground border border-slate-200 text-destructive hover:bg-destructive/10 hover:border-destructive/30 dark:hover:border-destructive shadow-sm'}`}
              >
                <Trash2 size={22} />
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Fullscreen Table View */}
      <FullscreenTable 
        isOpen={isTableOpen}
        onClose={() => setIsTableOpen(false)}
        data={expenses}
        title="Daftar Semua Pengeluaran"
        onEditItem={(item) => {
          handleEditClick(item);
        }}
        onAddItem={handleAddClick}
        addButtonText="Tambah Pengeluaran"
        extraAction={
          <button 
            onClick={() => setIsCatManagerOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-card dark:bg-[#1e1e1e] text-[#1E56D1] dark:text-[#3b82f6] border border-slate-200 dark:border-[#3f3f3f] rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all shadow-sm cursor-pointer active:scale-95 text-sm whitespace-nowrap"
          >
            <Tag size={18} /> Kelola Kategori
          </button>
        }
      />

      {/* Category Manager Modal */}
      <Modal isOpen={isCatManagerOpen} onClose={() => setIsCatManagerOpen(false)} title="Kelola Kategori">
        <button 
          onClick={() => { setEditingCategory(null); setCatFormData({name: '', color: '#1E56D1', icon: 'Tag'}); setIsCatEditOpen(true); }}
          className="bg-primary hover:opacity-90 text-primary-foreground font-bold py-3 px-6 text-sm rounded-full inline-flex items-center gap-2 hover:opacity-90 transition-all cursor-pointer shadow-md shadow-primary/30"
        >
          <Plus size={18} /> Tambah Kategori
        </button>

        <div className="mt-6 flex flex-col gap-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {expenseCategories.map(cat => (
            <div key={cat.id} className="flex justify-between items-center bg-card text-card-foreground border border-slate-100 rounded-[28px] p-6 shadow-sm group" style={{ borderLeft: `10px solid ${cat.color}` }}>
              <div className="pl-1">
                <p className="font-bold text-slate-800 flex items-center gap-2">
                  {cat.name} {cat.isDefault && <span className="text-slate-400 font-normal text-xs">(Default)</span>}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{cat.color}</span>
                  {cat.icon && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{cat.icon}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setEditingCategory(cat); setCatFormData({name: cat.name, color: cat.color, icon: cat.icon || 'Tag'}); setIsCatEditOpen(true); setShowDeleteConfirm(false); }}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-primary hover:bg-primary/10 transition-colors border border-slate-100 cursor-pointer"
                >
                  <PenLine size={16} />
                </button>
                {!cat.isDefault && (
                  <button 
                    onClick={() => deleteExpenseCategory(cat.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 text-destructive hover:bg-destructive/10 transition-colors border border-slate-100 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Edit/Add Category Modal */}
      <Modal isOpen={isCatEditOpen} onClose={() => setIsCatEditOpen(false)} title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (editingCategory) {
            updateExpenseCategory(editingCategory.id, catFormData);
          } else {
            addExpenseCategory({ name: catFormData.name, color: catFormData.color, icon: catFormData.icon });
          }
          setIsCatEditOpen(false);
        }} className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-500 mb-2 block">{editingCategory ? `Edit kategori: ${editingCategory.name}` : 'Buat kategori baru'}</span>
            <input 
              type="text" 
              required 
              value={catFormData.name} 
              onChange={e => setCatFormData({...catFormData, name: e.target.value})} 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-medium" 
            />
          </div>
          
          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-800">Pilih icon</label>
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex gap-4 overflow-x-auto custom-scrollbar">
              {Object.keys(IconMap).map(iconName => {
                const IconComponent = IconMap[iconName];
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setCatFormData({...catFormData, icon: iconName})}
                    className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl transition-all cursor-pointer ${catFormData.icon === iconName ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'}`}
                  >
                    <IconComponent size={20} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-800">Pilih warna</label>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex gap-6 items-start">
              <DeferredColorPicker 
                value={catFormData.color} 
                onChange={(color) => setCatFormData({...catFormData, color})} 
              />
              <div className="flex flex-wrap gap-3 py-2 h-[110px] pb-4 overflow-y-auto pr-2 custom-scrollbar">
                {['#FF647C', '#4BC0C0', '#94A3B8', '#B190FF', '#FFD363', '#1E56D1', '#F59E0B', '#10B981', '#E91E63', '#2196F3', '#F44336', '#FF9800', '#9C27B0', '#4CAF50', '#795548', '#FF00FF', '#646464', '#008105', '#CF4D5D'].map(color => (
                  <button 
                    type="button" 
                    key={color} 
                    onClick={() => setCatFormData({...catFormData, color})} 
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95 ${catFormData.color === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`} 
                    style={{ backgroundColor: color }} 
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-4">
              <button type="submit" className="px-8 py-3 bg-primary hover:opacity-90 text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all cursor-pointer">
                Simpan
              </button>
              <button type="button" onClick={() => setIsCatEditOpen(false)} className="px-8 py-3 bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 active:scale-95 transition-all cursor-pointer border border-slate-200">
                Batal
              </button>
            </div>
            {editingCategory && !editingCategory.isDefault && (
              <div className="relative">
                {showDeleteConfirm && (
                  <div className="absolute bottom-full right-0 mb-5 w-64 bg-card text-card-foreground rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-6 border border-slate-100 animate-in fade-in zoom-in slide-in-from-bottom-3 duration-200 z-50 origin-bottom-right">
                    <p className="text-lg font-bold text-slate-800 mb-6 text-center">Yakin mau hapus?</p>
                    <div className="flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 py-3 bg-destructive/10 text-destructive rounded-2xl text-sm font-black hover:bg-destructive/20 transition-all cursor-pointer"
                      >
                        Tidak
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          deleteExpenseCategory(editingCategory.id);
                          setIsCatEditOpen(false);
                          setShowDeleteConfirm(false);
                        }}
                        className="flex-1 py-3 bg-destructive text-destructive-foreground rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-destructive/20 cursor-pointer"
                      >
                        Ya
                      </button>
                    </div>
                    {/* Bubble Pointer */}
                    <div className="absolute -bottom-2 right-6 w-4 h-4 bg-card text-card-foreground border-b border-r border-slate-100 rotate-45" />
                  </div>
                )}
                <button 
                  type="button"
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className={`p-3 rounded-full transition-all cursor-pointer active:scale-95 ${showDeleteConfirm ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 scale-110' : 'bg-card text-card-foreground border border-slate-200 text-destructive hover:bg-destructive/10 hover:border-destructive/30 dark:hover:border-destructive shadow-sm'}`}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </Layout>
  );
};

export default ExpensePage;
