import React, { useState } from 'react';
import { X, Search, Plus, Filter, ArrowUpDown } from 'lucide-react';
import { formatRupiah } from '../utils/formatter';

const FullscreenTable = ({ isOpen, onClose, data, title, onEditItem, onAddItem, addButtonText, extraAction }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredData = data.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-6 md:p-12 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-background text-foreground w-full h-full rounded-3xl md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card border-b border-slate-100 dark:border-[#3f3f3f]">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{title}</h2>
              <p className="text-slate-400 font-medium mt-1 text-sm sm:text-base">Kelola semua daftar transaksi Anda di satu tempat</p>
            </div>
            
            <button 
              onClick={onClose}
              className="md:hidden p-3 h-fit bg-card dark:bg-[#1e1e1e] text-card-foreground dark:text-white border border-slate-100 dark:border-[#3f3f3f] text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all shadow-sm cursor-pointer flex-shrink-0"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex gap-3 md:gap-4 items-center w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Cari transaksi..." 
                  className="pl-12 pr-6 py-3.5 md:py-4 bg-card dark:bg-[#1e1e1e] text-card-foreground dark:text-white border border-slate-100 dark:border-[#3f3f3f] rounded-xl md:rounded-2xl w-full md:w-[300px] text-sm focus:outline-none focus:ring-4 focus:ring-blue-50/10 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={onClose}
                className="hidden md:flex p-3.5 md:p-4 bg-card dark:bg-[#1e1e1e] text-card-foreground dark:text-white border border-slate-100 dark:border-[#3f3f3f] text-slate-400 rounded-xl md:rounded-2xl hover:bg-slate-50 dark:hover:bg-[#2f2f2f] transition-all shadow-sm cursor-pointer flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              {extraAction}

              {onAddItem && (
                <button 
                  onClick={onAddItem}
                  className="px-6 py-3.5 md:py-4 bg-primary hover:bg-blue-600 text-white rounded-xl md:rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 text-sm font-bold flex-1 md:flex-none"
                >
                  <Plus size={20} />
                  {addButtonText}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-10 custom-scrollbar">
          <div className="bg-card text-card-foreground rounded-2xl md:rounded-[32px] shadow-sm border border-slate-100 dark:border-[#3f3f3f] overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px] md:min-w-full">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-[#2a2a2a]">
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#3f3f3f]">No</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#3f3f3f]">Sumber</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#3f3f3f]">Keterangan</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#3f3f3f] text-right">Jumlah</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#3f3f3f] text-center">Tanggal</th>
                  <th className="px-8 py-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#3f3f3f] text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredData.map((item, index) => (
                  <tr 
                    key={item.id || index} 
                    onClick={() => onEditItem(item)}
                    className="group cursor-pointer hover:bg-primary/5 dark:hover:bg-[#3b82f6]/10 transition-all border-b border-slate-50 dark:border-[#2f2f2f] last:border-0"
                  >
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`p-2 rounded-lg ${!item.hex ? (item.iconColor || 'bg-slate-50 text-slate-400 dark:bg-[#1e1e1e] dark:text-slate-300') : ''} scale-90`}
                          style={item.hex ? { backgroundColor: `${item.hex}1A`, color: item.hex } : {}}
                        >
                          {item.icon ? <item.icon size={16} /> : <Filter size={16} />}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-primary dark:group-hover:text-[#3b82f6] transition-colors uppercase tracking-wide">{item.title}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-sm font-black text-green-600">{formatRupiah(item.amount)}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-sm font-medium text-slate-500">{item.date}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="p-20 text-center">
                <div className="inline-flex p-6 bg-slate-50 rounded-full text-slate-300 mb-4">
                  <Search size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Tidak ada transaksi ditemukan</h3>
                <p className="text-slate-400">Coba gunakan kata kunci pencarian yang lain</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 md:px-10 py-5 md:py-6 bg-card border-t border-slate-100 dark:border-[#3f3f3f] flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left">
          <p className="text-sm text-slate-400 font-medium">Menampilkan <span className="text-slate-700 dark:text-slate-200 font-bold">{filteredData.length}</span> transaksi</p>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Sistem Sinkron Otomatis</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullscreenTable;
