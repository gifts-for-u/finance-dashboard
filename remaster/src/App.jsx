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
import { Toaster } from 'react-hot-toast';
import './App.css';

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
