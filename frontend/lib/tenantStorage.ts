/**
 * Multi-Tenant Local Storage Helper for Texaflow ERP.
 * Isolates browser storage per company/tenant ID while preserving backwards compatibility.
 */

export function getStoredCompanyId(): string {
  if (typeof window === "undefined") return "comp-001";
  try {
    const raw = sessionStorage.getItem("texaflow_auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      // 1. Explicit tenant marker in user ID (e.g. usr-comp-002-owner)
      if (parsed?.id && parsed.id.includes("comp-")) {
        const m = parsed.id.match(/(comp-\d+)/);
        if (m) return m[1];
      }
      // 2. Specific valid companyId format (comp-001, comp-002, ...)
      if (parsed?.companyId && /^comp-\d+$/.test(parsed.companyId)) {
        return parsed.companyId;
      }
      // 3. User ID or username/email checks for known tenants
      if (
        parsed?.id === "usr-comp-003-owner" ||
        parsed?.username?.toLowerCase() === "omsai" ||
        parsed?.email?.toLowerCase() === "omsai@om-sai.com" ||
        parsed?.companyId === "comp-003"
      ) {
        return "comp-003";
      }
      if (
        parsed?.id === "usr-comp-002-owner" || 
        parsed?.email?.toLowerCase().includes("radhe") || 
        parsed?.username?.toLowerCase().includes("radhe") ||
        parsed?.firmName?.toLowerCase().includes("radhe") ||
        parsed?.companyId === "comp-002"
      ) {
        return "comp-002";
      }
      if (
        parsed?.id === "usr-owner-01" || 
        parsed?.firmName?.toLowerCase().includes("shiv") ||
        (parsed?.companyId && parsed.companyId.includes("shiv"))
      ) {
        return "comp-001";
      }
      // 4. Fallback to valid companyId if present
      if (parsed?.companyId && typeof parsed.companyId === "string" && parsed.companyId.startsWith("comp-")) {
        const match = parsed.companyId.match(/(comp-\d+)/);
        if (match) return match[1];
      }
    }
  } catch {}
  return "comp-001";
}

export function getStoredFirmName(): string {
  if (typeof window === "undefined") return "Shiv Creation";
  try {
    const cid = getStoredCompanyId();
    // 1. Check saved tenant settings
    const savedTenant = localStorage.getItem(`app_settings_${cid}`);
    const savedLegacy = cid === "comp-001" ? localStorage.getItem("app_settings_om_sai") : null;
    const raw = savedTenant || savedLegacy;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.company_name && typeof parsed.company_name === "string" && parsed.company_name.trim()) {
        return parsed.company_name.trim();
      }
      if (parsed?.brand_name && typeof parsed.brand_name === "string" && parsed.brand_name.trim()) {
        return parsed.brand_name.trim();
      }
    }
    // 2. Check auth session
    const sess = sessionStorage.getItem("texaflow_auth_session");
    if (sess) {
      const parsedSess = JSON.parse(sess);
      if (parsedSess?.firmName && typeof parsedSess.firmName === "string" && parsedSess.firmName.trim() && !parsedSess.firmName.toLowerCase().includes("texaflow")) {
        return parsedSess.firmName.trim();
      }
    }
    // 3. Fallbacks by known company IDs
    if (cid === "comp-002") return "Radhe Fashion";
    if (cid === "comp-003") return "Om Sai Enterprise";
    return "Shiv Creation";
  } catch {}
  return "Shiv Creation";
}

export function getTenantStorageKey(baseKey: string, companyId?: string): string {
  const cid = companyId || getStoredCompanyId();
  return `${baseKey}_${cid}`;
}

export function getTenantItem<T>(baseKey: string, legacyKey?: string): T | null {
  if (typeof window === "undefined") return null;
  const cid = getStoredCompanyId();
  const key = `${baseKey}_${cid}`;
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      return JSON.parse(item);
    }
    // Backward compatibility STRICTLY for Om Sai (comp-001) only
    if (cid === "comp-001" && legacyKey) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy !== null) {
        return JSON.parse(legacy);
      }
    }
  } catch (e) {
    console.error(`Error reading tenant item for key: ${key}`, e);
  }
  return null;
}

export function setTenantItem<T>(baseKey: string, value: T, legacyKey?: string): void {
  if (typeof window === "undefined") return;
  const cid = getStoredCompanyId();
  const key = `${baseKey}_${cid}`;
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    if (cid === "comp-001" && legacyKey) {
      localStorage.setItem(legacyKey, serialized);
    }
  } catch (e) {
    console.error(`Error saving tenant item for key: ${key}`, e);
  }
}
