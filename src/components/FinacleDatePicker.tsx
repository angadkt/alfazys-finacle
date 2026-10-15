import React, { useRef } from 'react';

interface FinacleDatePickerProps {
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
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Formats ISO string 'YYYY-MM-DD' strictly into 'DD/MM/YYYY' for universal display
  const formatToDisplay = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const displayValue = formatToDisplay(value);

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange({ target: { value: e.target.value } });
    }
  };

  const triggerPicker = () => {
    if (disabled) return;
    try {
      if (hiddenDateRef.current && typeof hiddenDateRef.current.showPicker === 'function') {
        hiddenDateRef.current.showPicker();
      } else {
        hiddenDateRef.current?.click();
      }
    } catch {
      hiddenDateRef.current?.focus();
    }
  };

  return (
    <div
      onClick={triggerPicker}
      className={`relative inline-flex items-center cursor-pointer select-none ${className}`}
      title="Click to select date (DD/MM/YYYY)"
    >
      {/* Guaranteed DD/MM/YYYY display on ALL devices worldwide */}
      <span
        className={`w-full truncate text-left ${
          displayValue ? 'text-inherit font-inherit' : 'text-gray-400'
        }`}
      >
        {displayValue || placeholder}
      </span>

      {/* Calendar SVG Icon */}
      <span className="ml-1.5 flex-shrink-0 text-gray-500 hover:text-[#1e4676]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>

      {/* Hidden Native Picker (syncs state and provides native calendar dialog) */}
      <input
        ref={hiddenDateRef}
        type="date"
        id={id}
        name={name}
        value={value}
        min={min}
        max={max}
        required={required}
        disabled={disabled}
        onChange={handleNativeChange}
        tabIndex={-1}
        className="sr-only pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
}
