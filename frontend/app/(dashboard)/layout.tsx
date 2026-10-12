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
          <div suppressHydrationWarning className="w-full space-y-3.5 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

