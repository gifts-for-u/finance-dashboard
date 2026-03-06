import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { StatCard, ChartCard } from '../components/Cards';
import Modal from '../components/Modal';
import { formatRupiah } from '../utils/formatter';
import { 
  Wallet, 
  Receipt, 
  CircleDollarSign, 
  CreditCard, 
  PiggyBank, 
  BarChart3,
  Search,
  Filter,
  Plus,
  Trash2,
  CheckCircle2,
  MoreVertical,
  Settings,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Clock,
  ArrowDown,
  ArrowUp,
  Banknote
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useFinance } from '../context/FinanceContext';

const SortTimeDesc = ({size}) => <div className="flex items-center gap-0.5"><Clock size={size}/><ArrowDown size={size-4} strokeWidth={3}/></div>;
const SortTimeAsc = ({size}) => <div className="flex items-center gap-0.5"><Clock size={size}/><ArrowUp size={size-4} strokeWidth={3}/></div>;
const SortAmountDesc = ({size}) => <div className="flex items-center gap-0.5"><Banknote size={size}/><ArrowDown size={size-4} strokeWidth={3}/></div>;
const SortAmountAsc = ({size}) => <div className="flex items-center gap-0.5"><Banknote size={size}/><ArrowUp size={size-4} strokeWidth={3}/></div>;

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
        className={`w-12 h-12 flex flex-shrink-0 items-center justify-center bg-card dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#3f3f3f] rounded-2xl transition-all cursor-pointer active:scale-95 focus:outline-none ${value ? 'text-primary dark:text-[#3b82f6] shadow-md border-primary/30 dark:border-primary/50' : 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-400 dark:text-slate-300'}`}
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

