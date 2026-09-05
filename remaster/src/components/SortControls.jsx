import React, { useState, useRef, useEffect } from 'react';
import {
  Clock,
  ArrowDown,
  ArrowUp,
  Banknote,
  Filter,
} from 'lucide-react';

// Komponen ikon kecil untuk label visual di tombol sort.
// Digunakan oleh IconSortDropdown dan opsi dropdown.

export const SortTimeDesc = ({ size }) => (
  <div className="flex items-center gap-0.5">
    <Clock size={size} />
    <ArrowDown size={size - 4} strokeWidth={3} />
  </div>
);

export const SortTimeAsc = ({ size }) => (
  <div className="flex items-center gap-0.5">
    <Clock size={size} />
    <ArrowUp size={size - 4} strokeWidth={3} />
  </div>
);

export const SortAmountDesc = ({ size }) => (
  <div className="flex items-center gap-0.5">
    <Banknote size={size} />
    <ArrowDown size={size - 4} strokeWidth={3} />
  </div>
);

export const SortAmountAsc = ({ size }) => (
  <div className="flex items-center gap-0.5">
    <Banknote size={size} />
    <ArrowUp size={size - 4} strokeWidth={3} />
  </div>
);

/**
 * IconSortDropdown — tombol sort dengan ikon saja yang membuka
 * dropdown berisi opsi berlabel. Generic; tidak terikat satu halaman.
 *
 * Props:
 *  - value: nilai opsi yang sedang dipilih (controlled)
 *  - onChange(value): callback saat opsi dipilih
 *  - options: array of { value, label, icon? }
 */
export const IconSortDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`w-12 h-12 flex flex-shrink-0 items-center justify-center bg-card dark:bg-[#1e1e1e] border border-slate-100 dark:border-[#3f3f3f] rounded-2xl transition-all cursor-pointer active:scale-95 focus:outline-none ${value ? 'text-primary dark:text-[#3b82f6] shadow-md border-primary/30 dark:border-primary/50' : 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-400 dark:text-slate-300'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {(() => {
          const selected = options.find((opt) => opt.value === value);
          if (selected && selected.icon) {
            const Icon = selected.icon;
            return <Icon size={18} />;
          }
          return <Filter size={18} />;
        })()}
      </button>

      {isOpen && (
        <div className="absolute z-[60] top-[calc(100%+8px)] right-0 w-[160px] bg-card dark:bg-[#2f2f2f] text-card-foreground rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-md dark:shadow-[#1b1b1b] border border-slate-100 dark:border-[#3f3f3f] py-2 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          <div className="max-h-[240px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {options.map((opt, idx) => {
              const IconOpt = opt.icon || Filter;
              return (
                <div
                  key={idx}
                  className={`w-full text-left px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-3 text-sm font-semibold
                    ${value === opt.value
                      ? 'bg-primary/10 text-primary dark:text-[#3b82f6]'
                      : 'hover:bg-slate-50 dark:hover:bg-[#3f3f3f] text-slate-600 dark:text-slate-300'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  <IconOpt size={16} />
                  {opt.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};