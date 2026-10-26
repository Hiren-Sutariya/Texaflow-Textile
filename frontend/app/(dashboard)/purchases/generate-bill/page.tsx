"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PurchasesGenerateBillRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/invoices/generate");
  }, [router]);

  return (
    <div className="p-12 text-center text-slate-500 text-sm font-bold">
      Redirecting to Sales Invoice Generator...
    </div>
  );
}
