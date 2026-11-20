"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  shortLabel?: string;
}

interface CourtFlowSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  error?: string;
  disabled?: boolean;
  openUp?: boolean;
}

export function CourtFlowSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  triggerClassName = "",
  error,
  disabled = false,
  openUp
}: CourtFlowSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      if (typeof openUp === "boolean") {
        setOpenUpward(openUp);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setOpenUpward(spaceBelow < 260);
      }
    }
    setIsOpen(!isOpen);
  };

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div ref={containerRef} className={`relative inline-block w-full select-none ${className}`}>
      {label && (
        <label className={`block text-xs font-semibold mb-1.5 ${error ? "text-[#f04438]" : "text-slate-700"}`}>
          {label}
        </label>
      )}

      {/* Trigger Button - Matching CourtFlow Image 5 & 10 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full h-10 px-3.5 bg-white border rounded-xl flex items-center justify-between text-xs font-medium transition-all shadow-xs cursor-pointer focus:outline-none ${disabled
          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
          : error
            ? "border-[#fda29b] text-slate-900 focus:border-[#f04438] focus:ring-4 focus:ring-[#fda29b]/25"
            : isOpen
              ? "border-blue-600 text-slate-900 ring-4 ring-blue-600/15"
              : "border-[#d0d5dd] hover:border-slate-400 text-slate-800"
          } ${triggerClassName}`}
      >
        <span className={`truncate ${selectedOption ? "font-semibold text-slate-900" : "font-normal text-slate-400"}`}>
          {selectedOption ? (selectedOption.shortLabel || selectedOption.label) : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180 text-blue-600" : ""
            }`}
        />
      </button>

      {/* Floating Popover - Matching CourtFlow Image 5 & 10 */}
      {isOpen && (
        <div
          className={`absolute z-50 left-0 min-w-full bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            }`}
        >
          <div className="max-h-60 overflow-y-auto no-scrollbar space-y-0.5">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${isSelected
                    ? "text-blue-600 font-semibold bg-blue-50/60"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-2 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-[11px] font-medium text-[#f04438] mt-1">{error}</p>}
    </div>
  );
}
