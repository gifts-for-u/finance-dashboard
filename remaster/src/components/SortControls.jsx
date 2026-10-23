import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  ArrowDown,
  ArrowUp,
  Banknote,
  Filter,
} from 'lucide-react';

export const SortTimeDesc = ({ size }) => (
  <div className="flex items-center gap-0.5" aria-hidden="true">
    <Clock size={size} />
    <ArrowDown size={size - 4} strokeWidth={3} />
  </div>
);

export const SortTimeAsc = ({ size }) => (
  <div className="flex items-center gap-0.5" aria-hidden="true">
    <Clock size={size} />
    <ArrowUp size={size - 4} strokeWidth={3} />
  </div>
);

export const SortAmountDesc = ({ size }) => (
  <div className="flex items-center gap-0.5" aria-hidden="true">
    <Banknote size={size} />
    <ArrowDown size={size - 4} strokeWidth={3} />
  </div>
);

export const SortAmountAsc = ({ size }) => (
  <div className="flex items-center gap-0.5" aria-hidden="true">
    <Banknote size={size} />
    <ArrowUp size={size - 4} strokeWidth={3} />
  </div>
);

export const IconSortDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Urutkan: ${selected?.label || 'Semua'}`}
        className={`w-12 h-12 flex flex-shrink-0 items-center justify-center bg-card text-card-foreground border border-slate-100 dark:border-slate-800 rounded-2xl transition-all cursor-pointer active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          value 
            ? 'text-primary shadow-md border-primary/30 dark:border-primary/50' 
            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-400'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {(() => {
          if (selected && selected.icon) {
            const Icon = selected.icon;
            return <Icon size={18} />;
          }
          return <Filter size={18} />;
        })()}
      </button>

      {isOpen && (
        <div 
          role="listbox"
          aria-label="Pilihan pengurutan"
          className="absolute z-[60] top-[calc(100%+8px)] right-0 w-[170px] bg-card text-card-foreground rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        >
          <div className="max-h-[240px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {options.map((opt, idx) => {
              const IconOpt = opt.icon || Filter;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={value === opt.value}
                  key={idx}
                  className={`w-full text-left px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-3 text-sm font-semibold focus:outline-none ${
                    value === opt.value
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  <IconOpt size={16} aria-hidden="true" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
