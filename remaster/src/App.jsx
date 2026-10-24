import React, { useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import ScrollToTop from './components/ScrollToTop';
import ErrorBoundary from './components/ErrorBoundary';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

// Lazy-loaded route components for optimized initial bundle loading
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const IncomePage = lazy(() => import('./pages/IncomePage'));
const ExpensePage = lazy(() => import('./pages/ExpensePage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-slate-200 dark:border-slate-800 border-t-primary rounded-full animate-spin"></div>
  </div>
);

/**
 * Auto-logout setelah 30 menit idle (tidak ada aktivitas mouse/keyboard/scroll).
 *
 * PENTING: Ini hanya kontrol UX (UX courtesy), BUKAN kontrol keamanan.
 * Token Firebase Auth expire sendiri di server dan Firebase tidak akan
 * mengizinkan request dengan token yang sudah invalid.
 *
 * Untuk kontrol sesi yang sebenarnya (server-side enforcement), perlu:
 *   - Custom claims + Cloud Function yang memeriksa `auth_time`, ATAU
 *   - Firebase Admin SDK untuk `revokeRefreshTokens(uid)` di backend.
 *
 * Lihat:
 *   - PRD.md Section 8.4 (Security Model — Session)
 *   - 01-vulnerabilities.md #8 (Session manager kosmetik)
 */
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
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FinanceProvider>
          <Router>
            <SessionManager />
            <ScrollToTop />
            <Toaster 
              position="bottom-right"
              toastOptions={{
                className: 'dark:bg-card dark:text-slate-100 dark:border dark:border-slate-800 shadow-xl rounded-2xl font-medium',
                duration: 4000,
              }}
            />
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
          </Router>
        </FinanceProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
