import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  subLabel?: string;
  badge?: string;
  disabled?: boolean;
}

export interface FinacleSelectProps<T extends string = string> {
  value: T;
  onChange: (e: { target: { value: T } }) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  accentClass?: string;
}

export default function FinacleSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  id,
  name,
  required = false,
  accentClass = "text-[#104080]"
}: FinacleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Determine whether to open downward or flip upward based on viewport space
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 240px below and there's more room above, flip upward
      if (spaceBelow < 240 && rect.top > 240) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen]);

  // Keep focusedIndex in sync with selected value when opened
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  // Scroll focused option into view inside the list only (never scroll document or parent window)
  useEffect(() => {
    if (isOpen && listRef.current && focusedIndex >= 0) {
      const listEl = listRef.current;
      const activeEl = listEl.children[focusedIndex] as HTMLElement;
      if (activeEl) {
        const itemTop = activeEl.offsetTop;
        const itemBottom = itemTop + activeEl.offsetHeight;
        if (itemTop < listEl.scrollTop) {
          listEl.scrollTop = itemTop;
        } else if (itemBottom > listEl.scrollTop + listEl.clientHeight) {
          listEl.scrollTop = itemBottom - listEl.clientHeight;
        }
      }
    }
  }, [focusedIndex, isOpen]);

  const handleSelect = useCallback(
    (opt: SelectOption<T>) => {
      if (opt.disabled || disabled) return;
      onChange({ target: { value: opt.value } });
      setIsOpen(false);
    },
    [disabled, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Tab":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev + 1;
          while (next < options.length && options[next].disabled) next++;
          return next < options.length ? next : prev;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && options[next].disabled) next--;
          return next >= 0 ? next : prev;
        });
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex]);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-xs select-none ${isOpen ? "z-40" : "z-10"} ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form validation compatibility */}
      <input
        type="hidden"
        name={name}
        id={id}
        value={value}
        required={required}
      />

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-xs flex items-center justify-between gap-2 text-left cursor-pointer transition-all duration-150 shadow-2xs hover:border-gray-400 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080] ${
          isOpen ? "border-[#104080] ring-1 ring-[#104080]" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
      >
        <span
          className={`truncate font-bold ${
            selectedOption ? accentClass : "text-gray-400 font-normal"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${
            isOpen ? "transform rotate-180 text-[#104080]" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup (In-DOM pure styling - replaces OS native bubbles) */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          className={`absolute z-[100] ${
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } left-0 w-full bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto py-1 animate-in fade-in zoom-in-95 duration-100`}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400 italic text-center">
              No options available
            </div>
          ) : (
            options.map((opt, index) => {
              const isSelected = opt.value === value;
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => !opt.disabled && setFocusedIndex(index)}
                  className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer text-xs transition-colors ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed text-gray-400"
                      : isSelected
                      ? "bg-blue-50/80 font-bold text-[#104080]"
                      : isFocused
                      ? "bg-slate-100 text-gray-900"
                      : "text-gray-800 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate font-semibold">{opt.label}</span>
                    {opt.subLabel && (
                      <span className="text-[11px] text-gray-500 font-normal truncate mt-0.5">
                        {opt.subLabel}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {opt.badge && (
                      <span className="text-[10px] font-mono font-bold bg-blue-100/60 text-[#104080] px-1.5 py-0.5 rounded">
                        {opt.badge}
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-[#104080] shrink-0" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