const DashboardPage = () => {
  const navigate = useNavigate();
  const { incomes, totalIncome, expenses, totalExpense, addIncome, deleteIncome, addExpense, deleteExpense, toggleExpenseStatus, budgets } = useFinance();
  const [searchIncome, setSearchIncome] = useState('');
  const [searchExpense, setSearchExpense] = useState('');
  const [sortIncome, setSortIncome] = useState('');
  const [sortExpense, setSortExpense] = useState('');
  
  // Modal States
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  
  // Form States
  const [newIncome, setNewIncome] = useState({ title: '', amount: '', date: 'Today' });
  const [newExpense, setNewExpense] = useState({ title: '', category: 'Lainnya', amount: '', date: 'Today', hex: '#94A3B8' });

  const getSortedItems = (items, sortType) => {
    return [...items].sort((a, b) => {
      if (sortType === 'amount-desc') return b.amount - a.amount;
      if (sortType === 'amount-asc') return a.amount - b.amount;
      if (sortType === 'date-asc') return a.id - b.id;
      return b.id - a.id; // date-desc (default)
    });
  };

  // Calculate Actual Expenses (Paid/Done + Unpaid only, exclude Pending)
  const actualExpense = expenses
    .filter(ex => ex.status === 'done')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Calculate Actual Income (Paid/Done only)
  const actualIncome = incomes
    .filter(inc => inc.status === 'Paid' || inc.status === 'Done')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseData = expenses.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ 
        name: curr.category, 
        value: curr.amount, 
        color: curr.hex 
      });
    }
    return acc;
  }, []);

  const categoryData = expenses.reduce((acc, curr) => {
    const catName = curr.categoryName || curr.category;
    const existing = acc.find(item => item.name === catName);
    if (existing) {
      existing.rawValue += curr.amount;
    } else {
      acc.push({ name: catName, rawValue: curr.amount, color: curr.hex });
    }
    return acc;
  }, []).map(cat => ({
    ...cat,
    value: Math.round((cat.rawValue / (totalExpense || 1)) * 100)
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-4 shadow-2xl border border-slate-100 rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-sm font-bold text-primary dark:text-[#3b82f6]">{formatRupiah(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  // Derive Savings Rate
  const totalSavingsExpense = expenses
    .filter(ex => {
      const catId = (ex.categoryId || '').toLowerCase();
      const catName = (ex.categoryName || ex.category || '').toLowerCase();
      return catId === 'savings' || catName.includes('tabungan') || catId.includes('tabungan');
    })
    .reduce((acc, curr) => acc + curr.amount, 0);
  
  const rawSavingsRate = totalIncome > 0 ? (totalSavingsExpense / totalIncome) * 100 : null;
  const savingsRateDisplay = rawSavingsRate !== null ? `${rawSavingsRate.toFixed(0)}%` : '—';
  
  let savingsRateColor = 'slate';
  if (rawSavingsRate !== null) {
    if (rawSavingsRate >= 20) savingsRateColor = 'green';
    else if (rawSavingsRate >= 10) savingsRateColor = 'orange';
    else if (rawSavingsRate >= 0) savingsRateColor = 'blue';
    else savingsRateColor = 'red';
  }

  // Derive budget progress from actual data
  const budgetProgress = budgets.map(budget => {
    const actualSpent = expenses
      .filter(ex => ex.categoryId === budget.category && ex.status === 'done')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const plannedSpent = expenses
      .filter(ex => ex.categoryId === budget.category)
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const percent = budget.limit ? Math.round((actualSpent / budget.limit) * 100) : 0;
    let status = 'AMAN';
    let statusColor = 'text-green-600';
    if (percent > 100) {
      status = 'MELEBIHI BATAS';
      statusColor = 'text-destructive';
    } else if (percent > 80) {
      status = 'WASPADA';
      statusColor = 'text-orange-600';
    }

    return {
      title: budget.name,
      target: budget.limit,
      actual: actualSpent,
      plan: plannedSpent,
      percent: percent,
      status: status,
      statusColor: statusColor,
      barColor: budget.color,
      overAmount: budget.limit && actualSpent > budget.limit ? actualSpent - budget.limit : null
    };
  });

  return (
    <Layout title="Finance Dashboard Overview">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        <StatCard 
          icon={Wallet} 
          label="Total Perkiraan Pemasukan" 
          value={formatRupiah(totalIncome)} 
          color="blue" 
          infoText="Jumlah seluruh pemasukan yang sudah kamu catat untuk bulan ini." 
        />
        <StatCard 
          icon={Receipt} 
          label="Total Perkiraan Pengeluaran" 
          value={formatRupiah(totalExpense)} 
          color="purple" 
          infoText="Total semua pengeluaran yang direncanakan atau sudah diinput tanpa melihat status selesai." 
        />
        <StatCard 
          icon={CreditCard} 
          label="Total Pengeluaran Aktual" 
          value={formatRupiah(actualExpense)} 
          color="red" 
          infoText="Total pengeluaran yang sudah ditandai selesai (status &quot;LUNAS&quot;) pada bulan ini." 
        />
        <StatCard 
          icon={CircleDollarSign} 
          label="Saldo Aktual" 
          value={formatRupiah(actualIncome - actualExpense)} 
          color="slate" 
          infoText="Selisih antara total pemasukan dan pengeluaran aktual—menunjukkan uang yang benar-benar tersisa saat ini."
        />
        <StatCard 
          icon={PiggyBank} 
          label="Perkiraan Sisa Uang Bulan Ini" 
          value={formatRupiah(totalIncome - totalExpense)} 
          color="teal" 
          infoText="Perkiraan sisa uang jika semua pengeluaran yang direncanakan terealisasi (pemasukan dikurangi seluruh pengeluaran)."
        />
        <StatCard 
          icon={BarChart3} 
          label="Rasio Tabungan" 
          value={savingsRateDisplay} 
          color={savingsRateColor} 
          infoText="Persentase pemasukan yang dialokasikan ke kategori Tabungan dibandingkan total pemasukan bulan ini."
        />
      </div>

      <div className="space-y-8 mb-8">
        {/* Expenditure Visualization - Full Width Top */}
        <ChartCard title="Visualisasi Pengeluaran" className="w-full">
          <div className="h-[300px] md:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="75%"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Income List */}
          <ChartCard 
            title="Daftar Pemasukan Terbaru"
          >
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari pemasukan..." 
                value={searchIncome}
                onChange={(e) => setSearchIncome(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#3f3f3f] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all dark:text-white"
              />
            </div>
            <IconSortDropdown 
              value={sortIncome}
              onChange={setSortIncome}
              options={[
                { value: "date-desc", label: "Terbaru", icon: SortTimeDesc },
                { value: "date-asc", label: "Terlama", icon: SortTimeAsc },
                { value: "amount-desc", label: "Terbesar", icon: SortAmountDesc },
                { value: "amount-asc", label: "Terkecil", icon: SortAmountAsc }
              ]}
            />
          </div>

          <div className="space-y-3 mb-6">
            {getSortedItems(incomes.filter(inc => inc.title.toLowerCase().includes(searchIncome.toLowerCase())), sortIncome).slice(0, 5).map((inc, idx) => (
              <div key={inc.id} className="bg-card dark:bg-[#1e1e1e] p-3 sm:p-4 rounded-2xl flex justify-between items-center group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-[#3f3f3f] hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 dark:hover:border-primary/50">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl shadow-sm flex items-center justify-center transition-all group-hover:scale-110 ${inc.iconColor || 'bg-primary/10 dark:bg-[#3b82f6]/10 text-primary dark:text-[#3b82f6]'}`}>
                    {(() => {
                      const Icon = inc.icon || Wallet;
                      return <Icon size={18} />;
                    })()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{inc.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{inc.date} • {inc.type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="font-bold text-primary dark:text-[#3b82f6]">{formatRupiah(inc.amount)}</span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider mt-1 bg-green-500/10 text-green-500">{inc.status || 'PAID'}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteIncome(inc.id); }}
                    className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-destructive transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
            <button 
              onClick={() => navigate('/income')}
              className="w-full mt-auto py-3 text-sm font-bold text-slate-400 hover:text-primary transition-all border-t border-slate-100 pt-6 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Lihat Semua Pemasukan <ChevronRight size={14} />
            </button>
          </ChartCard>

          {/* Expenditure List */}
          <ChartCard 
            title="Daftar Pengeluaran Terbaru"
          >
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
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

          <div className="space-y-3 mb-6">
            {getSortedItems(expenses.filter(ex => ex.title.toLowerCase().includes(searchExpense.toLowerCase())), sortExpense).slice(0, 5).map((ex, idx) => (
                <div key={ex.id} className="bg-card dark:bg-[#1e1e1e] p-3 sm:p-4 rounded-2xl flex justify-between items-center group cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-100 dark:border-[#3f3f3f] hover:border-destructive/30 hover:bg-destructive/5 dark:hover:bg-[#6e0a0a]/15 dark:hover:border-destructive/50">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleExpenseStatus(ex.id); }}
                      className="p-2.5 sm:p-3 rounded-xl shadow-sm flex items-center justify-center transition-all cursor-pointer active:scale-95 hover:scale-105"
                      style={{ backgroundColor: `${ex.hex}1A`, color: ex.hex }}
                    >
                      {(() => {
                        const Icon = ex.icon || Receipt;
                        return <Icon size={18} />;
                      })()}
                    </button>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{ex.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{ex.date} • {ex.categoryName || ex.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-destructive">{formatRupiah(ex.amount)}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider mt-1 ${ex.status === 'done' ? 'bg-green-500/10 text-green-500' : 'bg-slate-500/10 text-slate-500'}`}>{ex.status === 'done' ? 'LUNAS' : 'BELUM LUNAS'}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteExpense(ex.id); }}
                      className="opacity-100 md:opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-destructive transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/expenses')}
              className="w-full mt-auto py-3 text-sm font-bold text-slate-400 hover:text-destructive transition-all border-t border-slate-100 pt-6 uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              Lihat Semua Transaksi <ChevronRight size={14} />
            </button>
          </ChartCard>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="mb-8">
        <ChartCard 
          title="Kategorisasi Pengeluaran"
        >
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 py-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 w-full max-w-5xl">
            {categoryData.length > 0 ? categoryData.map((cat, idx) => (
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
                        <Cell fill={cat.color || '#94A3B8'} />
                        <Cell fill="#F1F5F9" className="dark:fill-[#2f2f2f]" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-slate-800 dark:text-white">{cat.value}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{cat.name}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatRupiah(cat.rawValue)}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-2 md:col-span-5 text-center text-slate-400 py-10 font-medium">Bulan ini belum ada data pengeluaran</div>
            )}
          </div>
        </div>
        </ChartCard>
      </div>

      {/* Budget Progress Section */}
      <ChartCard>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-bold text-slate-800">Progres Budget</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/budget')}
              className="bg-card text-card-foreground border border-slate-100 text-slate-600 px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Settings size={18} />
              Kelola Budget
            </button>
          </div>
        </div>

        <div className="space-y-10">
          {budgetProgress.map((item, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.barColor.startsWith('bg-') ? item.barColor : ''}`} style={{ backgroundColor: item.barColor.startsWith('bg-') ? undefined : item.barColor }} />
                  <h4 className="font-bold text-slate-700 text-lg">{item.title}</h4>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target</p>
                  <p className="text-sm font-medium text-slate-600">{item.target ? formatRupiah(item.target) : 'Total ada'}</p>
                </div>
              </div>

              <div className="relative">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.barColor.startsWith('bg-') ? item.barColor : ''} transition-all duration-1000`} 
                    style={{ 
                      width: `${Math.min(item.percent, 100)}%`, 
                      backgroundColor: item.barColor.startsWith('bg-') ? undefined : item.barColor 
                    }} 
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="text-xs">
                    <span className="text-slate-400">Actual: </span>
                    <span className="font-bold text-slate-700">{formatRupiah(item.actual)}</span>
                  </div>
                  <div className="text-xs border-l border-slate-200 pl-4">
                    <span className="text-slate-400">Rencana: </span>
                    <span className="font-bold text-slate-700">{formatRupiah(item.plan)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-black tracking-widest uppercase ${item.statusColor}`}>{item.status}</p>
                  {item.overAmount && <p className="text-xs font-bold text-destructive mt-0.5">Melebihi {formatRupiah(item.overAmount)}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Income Modal */}
      <Modal 
        isOpen={isIncomeModalOpen} 
        onClose={() => setIsIncomeModalOpen(false)} 
        title="Tambah Pemasukan"
      >
        <form onSubmit={(e) => { e.preventDefault(); addIncome({ ...newIncome, amount: Number(newIncome.amount), status: 'Paid', type: 'Other', color: 'bg-primary/10' }); setIsIncomeModalOpen(false); setNewIncome({ title: '', amount: '', date: 'Today' }); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Judul Pemasukan</label>
            <input 
              type="text" 
              placeholder="Contoh: Gaji Bulanan"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={newIncome.title}
              onChange={(e) => setNewIncome({...newIncome, title: e.target.value})}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah (Rp)</label>
            <input 
              type="number" 
              placeholder="0"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={newIncome.amount}
              onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-primary-foreground rounded-[20px] font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all">
            Simpan Pemasukan
          </button>
        </form>
      </Modal>

      {/* Expense Modal */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title="Tambah Pengeluaran"
      >
        <form onSubmit={(e) => { e.preventDefault(); addExpense({ ...newExpense, amount: Number(newExpense.amount), status: 'planned', color: 'bg-destructive/10' }); setIsExpenseModalOpen(false); setNewExpense({ title: '', category: 'Lainnya', amount: '', date: 'Today', hex: '#94A3B8' }); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nama Barang/Jasa</label>
            <input 
              type="text" 
              placeholder="Contoh: Belanja Bulanan"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-destructive/20"
              value={newExpense.title}
              onChange={(e) => setNewExpense({...newExpense, title: e.target.value})}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kategori</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-destructive/20"
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
              >
                <option>Kebutuhan Dapur</option>
                <option>Kebutuhan Rumah</option>
                <option>Transportasi</option>
                <option>Langganan</option>
                <option>Lainnya</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jumlah (Rp)</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] focus:outline-none focus:ring-2 focus:ring-destructive/20"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                required
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-destructive text-destructive-foreground rounded-[20px] font-bold shadow-lg shadow-destructive/20 hover:opacity-90 active:scale-95 transition-all">
            Simpan Pengeluaran
          </button>
        </form>
      </Modal>
    </Layout>
  );
};

export default DashboardPage;
