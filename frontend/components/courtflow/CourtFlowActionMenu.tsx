"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Eye, Pencil, XCircle, Trash2 } from "lucide-react";

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  onClick: () => void;
}

interface CourtFlowActionMenuProps {
  items?: ActionMenuItem[];
  onView?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  customActions?: ActionMenuItem[];
  align?: "left" | "right";
}

export const CourtFlowActionMenu: React.FC<CourtFlowActionMenuProps> = ({
  items,
  onView,
  onEdit,
  onCancel,
  onDelete,
  customActions,
  align = "right",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Build standard actions matching CourtFlow Image 9 & 10
  const actionList: ActionMenuItem[] = items || [
    ...(onView
      ? [
          {
            label: "View Details",
            icon: <Eye className="w-3.5 h-3.5 text-slate-500" />,
            onClick: () => {
              setIsOpen(false);
              onView();
            },
          },
        ]
      : []),
    ...(onEdit
      ? [
          {
            label: "Edit",
            icon: <Pencil className="w-3.5 h-3.5 text-slate-500" />,
            onClick: () => {
              setIsOpen(false);
              onEdit();
            },
          },
        ]
      : []),
    ...(onCancel
      ? [
          {
            label: "Cancel",
            icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
            variant: "danger" as const,
            onClick: () => {
              setIsOpen(false);
              onCancel();
            },
          },
        ]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: <Trash2 className="w-3.5 h-3.5 text-rose-500" />,
            variant: "danger" as const,
            onClick: () => {
              setIsOpen(false);
              onDelete();
            },
          },
        ]
      : []),
    ...(customActions || []).map((action) => ({
      ...action,
      onClick: () => {
        setIsOpen(false);
        action.onClick();
      },
    })),
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1 w-44 rounded-xl bg-white shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100`}
        >
          {actionList.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
              }}
              className={`w-full text-left px-3.5 py-2 text-xs flex items-center gap-2.5 transition-colors ${
                item.variant === "danger"
                  ? "text-rose-600 hover:bg-rose-50/80 font-medium"
                  : "text-slate-700 hover:bg-slate-50 font-medium"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
