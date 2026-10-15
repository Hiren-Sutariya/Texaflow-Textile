/**
 * Client-Side Cookie Helpers for Next.js Multi-Tenant SSR.
 * Keeps active company ID, firm name, and owner name in sync between browser storage and SSR headers.
 */

export function setTenantCookie(companyId: string, firmName?: string, ownerName?: string) {
  if (typeof document === "undefined") return;
  const days = 365;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  if (companyId) {
    document.cookie = `texaflow_active_company_id=${encodeURIComponent(companyId)}; path=/; expires=${expires}; SameSite=Lax`;
  }
  if (firmName && firmName.trim()) {
    document.cookie = `texaflow_active_firm=${encodeURIComponent(firmName.trim())}; path=/; expires=${expires}; SameSite=Lax`;
  }
  if (ownerName && ownerName.trim()) {
    document.cookie = `texaflow_active_owner=${encodeURIComponent(ownerName.trim())}; path=/; expires=${expires}; SameSite=Lax`;
  }
}

export function clearTenantCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "texaflow_active_company_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie = "texaflow_active_firm=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  document.cookie = "texaflow_active_owner=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
}

export function getTenantCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
  return match ? decodeURIComponent(match[3]) : "";
}
