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
  X,
  ChevronDown
} from 'lucide-react';

import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children, title }) => {
  const location = useLocation();
  const { currentDate, changeMonth, theme, toggleTheme } = useFinance();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Laporan', path: '/reports', icon: FileText },
    { name: 'Pemasukan', path: '/income', icon: ArrowUpRight },
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Pengeluaran', path: '/expenses', icon: ArrowDownRight },
    { name: 'Anggaran', path: '/budget', icon: PieChart },
  ];

  const [hoveredTab, setHoveredTab] = useState(null);

  const formattedDate = new Intl.DateTimeFormat('id-ID', { 
    month: 'long', 
    year: 'numeric' 
  }).format(currentDate);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-28 md:p-6 md:pb-6 lg:p-10 lg:pb-10 relative">
      <div className="flex justify-between items-center md:hidden mb-6 sticky top-0 bg-background/95 backdrop-blur-3xl p-4 -mx-4 z-40 border-b border-slate-100 dark:border-[#3f3f3f]">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Date Selector (Mobile Only) */}
      <div className="md:hidden flex items-center justify-between bg-card text-card-foreground p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-[#3f3f3f] mb-6">
        <button 
          onClick={() => changeMonth(-1)} 
          className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-primary whitespace-nowrap capitalize">{formattedDate}</span>
        <button 
          onClick={() => changeMonth(1)} 
          className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl transition-colors cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95"
        >
          <ChevronRight size={16} />
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

      {/* Mobile Sidebar / Dropdown Nav - REMOVED */}

      {/* Mobile Drawer Overlay */}
      <div className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileMenuOpen(false)} />
        
        <div className={`absolute top-0 right-0 w-full max-w-[320px] h-full bg-slate-50 dark:bg-[#0a0f1d] border-l border-slate-100 dark:border-[#3f3f3f] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-5 flex justify-between items-center border-b border-slate-100 dark:border-[#3f3f3f] bg-background">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full transition-colors cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            {/* User Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-[#3f3f3f] bg-white dark:bg-[#1e1e1e] shadow-sm">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-slate-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500 font-medium tracking-wide">Selamat datang,</span>
                <span className="font-bold text-slate-800 dark:text-white text-base">{user?.displayName ? user.displayName.split(' ')[0] + '.' : 'User.'}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={toggleTheme}
                className="flex-1 flex justify-between items-center px-4 py-3 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#3f3f3f] rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm active:scale-95 transition-all outline-none"
              >
                {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                <ChevronDown size={16} className="text-slate-400" />
              </button>
              
              <button 
                onClick={logout}
                className="flex-[0.8] flex justify-center items-center gap-2 px-4 py-3 bg-red-100/50 dark:bg-red-900/20 border border-red-300 dark:border-red-800/50 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 cursor-pointer shadow-sm active:scale-95 transition-all hover:bg-red-100 outline-none"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
        {children}
      </main>

      {/* Bottom Navigation Navbar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-card/90 backdrop-blur-xl border-t border-slate-100 dark:border-[#3f3f3f] rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-5px_30px_-15px_rgba(0,0,0,0.5)] z-50 px-6 py-4 pb-safe flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center w-16 h-12 outline-none tap-highlight-transparent"
            >
              <div className="relative flex items-center justify-center w-full h-full">
                {isActive && (
                  <motion.div
                    layoutId="activeBubble"
                    className="absolute w-12 h-12 bg-primary rounded-full"
                    initial={{ y: 0, opacity: 0, scale: 0.5 }}
                    animate={{ y: -24, opacity: 1, scale: 1 }}
                    transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                  />
                )}
                
                <motion.div
                  className={`absolute z-10 ${isActive ? 'text-primary-foreground' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors'}`}
                  animate={{ y: isActive ? -24 : 0 }}
                  transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                >
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

                <motion.span
                  className={`absolute bottom-0 text-[10px] font-bold ${isActive ? 'text-primary dark:text-[#3b82f6]' : 'text-slate-400 dark:text-slate-500'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: isActive ? 1 : 0, 
                    y: isActive ? 6 : 10,
                    scale: isActive ? 1 : 0.8
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {item.name}
                </motion.span>
              </div>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
