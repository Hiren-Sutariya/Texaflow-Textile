"use client";

import Link from "next/link";
import { Clock, ArrowLeft, Sparkles, LucideIcon } from "lucide-react";

interface UpcomingModuleProps {
  title: string;
  moduleName: string;
  description?: string;
  icon?: LucideIcon;
}

export function UpcomingModule({
  title,
  moduleName,
  description = "This module is currently in development and will be released in an upcoming update.",
  icon: Icon = Clock
}: UpcomingModuleProps) {
  return (
    <div className="w-full min-h-[65vh] flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Icon & Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/80 flex items-center justify-center text-amber-600 shadow-inner">
            <Icon className="w-10 h-10" />
          </div>
          <span className="absolute -top-2 -right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-sm flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> Upcoming
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="text-xs font-bold text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded-xl py-1 px-3 inline-block">
            {moduleName} (વિકાસ હેઠળ છે / Under Development)
          </p>
          <p className="text-xs text-slate-500 font-medium leading-relaxed pt-2">
            {description}
          </p>
        </div>

        {/* Return Button */}
        <div className="pt-2">
          <Link
            href="/expenses"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go to Active Modules</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
