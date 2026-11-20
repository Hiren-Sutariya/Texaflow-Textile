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
  FileText,
  X,
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
  Plus,
  HelpCircle,
  Sparkles
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
    groupTitle: "MAIN",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Parties", href: "/vendors", icon: Users, moduleKey: "parties" },
      { name: "Workers", href: "/employees", icon: UserCheck, moduleKey: "workers" },
      { name: "Attendance", href: "/hrms/attendance", icon: Clock, moduleKey: "attendance" },
      { name: "Worker Payout", href: "/worker-payout", icon: Wallet, moduleKey: "worker_payout" },
    ]
  },
  {
    groupTitle: "MANAGEMENT",
    items: [
      { name: "Expenses", href: "/expenses", icon: Receipt, moduleKey: "expenses" },
      { name: "Purchases", href: "/purchases", icon: ShoppingCart, moduleKey: "purchases" },
      { name: "Sales Challans", href: "/sales", icon: Truck, moduleKey: "sales_challans" },
      { name: "Sales Invoices", href: "/sales-invoices", icon: FileCheck, moduleKey: "sales_invoices" },
      { name: "Payments", href: "/payments", icon: CreditCard, moduleKey: "payments" },
      { name: "Day Book", href: "/daybook", icon: CalendarDays, moduleKey: "daybook" },
      { name: "Ledger", href: "/ledger", icon: BookOpen, moduleKey: "ledger" },
    ]
  },
  {
    groupTitle: "ADMINISTRATION",
    items: [
      { name: "Categories", href: "/categories", icon: Tags, moduleKey: "settings" },
      { name: "Recycle Bin", href: "/recycle-bin", icon: Trash2, moduleKey: "recycle_bin" },
      { name: "Settings", href: "/settings", icon: Settings, moduleKey: "settings" },
      { name: "Reports", href: "/reports", icon: BarChart3, moduleKey: "reports", isUpcoming: true },
    ]
  }
];

