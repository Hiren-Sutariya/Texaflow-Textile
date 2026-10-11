"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { 
  Users, 
  Palette, 
  Briefcase, 
  UserCheck, 
  CreditCard, 
  Receipt, 
  Wallet, 
  TrendingUp, 
  ShieldCheck,
  LogOut,
  Building2
} from "lucide-react";

const destinationModules = [
  {
    title: "Parties Master",
    href: "/parties",
    icon: Users
  },
  {
    title: "Design Library",
    href: "/designs",
    icon: Palette
  },
  {
    title: "Karigar Issue",
    href: "/job-works",
    icon: Briefcase
  },
  {
    title: "Payments & Vouchers",
    href: "/payments",
    icon: CreditCard
  },
  {
    title: "Factory Expenses",
    href: "/expenses",
    icon: Receipt
  },
  {
    title: "Worker Payout",
    href: "/worker-payout",
    icon: Wallet
  },
  {
    title: "OMS Performance",
    href: "/oms-performance",
    icon: TrendingUp
  },
  {
    title: "Staff & Karigars",
    href: "/employees",
    icon: UserCheck
  }
];

export default function Home() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();

  // 1. Subtle light-themed loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans select-none">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 font-black text-2xl flex items-center justify-center shadow-2xs mb-3 animate-pulse">
          🧵
        </div>
        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-medium">Checking Om Sai Security Session...</p>
      </div>
    );
  }

  // 2. FIRST SCREEN: If NOT logged in, show the full-screen split Login Screen immediately!
  // The dashboard screen will NEVER appear before the user logs in.
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // 3. SECOND SCREEN: Once authenticated, show the 8 Module Dashboard Cards Grid!
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start md:justify-center items-center p-3 sm:p-6 lg:p-8 pt-3 pb-8 select-none gap-3.5 sm:gap-5 font-sans animate-in fade-in duration-200">
      
      {/* TOP USER WELCOME & TERMINAL STATUS BAR */}
      <div className="w-full max-w-6xl bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5 sm:gap-3 text-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 tracking-wider">
            OS
          </div>
          <div className="min-w-0 truncate">
            <div className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 truncate">
              <span className="truncate">{user?.firmName || "Om Sai Enterprises"}</span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] sm:text-[10px] font-bold shrink-0">
                {user?.roleTitle || "Owner"}
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-0.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">TexaFlow Textile • {user?.name || "Hiren Sutariya"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={logout}
            className="px-2.5 sm:px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer text-xs shrink-0"
            title="Lock Terminal"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* 8 MODULE CARDS GRID IN SEQUENTIAL ORDER (2 cols on mobile, 4 cols on desktop) */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
          {destinationModules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group bg-white border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 flex flex-col items-center text-center justify-center h-[145px] sm:h-[180px] min-h-[145px] sm:min-h-[180px] shadow-2xs hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center mb-2.5 sm:mb-3.5 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shrink-0">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.75]" />
                </div>

                <h2 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition-colors leading-tight">
                  {item.title}
                </h2>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FOOTER BRANDING */}
      <footer className="pt-4 border-t border-slate-200/60 w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-semibold text-center sm:text-left">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>TexaFlow Textile ERP • Enterprise Edition</span>
        </div>
        <div>
          Powered & Developed by <strong className="text-slate-700 font-bold">DigiScale Infotech</strong>
        </div>
      </footer>
    </div>
  );
}
