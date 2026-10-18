"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

interface DashboardShellProps {
  children: React.ReactNode;
  serverCompanyId?: string;
  serverFirmName?: string;
  serverOwnerName?: string;
}

export function DashboardShell({
  children,
  serverCompanyId,
  serverFirmName,
  serverOwnerName,
}: DashboardShellProps) {
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
      if (!localStorage.getItem("texaflow_all_data_wiped_v3")) {
        const keysToRemove = [
          "om_sai_purchases",
          "texaflow_purchases",
          "om_sai_vouchers",
          "texaflow_vouchers",
          "texaflow_ledger_opening_balances",
          "app_vendors_master",
          "om_sai_vendors",
          "texaflow_expenses",
          "om_sai_expenses",
          "app_employees_data",
          "app_attendance_data",
          "app_tasks_data",
          "app_inventory_stock",
          "app_documents_data",
          "app_production_logs",
          "app_finished_designs",
          "app_orders_data",
          "app_parties",
          "app_parties_list",
          "parties_register_data",
          "app_design_folders",
          "om_sai_designs_library",
          "app_machines_unit_1",
          "app_machines_unit_2"
        ];
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        const toDelete: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (
            key &&
            !key.includes("auth") &&
            !key.includes("token") &&
            !key.includes("user") &&
            (key.startsWith("api_cache_") || key.includes("dummy") || key.startsWith("texaflow_") || key.startsWith("om_sai_"))
          ) {
            toDelete.push(key);
          }
        }
        toDelete.forEach((k) => localStorage.removeItem(k));
        localStorage.setItem("texaflow_all_data_wiped_v3", "true");
        window.dispatchEvent(new Event("app_data_update"));
      }


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
          } catch { }
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
          } catch { }
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
        } catch { }
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
        } catch { }
      }

      if (hasChanges) {
        window.dispatchEvent(new Event("app_data_update"));
      }
    } catch { }
  }, []);

  const [pageKey, setPageKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let t1: NodeJS.Timeout;
    let t2: NodeJS.Timeout;

    const handleSmoothRefresh = () => {
      setIsRefreshing(true);
      // Mid-point of smooth transition: reset/remount page to pristine initial condition
      t1 = setTimeout(() => {
        setPageKey((prev) => prev + 1);
        window.dispatchEvent(new Event("app_data_update"));
      }, 200);

      // Smooth bloom back to full clarity with all default filters restored
      t2 = setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    };

    window.addEventListener("app_smooth_refresh", handleSmoothRefresh);
    return () => {
      window.removeEventListener("app_smooth_refresh", handleSmoothRefresh);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        serverCompanyId={serverCompanyId}
        serverFirmName={serverFirmName}
        serverOwnerName={serverOwnerName}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onToggleMobileMenu={() => setMobileSidebarOpen((prev) => !prev)}
        />
        <main suppressHydrationWarning className="flex-1 relative overflow-y-auto p-2 sm:p-3.5 bg-slate-50/60 no-scrollbar">
          {/* Subtle glowing thread indicator across top */}
          <div
            className={`fixed top-14 left-0 lg:left-[250px] right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent z-50 transition-opacity duration-300 pointer-events-none ${
              isRefreshing ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            key={pageKey}
            suppressHydrationWarning
            style={{
              transition: "opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)",
              opacity: isRefreshing ? 0.4 : 1,
            }}
            className="w-full space-y-3.5 max-w-[1600px] mx-auto"
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
