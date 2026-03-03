import React from 'react';

export const StatCard = ({ icon: Icon, label, value, subtext, color = 'blue', trend }) => {
  const colorClasses = {
    blue: 'bg-primary/10 dark:bg-[#3b82f6]/10 text-primary dark:text-[#3b82f6]',
    red: 'bg-destructive/10 text-destructive',
    green: 'bg-green-500/10 text-green-600 dark:text-green-500',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-500',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  };

  return (
    <div className="bg-card text-card-foreground p-5 md:p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f] flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className={`p-4 rounded-2xl ${colorClasses[color]} transition-transform group-hover:scale-110 duration-300`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${trend > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-500' : 'bg-destructive/10 text-destructive'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold font-mono text-slate-800 tracking-tight">{value}</h3>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{label}</p>
      </div>
      {subtext && <p className="text-xs font-medium text-slate-400">{subtext}</p>}
      
      {/* Decorative gradient corner */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 ${colorClasses[color].replace('text-', 'bg-')}`} />
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
