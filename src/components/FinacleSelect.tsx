import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

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
  triggerClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: 'left' | 'right';
}

export default function FinacleSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  triggerClassName = "",
  id,
  name,
  required = false,
  accentClass = "text-[#104080]",
  searchable,
  searchPlaceholder = "Type to search...",
  align = 'left'
}: FinacleSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [dropUp, setDropUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-enable search if searchable is true OR if list is large (>= 8 options) unless explicitly disabled
  const isSearchable = searchable ?? options.length >= 8;

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

  // Focus search input when opened, reset search when closed
  useEffect(() => {
    if (isOpen && isSearchable) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setSearchTerm("");
    }
  }, [isOpen, isSearchable]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchTerm.trim()) return options;
    const lower = searchTerm.toLowerCase().trim();
    return options.filter((opt) => {
      // If it's the blank unselected default, keep it only if search query is empty
      if (!opt.value && !opt.label.toLowerCase().includes(lower)) return false;
      const labelMatch = opt.label.toLowerCase().includes(lower);
      const subLabelMatch = opt.subLabel ? opt.subLabel.toLowerCase().includes(lower) : false;
      const badgeMatch = opt.badge ? opt.badge.toLowerCase().includes(lower) : false;
      const valueMatch = String(opt.value).toLowerCase().includes(lower);
      return labelMatch || subLabelMatch || badgeMatch || valueMatch;
    });
  }, [options, isSearchable, searchTerm]);

  // Determine whether to open downward or flip upward based on viewport space
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 260px below and there's more room above, flip upward
      if (spaceBelow < 260 && rect.top > 260) {
        setDropUp(true);
      } else {
        setDropUp(false);
      }
    }
  }, [isOpen]);

  // Keep focusedIndex in sync with filtered list & current value
  useEffect(() => {
    if (isOpen) {
      if (filteredOptions.length > 0) {
        const idx = filteredOptions.findIndex((opt) => opt.value === value);
        setFocusedIndex(idx >= 0 ? idx : 0);
      } else {
        setFocusedIndex(-1);
      }
    }
  }, [isOpen, searchTerm, filteredOptions, value]);

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
      setSearchTerm("");
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

    const isSearchInput = e.target === searchInputRef.current;

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
          while (next < filteredOptions.length && filteredOptions[next].disabled) next++;
          return next < filteredOptions.length ? next : prev;
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && filteredOptions[next].disabled) next--;
          return next >= 0 ? next : prev;
        });
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex]);
        }
        break;
      case " ":
        if (!isSearchInput) {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex]);
          }
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full text-xs select-none ${isOpen ? "z-50" : "z-10"} ${className}`}
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
        className={`w-full ${triggerClassName.includes('h-') ? '' : 'h-[38px]'} bg-white border border-gray-300 rounded-md ${triggerClassName.includes('px-') ? '' : 'px-3'} ${triggerClassName.includes('py-') ? '' : 'py-2'} text-xs flex items-center justify-between gap-2 text-left cursor-pointer transition-all duration-150 shadow-2xs hover:border-gray-400 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080] ${
          isOpen ? "border-[#104080] ring-1 ring-[#104080]" : ""
        } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50" : ""} ${triggerClassName}`}
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

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          role="listbox"
          tabIndex={-1}
          className={`absolute z-[9999] ${
            dropUp ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${align === 'right' ? 'right-0' : 'left-0'} bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden py-0 animate-in fade-in zoom-in-95 duration-100 flex flex-col`}
          style={{ minWidth: options.length <= 4 ? "170px" : "260px" }}
        >
          {/* Sticky Quick-Search Input */}
          {isSearchable && (
            <div className="p-2 border-b border-gray-100 bg-slate-50 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-white border border-gray-300 rounded px-2 py-1.5 pl-8 pr-7 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#104080] focus:ring-1 focus:ring-[#104080]"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === " ") e.stopPropagation();
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchTerm("");
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-500 italic text-center">
                {searchTerm ? `No matches found for "${searchTerm}"` : "No options available"}
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <div
                    key={`${opt.value}-${index}`}
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
        </div>
      )}
    </div>
  );
}
