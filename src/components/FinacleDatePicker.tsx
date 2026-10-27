import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from 'lucide-react';

export interface FinacleDatePickerProps {
  value?: string; // Expected in 'YYYY-MM-DD' or ''
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  min?: string;
  max?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function FinacleDatePicker({
  value = '',
  onChange,
  className = '',
  placeholder = 'dd/mm/yyyy',
  required = false,
  disabled = false,
  id,
  name,
  min,
  max,
}: FinacleDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center');
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>('days');

  // Internal navigation state for calendar view
  const [viewYear, setViewYear] = useState<number>(() => {
    if (value && value.includes('-')) {
      const y = parseInt(value.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (value && value.includes('-')) {
      const m = parseInt(value.split('-')[1], 10) - 1;
      if (!isNaN(m) && m >= 0 && m <= 11) return m;
    }
    return new Date().getMonth();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync navigation view with value when value changes or when opened
  useEffect(() => {
    if (value && value.includes('-')) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('days');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Viewport boundaries & auto-flip detection
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const popoverHeight = 350;

      // Auto-flip up if not enough space below
      if (spaceBelow < popoverHeight && rect.top > popoverHeight) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }

      // Check horizontal edge alignment
      if (rect.left < 140) {
        setAlign('left');
      } else if (window.innerWidth - rect.right < 140) {
        setAlign('right');
      } else {
        setAlign('center');
      }
    }
  }, [isOpen]);

  // Format ISO string 'YYYY-MM-DD' strictly into 'DD/MM/YYYY' for universal display
  const formatToDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const displayValue = formatToDisplay(value);

  // Parse currently selected date
  const selectedDateParts = value ? value.split('-').map(Number) : null;
  const isSelected = (y: number, m: number, d: number) => {
    if (!selectedDateParts || selectedDateParts.length !== 3) return false;
    return (
      selectedDateParts[0] === y &&
      selectedDateParts[1] === m + 1 &&
      selectedDateParts[2] === d
    );
  };

  // Check if date is today
  const today = new Date();
  const isToday = (y: number, m: number, d: number) => {
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  // Date selection handler
  const handleSelectDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const isoString = `${year}-${mm}-${dd}`;

    if (onChange) {
      onChange({ target: { value: isoString } });
    }
    setIsOpen(false);
    setViewMode('days');
  };

  // Month navigation
  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Calendar Day Generation (Standard 6-row / 42-cell matrix)
  const daysInViewMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  interface CalendarCell {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
  }

  const calendarCells: CalendarCell[] = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonthIdx = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYearVal = viewMonth === 0 ? viewYear - 1 : viewYear;
    calendarCells.push({
      day: daysInPrevMonth - i,
      month: prevMonthIdx,
      year: prevYearVal,
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInViewMonth; d++) {
    calendarCells.push({
      day: d,
      month: viewMonth,
      year: viewYear,
      isCurrentMonth: true,
    });
  }

  // Trailing days into next month (fill up to 42 cells for constant stable height)
  const remainingCells = 42 - calendarCells.length;
  for (let d = 1; d <= remainingCells; d++) {
    const nextMonthIdx = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYearVal = viewMonth === 11 ? viewYear + 1 : viewYear;
    calendarCells.push({
      day: d,
      month: nextMonthIdx,
      year: nextYearVal,
      isCurrentMonth: false,
    });
  }

  // Keyboard navigation on trigger button
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Base fallback styling if parent didn't specify borders or background
  const hasBorder = className.includes('border');
  const hasBg = className.includes('bg-');
  const hasHeight = className.includes('h-') || className.includes('py-');

  const defaultBaseClasses = [
    !hasBorder ? 'border border-gray-300' : '',
    !hasBg ? 'bg-white' : '',
    !hasHeight ? 'px-2.5 py-1 text-xs' : '',
    !className.includes('rounded') ? 'rounded' : '',
    'shadow-2xs hover:border-gray-400'
  ].filter(Boolean).join(' ');

  // Popover positioning classes
  const alignmentClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  const positionClass = dropUp
    ? `bottom-full mb-2.5 ${alignmentClass}`
    : `top-full mt-2.5 ${alignmentClass}`;

  // Caret notch positioning
  const notchAlignClass =
    align === 'left'
      ? 'left-6'
      : align === 'right'
      ? 'right-6'
      : 'left-1/2 -translate-x-1/2';

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className.includes('w-full') ? 'w-full' : ''}`}
    >
      {/* Hidden input for HTML form submission compatibility */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
        required={required}
      />

      {/* Interactive Trigger Box */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex items-center justify-between cursor-pointer select-none transition-all duration-150 focus:outline-none ${
          isOpen
            ? 'border-[#0066f5] ring-2 ring-[#0066f5]/20'
            : 'focus:border-[#0066f5] focus:ring-1 focus:ring-[#0066f5]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''} ${defaultBaseClasses} ${className}`}
        title="Click or press Enter/Space to select date (DD/MM/YYYY)"
        aria-label={placeholder || "Select date (DD/MM/YYYY)"}
        aria-expanded={isOpen}
      >
        {/* Universal DD/MM/YYYY Display */}
        <span
          className={`truncate text-left font-medium ${
            displayValue ? 'text-inherit font-inherit' : 'text-gray-400'
          }`}
        >
          {displayValue || placeholder}
        </span>

        {/* Clean Calendar SVG Icon */}
        <span
          className={`ml-1.5 flex-shrink-0 transition-colors ${
            isOpen ? 'text-[#0066f5]' : 'text-gray-500 hover:text-[#0066f5]'
          }`}
        >
          <CalendarIcon className="w-4 h-4 stroke-[1.8]" />
        </span>
      </div>

      {/* Floating In-DOM Calendar Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute ${positionClass} z-[100] w-[296px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 animate-in fade-in zoom-in-95 duration-100 select-none`}
        >
          {/* Top or Bottom Caret Notch pointing directly to the trigger */}
          {!dropUp ? (
            <>
              {/* Outer stroke triangle */}
              <div
                className={`absolute -top-[7px] ${notchAlignClass} w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-b-[7px] border-b-gray-200 pointer-events-none`}
              />
              {/* Inner white fill triangle */}
              <div
                className={`absolute -top-[6px] ${notchAlignClass} w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white pointer-events-none`}
              />
            </>
          ) : (
            <>
              {/* Outer stroke triangle (bottom) */}
              <div
                className={`absolute -bottom-[7px] ${notchAlignClass} w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-gray-200 pointer-events-none`}
              />
              {/* Inner white fill triangle (bottom) */}
              <div
                className={`absolute -bottom-[6px] ${notchAlignClass} w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-white pointer-events-none`}
              />
            </>
          )}

          {/* 1. CALENDAR HEADER */}
          <div className="flex items-center justify-between mb-3 px-1">
            {/* Previous Month */}
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded-full text-gray-700 hover:text-[#0066f5] hover:bg-slate-100 cursor-pointer transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Month & Year Title with dropdown switcher */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode((prev) => (prev === 'days' ? 'months' : 'days'));
              }}
              className="inline-flex items-center gap-1 font-bold text-[14px] text-gray-900 hover:text-[#0066f5] px-2 py-0.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <span>{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <ChevronDown className={`w-4 h-4 stroke-[2.2] text-gray-700 transition-transform ${viewMode !== 'days' ? 'rotate-180 text-[#0066f5]' : ''}`} />
            </button>

            {/* Next Month */}
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 rounded-full text-gray-700 hover:text-[#0066f5] hover:bg-slate-100 cursor-pointer transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* 2. QUICK MONTH & YEAR SELECTOR (Dropdown mode) */}
          {viewMode === 'months' ? (
            <div className="py-2 space-y-3">
              {/* Year Scroller */}
              <div className="flex items-center justify-between px-2 bg-slate-50 py-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y - 1)}
                  className="p-1 text-gray-600 hover:text-[#0066f5] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-sm text-gray-900">{viewYear}</span>
                <button
                  type="button"
                  onClick={() => setViewYear((y) => y + 1)}
                  className="p-1 text-gray-600 hover:text-[#0066f5] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES.map((name, idx) => {
                  const isCurrentMonthActive = idx === viewMonth;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx);
                        setViewMode('days');
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        isCurrentMonthActive
                          ? 'bg-[#0066f5] text-white shadow-xs'
                          : 'text-gray-700 hover:bg-slate-100 hover:text-[#0066f5]'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 3. DAYS CALENDAR MATRIX */
            <>
              {/* Weekday Row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {WEEKDAY_NAMES.map((weekday) => (
                  <div
                    key={weekday}
                    className="text-[12px] font-semibold text-slate-500 py-1"
                  >
                    {weekday}
                  </div>
                ))}
              </div>

              {/* Days Grid (42 cells: 6 rows of 7) */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarCells.map((cell, idx) => {
                  const active = isSelected(cell.year, cell.month, cell.day);
                  const currentDay = isToday(cell.year, cell.month, cell.day);

                  // Disabled date check (min / max)
                  const cellIso = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                  const isMinDisabled = min ? cellIso < min : false;
                  const isMaxDisabled = max ? cellIso > max : false;
                  const isDayDisabled = isMinDisabled || isMaxDisabled;

                  return (
                    <button
                      key={`${cell.year}-${cell.month}-${cell.day}-${idx}`}
                      type="button"
                      disabled={isDayDisabled}
                      onClick={() => handleSelectDate(cell.year, cell.month, cell.day)}
                      className={`h-8 w-8 mx-auto flex items-center justify-center text-[12px] transition-all cursor-pointer font-medium ${
                        active
                          ? 'bg-[#0066f5] text-white font-bold rounded-xl shadow-md scale-105'
                          : isDayDisabled
                          ? 'text-gray-200 cursor-not-allowed'
                          : !cell.isCurrentMonth
                          ? 'text-gray-300 hover:text-gray-600 rounded-lg'
                          : currentDay
                          ? 'text-[#0066f5] font-bold border border-[#0066f5]/40 rounded-lg hover:bg-blue-50'
                          : 'text-gray-800 hover:bg-slate-100 hover:text-[#0066f5] rounded-lg'
                      }`}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>

              {/* Quick Jump to Today Shortcut */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between px-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    const todayIso = new Date().toISOString().slice(0, 10);
                    if (onChange) onChange({ target: { value: todayIso } });
                    setIsOpen(false);
                  }}
                  className="font-bold text-[#0066f5] hover:underline cursor-pointer"
                >
                  Today
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange({ target: { value: '' } });
                      setIsOpen(false);
                    }}
                    className="font-medium text-gray-400 hover:text-red-500 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
