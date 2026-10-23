import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
      role="presentation"
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="bg-card text-card-foreground rounded-[32px] w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300 overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 sm:p-8 pb-0 flex justify-between items-center">
          <h2 id="modal-title" className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
          <button 
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
