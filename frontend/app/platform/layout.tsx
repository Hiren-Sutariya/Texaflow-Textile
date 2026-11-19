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
  Sparkles,
  RefreshCw,
  Bell
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">Authenticating Platform Operator...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "SuperAdmin") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-sm text-slate-400">
            This administration console requires platform-level SuperAdmin credentials.
          </p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors"
          >
            Sign in as SuperAdmin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Platform Top Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/platform" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md font-black text-sm">
              🛡️
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                TexaFlow <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">SuperAdmin</span>
              </span>
              <p className="text-[9px] text-slate-400 tracking-tight leading-none mt-0.5">Centralized SaaS Control Plane</p>
            </div>
          </Link>

          <span className="h-4 w-[1px] bg-slate-800 mx-2 hidden sm:block" />

          {/* Quick ERP jump link */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Switch to ERP Tenant Mode"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tenant ERP App</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden md:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Production Engine
          </span>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700/50 flex items-center justify-center text-xs font-black">
              SA
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-bold text-white leading-tight">Super Administrator</p>
              <p className="text-[10px] text-slate-400">{user.email || "superadmin@texaflow.com"}</p>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dedicated SaaS Admin Sidebar */}
        <aside className="w-64 bg-slate-900/70 border-r border-slate-800/80 flex flex-col shrink-0 overflow-y-auto no-scrollbar p-3 space-y-1">
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
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                } ${item.highlight && !isActive ? "border border-purple-500/30 text-purple-300" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : item.highlight ? "text-purple-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </div>
                {item.highlight && (
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                    Core
                  </span>
                )}
              </Link>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
