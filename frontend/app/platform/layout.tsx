"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
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
    <DashboardShell
      serverCompanyId="platform"
      serverFirmName="TexaFlow SaaS"
      serverOwnerName="Super Administrator"
    >
      {children}
    </DashboardShell>
  );
}
