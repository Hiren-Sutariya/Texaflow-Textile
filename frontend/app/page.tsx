"use client";

import Link from "next/link";
import { 
  Users, 
  Palette, 
  Briefcase, 
  Truck, 
  UserCheck, 
  CreditCard,
  Receipt,
  Wallet,
  TrendingUp,
  ShieldCheck
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
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-8 select-none gap-6">
      {/* 8 MODULE CARDS GRID IN SEQUENTIAL ORDER */}
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {destinationModules.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="group bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col items-center text-center justify-center h-[180px] min-h-[180px] shadow-2xs hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center mb-3.5 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shrink-0">
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>

                <h2 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h2>
              </Link>
            );
          })}
        </div>
      </div>

      {/* FOOTER BRANDING */}
      <footer className="pt-4 border-t border-slate-200/60 w-full max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 font-semibold">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>TexaFlow Textile ERP • Enterprise Edition</span>
        </div>
        <div>
          Powered & Developed by <strong className="text-slate-700 font-bold">DigiScale Infotech</strong>
        </div>
      </footer>
    </div>
  );
}
