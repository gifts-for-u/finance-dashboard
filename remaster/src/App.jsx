import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import ScrollToTop from './components/ScrollToTop';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncomePage from './pages/IncomePage';
import ExpensePage from './pages/ExpensePage';
import BudgetPage from './pages/BudgetPage';
import ReportsPage from './pages/ReportsPage';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

const SessionManager = () => {
  const { user, logout } = useAuth();
  
  const handleLogout = useCallback(() => {
    if (user) {
      logout();
      toast.error('Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit.', {
        id: 'session-timeout',
        duration: 5000,
        icon: '⏳'
      });
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) return; // Only track when logged in

    let timeoutId;
    
    const resetTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 30 minutes = 30 * 60 * 1000 = 1800000 ms
      timeoutId = setTimeout(handleLogout, 1800000);
    };

    // Initialize the timer
    resetTimeout();

    // Events to track user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    
    // Throttle the reset slightly to avoid hammering clearTimeout
    let lastResetTime = 0;
    const activityHandler = () => {
      const now = Date.now();
      if (now - lastResetTime > 1000) { // reset at most once per second
        resetTimeout();
        lastResetTime = now;
      }
    };

    // Attach listeners
    events.forEach(event => {
      window.addEventListener(event, activityHandler, { passive: true });
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
    };
  }, [user, handleLogout]);

  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0f1d]">
        <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-primary dark:border-t-[#3b82f6] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <Router>
          <SessionManager />
          <ScrollToTop />
          <Toaster 
            position="bottom-right"
            toastOptions={{
              className: 'dark:bg-[#1e1e1e] dark:text-white dark:border dark:border-[#3f3f3f]',
              duration: 4000,
            }}
          />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><IncomePage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensePage /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FinanceProvider>
    </AuthProvider>
  );
}

export default App;
