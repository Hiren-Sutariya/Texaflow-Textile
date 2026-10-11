"use client";

import { UpcomingModule } from "@/components/ui/UpcomingModule";
import { TrendingUp } from "lucide-react";

export default function OMSPerformancePage() {
  return (
    <UpcomingModule
      title="OMS Performance & Machine Analytics"
      moduleName="OMS Performance Module"
      description="This module is currently in development and will allow live telemetry tracking for machine RPM, stitch speed, shift efficiency, and uptime in upcoming releases."
      icon={TrendingUp}
    />
  );
}
