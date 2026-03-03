import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import Layout from '../components/Layout';
import { StatCard, ChartCard } from '../components/Cards';
import { formatRupiah } from '../utils/formatter';
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieChartIcon,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ReportsPage = () => {
  const { user } = useAuth();
  const { expenseCategories, incomes, expenses } = useFinance();
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchAllMonths = async () => {
      setIsLoading(true);
      try {
        const monthsRef = collection(db, "users", user.uid, "months");
        const snapshot = await getDocs(monthsRef);
        
        const allMonths = [];
        snapshot.forEach(docSnap => {
          const id = docSnap.id; // YYYY-MM
          const data = docSnap.data();
          
          let incTotal = 0;
          (data.incomes || []).forEach(inc => {
             if ((inc.status || '').toLowerCase() !== 'pending') {
               incTotal += Number(inc.amount || 0);
             }
          });
          
          let expTotal = 0;
          const expList = data.expenses || [];
          expList.forEach(exp => {
             const s = (exp.status || '').toLowerCase();
             if (s === 'paid' || s === 'done' || s === 'unpaid') {
               expTotal += Number(exp.amount || 0);
             }
          });

          const [yyyy, mm] = id.split('-');
          const d = new Date(yyyy, Number(mm) - 1, 1);
          const monthName = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][d.getMonth()];
          const shortName = `${monthName} ${yyyy.slice(2)}`;
          const longName = `${monthName} ${yyyy}`;
          
          allMonths.push({
            id,
            name: shortName,
            longName,
            income: incTotal,
            expense: expTotal,
            balance: incTotal - expTotal,
            rawExpenses: expList
          });
        });
        
        allMonths.sort((a, b) => a.id.localeCompare(b.id));

        // Let's override the last actual month safely if current month's dynamic change
        // Wait, context values `incomes` and `expenses` reflect the active user's current month. 
        // A simple re-fetch when they change is enough since we use getDocs.
        setReportData(allMonths);
      } catch (err) {
        console.error("Error fetching reports", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllMonths();
  }, [user, incomes, expenses]);

  const totalLifeTimeSavings = reportData.reduce((acc, curr) => acc + curr.balance, 0);
  const lifeTimeIncome = reportData.reduce((acc, curr) => acc + curr.income, 0);
  const savingRate = lifeTimeIncome > 0 ? ((totalLifeTimeSavings / lifeTimeIncome) * 100).toFixed(1) : 0;
  
  const latestMonth = reportData.length > 0 ? reportData[reportData.length - 1] : { income: 0, expense: 0, balance: 0, name: '-' };

  const distMap = {};
  reportData.forEach(month => {
    month.rawExpenses.forEach(exp => {
       const s = (exp.status || '').toLowerCase();
       if (s === 'paid' || s === 'done' || s === 'unpaid') {
         const catId = exp.category || 'lainnya';
         distMap[catId] = (distMap[catId] || 0) + Number(exp.amount || 0);
       }
    });
  });

  const distData = Object.entries(distMap).map(([catId, val]) => {
     const catObj = expenseCategories.find(c => c.id === catId || c.name === catId);
     return {
       name: catObj?.name || catId,
       value: val,
       color: catObj?.color || '#94A3B8'
     };
  }).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

  const lineData = reportData.slice(-6);
  const tableData = [...reportData].reverse();
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card text-card-foreground p-4 shadow-2xl border border-slate-100 dark:border-[#3f3f3f] rounded-2xl">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex flex-col mb-1 last:mb-0">
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

  return (
    <Layout title="Laporan Keuangan">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <StatCard icon={PieChartIcon} label="Total Simpanan All-Time" value={formatRupiah(totalLifeTimeSavings)} color="blue" />
        <StatCard icon={TrendingUp} label={`Arus Kas Bersih (${latestMonth.name.toUpperCase()})`} value={formatRupiah(latestMonth.balance)} color={latestMonth.balance >= 0 ? "green" : "red"} subtext={latestMonth.balance >= 0 ? "Surplus" : "Defisit"} />
        <StatCard icon={TrendingDown} label="Tingkat Tabungan All-Time" value={`${savingRate}%`} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <ChartCard title="Pemasukan vs Pengeluaran" className="lg:col-span-2">
          <div className="h-[400px] pt-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}jt`} />
                <Tooltip content={<CustomTooltip />} />
                <Line name="Pemasukan" type="monotone" dataKey="income" stroke="#10B981" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#10B981', strokeWidth: 2 }} />
                <Line name="Pengeluaran" type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#EF4444', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Distribusi Pengeluaran">
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {distData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {distData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-slate-500">{item.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <ChartCard>
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-2xl font-bold text-slate-800">Laporan Bulanan</h3>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">
            <Download size={18} />
            Unduh PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest">Bulan</th>
                <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Pemasukan</th>
                <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Pengeluaran</th>
                <th className="pb-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-sm font-bold text-slate-400">Tidak ada riwayat data</td>
                </tr>
              ) : tableData.map((row, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 transition-all dark:hover:bg-[#2f2f2f]/30">
                  <td className="py-6 text-sm font-bold text-slate-700 dark:text-slate-200">{row.longName}</td>
                  <td className="py-6 text-sm font-bold text-green-600 dark:text-green-500 text-right">{formatRupiah(row.income)}</td>
                  <td className="py-6 text-sm font-bold text-destructive text-right">{formatRupiah(row.expense)}</td>
                  <td className="py-6 text-sm font-black text-primary dark:text-[#3b82f6] text-right">{formatRupiah(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-xs font-black text-slate-400 hover:text-primary transition-all uppercase tracking-widest">
          Lihat Laporan Lebih Lama
        </button>
      </ChartCard>
    </Layout>
  );
};

export default ReportsPage;
