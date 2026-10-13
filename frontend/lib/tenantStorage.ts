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
      // 1. Explicit valid companyId format (comp-001, comp-002, comp-003, ...)
      if (parsed?.companyId && typeof parsed.companyId === "string" && /^comp-\d+$/.test(parsed.companyId)) {
        return parsed.companyId;
      }
      // 2. Explicit tenant marker in user ID (e.g. usr-comp-002-owner)
      if (parsed?.id && typeof parsed.id === "string" && parsed.id.includes("comp-")) {
        const m = parsed.id.match(/(comp-\d+)/);
        if (m) return m[1];
      }
    }
  } catch {}
  return "comp-001";
}

export function getStoredFirmName(): string {
  if (typeof window === "undefined") return "";
  try {
    // 1. Check active auth session firm name FIRST
    const sess = sessionStorage.getItem("texaflow_auth_session");
    if (sess) {
      const parsedSess = JSON.parse(sess);
      if (parsedSess?.firmName && typeof parsedSess.firmName === "string" && parsedSess.firmName.trim() && !parsedSess.firmName.toLowerCase().includes("texaflow")) {
        return parsedSess.firmName.trim();
      }
    }

    // 2. Check saved tenant settings in localStorage
    const cid = getStoredCompanyId();
    const savedTenant = localStorage.getItem(`app_settings_${cid}`);
    if (savedTenant) {
      const parsed = JSON.parse(savedTenant);
      if (parsed?.company_name && typeof parsed.company_name === "string" && parsed.company_name.trim()) {
        return parsed.company_name.trim();
      }
      if (parsed?.brand_name && typeof parsed.brand_name === "string" && parsed.brand_name.trim()) {
        return parsed.brand_name.trim();
      }
    }

    // 3. Fallback for primary comp-001
    if (cid === "comp-001") {
      const savedLegacy = localStorage.getItem("app_settings_om_sai");
      if (savedLegacy) {
        const parsed = JSON.parse(savedLegacy);
        if (parsed?.company_name?.trim()) return parsed.company_name.trim();
      }
      return "Shiv Creation";
    }
  } catch {}
  return "";
}

export function getStoredUserName(): string {
  if (typeof window === "undefined") return "";
  try {
    const sess = sessionStorage.getItem("texaflow_auth_session");
    if (sess) {
      const parsedSess = JSON.parse(sess);
      if (parsedSess?.name && typeof parsedSess.name === "string" && parsedSess.name.trim() && parsedSess.name !== "Factory Admin") {
        return parsedSess.name.trim();
      }
    }
    const cid = getStoredCompanyId();
    const savedTenant = localStorage.getItem(`app_settings_${cid}`);
    if (savedTenant) {
      const parsed = JSON.parse(savedTenant);
      if (parsed?.owner_name && typeof parsed.owner_name === "string" && parsed.owner_name.trim()) {
        return parsed.owner_name.trim();
      }
    }
    if (cid === "comp-001") return "Hiren Sutariya";
  } catch {}
  return "";
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
