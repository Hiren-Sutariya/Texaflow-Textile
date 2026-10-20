"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, 
  RefreshCw, 
  Menu, 
  Languages, 
  ChevronDown, 
  Check, 
  Maximize2, 
  Minimize2, 
  AlertTriangle, 
  CheckCircle2, 
  X
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const pageTitles: Record<string, string> = {
  "/": "Owner Command Center",
  "/job-works": "Job Work Directory",
  "/job-works/new": "Create New Job Work Order",
  "/designs": "Design Library",
  "/inventory": "Company vs Party Stock Ledger",
  "/purchases": "Purchase Orders & Stock Shortage",
  "/payments": "Payments & Vouchers Ledger",
  "/expenses": "Factory & Overhead Expenses",
  "/worker-payout": "Worker Payout & Karigar Salary Ledger",
  "/oms-performance": "OMS Performance & Operation Engine",
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
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Notification dropdown state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state changes
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

  // Close dropdowns on outside click or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLangOpen(false);
        setIsNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelectLanguage = (lang: "en" | "gu") => {
    setLanguage(lang);
    setIsLangOpen(false);
  };

  let rawPageTitle = pageTitles[pathname];
  if (!rawPageTitle) {
    if (pathname.startsWith("/job-works/")) {
      rawPageTitle = "Job Work 360 View";
    } else {
      rawPageTitle = "Business Monitoring";
    }
  }
  const pageTitle = t(rawPageTitle);

  const handleRefresh = useCallback(() => {
    setIsSpinning(true);
    // Trigger smooth in-app soft remount & refresh
    window.dispatchEvent(new CustomEvent("app_smooth_refresh"));
    try {
      router.refresh();
    } catch {}

    setTimeout(() => {
      setIsSpinning(false);
    }, 600);
  }, [router]);

  // Intercept Cmd+R, Ctrl+R, F5 to prevent fast white blink and trigger smooth refresh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isRKey = e.key === "r" || e.key === "R" || e.code === "KeyR" || e.keyCode === 82;
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isF5 = e.key === "F5" || e.code === "F5" || e.keyCode === 116;

      if ((isRKey && isCmdOrCtrl) || isF5) {
        // If Shift is pressed (Cmd+Shift+R / Ctrl+Shift+R), allow native hard reload
        if (!e.shiftKey) {
          e.preventDefault();
          e.stopPropagation();
          handleRefresh();
        }
      }

      // Cmd+K to open Quick Action
      const isKKey = e.key === "k" || e.key === "K" || e.code === "KeyK";
      if (isKKey && isCmdOrCtrl) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("app_open_quick_create"));
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleRefresh]);

  return (
    <header className="h-14 border-b border-slate-200/80 bg-white px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs select-none">
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

      {/* Right Section: Quick Controls & Corner Language Selector */}
      <div className="flex items-center gap-2 sm:gap-2.5">

        {/* 3. Fullscreen Toggle Button - hidden on mobile screens */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden sm:flex h-9 w-9 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 rounded-xl items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          title={isFullscreen ? (language === "gu" ? "ફૂલ સ્ક્રીનમાંથી બહાર નીકળો" : "Exit Fullscreen") : (language === "gu" ? "ફૂલ સ્ક્રીન વ્યુ" : "Fullscreen View")}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-slate-700" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* 4. Smooth Refresh Button */}
        <button 
          type="button"
          onClick={handleRefresh}
          className="h-8.5 w-8.5 sm:h-9 sm:w-9 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/90 hover:border-blue-200 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
          title={language === "gu" ? "સ્મૂથ રિફ્રેશ (Cmd+R)" : "Smooth Refresh (Cmd+R)"}
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-500 ${isSpinning ? "animate-spin text-blue-600" : ""}`} />
        </button>

        {/* 5. Notification Bell Button with Interactive Popover */}
        <div className="relative" ref={notifDropdownRef}>
          <button 
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="relative h-8.5 w-8.5 sm:h-9 sm:w-9 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/90 hover:border-slate-300 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
            title={language === "gu" ? "સૂચનાઓ" : "Notifications"}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
          </button>

          {isNotifOpen && (
            <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-80 max-w-sm mx-auto sm:mx-0 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">{t("Notifications")}</span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">2 New</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto mt-1">
                <div className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50 p-1.5 rounded-xl transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs flex-1 min-w-0">
                    <p className="font-bold text-slate-900 leading-tight">Material Shortage: 1 PO</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Yarn supply required for Loom #4</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">15 min ago</span>
                  </div>
                </div>

                <div className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50 p-1.5 rounded-xl transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs flex-1 min-w-0">
                    <p className="font-bold text-slate-900 leading-tight">Shift-1 Production Complete</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">340 meters logged by Day Shift</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">1 hr ago</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Mark all as read
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 6. Subtle Vertical Divider */}
        <div className="h-5 w-[1px] bg-slate-200 mx-0.5" />

        {/* 7. Language Selector (English / ગુજરાતી) - AT THE FAR RIGHT CORNER */}
        <div className="relative" ref={langDropdownRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen((prev) => !prev)}
            className="h-9 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs select-none active:scale-98"
            title={language === "gu" ? "ભાષા પસંદ કરો" : "Select Language"}
          >
            <Languages className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-bold tracking-tight">
              {language === "gu" ? "ગુજરાતી" : "English"}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-blue-500 transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`} />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                {language === "gu" ? "ભાષા પસંદગી" : "Language"}
              </div>
              <button
                type="button"
                onClick={() => handleSelectLanguage("en")}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left ${
                  language === "en"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <span>English</span>
                </div>
                {language === "en" && <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage("gu")}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left ${
                  language === "gu"
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇮🇳</span>
                  <span>ગુજરાતી</span>
                </div>
                {language === "gu" && <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
