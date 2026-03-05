import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

export const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue', trend, infoText }) => {
  const [showInfo, setShowInfo] = useState(false);
  const infoRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  const colorClasses = {
    blue: 'bg-primary/10 dark:bg-[#3b82f6]/10 text-primary dark:text-[#3b82f6]',
    red: 'bg-destructive/10 text-destructive',
    green: 'bg-green-500/10 text-green-600 dark:text-green-500',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-500',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-500',
  };

  const solidColorClasses = {
    blue: 'bg-primary dark:bg-[#3b82f6] text-white',
    red: 'bg-destructive text-white',
    green: 'bg-green-600 dark:bg-green-500 text-white',
    purple: 'bg-purple-600 dark:bg-purple-500 text-white',
    orange: 'bg-orange-600 dark:bg-orange-500 text-white',
    slate: 'bg-slate-600 dark:bg-slate-500 text-white',
    teal: 'bg-teal-600 dark:bg-teal-500 text-white',
  };

  return (
    <div className="bg-card text-card-foreground p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f] flex flex-col gap-4 relative overflow-visible group hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start z-10 w-full relative">
        <div className={`p-4 rounded-2xl ${colorClasses[color]} transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${trend > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-destructive/10 text-destructive'}`}>
              {trend > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold font-mono text-slate-800 tracking-tight">{value}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
      {subtext && <p className="text-xs font-medium text-slate-400 z-10">{subtext}</p>}
      
      {infoText && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20" ref={infoRef}>
          <button 
            type="button"
            className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm outline-none focus:outline-none transition-transform hover:scale-110 active:scale-95 ${solidColorClasses[color]}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
          >
            <Info size={14} strokeWidth={2.5} />
          </button>
          
          {showInfo && (
            <div className="absolute top-full right-0 mt-4 w-64 md:w-72 bg-white dark:bg-[#2a2a2a] rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[#000000_0px_10px_40px] border border-slate-100 dark:border-[#3f3f3f] animate-in fade-in zoom-in slide-in-from-top-5 duration-300 z-50">
              <h4 className={`text-sm font-black tracking-widest uppercase mb-3 ${colorClasses[color].split(' ')[2]}`}>{label}</h4>
              <div className="w-full h-[1px] bg-slate-100 dark:bg-[#3f3f3f] mb-4"></div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed text-left">{infoText}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export const ChartCard = ({ title, extra, children, className = "" }) => {
  return (
    <div className={`bg-card text-card-foreground p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f] flex flex-col ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className="flex flex-col flex-1 w-full h-full relative">
        {children}
      </div>
    </div>
  );
};
