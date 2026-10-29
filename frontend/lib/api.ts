import { getStoredCompanyId } from "./tenantStorage";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h.startsWith("192.168.") || h.startsWith("10.") || h.endsWith(".local")) {
      return `http://${h}:8000/api/v1`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://texaflow-backend.onrender.com/api/v1";
};

export const API_BASE_URL = getBaseUrl();

// Fast in-memory SWR cache for instant 0ms tab switching
// Cache TTL: 30 seconds — ensures live site always shows fresh data within 30s
const CACHE_TTL_MS = 30_000;
const memoryCache = new Map<string, { data: any; time: number }>();

export function getCachedApi<T>(endpoint: string): T | null {
  if (typeof window === "undefined") return null;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  const cacheKey = `api_cache_${tenantCompanyId}_${endpoint}`;
  const now = Date.now();

  // 1. In-memory check (0 ms) — only if not expired
  const inMem = memoryCache.get(cacheKey);
  if (inMem && inMem.data !== undefined && inMem.data !== null && (now - inMem.time) < CACHE_TTL_MS) {
    return inMem.data as T;
  }

  // 2. LocalStorage check — only if not expired
  try {
    const raw = localStorage.getItem(cacheKey);
    const tsRaw = localStorage.getItem(`${cacheKey}_ts`);
    if (raw && tsRaw) {
      const savedTime = parseInt(tsRaw, 10);
      if ((now - savedTime) < CACHE_TTL_MS) {
        const parsed = JSON.parse(raw);
        if (parsed !== undefined && parsed !== null) {
          memoryCache.set(cacheKey, { data: parsed, time: savedTime });
          return parsed as T;
        }
      } else {
        // Cache expired — clear it so fresh data loads
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_ts`);
        memoryCache.delete(cacheKey);
      }
    }
  } catch {}

  return null;
}

export function setCachedApi<T>(endpoint: string, data: T): void {
  if (typeof window === "undefined") return;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  const cacheKey = `api_cache_${tenantCompanyId}_${endpoint}`;
  const now = Date.now();
  memoryCache.set(cacheKey, { data, time: now });
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}_ts`, String(now));
  } catch {}
}

export function invalidateApiCache(endpointPrefix?: string): void {
  if (typeof window === "undefined") return;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  if (!endpointPrefix) {
    memoryCache.clear();
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("api_cache_")) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}
    return;
  }
  const prefix = `api_cache_${tenantCompanyId}_${endpointPrefix}`;
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix) || k.includes(endpointPrefix)) {
      memoryCache.delete(k);
    }
  }
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(prefix) || k.includes(endpointPrefix))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  const method = (options.method || "GET").toUpperCase();

  let authToken = "";
  if (typeof window !== "undefined") {
    try {
      authToken = sessionStorage.getItem("texaflow_auth_token") || localStorage.getItem("texaflow_auth_token") || "";
    } catch {}
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Company-Id": tenantCompanyId,
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  // Safe timeout controller (default 5000ms for GET, 10000ms for mutations)
  const timeoutMs = method === "GET" ? 5000 : 10000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || `API Error (${res.status})`);
    }

    if (res.status === 204) {
      if (method !== "GET") {
        invalidateApiCache(endpoint.split("/")[1] || endpoint);
      }
      return null as T;
    }

    const json = await res.json();
    const result = (json.data !== undefined ? json.data : json) as T;

    // Cache successful GET results
    if (method === "GET" && result !== null && result !== undefined) {
      setCachedApi(endpoint, result);
    } else if (method !== "GET") {
      // Invalidate relevant caches on mutation
      invalidateApiCache(endpoint.split("/")[1] || endpoint);
    }

    return result;
  } catch (err: any) {
    clearTimeout(timer);
    console.warn(`Fetch API Notice [${endpoint}]:`, err.message);

    // On GET failure/timeout, gracefully fall back to cache if available
    if (method === "GET") {
      const cached = getCachedApi<T>(endpoint);
      if (cached !== null) {
        return cached;
      }
    }

    throw err;
  }
}
