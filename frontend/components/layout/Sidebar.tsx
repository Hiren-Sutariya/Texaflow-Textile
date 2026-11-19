"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  ShoppingCart, 
  CreditCard, 
  Receipt, 
  UserCheck, 
  BarChart3, 
  Settings,
  Palette,
  FileText,
  SquarePen,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Wallet,
  TrendingUp,
  LogOut,
  BookOpen,
  Tags,
  Trash2,
  Truck,
  FileCheck,
  Clock,
  UserCog,
  CalendarDays,
  ShieldCheck,
  LayoutDashboard,
  Building2,
  Boxes,
  Headphones,
  Plus
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredFirmName, getStoredUserName, getStoredCompanyId } from "@/lib/tenantStorage";
import { setTenantCookie } from "@/lib/cookieStorage";
import { API_BASE_URL } from "@/lib/api";

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  moduleKey?: string;
  isUpcoming?: boolean;
}

interface MenuGroup {
  groupTitle: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    groupTitle: "Masters",
    items: [
      { name: "Parties", href: "/vendors", icon: Users, moduleKey: "parties" },
    ]
  },
  {
    groupTitle: "HRMS & Payroll",
    items: [
      { name: "Workers", href: "/employees", icon: UserCheck, moduleKey: "workers" },
      { name: "Attendance", href: "/hrms/attendance", icon: Clock, moduleKey: "attendance" },
      { name: "Worker Payout", href: "/worker-payout", icon: Wallet, moduleKey: "worker_payout" },
      { name: "Worker Portal", href: "/worker-portal", icon: UserCog, moduleKey: "workers" },
    ]
  },
  {
    groupTitle: "Finance",
    items: [
      { name: "Expenses", href: "/expenses", icon: Receipt, moduleKey: "expenses" },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart, moduleKey: "purchases" },
      { name: "Sales Challans", href: "/sales", icon: Truck, moduleKey: "sales_challans" },
      { name: "Sales Invoices", href: "/sales-invoices", icon: FileCheck, moduleKey: "sales_invoices" },
      { name: "Invoices", href: "/invoices", icon: FileText, moduleKey: "sales_invoices" },
      { name: "Payments", href: "/payments", icon: CreditCard, moduleKey: "payments" },
      { name: "Day Book", href: "/daybook", icon: CalendarDays, moduleKey: "daybook" },
      { name: "Ledger", href: "/ledger", icon: BookOpen, moduleKey: "ledger" },
    ]
  },
  {
    groupTitle: "Settings",
    items: [
      { name: "Categories", href: "/categories", icon: Tags, moduleKey: "settings" },
      { name: "Recycle Bin", href: "/recycle-bin", icon: Trash2, moduleKey: "recycle_bin" },
      { name: "Settings", href: "/settings", icon: Settings, moduleKey: "settings" },
    ]
  },
  {
    groupTitle: "Upcoming Features",
    items: [
      { name: "OMS Performance", href: "/oms-performance", icon: TrendingUp, isUpcoming: true },
      { name: "Reports", href: "/reports", icon: BarChart3, moduleKey: "reports", isUpcoming: true },
    ]
  }
];

const platformMenuGroups: MenuGroup[] = [
  {
    groupTitle: "Platform Core",
    items: [
      { name: "Dashboard", href: "/platform", icon: LayoutDashboard },
      { name: "Companies", href: "/platform/companies", icon: Building2 },
      { name: "Users", href: "/platform/users", icon: Users },
      { name: "Subscriptions", href: "/platform/subscriptions", icon: CreditCard },
    ]
  },
  {
    groupTitle: "Billing & Revenue",
    items: [
      { name: "Billing & Ledger", href: "/platform/billing", icon: Receipt },
      { name: "Plans & Pricing", href: "/platform/plans", icon: Tags },
    ]
  },
  {
    groupTitle: "Access & Governance",
    items: [
      { name: "Permission Matrix", href: "/platform/permissions", icon: ShieldCheck },
      { name: "Module Management", href: "/platform/modules", icon: Boxes },
      { name: "Audit Logs", href: "/platform/audit-logs", icon: FileText },
    ]
  },
  {
    groupTitle: "Operations & Support",
    items: [
      { name: "Customer Support", href: "/platform/support", icon: Headphones },
      { name: "Platform Settings", href: "/platform/settings", icon: Settings },
    ]
  }
];