const platformMenuGroups: MenuGroup[] = [
  {
    groupTitle: "MAIN",
    items: [
      { name: "Dashboard", href: "/platform", icon: LayoutDashboard },
      { name: "Companies", href: "/platform/companies", icon: Building2 },
      { name: "Users", href: "/platform/users", icon: Users },
      { name: "Subscriptions", href: "/platform/subscriptions", icon: CreditCard },
    ]
  },
  {
    groupTitle: "MANAGEMENT",
    items: [
      { name: "Billing & Ledger", href: "/platform/billing", icon: Receipt },
      { name: "Plans & Pricing", href: "/platform/plans", icon: Tags },
      { name: "Permission Matrix", href: "/platform/permissions", icon: ShieldCheck },
      { name: "Module Management", href: "/platform/modules", icon: Boxes },
    ]
  },
  {
    groupTitle: "ADMINISTRATION",
    items: [
      { name: "Customer Support", href: "/platform/support", icon: Headphones },
      { name: "Audit Logs", href: "/platform/audit-logs", icon: FileText },
      { name: "Platform Settings", href: "/platform/settings", icon: Settings },
    ]
  }
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

  const [liveUpdatedFirm, setLiveUpdatedFirm] = useState<string>("");
  const [liveUpdatedOwner, setLiveUpdatedOwner] = useState<string>("");
  const [activeModules, setActiveModules] = useState<Record<string, boolean> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const clientCid = user?.companyId || (typeof window !== "undefined" ? getStoredCompanyId() : "");
  const cid = clientCid || serverCompanyId || "";

  const defaultFirm = cid === "comp-002"
    ? "Om Sai Enterprise"
    : (cid === "comp-001" ? "Shiv Creation" : (serverFirmName || ""));
  const defaultOwner = cid === "comp-002"
    ? "Nilesh Sutariya"
    : (cid === "comp-001" ? "Hiren Sutariya" : (serverOwnerName || ""));

  let displayedFirmName = defaultFirm;
  if (liveUpdatedFirm && liveUpdatedFirm.trim()) {
    displayedFirmName = liveUpdatedFirm.trim();
  } else if (user?.firmName && user.firmName.trim() && user.firmName.toLowerCase() !== "company") {
    displayedFirmName = user.firmName.trim();
  } else if (typeof window !== "undefined") {
    const stored = getStoredFirmName();
    if (stored && stored.toLowerCase() !== "company") displayedFirmName = stored;
  } else if (serverFirmName && serverFirmName.trim() && serverFirmName.toLowerCase() !== "company") {
    displayedFirmName = serverFirmName.trim();
  }

  if (cid === "comp-001" && (displayedFirmName.toLowerCase().includes("om sai") || !displayedFirmName)) {
    displayedFirmName = "Shiv Creation";
  } else if (cid === "comp-002" && (displayedFirmName.toLowerCase().includes("shiv") || !displayedFirmName)) {
    displayedFirmName = "Om Sai Enterprise";
  }

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

  if (cid === "comp-001" && (displayedUserName.toLowerCase().includes("nilesh") || displayedUserName.toLowerCase() === "owner" || !displayedUserName)) {
    displayedUserName = "Hiren Sutariya";
  } else if (cid === "comp-002" && (displayedUserName.toLowerCase().includes("hiren") || displayedUserName.toLowerCase() === "owner" || !displayedUserName)) {
    displayedUserName = "Nilesh Sutariya";
  }

  const isPlatformMode = pathname.startsWith("/platform");

  const userInitials = isPlatformMode
    ? "SA"
    : displayedUserName
      ? displayedUserName.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase()
      : (cid === "comp-002" ? "NS" : (cid === "comp-001" ? "HS" : ""));

  useEffect(() => {
    if (typeof window !== "undefined" && cid && !isPlatformMode) {
      setTenantCookie(cid, displayedFirmName, displayedUserName);
    }
  }, [cid, displayedFirmName, displayedUserName, isPlatformMode]);

  const renderNavContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white text-slate-800">
      {/* Brand Header - Leveled with Navbar header (h-16, border-b border-slate-200/80) */}
      <div className="h-16 px-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-white">
        <Link
          href={isPlatformMode ? "/platform" : "/"}
          prefetch={true}
          onClick={() => {
            if (isMobile) onClose?.();
          }}
          className="flex items-center gap-2.5 overflow-hidden group outline-none"
        >
          {/* Brand Icon */}
          <div className="w-8.5 h-8.5 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 tracking-wider">
            {isPlatformMode ? "SA" : "TF"}
          </div>
          <div className="truncate">
            <h1 className="font-extrabold text-slate-900 text-sm tracking-tight leading-none truncate flex items-center gap-1.5">
              <span>{isPlatformMode ? "SaaS Platform" : "TexaFlow"}</span>
              {isPlatformMode && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Admin
                </span>
              )}
            </h1>
            <p className="text-[10px] font-medium text-slate-500 tracking-wide mt-1 truncate">
              {isPlatformMode ? "Central Control Plane" : displayedFirmName}
            </p>
          </div>
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List in exact Om Sai ERP white & blue style */}
      <nav suppressHydrationWarning className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-4">
        {/* Switcher Button for SuperAdmin */}
        {mounted && user?.role === "SuperAdmin" && (
          <div className="px-0.5">
            {isPlatformMode ? (
              <Link
                href="/vendors"
                onClick={() => isMobile && onClose?.()}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200/80 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Switch to Tenant ERP</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-500" />
              </Link>
            ) : (
              <Link
                href="/platform"
                onClick={() => isMobile && onClose?.()}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>SaaS Super Admin</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-blue-100" />
              </Link>
            )}
          </div>
        )}

        {/* Menu Groups */}
        {(isPlatformMode ? platformMenuGroups : menuGroups).map((group) => (
          <div key={group.groupTitle} className="space-y-1">
            <p className="px-2.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
              {group.groupTitle}
            </p>
            <div className="space-y-0.5 pt-0.5">
              {group.items
                ?.filter((sub) => {
                  if (user?.role === "SuperAdmin" || isPlatformMode) return true;
                  if (!sub.moduleKey) return true;
                  if (activeModules && activeModules[sub.moduleKey] === false) return false;
                  return true;
                })
                .map((sub) => {
                  const isSubActive = isPlatformMode
                    ? (sub.href === "/platform"
                      ? pathname === "/platform"
                      : pathname === sub.href || pathname.startsWith(sub.href + "/"))
                    : pathname === sub.href || (sub.href !== "/" && pathname.startsWith(sub.href + "/"));
                  const SubIcon = sub.icon;

                  return (
                    <Link
                      key={sub.name}
                      href={sub.href}
                      prefetch={true}
                      onClick={() => isMobile && onClose?.()}
                      className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 select-none ${
                        isSubActive
                          ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                          : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-medium hover:translate-x-0.5"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ${
                          isSubActive
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600"
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate flex-1">{t(sub.name)}</span>
                      {sub.isUpcoming && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                          {t("Upcoming")}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Tenant Switcher & User Profile */}
      <div className="p-3 border-t border-slate-200 bg-white space-y-2 shrink-0">
        {/* User Card */}
        <div className="flex items-center justify-between px-2 py-1 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center shrink-0">
              {isPlatformMode ? "SA" : userInitials}
            </div>
            <div className="truncate">
              <p className="font-bold text-slate-900 truncate text-xs">
                {isPlatformMode ? "Super Admin" : displayedUserName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {isPlatformMode ? "Platform Administrator" : displayedFirmName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Help & Support */}
        <Link
          href="/platform/support"
          className="flex items-center gap-2 px-2 pt-0.5 text-[11px] text-slate-500 hover:text-blue-600 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Help and support</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 h-screen sticky top-0 z-40 border-r border-slate-200/80 bg-white">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 bg-white">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
