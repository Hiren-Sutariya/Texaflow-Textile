"use client";

import React from "react";
import { Search } from "lucide-react";

export interface CourtFlowInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  searchIcon?: boolean;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const CourtFlowInput = React.forwardRef<HTMLInputElement, CourtFlowInputProps>(
  ({ searchIcon, icon, wrapperClassName = "", className = "", ...props }, ref) => {
    const hasLeadingIcon = searchIcon || !!icon;

    return (
      <div className={`relative w-full ${wrapperClassName}`}>
        {searchIcon ? (
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        ) : icon ? (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            {icon}
          </div>
        ) : null}

        <input
          ref={ref}
          className={`w-full h-10 bg-white border border-[#d0d5dd] rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 shadow-2xs transition-all ${
            hasLeadingIcon ? "pl-10 pr-3.5" : "px-3.5"
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);

CourtFlowInput.displayName = "CourtFlowInput";