const quickCreateOptions = [
  { title: "Material Purchase", href: "/purchases/new", icon: ShoppingCart, color: "bg-blue-50 text-blue-600 border-blue-100" },
  { title: "Sales Challan", href: "/sales/new", icon: Truck, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { title: "Sales Invoice", href: "/sales-invoices/new", icon: FileCheck, color: "bg-cyan-50 text-cyan-600 border-cyan-100" },
  { title: "Company Expense", href: "/expenses/new", icon: Receipt, color: "bg-rose-50 text-rose-600 border-rose-100" },
  { title: "Payment Voucher", href: "/payments/new", icon: CreditCard, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { title: "Worker Payout", href: "/worker-payout", icon: Wallet, color: "bg-amber-50 text-amber-700 border-amber-100" },
  { title: "Parties", href: "/vendors", icon: Users, color: "bg-purple-50 text-purple-600 border-purple-100" }
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
  serverCompanyId?: string;
  serverFirmName?: string;
  serverOwnerName?: string;
}

export function Sidebar({ 
  mobileOpen = false, 
  onClose,
  serverCompanyId,
  serverFirmName,
  serverOwnerName
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const [showQuickModal, setShowQuickModal] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Masters: true,
    "HRMS & Payroll": true,
    Finance: true,
    Settings: true,
    "Upcoming Features": false,
    "Platform Core": true,
    "Billing & Revenue": true,
    "Access & Governance": true,
    "Operations & Support": true,
  });

  // Auto-expand "Upcoming Features" if current route matches an upcoming item
  useEffect(() => {
    const isUpcomingActive = ["/designs", "/worker-payout", "/oms-performance", "/reports"].some(
      (path) => pathname === path || (path !== "/" && pathname.startsWith(path + "/"))
    );
    if (isUpcomingActive) {
      setOpenGroups((prev) => ({ ...prev, "Upcoming Features": true }));
    }
  }, [pathname]);

  const handleOptionClick = (href: string) => {
    setShowQuickModal(false);
    onClose?.();
    router.push(href);
  };

  useEffect(() => {
    const handleOpenQuickModal = () => setShowQuickModal(true);
    window.addEventListener("app_open_quick_create", handleOpenQuickModal);
    return () => window.removeEventListener("app_open_quick_create", handleOpenQuickModal);
  }, []);

  // Dynamic Company Brand Name & Owner Name (Syncs with Settings in Real-Time with ZERO delay on refresh)
  const [liveUpdatedFirm, setLiveUpdatedFirm] = useState<string>("");
  const [liveUpdatedOwner, setLiveUpdatedOwner] = useState<string>("");
  const [activeModules, setActiveModules] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    async function loadActiveModules() {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("auth_token");
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/auth/my-permissions`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.modules) {
            setActiveModules(data.modules);
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }
    loadActiveModules();
  }, [user?.companyId]);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      const updateCid = e?.detail?.company_id;
      const currentCid = user?.companyId || getStoredCompanyId() || serverCompanyId;
      if (updateCid && updateCid !== currentCid) return;

      if (e?.detail?.company_name?.trim()) {
        setLiveUpdatedFirm(e.detail.company_name.trim());
      }
      if (e?.detail?.owner_name?.trim()) {
        setLiveUpdatedOwner(e.detail.owner_name.trim());
      }
    };

    window.addEventListener("app_settings_update", handleSettingsUpdate);
    return () => {
      window.removeEventListener("app_settings_update", handleSettingsUpdate);
    };
  }, [user?.companyId, serverCompanyId]);

  // Client-side active CID vs Server-side SSR cookie CID
  const clientCid = user?.companyId || (typeof window !== "undefined" ? getStoredCompanyId() : "");
  const cid = clientCid || serverCompanyId || "";

  // Base defaults per company ID - NEVER fall back to comp-001 if unknown or Om Sai
  const defaultFirm = cid === "comp-002"
    ? "Om Sai Enterprise"
    : (cid === "comp-001" ? "Shiv Creation" : (serverFirmName || ""));
  const defaultOwner = cid === "comp-002"
    ? "Nilesh Sutariya"
    : (cid === "comp-001" ? "Hiren Sutariya" : (serverOwnerName || ""));

  // Determine active displayed firm name strictly isolated per tenant
  let displayedFirmName = defaultFirm;
  if (liveUpdatedFirm && liveUpdatedFirm.trim()) {
    displayedFirmName = liveUpdatedFirm.trim();
  } else if (user?.firmName && user.firmName.trim() && user.firmName.toLowerCase() !== "company" && !user.firmName.toLowerCase().includes("texaflow")) {
    displayedFirmName = user.firmName.trim();
  } else if (typeof window !== "undefined") {
    const stored = getStoredFirmName();
    if (stored && stored.toLowerCase() !== "company") displayedFirmName = stored;
  } else if (serverFirmName && serverFirmName.trim() && serverFirmName.toLowerCase() !== "company" && !serverFirmName.toLowerCase().includes("texaflow")) {
    displayedFirmName = serverFirmName.trim();
  }

  // Strict cross-tenant sanitization
  if (cid === "comp-001" && (displayedFirmName.toLowerCase().includes("om sai") || !displayedFirmName)) {
    displayedFirmName = "Shiv Creation";
  } else if (cid === "comp-002" && (displayedFirmName.toLowerCase().includes("shiv") || !displayedFirmName)) {
    displayedFirmName = "Om Sai Enterprise";
  }

  // Determine active displayed user name strictly isolated per tenant
  let displayedUserName = defaultOwner;
  if (liveUpdatedOwner && liveUpdatedOwner.trim()) {
    displayedUserName = liveUpdatedOwner.trim();
  } else if (user?.name && user.name.trim() && user.name !== "Factory Admin" && user.name.toLowerCase() !== "owner") {
    displayedUserName = user.name.trim();
  } else if (typeof window !== "undefined") {
    const stored = getStoredUserName();
    if (stored && stored !== "Factory Admin" && stored.toLowerCase() !== "owner") displayedUserName = stored;
  } else if (serverOwnerName && serverOwnerName.trim() && serverOwnerName !== "Factory Admin" && serverOwnerName.toLowerCase() !== "owner") {
    displayedUserName = serverOwnerName.trim();
  }

  // Strict cross-tenant sanitization
  if (cid === "comp-001" && (displayedUserName.toLowerCase().includes("nilesh") || displayedUserName.toLowerCase() === "owner" || !displayedUserName)) {
    displayedUserName = "Hiren Sutariya";
  } else if (cid === "comp-002" && (displayedUserName.toLowerCase().includes("hiren") || displayedUserName.toLowerCase() === "owner" || !displayedUserName)) {
    displayedUserName = "Nilesh Sutariya";
  }

  const isPlatformMode = pathname.startsWith("/platform");
  if (isPlatformMode) {
    displayedFirmName = "TexaFlow SaaS";
    displayedUserName = "Super Administrator";
  }

  const brandInitials = isPlatformMode
    ? "SA"
    : displayedFirmName
      ? displayedFirmName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase()
      : (cid === "comp-002" ? "OS" : (cid === "comp-001" ? "SC" : ""));

  const userInitials = isPlatformMode
    ? "SA"
    : displayedUserName
      ? displayedUserName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase()
      : (cid === "comp-002" ? "NS" : (cid === "comp-001" ? "HS" : ""));

  // Keep cookies constantly in sync in background whenever displayed tenant is known
  useEffect(() => {
    if (typeof window !== "undefined" && cid && !isPlatformMode) {
      setTenantCookie(cid, displayedFirmName, displayedUserName);
    }
  }, [cid, displayedFirmName, displayedUserName, isPlatformMode]);

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header - Perfectly leveled with Navbar header (h-14, border-b border-slate-200/80) */}
      <div suppressHydrationWarning className="h-14 px-3 border-b border-slate-200/80 bg-white relative flex items-center justify-between shrink-0">
        <Link 
          href={isPlatformMode ? "/platform" : "/"}
          prefetch={true}
          onClick={() => {
            if (isMobile) onClose?.();
          }}
          className="flex items-center gap-2.5 overflow-hidden py-1 px-1.5 rounded-xl hover:bg-slate-50 transition-colors w-full group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          title={isPlatformMode ? "SaaS Platform Command Center" : "Return to Main Dashboard"}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center font-black text-sm justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform uppercase">
            {brandInitials}
          </div>
          <div className="truncate">
            <h1 className="font-extrabold text-slate-900 text-xs tracking-tight leading-tight truncate uppercase">
              {displayedFirmName}
            </h1>
            <p className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{isPlatformMode ? "SaaS Super Admin" : "TexaFlow Textile"}</span>
            </p>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-1"
            title="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List - Ultra Clean Linear / Vercel Style */}
      <nav className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-3.5">
        {/* SuperAdmin Quick Access Switcher */}
        {isPlatformMode ? (
          <div>
            <Link
              href="/vendors"
              onClick={() => {
                if (isMobile) onClose?.();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-all border border-blue-200/80 shadow-2xs group"
              title="Switch to Tenant ERP Mode"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  🏢
                </div>
                <span className="truncate">Switch to Tenant ERP</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ) : (
          user?.role === "SuperAdmin" && (
            <div>
              <Link
                href="/platform"
                onClick={() => {
                  if (isMobile) onClose?.();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 hover:from-purple-800 hover:to-indigo-900 text-white text-xs font-bold shadow-md transition-all group border border-purple-400/30"
                title="Switch to SaaS Platform Administration Console"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="truncate">Open Super Admin Panel</span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/25 text-white shrink-0 flex items-center gap-1">
                  <span>Console</span> ➔
                </span>
              </Link>
            </div>
          )
        )}

        {/* Primary Action Button */}
        <div>
          {isPlatformMode ? (
            <Link
              href="/platform/companies"
              onClick={() => {
                if (isMobile) onClose?.();
              }}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold shadow-2xs transition-all hover:border-blue-400 hover:text-blue-700 group cursor-pointer outline-none focus:outline-none"
            >
              <Plus className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
              <span>Register Enterprise</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowQuickModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold shadow-2xs transition-all hover:border-blue-400 hover:text-blue-700 group cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            >
              <SquarePen className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
              <span>{t("Create new service")}</span>
            </button>
          )}
        </div>

        {/* Category Sections */}
        <div className="space-y-4 pt-1">
          {(isPlatformMode ? platformMenuGroups : menuGroups).map((group) => {
            const groupKey = group.groupTitle;
            const isOpen = openGroups[groupKey] ?? true;

            const toggleGroup = () => {
              setOpenGroups((prev) => ({
                ...prev,
                [groupKey]: !isOpen
              }));
            };

            return (
              <div key={group.groupTitle} className="space-y-1">
                {/* Category Dropdown Header */}
                <button
                  type="button"
                  onClick={toggleGroup}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all group/hdr cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ${
                    group.groupTitle === "Upcoming Features"
                      ? "text-amber-700 hover:text-amber-800 bg-amber-50/60 hover:bg-amber-100/60 border border-amber-200/70 my-1"
                      : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{t(group.groupTitle)}</span>
                    {group.groupTitle === "Upcoming Features" && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300/80">
                        {group.items?.length || 5}
                      </span>
                    )}
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      group.groupTitle === "Upcoming Features"
                        ? "text-amber-600 group-hover/hdr:text-amber-800"
                        : "text-slate-400 group-hover/hdr:text-slate-600"
                    } ${isOpen ? "rotate-0" : "-rotate-90"}`}
                  />
                </button>

                {/* Menu Items List Dropdown */}
                {isOpen && (
                  <div className="space-y-0.5 pt-0.5 animate-in fade-in duration-150">
                    {group.items?.filter((sub) => {
                      if (user?.role === "SuperAdmin" || isPlatformMode) return true;
                      if (!sub.moduleKey) return true;
                      if (activeModules && activeModules[sub.moduleKey] === false) return false;
                      return true;
                    }).map((sub) => {
                      const isSubActive = isPlatformMode
                        ? (sub.href === "/platform" ? pathname === "/platform" : pathname === sub.href || pathname.startsWith(sub.href + "/"))
                        : (pathname === sub.href || (sub.href !== "/" && pathname.startsWith(sub.href + "/")));
                      const SubIcon = sub.icon;

                      return (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          prefetch={true}
                          onClick={() => {
                            if (isMobile) onClose?.();
                          }}
                          className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-200 ease-in-out outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 select-none ${
                            isSubActive
                              ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                              : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-semibold hover:translate-x-0.5"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ease-in-out shrink-0 ${
                              isSubActive
                                ? "bg-blue-600 text-white shadow-2xs"
                                : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                            }`}
                          >
                            <SubIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate text-xs flex-1">{t(sub.name)}</span>
                          {sub.isUpcoming && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                              {t("Upcoming")}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer - Solidly rendered with zero blinking on refresh */}
      <div suppressHydrationWarning className="h-[57px] px-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center border border-blue-200 shrink-0">
            {isPlatformMode || user?.role === "SuperAdmin" ? "SA" : userInitials}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 truncate leading-none">
              {isPlatformMode || user?.role === "SuperAdmin" ? "Super Administrator" : displayedUserName}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
              {t(isPlatformMode || user?.role === "SuperAdmin" ? "SaaS Super Administrator" : (user?.roleTitle || (user?.role === "Manager" ? "Factory Manager" : user?.role === "Accounts" ? "Accounts Officer" : "Proprietor & Director")))}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
          title={t("Log Out")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* 1. DESKTOP PERMANENT SIDEBAR (Visible on lg screens and up) */}
      <aside className="hidden lg:flex w-[250px] bg-white border-r border-slate-200/80 flex-col h-screen sticky top-0 select-none z-20 shrink-0">
        {renderNavContent(false)}
      </aside>

      {/* 2. MOBILE & TABLET SLIDE-OVER DRAWER (Visible below lg screens) */}
      {mobileOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200" 
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[270px] max-w-[85vw] bg-white border-r border-slate-200 flex flex-col h-full shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out select-none ${
          mobileOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
        }`}
      >
        {renderNavContent(true)}
      </aside>

      {/* Linear / Vercel Ultra-Clean Quick Create Selection Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">{t("Create New Record")}</h2>
              </div>
              <button
                onClick={() => setShowQuickModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {quickCreateOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.title}
                    onClick={() => handleOptionClick(opt.href)}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/70 hover:border-blue-300 transition-all flex flex-col items-center text-center space-y-2 group"
                  >
                    <div className={`p-2 rounded-lg border ${opt.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 group-hover:text-blue-700 transition-colors leading-tight">
                      {t(opt.title)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
