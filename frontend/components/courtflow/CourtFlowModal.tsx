"use client";

import React, { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { CourtFlowButton } from "./CourtFlowButton";

export interface CourtFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  loading?: boolean;
  error?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export const CourtFlowModal: React.FC<CourtFlowModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel = "Cancel",
  onSecondaryAction,
  loading = false,
  error,
  maxWidth = "lg",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  let widthClass = "max-w-lg";
  if (maxWidth === "sm") widthClass = "max-w-sm";
  if (maxWidth === "md") widthClass = "max-w-md";
  if (maxWidth === "xl") widthClass = "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      />

      {/* Modal Dialog */}
      <div
        className={`relative bg-white rounded-2xl border border-slate-100 shadow-2xl w-full ${widthClass} p-6 space-y-5 z-10 animate-in fade-in zoom-in-95 duration-150`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice if present */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto no-scrollbar py-1">
          {children}
        </div>

        {/* Footer */}
        {(primaryActionLabel || secondaryActionLabel) && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            {secondaryActionLabel && (
              <CourtFlowButton
                type="button"
                variant="secondary"
                onClick={onSecondaryAction || onClose}
                disabled={loading}
              >
                {secondaryActionLabel}
              </CourtFlowButton>
            )}

            {primaryActionLabel && (
              <CourtFlowButton
                type="button"
                variant="primary"
                onClick={onPrimaryAction}
                loading={loading}
              >
                {primaryActionLabel}
              </CourtFlowButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
