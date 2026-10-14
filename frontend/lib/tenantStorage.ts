/**
 * Multi-Tenant Local Storage Helper for Texaflow ERP.
 * Isolates browser storage per company/tenant ID while preserving backwards compatibility.
 */

export function getStoredCompanyId(): string {
  if (typeof window === "undefined") return "comp-001";
  try {
    const raw = sessionStorage.getItem("texaflow_auth_session") || localStorage.getItem("texaflow_auth_session");
    if (raw) {
      const parsed = JSON.parse(raw);
      const directCid = parsed?.companyId || parsed?.company_id;
      const email = (parsed?.email || "").toLowerCase().trim();
      const username = (parsed?.username || "").toLowerCase().trim();
      const rawId = typeof parsed?.id === "string" ? parsed.id.trim() : "";
      const firm = (parsed?.firmName || parsed?.firm_name || parsed?.company_name || "").toLowerCase().trim();
      const name = (parsed?.name || parsed?.owner_name || "").toLowerCase().trim();

      // 1. Direct authoritative check on company ID first
      if (directCid === "comp-001") return "comp-001";
      if (directCid === "comp-002") return "comp-002";

      // 2. Direct email / username check
      if (email.includes("shiv") || username.includes("shiv")) return "comp-001";
      if (email.includes("om-sai") || username.includes("om-sai") || email.includes("omsai") || username.includes("omsai")) return "comp-002";

      // 3. User ID check
      if (rawId === "user-001" || rawId === "usr-owner-01" || rawId.includes("comp-001")) return "comp-001";
      if (rawId === "user-002" || rawId.includes("comp-002")) return "comp-002";

      // 4. Firm name check
      if (firm.includes("shiv")) return "comp-001";
      if (firm.includes("om sai") || firm.includes("omsai")) return "comp-002";

      // 5. Name check
      if (name.includes("hiren")) return "comp-001";
      if (name.includes("nilesh")) return "comp-002";

      // 6. Generic comp-XXX pattern
      if (directCid && typeof directCid === "string" && /^comp-\d+$/.test(directCid)) {
        return directCid;
      }
      if (rawId) {
        const m = rawId.match(/(comp-\d+)/);
        if (m) return m[1];
        const userM = rawId.match(/^user-(\d+)$/);
        if (userM) return `comp-${userM[1]}`;
      }
    }

    // If no active auth session, check saved settings in localStorage
    const savedComp001 = localStorage.getItem("app_settings_comp-001") || localStorage.getItem("texaflow_login_username_comp-001");
    const savedComp002 = localStorage.getItem("app_settings_comp-002") || localStorage.getItem("texaflow_login_username_comp-002");
    if (savedComp001 && !savedComp002) return "comp-001";
    if (savedComp002 && !savedComp001) return "comp-002";
  } catch {}
  return "comp-001";
}

export function getStoredFirmName(): string {
  const cid = getStoredCompanyId();
  if (typeof window === "undefined") {
    return cid === "comp-002" ? "Om Sai Enterprise" : "Shiv Creation";
  }
  try {
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
  return cid === "comp-002" ? "Om Sai Enterprise" : "Shiv Creation";
}

export function getStoredUserName(): string {
  const cid = getStoredCompanyId();
  if (typeof window === "undefined") {
    return cid === "comp-002" ? "Nilesh Sutariya" : "Hiren Sutariya";
  }
  try {
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
  return cid === "comp-002" ? "Nilesh Sutariya" : "Hiren Sutariya";
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
