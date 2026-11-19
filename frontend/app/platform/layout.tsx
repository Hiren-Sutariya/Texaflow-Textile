"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Receipt,
  Tag,
  Boxes,
  ShieldCheck,
  Headphones,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/platform", icon: LayoutDashboard, exact: true },
  { name: "Companies", href: "/platform/companies", icon: Building2 },
  { name: "Users", href: "/platform/users", icon: Users },
  { name: "Subscriptions", href: "/platform/subscriptions", icon: CreditCard },
  { name: "Billing & Transactions", href: "/platform/billing", icon: Receipt },
  { name: "Plans & Pricing", href: "/platform/plans", icon: Tag },
  { name: "Module Management", href: "/platform/modules", icon: Boxes },
  { name: "Permission Management", href: "/platform/permissions", icon: ShieldCheck, highlight: true },
  { name: "Support Management", href: "/platform/support", icon: Headphones },
  { name: "Audit Logs", href: "/platform/audit-logs", icon: FileText },
  { name: "Platform Settings", href: "/platform/settings", icon: Settings },
];

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (!user || user.role !== "SuperAdmin") {
        router.replace("/login?error=superadmin_required");
      }
    }
  }, [user, isLoading, mounted, router]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold tracking-wide text-slate-500">Authenticating Platform Operator...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "SuperAdmin") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-sm text-slate-500">
            This administration console requires platform-level SuperAdmin credentials.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
          >
            Sign in as SuperAdmin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased font-sans">
      {/* Platform Top Header - Clean White & Blue */}
      <header className="h-14 border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/platform" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 font-black text-xs">
              SA
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                TexaFlow <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">SuperAdmin</span>
              </span>
              <p className="text-[9px] text-slate-400 tracking-tight leading-none mt-0.5">Centralized SaaS Control Plane</p>
            </div>
          </Link>

          <span className="h-4 w-[1px] bg-slate-200 mx-2 hidden sm:block" />

          {/* Quick ERP jump link */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-700 px-2.5 py-1 rounded-lg hover:bg-blue-50/60 transition-colors font-semibold"
            title="Switch to ERP Tenant Mode"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tenant ERP App</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden md:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Production Engine
          </span>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-black">
              SA
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-bold text-slate-900 leading-tight">Super Administrator</p>
              <p className="text-[10px] text-slate-400">{user.email || "superadmin@texaflow.com"}</p>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dedicated SaaS Admin Sidebar - Clean White & Blue */}
        <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0 overflow-y-auto no-scrollbar p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Platform Management
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                } ${item.highlight && !isActive ? "bg-blue-50/50 text-blue-700 border border-blue-100" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"}`}>
                    Core
                  </span>
                )}
              </Link>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
