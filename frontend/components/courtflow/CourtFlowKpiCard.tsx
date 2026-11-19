"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface CourtFlowKpiCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBgColor?: string;
  trend?: string;
  trendPositive?: boolean;
  className?: string;
}

export const CourtFlowKpiCard: React.FC<CourtFlowKpiCardProps> = ({
  label,
  value,
  icon,
  iconBgColor = "bg-emerald-50 text-emerald-600",
  trend,
  trendPositive = true,
  className = "",
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3 transition-all hover:shadow-xs ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}
          >
            {icon}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {value}
        </h3>
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span
              className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded ${
                trendPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {trendPositive ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5 inline" />
              )}
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
