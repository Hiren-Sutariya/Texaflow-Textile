"use client";

import React from "react";

export interface CourtFlowBadgeProps {
  status?: "active" | "confirmed" | "completed" | "success" | "pending" | "trial" | "trialing" | "warning" | "suspended" | "cancelled" | "danger" | "neutral" | string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
}

export const CourtFlowBadge: React.FC<CourtFlowBadgeProps> = ({
  status = "neutral",
  label,
  children,
  className = "",
}) => {
  const normalized = status.toLowerCase();

  let colorClasses = "bg-slate-50 text-slate-700 border-slate-200";
  let dotColor = "bg-slate-400";

  if (["active", "confirmed", "completed", "success"].includes(normalized)) {
    colorClasses = "bg-[#ecfdf3] text-[#027a48] border-[#a6f4c5]";
    dotColor = "bg-[#12b76a]";
  } else if (["pending", "trial", "trialing", "warning"].includes(normalized)) {
    colorClasses = "bg-[#fff6ed] text-[#b54708] border-[#fed4a7]";
    dotColor = "bg-[#f79009]";
  } else if (["suspended", "cancelled", "danger", "error"].includes(normalized)) {
    colorClasses = "bg-[#fef3f2] text-[#b42318] border-[#fecdca]";
    dotColor = "bg-[#f04438]";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label || children}</span>
    </span>
  );
};
