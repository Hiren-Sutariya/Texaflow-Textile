"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  Briefcase, 
  Package, 
  Factory, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  Receipt, 
  UserCheck, 
  Handshake, 
  BarChart3, 
  CheckSquare, 
  Settings,
  Palette,
  PieChart,
  FileText,
  SquarePen,
  X,
  Sparkles,
  Calculator,
  ChevronDown,
  Check,
  Building2,
  MapPin,
  LayoutGrid,
  Wallet,
  TrendingUp,
  Coins,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  isUpcoming?: boolean;
}

interface SubGroup {
  subTitle?: string;
  items: MenuItem[];
}

interface MenuGroup {
  groupTitle: string;
  items?: MenuItem[];
  subGroups?: SubGroup[];
}

const menuGroups: MenuGroup[] = [
  {
    groupTitle: "Masters",
    items: [
      { name: "Vendors", href: "/vendors", icon: Building2 },
      { name: "Workers & Karigars", href: "/employees", icon: UserCheck },
      { name: "Design Library", href: "/designs", icon: Palette },
      { name: "Parties", href: "/parties", icon: Users, isUpcoming: true },
      { name: "Karigar Issue", href: "/job-works", icon: FileText, isUpcoming: true },
    ]

  },
  {
    groupTitle: "Finance & Accounts",
    items: [
      { name: "Payments & Vouchers", href: "/payments", icon: CreditCard },
      { name: "Expenses", href: "/expenses", icon: Receipt },
      { name: "Worker Payout", href: "/worker-payout", icon: Wallet, isUpcoming: true },
      { name: "OMS Performance", href: "/oms-performance", icon: TrendingUp, isUpcoming: true },
    ]
  },
  {
    groupTitle: "Staff & Settings",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3, isUpcoming: true },
      { name: "Settings", href: "/settings", icon: Settings },
    ]
  }
];

const quickCreateOptions = [
  { title: "Company Expense", href: "/expenses", icon: Receipt, color: "bg-rose-50 text-rose-600 border-rose-100" },
  { title: "Delivery Challan", href: "/dispatches", icon: Truck, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  { title: "Payment Voucher", href: "/payments", icon: CreditCard, color: "bg-indigo-50 text-indigo-600 border-indigo-100" },
  { title: "Worker Payout", href: "/worker-payout", icon: Wallet, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  { title: "Shift Production", href: "/production", icon: Factory, color: "bg-amber-50 text-amber-700 border-amber-100" },
  { title: "Party / Client", href: "/parties", icon: Users, color: "bg-purple-50 text-purple-600 border-purple-100" }
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [showQuickModal, setShowQuickModal] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Masters: true,
    "Finance & Accounts": true,
    "Staff & Settings": false,
  });

  const handleOptionClick = (href: string) => {
    setShowQuickModal(false);
    onClose?.();
    router.push(href);
  };

  const [activeUnit, setActiveUnit] = useState<string>("Unit 1");

  useEffect(() => {
    const updateUnit = () => {
      const saved = localStorage.getItem("app_active_unit");
      if (saved && saved !== "Owner View") {
        setActiveUnit(saved);
      } else {
        setActiveUnit("Unit 1");
        localStorage.setItem("app_active_unit", "Unit 1");
      }
    };
    updateUnit();
    window.addEventListener("app_location_change", updateUnit);
    return () => window.removeEventListener("app_location_change", updateUnit);
  }, []);

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="border-b border-slate-100 p-3 bg-white relative flex items-center justify-between">
        <Link 
          href="/"
          prefetch={true}
          onClick={() => {
            if (isMobile) onClose?.();
          }}
          className="flex items-center gap-2.5 overflow-hidden p-1.5 rounded-xl hover:bg-slate-50 transition-colors w-full group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          title="Return to Main Dashboard"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center font-black text-sm justify-center shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
            OS
          </div>
          <div className="truncate">
            <h1 className="font-extrabold text-slate-900 text-xs tracking-tight leading-tight truncate">
              OM SAI ENTERPRISES
            </h1>
            <p className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>TexaFlow Textile</span>
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
        {/* Primary Action Button */}
        <div>
          <button
            type="button"
            onClick={() => setShowQuickModal(true)}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-900 text-xs font-bold shadow-2xs transition-all hover:border-blue-400 hover:text-blue-700 group cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
          >
            <SquarePen className="w-4 h-4 text-slate-600 group-hover:text-blue-600 transition-colors" />
            <span>Create new service</span>
          </button>
        </div>

        {/* Category Sections */}
        <div className="space-y-4 pt-1">
          {menuGroups.map((group) => {
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
                  className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[10px] font-extrabold text-slate-400 uppercase tracking-wider hover:text-slate-700 transition-colors group/hdr cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                >
                  <span>{group.groupTitle}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 group-hover/hdr:text-slate-600 transition-transform duration-200 ${
                      isOpen ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                </button>

                {/* Menu Items List Dropdown */}
                {isOpen && (
                  <div className="space-y-0.5 pt-0.5 animate-in fade-in duration-150">
                    {group.items?.map((sub) => {
                      const isSubActive =
                        pathname === sub.href || (sub.href !== "/" && pathname.startsWith(sub.href + "/"));
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
                          <span className="truncate text-xs flex-1">{sub.name}</span>
                          {sub.isUpcoming && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/80 shrink-0">
                              Upcoming
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

      {/* User Profile Footer */}
      <div className="h-[57px] px-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs flex items-center justify-center border border-amber-200 shrink-0">
            {user?.role === "Manager" ? "🏭" : user?.role === "Accounts" ? "💼" : "👤"}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-900 truncate leading-none">
              {user?.name || "Om Sai Embroidery"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
              {user?.roleTitle || "Owner Account"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Sign Out / Lock Console"
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
          mobileOpen ? "translate-x-0" : "-translate-x-full"
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
                <h2 className="text-sm font-bold text-slate-900">Create New Record</h2>
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
                      {opt.title}
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
