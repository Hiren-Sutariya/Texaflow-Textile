/**
 * Multi-Tenant Local Storage Helper for Texaflow ERP.
 * Isolates browser storage per company/tenant ID while preserving backwards compatibility.
 */

export function getStoredCompanyId(): string {
  if (typeof window === "undefined") return "comp-002";
  try {
    const raw = sessionStorage.getItem("texaflow_auth_session") || localStorage.getItem("texaflow_auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      
      // 1. Explicit indicator checks first to prevent wrong cross-tenant assignment
      const isOmSai = 
        parsed?.companyId === "comp-002" ||
        parsed?.company_id === "comp-002" ||
        (typeof parsed?.id === "string" && parsed.id.includes("comp-002")) ||
        parsed?.firmName?.toLowerCase().includes("om sai") ||
        parsed?.firm_name?.toLowerCase().includes("om sai") ||
        parsed?.company_name?.toLowerCase().includes("om sai") ||
        parsed?.email?.includes("om-sai") ||
        parsed?.username?.includes("om-sai") ||
        parsed?.name?.toLowerCase().includes("nilesh");

      const isShiv = 
        parsed?.companyId === "comp-001" ||
        parsed?.company_id === "comp-001" ||
        (typeof parsed?.id === "string" && (parsed.id.includes("comp-001") || parsed.id === "usr-owner-01" || parsed.id === "user-001")) ||
        parsed?.firmName?.toLowerCase().includes("shiv") ||
        parsed?.firm_name?.toLowerCase().includes("shiv") ||
        parsed?.company_name?.toLowerCase().includes("shiv") ||
        parsed?.email?.includes("shiv") ||
        parsed?.username?.includes("shiv") ||
        parsed?.name?.toLowerCase().includes("hiren");

      if (isOmSai && !isShiv) return "comp-002";
      if (isShiv && !isOmSai) return "comp-001";

      // 2. Direct check on companyId / company_id
      const rawCid = parsed?.companyId || parsed?.company_id;
      if (rawCid && typeof rawCid === "string" && /^comp-\d+$/.test(rawCid)) {
        return rawCid;
      }

      // 3. Check ID pattern
      if (parsed?.id && typeof parsed.id === "string") {
        const m = parsed.id.match(/(comp-\d+)/);
        if (m) return m[1];
        const userM = parsed.id.match(/^user-(\d+)$/);
        if (userM) return `comp-${userM[1]}`;
      }
    }
  } catch {}
  return "comp-002";
}

export function getStoredFirmName(): string {
  if (typeof window === "undefined") return "Om Sai Enterprise";
  try {
    const cid = getStoredCompanyId();

    // 1. Check active auth session firm name FIRST (sessionStorage or localStorage)
    const rawSess = sessionStorage.getItem("texaflow_auth_session") || localStorage.getItem("texaflow_auth_session");
    if (rawSess) {
      const parsedSess = JSON.parse(rawSess);
      const firmCandidate = parsedSess?.firmName || parsedSess?.firm_name || parsedSess?.company_name;
      if (
        firmCandidate && 
        typeof firmCandidate === "string" && 
        firmCandidate.trim() && 
        !firmCandidate.toLowerCase().includes("texaflow") &&
        firmCandidate.toLowerCase() !== "company"
      ) {
        const cleanFirm = firmCandidate.trim();
        if (cid === "comp-001" && cleanFirm.toLowerCase().includes("om sai")) {
          // Reject cross-tenant leak into comp-001
        } else if (cid === "comp-002" && cleanFirm.toLowerCase().includes("shiv")) {
          // Reject cross-tenant leak into comp-002
        } else {
          return cleanFirm;
        }
      }
    }

    // 2. Check saved tenant settings in localStorage
    const savedTenant = localStorage.getItem(`app_settings_${cid}`);
    if (savedTenant) {
      const parsed = JSON.parse(savedTenant);
      const cName = parsed?.company_name || parsed?.brand_name;
      if (cName && typeof cName === "string" && cName.trim() && cName.toLowerCase() !== "company") {
        const cleanName = cName.trim();
        if (cid === "comp-001" && cleanName.toLowerCase().includes("om sai")) {
          // Reject cross-tenant leak
        } else if (cid === "comp-002" && cleanName.toLowerCase().includes("shiv")) {
          // Reject cross-tenant leak
        } else {
          return cleanName;
        }
      }
    }

    // 3. Fallbacks by Company ID
    if (cid === "comp-002") return "Om Sai Enterprise";
    if (cid === "comp-001") return "Shiv Creation";
  } catch {}
  return "Om Sai Enterprise";
}

export function getStoredUserName(): string {
  if (typeof window === "undefined") return "Nilesh Sutariya";
  try {
    const cid = getStoredCompanyId();

    // 1. Check active auth session user name (sessionStorage or localStorage)
    const rawSess = sessionStorage.getItem("texaflow_auth_session") || localStorage.getItem("texaflow_auth_session");
    if (rawSess) {
      const parsedSess = JSON.parse(rawSess);
      const nameCandidate = parsedSess?.name || parsedSess?.owner_name;
      if (
        nameCandidate && 
        typeof nameCandidate === "string" && 
        nameCandidate.trim() && 
        nameCandidate !== "Factory Admin" &&
        nameCandidate.toLowerCase() !== "owner"
      ) {
        const cleanName = nameCandidate.trim();
        if (cid === "comp-001" && cleanName.toLowerCase().includes("nilesh")) {
          // Reject cross-tenant Nilesh leak into comp-001
        } else if (cid === "comp-002" && cleanName.toLowerCase().includes("hiren")) {
          // Reject cross-tenant Hiren leak into comp-002
        } else {
          return cleanName;
        }
      }
    }

    // 2. Check saved tenant settings in localStorage
    const savedTenant = localStorage.getItem(`app_settings_${cid}`);
    if (savedTenant) {
      const parsed = JSON.parse(savedTenant);
      if (parsed?.owner_name && typeof parsed.owner_name === "string" && parsed.owner_name.trim() && parsed.owner_name.toLowerCase() !== "owner") {
        const cleanOwner = parsed.owner_name.trim();
        if (cid === "comp-001" && cleanOwner.toLowerCase().includes("nilesh")) {
          // Reject cross-tenant Nilesh leak into comp-001
        } else if (cid === "comp-002" && cleanOwner.toLowerCase().includes("hiren")) {
          // Reject cross-tenant Hiren leak into comp-002
        } else {
          return cleanOwner;
        }
      }
    }

    // 3. Fallbacks by Company ID
    if (cid === "comp-002") return "Nilesh Sutariya";
    if (cid === "comp-001") return "Hiren Sutariya";
  } catch {}
  return "Nilesh Sutariya";
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
    // Backward compatibility for Om Sai (comp-002) only
    if (cid === "comp-002" && legacyKey) {
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
    if (cid === "comp-002" && legacyKey) {
      localStorage.setItem(legacyKey, serialized);
    }
  } catch (e) {
    console.error(`Error saving tenant item for key: ${key}`, e);
  }
}
