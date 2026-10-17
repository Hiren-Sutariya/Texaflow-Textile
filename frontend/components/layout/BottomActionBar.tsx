"use client";

import React from "react";

export interface BottomActionBarProps {
  /** Optional content on the left (e.g. Synced status or custom buttons) */
  leftContent?: React.ReactNode;
  /** Optional content on the right (e.g. Cancel, Save buttons) */
  rightContent?: React.ReactNode;
  /** Full custom children override */
  children?: React.ReactNode;
  /** Extra CSS classes */
  className?: string;
  /** Quick flag to show the standard pulsing 'Synced' badge */
  showSynced?: boolean;
  /** Custom label for synced badge (default: 'Synced') */
  syncedText?: string;
}

/**
 * Standard Universal Bottom Action Bar
 * 
 * - Perfectly aligned & leveled with the Sidebar bottom profile footer (h-[57px], border-t border-slate-200, bottom-0)
 * - Full-width spanning from the sidebar edge (lg:left-[250px]) to the right screen edge (right-0)
 * - On mobile/tablet (< lg), spans 100% full width (left-0 right-0)
 * - Single source of truth for all form / action bars across the entire application
 */
import { useLanguage } from "@/context/LanguageContext";

export function BottomActionBar({
  leftContent,
  rightContent,
  children,
  className = "",
  showSynced = false,
  syncedText = "Synced",
}: BottomActionBarProps) {
  const { t } = useLanguage();

  return (
    <div
      className={`fixed bottom-0 left-0 lg:left-[250px] right-0 z-40 h-[57px] bg-white border-t border-slate-200 px-3 sm:px-6 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.06)] gap-2 ${className}`}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-slate-500 shrink-0">
            {showSynced && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                <span className="hidden xs:inline truncate text-[11px] sm:text-xs">{t(syncedText)}</span>
              </>
            )}
            {leftContent}
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {rightContent}
          </div>
        </>
      )}
    </div>
  );
}

export default BottomActionBar;
