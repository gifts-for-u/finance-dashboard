import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { StatCard, ChartCard } from '../components/Cards';
import { formatRupiah } from '../utils/formatter';
import { 
  PieChart as PieChartIcon, 
  Target, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  Home,
  Utensils,
  Play,
  Car,
  ChevronDown,
  MoreVertical,
  Save
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { useFinance } from '../context/FinanceContext';
import Modal from '../components/Modal';
import { CustomSelect } from '../components/CustomInputs';

const BudgetPage = () => {
  const { budgets, expenses, addBudget, expenseCategories, currentDate } = useFinance();
  const { user } = useAuth();
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetFormData, setBudgetFormData] = useState({ category: '', amount: '' });

  useEffect(() => {
    if (expenseCategories.length > 0 && !budgetFormData.category) {
      setBudgetFormData(prev => ({ ...prev, category: expenseCategories[0].name }));
    }
  }, [expenseCategories]);

  const handleAddBudget = async (e) => {
    e.preventDefault();
    if (!budgetFormData.category || !budgetFormData.amount) return;
    await addBudget({ category: budgetFormData.category, limit: budgetFormData.amount });
    setIsBudgetModalOpen(false);
    setBudgetFormData({ category: expenseCategories[0]?.name || '', amount: '' });
  };

  const categoryOptions = expenseCategories.map(c => ({ value: c.name, label: c.name }));

  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    if (!user?.uid || !currentDate) return;

    const fetchHistoryData = async () => {
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
        const historyResults = await Promise.all(keys.map(async (k) => {
          const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          
          if (k.id === currentKey) {
            // For current month, use values from context
            const totalTarget = budgets.reduce((acc, curr) => acc + curr.limit, 0);
            const totalActual = budgets.reduce((acc, budget) => {
               const actualSpent = expenses
                .filter(ex => ex.categoryId === budget.category && ex.status === 'done')
                .reduce((a, c) => a + c.amount, 0);
               return acc + actualSpent;
            }, 0);
            return { name: k.name, target: totalTarget, actual: totalActual };
          }

          const monthRef = doc(db, 'users', user.uid, 'months', k.id);
          const snap = await getDoc(monthRef);
          let targetTotal = 0;
          let actualTotal = 0;
          
          if (snap.exists()) {
            const data = snap.data();
            const budgetObj = data.budgets || {};
            targetTotal = Object.values(budgetObj).reduce((sum, limit) => sum + Number(limit), 0);
            
            const expArr = data.expenses || [];
            actualTotal = expArr
              .filter(i => {
                const s = (i.status || '').toLowerCase();
                const isPaid = s === 'done';
                const limit = Number(budgetObj[i.category] || 0);
                return isPaid && limit > 0;
              })
              .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);
          }
          return { name: k.name, target: targetTotal, actual: actualTotal };
        }));
        setHistoryData(historyResults);
      } catch (err) {
        console.error("Error fetching budget history:", err);
      }
    };
    fetchHistoryData();
  }, [user, currentDate, budgets, expenses]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-4 shadow-2xl border border-slate-100 dark:border-[#3f3f3f] rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex flex-col mb-2 last:mb-0">
              <span className="text-[10px] uppercase font-bold" style={{ color: entry.color, opacity: 0.8 }}>{entry.name}</span>
              <span className="text-sm font-bold" style={{ color: entry.color }}>
                {formatRupiah(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const derivedCategories = budgets.map(budget => {
    const actualSpent = expenses
      .filter(ex => ex.categoryId === budget.category && ex.status === 'done')
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    const percent = budget.limit ? Math.round((actualSpent / budget.limit) * 100) : 0;
    let status = 'AMAN';
    let badge = 'bg-green-500/10 text-green-600 dark:text-green-500';
    let color = budget.color;

    if (percent > 100) {
      status = 'BERLEBIH';
      badge = 'bg-destructive/20 text-destructive';
      color = 'bg-destructive';
    } else if (percent > 80) {
      status = 'HAMPIR HABIS';
      badge = 'bg-orange-500/10 text-orange-600 dark:text-orange-500';
      color = 'bg-orange-400';
    }

    return {
      name: budget.name,
      spent: actualSpent,
      limit: budget.limit,
      percent: percent,
      status: status,
      badge: badge,
      color: color,
      icon: budget.icon,
      iconColor: 'text-primary bg-primary/10' // Skip trying to text-fy random hex codes, use fallback generic styling for now until icon discussion
    };
  });

  const totalBudgetLimit = budgets.reduce((acc, curr) => acc + curr.limit, 0);
  const totalActualSpent = derivedCategories.reduce((acc, curr) => acc + curr.spent, 0);
  const overallPercent = totalBudgetLimit ? Math.round((totalActualSpent / totalBudgetLimit) * 100) : 0;

  const gaugeData = [
    { name: 'Used', value: overallPercent, color: '#1E56D1' },
    { name: 'Remaining', value: Math.max(0, 100 - overallPercent), color: '#F1F5F9' },
  ];

  return (
    <Layout title="Ikhtisar Anggaran">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-8 mb-8 relative">
        <StatCard icon={PieChartIcon} label="Total Anggaran" value={formatRupiah(totalBudgetLimit)} color="blue" subtext="Aktif: Okt 2023" infoText="Total alokasi dana yang Anda anggarkan untuk membatasi pengeluaran pada bulan ini." />
        <StatCard icon={Target} label="Terpakai Bulan Ini" value={formatRupiah(totalActualSpent)} color="red" subtext={`${overallPercent}% Terpakai`} infoText="Jumlah pengeluaran yang sudah terjadi dari seluruh kategori yang dianggarkan (berstatus &quot;LUNAS&quot;)." />
        <StatCard icon={ShieldCheck} label="Sisa Anggaran" value={formatRupiah(Math.max(0, totalBudgetLimit - totalActualSpent))} color="green" subtext={`Status: ${overallPercent > 100 ? 'Overlimit' : 'Aman'}`} infoText="Sisa saldo atau sisa batas dari anggaran yang masih bisa digunakan pada bulan ini." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Budget History Chart */}
        <ChartCard title="Riwayat Anggaran" className="lg:col-span-2">
          <div className="flex items-center gap-4 absolute right-8 top-8">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#689ff2]" />
              <span className="text-[10px] font-bold text-[#689ff2] uppercase">Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-primary hover:opacity-90" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Realisasi</span>
            </div>
          </div>
          <div className="h-[400px] w-full pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}jt`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar name="Target" dataKey="target" fill="#689ff2" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar name="Realisasi" dataKey="actual" fill="#1E56D1" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Budget Health Gauge */}
        <ChartCard title="Kesehatan Anggaran">
          <div className="flex flex-col items-center justify-center h-full relative">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="70%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={110}
                    outerRadius={150}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <p className="text-4xl font-black text-slate-800">{overallPercent}%</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Terpakai</p>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 leading-relaxed px-4 max-w-[280px] mb-6">
              Anda telah menggunakan <span className="font-bold text-slate-800">{overallPercent}%</span> dari total anggaran bulan ini. Pengeluaran Anda <span className={`${overallPercent > 100 ? 'text-destructive' : 'text-green-600'} font-bold`}>{overallPercent > 100 ? 'melebihi batas' : 'masih dalam batas aman'}</span>.
            </p>
          </div>
        </ChartCard>
      </div>

      {/* Allocation List */}
      <ChartCard>
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h3 className="text-2xl font-bold text-slate-800">Alokasi Anggaran per Kategori</h3>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari kategori..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button 
              onClick={() => setIsBudgetModalOpen(true)}
              className="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 whitespace-nowrap cursor-pointer active:scale-95"
            >
              <Plus size={18} />
              Anggaran Baru
            </button>
            <button className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-500">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {derivedCategories.map((cat, idx) => (
            <div key={idx} className="bg-slate-50/50 p-6 rounded-[32px] border border-slate-100/50 group hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${cat.iconColor} transition-transform group-hover:scale-110 shadow-sm`}>
                    {(() => {
                      const Icon = cat.icon;
                      return <Icon size={20} />;
                    })()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{cat.name}</h4>
                    <p className="text-xs text-slate-400 font-medium">{formatRupiah(cat.spent)} / {formatRupiah(cat.limit)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${cat.badge}`}>
                    {cat.percent}% - {cat.status}
                  </span>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
              
              <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full ${cat.color.startsWith('bg-') ? cat.color : ''} transition-all duration-1000`} 
                  style={{ 
                    width: `${Math.min(cat.percent, 100)}%`, 
                    backgroundColor: cat.color.startsWith('bg-') ? undefined : cat.color 
                  }} 
                />
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-10 py-2 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary transition-all">
          Lihat Semua Kategori
          <ChevronDown size={18} />
        </button>
      </ChartCard>

      {/* Add Budget Modal */}
      <Modal 
        isOpen={isBudgetModalOpen} 
        onClose={() => setIsBudgetModalOpen(false)} 
        title="Tambah Anggaran"
      >
        <form onSubmit={handleAddBudget} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
            <CustomSelect 
              value={budgetFormData.category}
              onChange={(val) => setBudgetFormData({...budgetFormData, category: val})}
              options={categoryOptions}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Jumlah Anggaran</label>
            <input 
              type="number" 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold text-primary"
              placeholder="0"
              value={budgetFormData.amount}
              onChange={(e) => setBudgetFormData({...budgetFormData, amount: e.target.value})}
              required
            />
          </div>
          
          <div className="pt-2">
            <button 
              type="submit" 
              className="w-auto px-10 py-4 bg-primary text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save size={18} />
              Simpan
            </button>
          </div>
        </form>
      </Modal>

    </Layout>
  );
};

export default BudgetPage;
