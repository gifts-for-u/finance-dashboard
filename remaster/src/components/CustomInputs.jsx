import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar, PenLine, ChevronLeft, ChevronRight } from 'lucide-react';
import { HexColorPicker } from "react-colorful";

export const CustomSelect = ({ value, onChange, options }) => {
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
      <div 
        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl transition-all font-medium cursor-pointer flex justify-between items-center hover:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className="text-slate-700">{options.find(opt => opt.value === value)?.label || value}</span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && (
        <div className="absolute z-[60] top-[calc(100%+8px)] left-0 w-full bg-card text-card-foreground rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 will-change-transform">
          <div className="max-h-[240px] overflow-y-auto overflow-x-hidden custom-scrollbar transform-gpu overscroll-contain">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className={`w-full text-left px-5 py-3.5 cursor-pointer transition-colors flex items-center gap-3
                  ${value === opt.value 
                    ? 'font-bold text-destructive bg-destructive/10/80 mx-2 rounded-2xl w-[calc(100%-16px)] my-0.5' 
                    : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 mx-2 rounded-2xl w-[calc(100%-16px)] my-0.5'
                  }`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.color && (
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }}></div>
                )}
                <span className="truncate flex-1">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CustomDatePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    
    if (typeof dateStr === 'string' && dateStr.includes(' ')) {
      const parts = dateStr.split(' ');
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const yearStr = parts[2];
      
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthStr?.toLowerCase());
      
      if (monthIndex !== -1 && !isNaN(day)) {
        const year = yearStr ? parseInt(yearStr) : new Date().getFullYear();
        return new Date(year, monthIndex, day);
      }
    }
    
    if (typeof dateStr === 'string' && dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
    }
    
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  };

  const [currentDate, setCurrentDate] = useState(parseLocalDate(value));

  useEffect(() => {
    if (value) setCurrentDate(parseLocalDate(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day) => {
    const year = currentDate.getFullYear();
    const cday = day.toString().padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthStr = monthNames[currentDate.getMonth()];
    onChange(`${cday} ${monthStr} ${year}`);
    setIsOpen(false);
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const checkDate = parseLocalDate(value);
    const isSelected = value && checkDate.getDate() === i && checkDate.getMonth() === currentDate.getMonth() && checkDate.getFullYear() === currentDate.getFullYear();
    const today = new Date();
    const isToday = today.getDate() === i && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
    
    days.push(
      <div 
        key={i} 
        onClick={() => handleDateClick(i)}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm cursor-pointer transition-all ${isSelected ? 'bg-primary/100 text-primary-foreground font-bold shadow-md' : isToday ? 'bg-primary/10 text-primary font-bold hover:bg-primary/20' : 'hover:bg-slate-100 text-slate-700 font-medium'}`}
      >
        {i}
      </div>
    );
  }

  const checkValueDate = parseLocalDate(value);
  const displayDate = value ? `${checkValueDate.getDate().toString().padStart(2, '0')} ${monthNames[checkValueDate.getMonth()]} ${checkValueDate.getFullYear()}` : 'Pilih Tanggal';

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl transition-all font-medium cursor-pointer flex justify-between items-center hover:bg-slate-100"
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        <span className="text-slate-700">{displayDate}</span>
        <Calendar size={18} className="text-slate-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-[60] bottom-[calc(100%+8px)] sm:bottom-auto sm:top-[calc(100%+8px)] left-0 w-[280px] bg-card text-card-foreground rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 p-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-800 text-sm">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-3 border-b border-slate-100 bg-card text-card-foreground">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
              <div key={day} className="text-[10px] pb-2 font-black tracking-widest uppercase text-slate-400">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 place-items-center">
            {days}
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
