import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PieChart } from 'lucide-react';
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


      </div>
    </div>
  );
};

export default LoginPage;
