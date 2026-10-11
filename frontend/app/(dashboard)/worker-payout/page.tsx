"use client";

import { UpcomingModule } from "@/components/ui/UpcomingModule";
import { Wallet } from "lucide-react";

export default function WorkerPayoutPage() {
  return (
    <UpcomingModule
      title="Worker Payout & Settlement"
      moduleName="Worker Payout Module"
      description="This module is currently in development and will allow calculating gross wages, piece-rate earnings, advance deductions, and payout disbursements in upcoming releases."
      icon={Wallet}
    />
  );
}
