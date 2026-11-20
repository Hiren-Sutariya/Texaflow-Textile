"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface CourtFlowDatePickerProps {
  label?: string;
  value?: string; // Format: YYYY-MM-DD
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  error?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CourtFlowDatePicker({
  label,
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  triggerClassName = "",
  error,
  disabled = false,
}: CourtFlowDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or fallback to today
  const initialDate = value ? new Date(value) : new Date();
  const validInitialDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;

  const [viewYear, setViewYear] = useState<number>(validInitialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(validInitialDate.getMonth()); // 0-indexed

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Format display string like "Dec 22, 2026"
  const formattedDisplay = value
    ? (() => {
      const d = new Date(value);
      if (isNaN(d.getTime())) return value;
      return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    })()
    : null;

  // Generate calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${mm}-${dd}`;
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const d = new Date(value);
    if (isNaN(d.getTime())) return false;
    return (
      d.getFullYear() === viewYear &&
      d.getMonth() === viewMonth &&
      d.getDate() === day
    );
  };

  const isTodayDate = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full select-none ${className}`}>
      {label && (
        <label className={`block text-xs font-semibold mb-1.5 ${error ? "text-[#f04438]" : "text-slate-700"}`}>
          {label}
        </label>
      )}

      {/* Trigger Button - Matching CourtFlow Image 3 & 11 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className="w-4 h-4 text-slate-700 shrink-0" />
          <span className={`truncate ${formattedDisplay ? "font-semibold text-slate-900" : "font-normal text-slate-400"}`}>
            {formattedDisplay || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? "rotate-180 text-blue-600" : ""
            }`}
        />
      </button>

      {/* Calendar Card Dropdown - Matching CourtFlow Image 3 & 11 */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-900/10 p-4 w-72 animate-in fade-in zoom-in-95 duration-100">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-slate-400 text-center py-0.5">
                {d}
              </span>
            ))}
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Prev month fill */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const dayNum = prevMonthDays - firstDayOfWeek + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="w-8 h-8 flex items-center justify-center text-xs text-slate-300 font-normal pointer-events-none"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelectedDate(day);
              const today = isTodayDate(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors cursor-pointer ${selected
                    ? "bg-blue-600 text-white font-bold shadow-xs"
                    : today
                      ? "border border-blue-300 text-blue-700 font-semibold hover:bg-blue-50/50"
                      : "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today Button quick pick */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const mm = String(now.getMonth() + 1).padStart(2, "0");
                const dd = String(now.getDate()).padStart(2, "0");
                onChange?.(`${now.getFullYear()}-${mm}-${dd}`);
                setIsOpen(false);
              }}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange?.("");
                setIsOpen(false);
              }}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[11px] font-medium text-[#f04438] mt-1">{error}</p>}
    </div>
  );
}
