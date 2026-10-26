"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToInvoices() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/invoices");
  }, [router]);

  return null;
}
