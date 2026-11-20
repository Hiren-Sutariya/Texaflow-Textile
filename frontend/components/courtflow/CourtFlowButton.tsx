"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface CourtFlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const CourtFlowButton: React.FC<CourtFlowButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled,
  className = "",
  ...props
}) => {
  let baseStyle = "inline-flex items-center justify-center font-semibold transition-all rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";

  let sizeStyle = "h-10 px-4 text-xs gap-2";
  if (size === "sm") sizeStyle = "h-8.5 px-3 text-xs gap-1.5";
  if (size === "lg") sizeStyle = "h-11 px-5 text-sm gap-2.5";

  let variantStyle = "bg-blue-600 hover:bg-blue-700 text-white shadow-xs border border-blue-600";
  if (variant === "secondary") {
    variantStyle = "bg-white hover:bg-slate-50 text-slate-700 border border-[#d0d5dd] shadow-2xs";
  } else if (variant === "danger") {
    variantStyle = "bg-[#f04438] hover:bg-[#d92d20] text-white shadow-xs border border-[#f04438]";
  } else if (variant === "outline") {
    variantStyle = "bg-white hover:bg-slate-50 text-slate-700 border border-[#eaecf0] shadow-2xs";
  }

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
