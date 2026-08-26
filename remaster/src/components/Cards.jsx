import React, { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';

export const StatCard = ({ icon: Icon, label, rawLabel, value, subtext, color = 'blue', trend, infoText, className = "" }) => {
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

  const displayTitle = rawLabel || (typeof label === 'string' ? label : 'Informasi');

  return (
    <div className={`bg-card text-card-foreground p-4 sm:p-5 md:p-7 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f] flex flex-col justify-between gap-3 md:gap-4 relative overflow-visible group hover:shadow-md transition-all duration-300 min-h-[145px] sm:min-h-[160px] md:min-h-[190px] ${showInfo ? 'z-[75]' : 'z-[1]'} ${className}`}>
      <div className="flex justify-between items-start z-10 w-full relative">
        <div className={`p-2.5 sm:p-3 md:p-4 rounded-xl md:rounded-2xl ${colorClasses[color]} transition-transform group-hover:scale-105 duration-300`}>
          <Icon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </div>

        {infoText && (
          <div className="relative" ref={infoRef}>
            <button 
              type="button"
              className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center cursor-pointer shadow-sm outline-none focus:outline-none transition-transform hover:scale-110 active:scale-95 ${solidColorClasses[color]}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowInfo(!showInfo);
              }}
              aria-label="Informasi"
            >
              <Info className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[2.5]" />
            </button>
            
            {showInfo && (
              <>
                <div 
                  className="fixed inset-0 z-[70] bg-black/40 sm:bg-black/10 dark:bg-black/60 sm:dark:bg-black/30 backdrop-blur-sm sm:backdrop-blur-[1px] cursor-default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowInfo(false);
                  }}
                />
                <div className="fixed sm:absolute top-1/2 sm:top-full left-1/2 sm:left-auto sm:right-0 -translate-x-1/2 sm:translate-x-0 -translate-y-1/2 sm:translate-y-0 w-[88vw] max-w-xs sm:max-w-none sm:w-72 md:w-80 mt-0 sm:mt-3 bg-white dark:bg-[#2a2a2a] rounded-3xl p-5 sm:p-6 shadow-2xl sm:shadow-[0_10px_40px_rgba(0,0,0,0.2)] dark:shadow-[#000000_0px_10px_40px] border border-slate-100 dark:border-[#3f3f3f] animate-pop z-[80] origin-center sm:origin-top-right">
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <h4 className={`text-xs sm:text-sm font-black tracking-widest uppercase ${colorClasses[color].split(' ')[2]}`}>{displayTitle}</h4>
                    <button
                      type="button"
                      onClick={() => setShowInfo(false)}
                      className="p-1 -mr-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      aria-label="Tutup"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-full h-[1px] bg-slate-100 dark:bg-[#3f3f3f] mb-3 sm:mb-4"></div>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed text-left">{infoText}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-end mt-1">
        <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2 md:gap-3">
          <h3 className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold font-mono text-slate-800 dark:text-white tracking-tight break-all sm:break-normal">
            {value}
          </h3>
          {trend !== undefined && trend !== null && (
            <div className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg text-[9px] sm:text-[10px] md:text-xs font-bold whitespace-nowrap ${Number(trend) > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-destructive/10 text-destructive'}`}>
              {Number(trend) > 0 ? '+' : ''}{trend}%
            </div>
          )}
        </div>
        <div className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mt-1 md:mt-1.5 line-clamp-2">
          {label}
        </div>
        {subtext && (
          <p className="text-[10px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 z-10">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

export const ChartCard = ({ title, extra, children, className = "" }) => {
  return (
    <div className={`bg-card text-card-foreground p-4 sm:p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f] flex flex-col ${className}`}>
      {title && (
        <div className="flex justify-between items-center mb-4 sm:mb-6 md:mb-8">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
          {extra && <div>{extra}</div>}
        </div>
      )}
      <div className="flex flex-col flex-1 w-full h-full relative">
        {children}
      </div>
    </div>
  );
};
