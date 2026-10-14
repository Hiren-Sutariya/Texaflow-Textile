"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, AlertCircle, RefreshCw, LayoutGrid, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Owner Command Center",
  "/job-works": "Job Work Directory",
  "/job-works/new": "Create New Job Work Order",
  "/production": "Production Floor & Daily Shift Entry",
  "/designs": "Design Library",
  "/inventory": "Company vs Party Stock Ledger",
  "/purchases": "Purchase Orders & Stock Shortage",
  "/dispatches": "Dispatches & Gate Passes",
  "/payments": "Payments & Vouchers Ledger",
  "/expenses": "Factory & Overhead Expenses",
  "/worker-payout": "Worker Payout & Karigar Salary Ledger",
  "/oms-performance": "OMS Performance & Operation Engine",
  "/orders": "Orders Directory",
  "/parties": "Parties Directory",
  "/vendors": "Vendor Master",
  "/employees": "Staff & Karigar Directory",
  "/tasks": "Tasks & Audit Proof Logs",
  "/reports": "Reports & Business Analytics",
  "/documents": "Digital Document Repository",
  "/settings": "System & Company Settings"
};

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);

  let pageTitle = pageTitles[pathname];
  if (!pageTitle) {
    if (pathname.startsWith("/job-works/")) {
      pageTitle = "Job Work 360 View";
    } else {
      pageTitle = "Business Monitoring";
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true);
    // 1. Dispatch custom event for main content area (2nd image) to refresh
    window.dispatchEvent(new CustomEvent("app_refresh_content"));
    // 2. Dispatch data update for all data-fetching pages
    window.dispatchEvent(new Event("app_data_update"));

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <header className="h-14 border-b border-slate-200/80 bg-white px-3 sm:px-5 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
      {/* Mobile Menu Button + Single Authoritative Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-none truncate">
          {pageTitle}
        </h1>
      </div>

      {/* Right Section: Quick Controls */}
      <div className="flex items-center gap-3">
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50/80 border border-amber-200 rounded-full text-xs font-semibold text-amber-800">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
          <span>Material Shortage: 1 PO</span>
        </div>

        <button 
          type="button"
          onClick={handleRefresh}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
          title="Refresh Data (Soft Refresh)"
        >
          <RefreshCw className={`w-3.5 h-3.5 transition-transform ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
        </button>

        <button className="relative p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </header>
  );
}
