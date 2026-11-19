"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { CourtFlowButton } from "./CourtFlowButton";

export interface CourtFlowDrawerProps {
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
}

export const CourtFlowDrawer: React.FC<CourtFlowDrawerProps> = ({
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {children}
          </div>

          {/* Footer */}
          {(primaryActionLabel || secondaryActionLabel) && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5 shrink-0">
              {secondaryActionLabel && (
                <CourtFlowButton
                  variant="secondary"
                  onClick={onSecondaryAction || onClose}
                  disabled={loading}
                >
                  {secondaryActionLabel}
                </CourtFlowButton>
              )}

              {primaryActionLabel && (
                <CourtFlowButton
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
    </div>
  );
};
