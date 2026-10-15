import { cookies } from "next/headers";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const serverCompanyId = cookieStore.get("texaflow_active_company_id")?.value || "";
  const rawFirm = cookieStore.get("texaflow_active_firm")?.value;
  const rawOwner = cookieStore.get("texaflow_active_owner")?.value;

  const serverFirmName = rawFirm ? decodeURIComponent(rawFirm) : "";
  const serverOwnerName = rawOwner ? decodeURIComponent(rawOwner) : "";

  return (
    <DashboardShell
      serverCompanyId={serverCompanyId}
      serverFirmName={serverFirmName}
      serverOwnerName={serverOwnerName}
    >
      {children}
    </DashboardShell>
  );
}
