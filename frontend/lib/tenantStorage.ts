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
      // 1. Highest Priority: Explicit tenant marker in user ID (e.g. usr-comp-002-owner)
      if (parsed?.id && parsed.id.includes("comp-")) {
        const m = parsed.id.match(/(comp-\d+)/);
        if (m) return m[1];
      }
      // 2. Specific non-default companyId
      if (parsed?.companyId && parsed.companyId !== "comp-001") {
        return parsed.companyId;
      }
      // 3. Known or new company firm name check
      if (parsed?.firmName && !parsed.firmName.toLowerCase().includes("om sai")) {
        if (parsed.firmName.toLowerCase().includes("radhe")) {
          return "comp-002";
        }
        return `comp-${parsed.firmName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}`;
      }
      // 4. Known company email check
      if (parsed?.email?.toLowerCase().includes("radhe") || parsed?.username?.toLowerCase().includes("radhe")) {
        return "comp-002";
      }
      if (parsed?.companyId) return parsed.companyId;
    }
  } catch {}
  return "comp-001";
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
