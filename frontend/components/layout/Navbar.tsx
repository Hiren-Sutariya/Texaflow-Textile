"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bell, 
  RefreshCw, 
  Menu, 
  Languages, 
  ChevronDown, 
  Check, 
  Maximize2, 
  Minimize2, 
  Plus,
  Search,
  Calendar,
  UserPlus,
  FileText
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/platform": "Dashboard",
  "/platform/companies": "Companies",
  "/platform/users": "Users",
  "/platform/subscriptions": "Subscriptions",
  "/platform/billing": "Billing & Transactions",
  "/platform/plans": "Plans & Pricing",
  "/platform/modules": "Module Management",
  "/platform/permissions": "Permission Management",
  "/platform/support": "Support Management",
  "/platform/audit-logs": "Audit Logs",
  "/platform/settings": "Platform Settings",
  "/parties": "Parties Directory",
  "/vendors": "Parties Directory",
  "/employees": "Workers Directory",
  "/expenses": "Expenses",
  "/purchases": "Purchases",
  "/sales": "Sales Challans",
  "/sales-invoices": "Sales Invoices",
  "/payments": "Payments",
  "/daybook": "Day Book",
  "/ledger": "Ledger",
  "/categories": "Categories",
  "/recycle-bin": "Recycle Bin",
  "/settings": "Settings",
};

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  let rawPageTitle = pageTitles[pathname] || "Dashboard";
  const pageTitle = t(rawPageTitle);

  const handleRefresh = useCallback(() => {
    setIsSpinning(true);
    window.dispatchEvent(new CustomEvent("app_smooth_refresh"));
    try {
      router.refresh();
    } catch {}
    setTimeout(() => setIsSpinning(false), 600);
  }, [router]);

  const isPlatform = pathname.startsWith("/platform");

  // Determine dynamic primary action button matching the active page with NO double plus
  let primaryAction = {
    label: "New Entry",
    href: "/vendors",
    onClick: () => window.dispatchEvent(new CustomEvent("app_open_quick_create"))
  };

  if (isPlatform) {
    primaryAction = {
      label: "Register Company",
      href: "/platform/companies",
      onClick: () => {}
    };
  } else if (pathname.startsWith("/expenses")) {
    primaryAction = {
      label: "New Expense",
      href: "/expenses/new",
      onClick: () => {}
    };
  } else if (pathname.startsWith("/purchases")) {
    primaryAction = {
      label: "New Purchase Bill",
      href: "/purchases/new",
      onClick: () => {}
    };
  } else if (pathname.startsWith("/sales-invoices")) {
    primaryAction = {
      label: "New Invoice",
      href: "/sales-invoices/new",
      onClick: () => {}
    };
  } else if (pathname.startsWith("/sales")) {
    primaryAction = {
      label: "New Challan",
      href: "/sales/new",
      onClick: () => {}
    };
  } else if (pathname.startsWith("/vendors") || pathname.startsWith("/parties")) {
    primaryAction = {
      label: "New Party",
      href: "/vendors",
      onClick: () => window.dispatchEvent(new CustomEvent("app_open_add_vendor"))
    };
  } else if (pathname.startsWith("/employees")) {
    primaryAction = {
      label: "New Worker",
      href: "/employees",
      onClick: () => window.dispatchEvent(new CustomEvent("app_open_add_employee"))
    };
  }

  return (
    <header className="h-16 border-b border-[#eaecf0] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left side: Mobile menu toggle + Page Title + Action Pills */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title */}
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-none truncate">
          {pageTitle}
        </h1>

        {/* Quick Action Pills matching Image 4 */}
        <div className="hidden md:flex items-center gap-2 pl-2">
          {isPlatform ? (
            <>
              <Link
                href="/platform/companies"
                className="h-8.5 px-3.5 rounded-xl bg-[#12b76a] hover:bg-[#0e9f5d] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Register Company</span>
              </Link>
              <Link
                href="/platform/users"
                className="h-8.5 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>Add User</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href={primaryAction.href}
                onClick={primaryAction.onClick}
                className="h-8.5 px-3.5 rounded-xl bg-[#12b76a] hover:bg-[#0e9f5d] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{primaryAction.label}</span>
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("app_open_quick_create"))}
                className="h-8.5 px-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Quick Entry</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right side: Search Input + Notification Bell + Refresh/Fullscreen/Language */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative hidden sm:block w-48 md:w-60">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-9 rounded-xl border border-slate-200 bg-white pl-8.5 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>

        <button
          type="button"
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        <div className="relative" ref={langDropdownRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="h-9 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Languages className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">{language === "gu" ? "ગુજરાતી" : "English"}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
          {isLangOpen && (
            <div className="absolute right-0 mt-1 w-32 rounded-xl bg-white shadow-xl border border-slate-200 py-1 z-50">
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setIsLangOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>English</span>
                {language === "en" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("gu");
                  setIsLangOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>ગુજરાતી</span>
                {language === "gu" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden sm:flex w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 items-center justify-center text-slate-600 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={handleRefresh}
          className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isSpinning ? "animate-spin text-emerald-600" : ""}`} />
        </button>
      </div>
    </header>
  );
}
