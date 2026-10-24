import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Terjadi Kesalahan pada Halaman
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Aplikasi mengalami kendala saat memuat komponen ini. Anda dapat memuat ulang halaman untuk mencoba kembali.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-slate-100 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 max-h-36 overflow-auto text-xs font-mono text-destructive">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 px-5 rounded-2xl shadow-lg shadow-primary/25 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw size={18} />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
