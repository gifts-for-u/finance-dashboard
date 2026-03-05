import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  FileText,
  User,
  Calendar,
  Moon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Menu,
  X
} from 'lucide-react';

import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children, title }) => {
  const location = useLocation();
  const { currentDate, changeMonth, theme, toggleTheme } = useFinance();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pemasukan', path: '/income', icon: ArrowUpRight },
    { name: 'Pengeluaran', path: '/expenses', icon: ArrowDownRight },
    { name: 'Anggaran', path: '/budget', icon: PieChart },
    { name: 'Laporan', path: '/reports', icon: FileText },
  ];

  const [hoveredTab, setHoveredTab] = useState(null);

  const formattedDate = new Intl.DateTimeFormat('id-ID', { 
    month: 'long', 
    year: 'numeric' 
  }).format(currentDate);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-6 lg:p-10 relative">
      {/* Header Mobile */}
      <div className="flex justify-between items-center md:hidden mb-6 sticky top-0 bg-background/95 backdrop-blur-3xl p-4 -mx-4 z-40 border-b border-slate-100 dark:border-[#3f3f3f]">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Header Desktop */}
      <div className="hidden md:flex flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{title}</h1>
        
        <div className="flex items-center gap-4">
          {/* User Profile */}
          <div className="flex items-center gap-3 bg-card text-card-foreground px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-[#3f3f3f]">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={18} className="text-slate-500 dark:text-slate-400" />
              )}
            </div>
            <span className="font-medium text-slate-700 dark:text-slate-200">{user?.displayName || 'User'}</span>
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 bg-card text-card-foreground px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <button 
              onClick={() => changeMonth(-1)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap capitalize">{formattedDate}</span>
            <button 
              onClick={() => changeMonth(1)}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Actions */}
          <button 
            onClick={toggleTheme} // Changed onClick to toggleTheme
            className={`p-3 rounded-full transition-all active:scale-95 shadow-lg cursor-pointer ${theme === 'dark' ? 'bg-yellow-400 text-slate-900 shadow-yellow-100' : 'bg-primary hover:opacity-90 text-primary-foreground shadow-primary/30'}`} // Dynamic class based on theme
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} {/* Dynamic icon based on theme */}
          </button>
          <button 
            onClick={logout}
            className="p-3 bg-card dark:bg-[#1e1e1e] text-slate-400 rounded-full border border-slate-100 dark:border-[#3f3f3f] shadow-sm transition-all hover:text-destructive active:scale-95 cursor-pointer"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <nav className="mb-10 w-full hidden md:block" onMouseLeave={() => setHoveredTab(null)}>
        <div className="bg-primary p-2 px-2.5 gap-3 rounded-[32px] flex items-center shadow-lg shadow-primary/20 w-full relative">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isHovered = hoveredTab === item.path;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onMouseEnter={() => setHoveredTab(item.path)}
                className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[26px] whitespace-nowrap relative z-10 transition-colors duration-300"
              >
                {/* Active Indicator Slide */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-primary-foreground shadow-md rounded-[26px] -z-10"
                    transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1.2 }}
                  />
                )}
                
                {/* Hover Indicator Slide */}
                {isHovered && !isActive && (
                  <motion.div
                    layoutId="hoverNavTab"
                    className="absolute inset-0 bg-primary-foreground/10 rounded-[26px] -z-10"
                    transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1.2 }}
                  />
                )}

                <item.icon size={18} className={`relative z-20 ${isActive ? 'text-primary' : 'text-primary-foreground/80'}`} />
                <span className={`font-semibold text-sm tracking-wide relative z-20 ${isActive ? 'text-primary' : 'text-primary-foreground/80'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sidebar / Dropdown Nav */}
      <div className={`
        md:hidden fixed inset-x-0 top-[72px] bottom-0 bg-background/95 backdrop-blur-xl
        z-30 transition-all duration-500 ease-in-out border-t border-slate-100 dark:border-[#3f3f3f]
        ${isMobileMenuOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-full opacity-0 invisible'}
      `}>
        <div className="p-6 flex flex-col gap-8 h-full overflow-y-auto">
          {/* User Profile Mobile */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-slate-100 dark:border-[#3f3f3f]">
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-500" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Selamat datang,</p>
              <h3 className="font-bold text-slate-700 dark:text-slate-200">{user?.displayName || 'User'}</h3>
            </div>
          </div>

          {/* Navigation Mobile */}
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/30' 
                    : 'bg-card text-slate-500 hover:bg-slate-100 dark:bg-[#1e1e1e] dark:hover:bg-[#2f2f2f] hover:text-primary'
                  }
                `}
              >
                <item.icon size={20} />
                <span className="text-sm tracking-wide">{item.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-3">
             {/* Date Selector Mobile */}
            <div className="flex items-center justify-between bg-card text-card-foreground p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f]">
              <button onClick={() => changeMonth(-1)} className="p-3 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-primary whitespace-nowrap capitalize">{formattedDate}</span>
              <button onClick={() => changeMonth(1)} className="p-3 text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={toggleTheme} 
                className={`flex-1 flex justify-center items-center gap-2 p-4 rounded-2xl transition-all font-bold text-sm ${theme === 'dark' ? 'bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-100' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'}`}
              >
                {theme === 'dark' ? <><Sun size={18} /> Mode Terang</> : <><Moon size={18} /> Mode Gelap</>}
              </button>
              <button 
                onClick={logout}
                className="flex-[0.4] flex justify-center items-center gap-2 p-4 bg-red-50 text-destructive dark:bg-red-950/30 rounded-2xl transition-all hover:bg-red-100 cursor-pointer font-bold"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {children}
      </main>
    </div>
  );
};

export default Layout;
