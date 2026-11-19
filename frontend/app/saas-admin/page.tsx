"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function SaasAdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/platform");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Redirecting to SaaS Super Admin Platform...
        </p>
      </div>
    </div>
  );
}
