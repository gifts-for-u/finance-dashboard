import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { StatCard, ChartCard } from '../components/Cards';
import Modal from '../components/Modal';
import FullscreenTable from '../components/FullscreenTable';
import { formatRupiah } from '../utils/formatter';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  Search, 
  Trash2,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  Banknote,
  MoreVertical,
  Briefcase,
  Layers,
  BarChart,
  Gift,
  Plus,
  Save
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { CustomDatePicker, CustomSelect } from '../components/CustomInputs';

const STATUS_OPTIONS = [
  { value: 'Paid', label: 'Sudah Dibayar' },
  { value: 'Pending', label: 'Belum Dibayar' }
];

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

const IncomePage = () => {
  const { incomes, totalIncome, addIncome, updateIncome, deleteIncome, currentDate } = useFinance();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchIncome, setSearchIncome] = useState('');
  const [sortIncome, setSortIncome] = useState('');
  
  const d = new Date();
  const formattedDateInit = `${d.getDate().toString().padStart(2, '0')} ${["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()]} ${d.getFullYear()}`;
  
  const initialFormState = {
    amount: '',
    source: '',
    description: '',
    date: formattedDateInit
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editFormData, setEditFormData] = useState({
    id: null,
    amount: '',
    source: '',
    description: '',
    date: ''
  });

  const handleAddClick = () => {
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEditClick = (inc) => {
    setEditFormData({
      id: inc.id,
      amount: inc.amount.toString(),
      source: inc.type || '',
      description: inc.title || '',
      date: inc.fullDate || inc.date || formattedDateInit
    });
    setShowDeleteConfirm(false);
    setIsEditModalOpen(true);
  };

  const actualIncome = incomes
    .filter(inc => inc.status === 'Paid' || inc.status === 'Done')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingIncomes = incomes.filter(inc => inc.status === 'Pending');
  const pendingTotal = pendingIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = pendingIncomes.length;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-4 shadow-2xl border border-slate-100 dark:border-[#3f3f3f] rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label || payload[0].name}</p>
          <p className="text-sm font-bold text-primary dark:text-[#3b82f6]">{formatRupiah(payload[0].value)}</p>
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
          
          // Use real-time local state for the currently active month
          if (k.id === currentKey) {
            const actualFromContext = incomes
              .filter(inc => inc.status === 'Paid' || inc.status === 'Done')
              .reduce((acc, curr) => acc + curr.amount, 0);
            return { name: k.name, income: actualFromContext };
          }

          // Fetch historical months
          const monthRef = doc(db, 'users', user.uid, 'months', k.id);
          const snap = await getDoc(monthRef);
          let incomeTotal = 0;
          if (snap.exists()) {
            const incArr = snap.data().incomes || [];
            incomeTotal = incArr
              .filter(i => (i.status || '').toLowerCase() !== 'pending')
              .reduce((sum, curr) => sum + Number(curr.amount || 0), 0);
          }
          return { name: k.name, income: incomeTotal };
        }));
        
        setTrendData(trendResults);
      } catch (err) {
        console.error("Error fetching trend:", err);
      }
    };

    fetchTrendData();
  }, [user, currentDate, incomes]);

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

  const filteredAndSortedIncomes = getSortedItems(
    incomes.filter(inc => (inc.title || '').toLowerCase().includes(searchIncome.toLowerCase())),
    sortIncome
  );

  const sourceTotals = incomes.reduce((acc, curr) => {
    const key = curr.type || 'Other';
    acc[key] = (acc[key] || 0) + curr.amount;
    return acc;
  }, {});

  const total = Object.values(sourceTotals).reduce((a, b) => a + b, 0);

  const sourceData = Object.entries(sourceTotals).map(([name, amount], index) => {
    const colors = ['#4F46E5', '#818CF8', '#34D399', '#F472B6', '#10B981', '#3B82F6'];
    return {
      name,
      value: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: colors[index % colors.length],
      sub: formatRupiah(amount)
    };
  });

  return (
    <Layout title="Income Overview">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-8 mb-8 relative">
        <StatCard icon={Wallet} label="Total Perkiraan Pemasukan" value={formatRupiah(totalIncome)} color="blue" trend={12.5} infoText="Jumlah seluruh pemasukan yang sudah dicatat, terlepas dari apakah uangnya sudah diterima atau belum." />
        <StatCard icon={Clock} label="Pending Invoices" value={formatRupiah(pendingTotal)} color="orange" subtext={`${pendingCount} Pending`} infoText="Jumlah piutang atau ekspektasi pemasukan yang statusnya masih menunggu pembayaran (belum lunas)." />
        <StatCard icon={TrendingUp} label="Total Pemasukan Aktual" value={formatRupiah(actualIncome)} color="green" infoText="Total pendapatan yang uangnya benar-benar sudah diterima dan ditandai &quot;LUNAS&quot; bulan ini." />
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Left Column: Income Trend */}
          <div className="lg:col-span-2">
            <ChartCard title="Income Trend" className="h-[650px]">
              <div className="h-full w-full pb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
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
                      dataKey="income" 
                      stroke="#4F46E5" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorIncome)" 
                      dot={{ r: 6, fill: '#fff', stroke: '#4F46E5', strokeWidth: 3 }}
                      activeDot={{ r: 8 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Right Column: Recent Income List */}
          <div className="lg:col-span-1">
            <ChartCard 
              title="Pemasukan Terbaru"
              className="h-[650px]"
              extra={
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 bg-primary/10 dark:bg-[#3b82f6]/10 text-primary dark:text-[#3b82f6] rounded-xl hover:bg-primary/20 dark:hover:bg-[#3b82f6]/20 transition-all active:scale-95 cursor-pointer"
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

                <div className="flex-1 overflow-y-auto px-1 custom-scrollbar space-y-4">
                  {filteredAndSortedIncomes.map((income, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center gap-5 group cursor-pointer hover:bg-slate-500/5 dark:hover:bg-slate-800/50 border border-transparent hover:border-primary/50 dark:hover:border-primary hover:shadow-md dark:hover:shadow-primary/20 p-3 rounded-2xl transition-all"
                      onClick={() => handleEditClick(income)}
                    >
                      <div className={`p-4 rounded-2xl ${income.iconColor} transition-all group-hover:scale-110 shadow-sm`}>
                        {(() => {
                          const Icon = income.icon;
                          return <Icon size={20} />;
                        })()}
                      </div>
                      <div className="flex-1 border-b border-slate-100 pb-4">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-primary transition-colors">{income.title}</h4>
                          <span className="font-black text-green-600 text-sm">{formatRupiah(income.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">{income.type}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                            <span className="text-xs text-slate-400 font-medium">{income.date}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-500">
                            {income.status || 'PAID'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => setIsTableOpen(true)}
                  className="w-full mt-6 py-4 text-xs font-black text-slate-400 hover:text-primary transition-all uppercase tracking-[0.2em] border-t border-slate-100 cursor-pointer active:scale-95"
                >
                  Lihat Semua Transaksi
                </button>
              </div>
            </ChartCard>
          </div>
        </div>

        {/* Bottom Full Width: Income Sources */}
        <ChartCard title="Income Sources">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 py-4">
            <div className="h-[400px] w-[400px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={110}
                    outerRadius={150}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black text-slate-800">{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 flex-1 w-full max-w-md">
              {sourceData.map((source, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: source.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-slate-700">{source.name}</h4>
                      <span className="font-bold text-slate-800">{source.value}%</span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">{source.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Add Income Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tambah Pemasukan"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          addIncome({
            title: formData.description || formData.source, // Use description as Title
            amount: Number(formData.amount),
            date: formData.date,
            type: formData.source, // Use source as the type/category subtext
            status: formData.status,
            icon: Wallet,
            color: 'bg-primary/10',
            iconColor: 'bg-primary/10 dark:bg-[#3b82f6]/10 text-primary dark:text-[#3b82f6]'
          });
          setIsModalOpen(false);
          setFormData(initialFormState);
        }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Pemasukan</label>
            <input 
              type="text"
              placeholder="Contoh: Gaji, Bonus Akhir Tahun"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-medium"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Jumlah</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold text-primary"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Sumber</label>
              <input 
                type="text" 
                placeholder="Freelance, dll."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-medium"
                value={formData.source}
                onChange={(e) => setFormData({...formData, source: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tanggal</label>
              <CustomDatePicker 
                value={formData.date}
                onChange={(date) => setFormData({...formData, date})}
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
            className="w-auto px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Simpan
          </button>
        </form>
      </Modal>

      {/* Edit Income Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit Pemasukan"
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          updateIncome(editFormData.id, {
            title: editFormData.description,
            amount: Number(editFormData.amount),
            date: editFormData.date,
            type: editFormData.source,
            status: editFormData.status,
            fullDate: editFormData.date // Keeping full date for future edits
          });
          setIsEditModalOpen(false);
        }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Nama Pemasukan</label>
            <input 
              type="text"
              placeholder="Contoh: Gaji, Bonus Akhir Tahun"
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-medium"
              value={editFormData.description}
              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Jumlah</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-bold text-primary"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Sumber</label>
              <input 
                type="text" 
                placeholder="Freelance, dll."
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all font-medium"
                value={editFormData.source}
                onChange={(e) => setEditFormData({...editFormData, source: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Tanggal</label>
              <CustomDatePicker 
                value={editFormData.date}
                onChange={(date) => setEditFormData({...editFormData, date})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Status</label>
              <CustomSelect 
                value={editFormData.status}
                onChange={(val) => setEditFormData({...editFormData, status: val})}
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button 
              type="submit" 
              className="w-auto px-10 py-4 bg-primary text-primary-foreground rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
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
                      className="flex-1 py-3 bg-primary/10 dark:bg-[#3b82f6]/10 text-primary dark:text-[#3b82f6] rounded-2xl text-sm font-black hover:bg-primary/20 dark:hover:bg-[#3b82f6]/20 transition-all"
                    >
                      Tidak
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        deleteIncome(editFormData.id);
                        setIsEditModalOpen(false);
                        setShowDeleteConfirm(false);
                      }}
                      className="flex-1 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-black hover:opacity-90 transition-all shadow-lg shadow-primary/20"
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
                className={`p-4 rounded-full transition-all active:scale-95 ${showDeleteConfirm ? 'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 scale-110' : 'bg-card text-card-foreground border border-slate-200 text-destructive hover:bg-destructive/10 hover:border-destructive/30 dark:hover:border-destructive shadow-sm'}`}
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
        data={incomes}
        title="Daftar Semua Pemasukan"
        onEditItem={(item) => {
          handleEditClick(item);
          // Don't close table, so user can see it after edit
        }}
        onAddItem={handleAddClick}
        addButtonText="Tambah Pemasukan"
      />
    </Layout>
  );
};

export default IncomePage;
