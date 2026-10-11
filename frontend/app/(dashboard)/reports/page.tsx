"use client";

import { UpcomingModule } from "@/components/ui/UpcomingModule";
import { BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <UpcomingModule
      title="Reports & Business Intelligence"
      moduleName="Reports Module"
      description="This module is currently in development and will provide automated production reports, Karigar performance analytics, and financial summaries in upcoming releases."
      icon={BarChart3}
    />
  );
}
