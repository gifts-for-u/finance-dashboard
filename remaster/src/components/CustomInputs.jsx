import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Calendar, PenLine, ChevronLeft, ChevronRight } from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import { MONTH_NAMES_ID, MONTH_NAMES_LONG_ID } from '../utils/dates';

export const CustomSelect = ({ value, onChange, options }) => {
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

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        ref={triggerRef}
        className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-3xl transition-all font-medium cursor-pointer flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/20 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-slate-700 dark:text-slate-200">{selectedOption?.label || value}</span>
        <ChevronDown size={18} className={`text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      
      {isOpen && (
        <div 
          role="listbox"
          className="absolute z-[60] top-[calc(100%+8px)] left-0 w-full bg-card text-card-foreground rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 py-2 animate-in fade-in zoom-in-95 duration-200 will-change-transform"
        >
          <div className="max-h-[240px] overflow-y-auto overflow-x-hidden custom-scrollbar transform-gpu overscroll-contain">
            {options.map((opt, idx) => (
              <button
                type="button"
                role="option"
                aria-selected={value === opt.value}
                key={idx}
                className={`w-full text-left px-5 py-3.5 cursor-pointer transition-colors flex items-center gap-3
                  ${value === opt.value 
                    ? 'font-bold text-destructive bg-destructive/10 mx-2 rounded-2xl w-[calc(100%-16px)] my-0.5' 
                    : 'font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 mx-2 rounded-2xl w-[calc(100%-16px)] my-0.5'
                  }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                {opt.color && (
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} aria-hidden="true" />
                )}
                <span className="truncate flex-1">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState('bottom'); // 'bottom' | 'top'
  const [align, setAlign] = useState('left'); // 'left' | 'right'

  const dropdownRef = useRef(null);
  const popoverRef = useRef(null);
  const triggerRef = useRef(null);
  
  const parseLocalDate = useCallback((dateStr) => {
    if (!dateStr) return new Date();

    if (typeof dateStr === 'string' && dateStr.includes(' ')) {
      const parts = dateStr.split(' ');
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1];
      const yearStr = parts[2];

      const monthIndex = MONTH_NAMES_ID.findIndex(m => m.toLowerCase() === monthStr?.toLowerCase());

      if (monthIndex !== -1 && !isNaN(day)) {
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        return new Date(year, monthIndex, day);
      }
    }
    
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
      }
    }
    
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }, []);

  const [currentDate, setCurrentDate] = useState(() => parseLocalDate(value));

  useEffect(() => {
    if (value) setCurrentDate(parseLocalDate(value));
  }, [value, parseLocalDate]);

  // Hitung posisi popover dinamis (auto-flip atas/bawah & kiri/kanan)
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Tinggi popover kalender dengan quick presets sekitar 370px, lebar 292px
    const popoverHeight = 370;
    const popoverWidth = 292;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // ponytail: Cek jarak viewport bounding rect sederhana tanpa dependensi berat (Floating UI/Popper).
    // Ceiling: Jika ada container overflow scroll bersarang ekstrem, perlu ditingkatkan ke React Portal.
    if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }

    // Hindari overflow horizontal ke luar tepi kanan layar
    const spaceRight = window.innerWidth - rect.left;
    if (spaceRight < popoverWidth && rect.right >= popoverWidth) {
      setAlign('right');
    } else {
      setAlign('left');
    }
  }, []);

  // Update posisi saat terbuka, resize, atau scroll
  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleResizeOrScroll = () => updatePosition();
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, [isOpen, updatePosition]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keyboard accessibility: Escape untuk menutup popover dan fokus kembali ke trigger
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleSelectDate = (day) => {
    const year = currentDate.getFullYear();
    const cday = day.toString().padStart(2, '0');
    const monthStr = MONTH_NAMES_ID[currentDate.getMonth()];
    onChange(`${cday} ${monthStr} ${year}`);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleQuickPreset = (offsetDays = 0) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const year = target.getFullYear();
    const cday = target.getDate().toString().padStart(2, '0');
    const monthStr = MONTH_NAMES_ID[target.getMonth()];
    setCurrentDate(new Date(year, target.getMonth(), 1));
    onChange(`${cday} ${monthStr} ${year}`);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  // Rentang tahun dinamis untuk quick select tahun
  const currentYear = new Date().getFullYear();
  const yearsRange = useMemo(() => {
    const list = [];
    const startYear = Math.min(currentDate.getFullYear() - 3, currentYear - 5);
    const endYear = Math.max(currentDate.getFullYear() + 3, currentYear + 5);
    for (let y = startYear; y <= endYear; y++) {
      list.push(y);
    }
    return list;
  }, [currentDate, currentYear]);

  const checkValueDate = parseLocalDate(value);
  const displayDate = value 
    ? `${checkValueDate.getDate().toString().padStart(2, '0')} ${MONTH_NAMES_ID[checkValueDate.getMonth()]} ${checkValueDate.getFullYear()}` 
    : 'Pilih Tanggal';

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" aria-hidden="true" />);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const isSelected = value && 
      checkValueDate.getDate() === i && 
      checkValueDate.getMonth() === currentDate.getMonth() && 
      checkValueDate.getFullYear() === currentDate.getFullYear();
    const today = new Date();
    const isToday = today.getDate() === i && 
      today.getMonth() === currentDate.getMonth() && 
      today.getFullYear() === currentDate.getFullYear();
    
    days.push(
      <button 
        type="button"
        key={i} 
        onClick={() => handleSelectDate(i)}
        aria-label={`${i} ${MONTH_NAMES_LONG_ID[currentDate.getMonth()]} ${currentDate.getFullYear()}${isToday ? ', Hari ini' : ''}${isSelected ? ', Terpilih' : ''}`}
        aria-pressed={isSelected}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          isSelected 
            ? 'bg-primary text-primary-foreground font-bold shadow-md scale-105' 
            : isToday 
            ? 'bg-primary/10 text-primary font-bold hover:bg-primary/20' 
            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
        }`}
      >
        {i}
      </button>
    );
  }

  const placementClass = placement === 'top' 
    ? 'bottom-[calc(100%+8px)] origin-bottom slide-in-from-bottom-2' 
    : 'top-[calc(100%+8px)] origin-top slide-in-from-top-2';

  const alignClass = align === 'right' ? 'right-0 left-auto' : 'left-0 right-auto';

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        ref={triggerRef}
        onClick={() => {
          updatePosition();
          setIsOpen(prev => !prev);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={`Pilih tanggal. Tanggal saat ini: ${displayDate}`}
        className="w-full p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-3xl transition-all font-medium cursor-pointer flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/20 text-left"
      >
        <span className="text-slate-700 dark:text-slate-200">{displayDate}</span>
        <Calendar size={18} className="text-slate-400 shrink-0" aria-hidden="true" />
      </button>
      
      {isOpen && (
        <div 
          ref={popoverRef}
          role="dialog"
          aria-label="Pilih tanggal"
          className={`absolute z-[70] ${placementClass} ${alignClass} w-[292px] max-w-[calc(100vw-32px)] bg-card text-card-foreground rounded-3xl shadow-[0_12px_40px_-10px_rgba(0,0,0,0.18)] border border-slate-100 dark:border-slate-800 p-4 animate-in fade-in zoom-in-95 duration-200`}
        >
          {/* Header Navigasi Bulan/Tahun dengan Quick Dropdown */}
          <div className="flex justify-between items-center mb-3">
            <button 
              type="button" 
              onClick={handlePrevMonth} 
              aria-label="Bulan sebelumnya"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>

            {/* Quick Month & Year jump dropdowns */}
            <div className="flex items-center gap-1">
              <label htmlFor="custom-datepicker-month" className="sr-only">Pilih Bulan</label>
              <select
                id="custom-datepicker-month"
                value={currentDate.getMonth()}
                onChange={(e) => {
                  e.stopPropagation();
                  setCurrentDate(new Date(currentDate.getFullYear(), Number(e.target.value), 1));
                }}
                className="font-bold text-slate-800 dark:text-slate-100 text-xs bg-slate-100/70 dark:bg-slate-800 py-1 px-2 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary focus:outline-none transition-colors"
              >
                {MONTH_NAMES_LONG_ID.map((name, idx) => (
                  <option key={name} value={idx} className="bg-card text-card-foreground">
                    {name}
                  </option>
                ))}
              </select>

              <label htmlFor="custom-datepicker-year" className="sr-only">Pilih Tahun</label>
              <select
                id="custom-datepicker-year"
                value={currentDate.getFullYear()}
                onChange={(e) => {
                  e.stopPropagation();
                  setCurrentDate(new Date(Number(e.target.value), currentDate.getMonth(), 1));
                }}
                className="font-bold text-slate-800 dark:text-slate-100 text-xs bg-slate-100/70 dark:bg-slate-800 py-1 px-2 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary focus:outline-none transition-colors"
              >
                {yearsRange.map((yr) => (
                  <option key={yr} value={yr} className="bg-card text-card-foreground">
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <button 
              type="button" 
              onClick={handleNextMonth} 
              aria-label="Bulan berikutnya"
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          {/* Header Hari dalam Minggu */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-800" role="row">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day, idx) => (
              <div 
                key={day} 
                role="columnheader"
                aria-label={['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][idx]}
                className="text-[10px] font-black tracking-widest uppercase text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Grid Tanggal */}
          <div className="grid grid-cols-7 gap-1 place-items-center mb-2">
            {days}
          </div>

          {/* Quick Presets (Hari Ini, Kemarin, Tutup) */}
          <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickPreset(0)}
                className="px-2.5 py-1 rounded-xl font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Pilih hari ini"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(-1)}
                className="px-2.5 py-1 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Pilih kemarin"
              >
                Kemarin
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                triggerRef.current?.focus();
              }}
              className="px-2 py-1 rounded-xl font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer focus:outline-none"
              aria-label="Tutup kalender"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DeferredColorPicker = ({ value, onChange }) => {
  const [localColor, setLocalColor] = useState(value);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!popoverOpen) {
      setLocalColor(value);
    }
  }, [value, popoverOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverOpen(false);
        onChange(localColor);
      }
    };
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen, localColor, onChange]);

  return (
    <div className="relative" ref={popoverRef}>
      <div 
        className="relative w-24 h-24 rounded-3xl shadow-sm shrink-0 transition-colors duration-300 overflow-hidden flex items-center justify-center group cursor-pointer border border-slate-100" 
        style={{ backgroundColor: localColor }}
        onClick={() => {
          if (popoverOpen) {
            setPopoverOpen(false);
            onChange(localColor);
          } else {
            setPopoverOpen(true);
          }
        }}
        title="Pilih warna kustom"
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 transition-opacity">
          <PenLine size={24} className="text-white drop-shadow-md" />
        </div>
      </div>
      
      {popoverOpen && (
        <div className="absolute top-[calc(100%+16px)] left-0 z-50 bg-card text-card-foreground p-4 rounded-[32px] shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
          <HexColorPicker color={localColor} onChange={setLocalColor} />
          {/* Bubble Tail Pointing Up */}
          <div className="absolute bottom-full left-10 -mb-px w-0 h-0 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white filter drop-shadow-[0_-1px_0_theme(colors.slate.100)]" />
        </div>
      )}
    </div>
  );
};
