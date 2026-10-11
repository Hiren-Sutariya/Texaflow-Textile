"use client";

import { UpcomingModule } from "@/components/ui/UpcomingModule";
import { FileText } from "lucide-react";

export default function JobWorksPage() {
  return (
    <UpcomingModule
      title="Karigar Issue & Production Slips"
      moduleName="Karigar Issue Module"
      description="This module is currently in development and will allow tracking Karigar issue slips, work order allocations, and machine programs in upcoming releases."
      icon={FileText}
    />
  );
}
