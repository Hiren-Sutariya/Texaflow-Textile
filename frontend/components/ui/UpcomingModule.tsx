"use client";

import { LucideIcon } from "lucide-react";

interface UpcomingModuleProps {
  title?: string;
  moduleName?: string;
  description?: string;
  icon?: LucideIcon;
}

export function UpcomingModule(_props?: UpcomingModuleProps) {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-300 tracking-widest uppercase select-none">
        Upcoming
      </h1>
    </div>
  );
}

export default UpcomingModule;
