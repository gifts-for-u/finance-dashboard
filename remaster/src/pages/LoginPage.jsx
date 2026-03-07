import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart, Plus, Minus, Tag, RefreshCw, Download, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    document.title = "Login - Finance Tracker";
    return () => {
      document.title = "Finance Tracker";
    };
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (error) {
      // Error is handled in AuthContext via toast
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0a0f1d] transition-colors relative">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 dark:from-primary/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md bg-card dark:bg-[#151b2b] text-card-foreground rounded-[32px] p-10 md:p-12 shadow-xl shadow-primary/5 dark:shadow-none border border-slate-100 dark:border-[#2f3547] relative z-10 overflow-hidden isolate">
        
        {/* Glow behind card */}
        <div className="absolute -z-10 -top-20 -left-20 w-60 h-60 bg-primary/10 dark:bg-primary/5 rounded-full blur-[60px]" />
        
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary dark:bg-[#3b82f6]/10 dark:text-[#3b82f6] mb-6">
            <PieChart size={36} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">Dashboard Keuangan</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Kelola keuangan personal Anda dengan mudah</p>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#3f3f3f] text-slate-800 dark:text-white rounded-2xl font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-[#2a2a2a] transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isLoggingIn ? (
            <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-primary dark:border-t-[#3b82f6] rounded-full animate-spin" />
          ) : (
            <img 
              src="https://www.svgrepo.com/show/303108/google-icon-logo.svg" 
              alt="Google" 
              className="w-5 h-5 group-hover:scale-110 transition-transform"
            />
          )}
          {isLoggingIn ? 'Memproses login...' : 'Masuk dengan Google'}
        </button>

        <div className="mt-12">
          <h3 className="text-center font-bold text-slate-700 dark:text-slate-300 mb-6 tracking-wide">FITUR APLIKASI</h3>
          <div className="space-y-3">
            {[
              { icon: <Plus size={16} />, text: 'Catat pemasukan dan pengeluaran' },
              { icon: <PieChart size={16} />, text: 'Visualisasi data keuangan' },
              { icon: <Tag size={16} />, text: 'Kategorisasi pengeluaran' },
              { icon: <RefreshCw size={16} />, text: 'Template pengeluaran rutin' },
              { icon: <Download size={16} />, text: 'Export/import data' },
              { icon: <Smartphone size={16} />, text: 'Responsif untuk semua perangkat' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#2f3547] text-slate-600 dark:text-slate-300 text-sm font-medium">
                <div className="text-primary dark:text-[#3b82f6]">
                  {feature.icon}
                </div>
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
