"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Automatically close mobile menu when navigating to another page
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Automatically purge legacy test dummy data from browser localStorage on load
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const dummyPartyNames = ["abc tex fabrics", "royal fashion house", "shree ram textiles"];
      const dummyPartyIds = ["p-101", "p-102", "p-103"];
      let hasChanges = false;

      // 1. Clean Parties
      ["app_parties", "app_parties_list", "parties_register_data"].forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
              const cleaned = arr.filter(
                (p: any) =>
                  !dummyPartyNames.includes((p.name || "").toLowerCase().trim()) &&
                  !dummyPartyIds.includes(p.id)
              );
              if (cleaned.length !== arr.length) {
                localStorage.setItem(k, JSON.stringify(cleaned));
                hasChanges = true;
              }
            }
          } catch {}
        }
      });

      // 2. Clean dummy design folders
      ["app_design_folders", "om_sai_designs_library"].forEach((k) => {
        const val = localStorage.getItem(k);
        if (val) {
          try {
            const arr = JSON.parse(val);
            if (Array.isArray(arr)) {
              const cleaned = arr.filter(
                (d: any) =>
                  d.id !== "des-dummy-1" &&
                  !dummyPartyNames.includes((d.party_name || "").toLowerCase().trim())
              );
              if (cleaned.length !== arr.length) {
                localStorage.setItem(k, JSON.stringify(cleaned));
                hasChanges = true;
              }
            }
          } catch {}
        }
      });

      // 3. Clean dummy production logs
      const logsVal = localStorage.getItem("app_production_logs");
      if (logsVal) {
        try {
          const arr = JSON.parse(logsVal);
          if (Array.isArray(arr)) {
            const cleaned = arr.filter(
              (l: any) =>
                !dummyPartyNames.includes((l.party_name || "").toLowerCase().trim()) &&
                l.id !== "log-1" &&
                l.id !== "log-2"
            );
            if (cleaned.length !== arr.length) {
              localStorage.setItem("app_production_logs", JSON.stringify(cleaned));
              hasChanges = true;
            }
          }
        } catch {}
      }

      // 4. Clean dummy finished designs
      const finVal = localStorage.getItem("app_finished_designs");
      if (finVal) {
        try {
          const arr = JSON.parse(finVal);
          if (Array.isArray(arr)) {
            const cleaned = arr.filter(
              (f: any) =>
                !dummyPartyNames.includes((f.party_name || "").toLowerCase().trim()) &&
                !f.id?.startsWith("fd-amt-") &&
                !f.id?.startsWith("fd-kdd-")
            );
            if (cleaned.length !== arr.length) {
              localStorage.setItem("app_finished_designs", JSON.stringify(cleaned));
              hasChanges = true;
            }
          }
        } catch {}
      }

      if (hasChanges) {
        window.dispatchEvent(new Event("app_data_update"));
      }
    } catch {}
  }, []);

  const [isContentRefreshing, setIsContentRefreshing] = useState(false);

  useEffect(() => {
    const onRefreshContent = () => {
      setIsContentRefreshing(true);
      setTimeout(() => setIsContentRefreshing(false), 350);
    };
    window.addEventListener("app_refresh_content", onRefreshContent);
    return () => window.removeEventListener("app_refresh_content", onRefreshContent);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        mobileOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar 
          onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)} 
        />
        <main suppressHydrationWarning className="flex-1 overflow-y-auto p-2 sm:p-3.5 bg-slate-50/60 no-scrollbar">
          <div 
            suppressHydrationWarning 
            className={`w-full space-y-3.5 max-w-[1600px] mx-auto transition-opacity duration-200 ${
              isContentRefreshing ? "opacity-30 scale-[0.999]" : "opacity-100 scale-100"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

