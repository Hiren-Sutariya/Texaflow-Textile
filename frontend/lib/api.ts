import { getStoredCompanyId } from "./tenantStorage";

const getBaseUrl = (): string => {
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000/api/v1";
  }
  return process.env.NEXT_PUBLIC_API_URL || "https://texaflow-backend.onrender.com/api/v1";
};

export const API_BASE_URL = getBaseUrl();

// Fast in-memory SWR cache for instant 0ms tab switching
const memoryCache = new Map<string, { data: any; time: number }>();

export function getCachedApi<T>(endpoint: string): T | null {
  if (typeof window === "undefined") return null;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  const cacheKey = `api_cache_${tenantCompanyId}_${endpoint}`;

  // 1. In-memory check (0 ms)
  const inMem = memoryCache.get(cacheKey);
  if (inMem && Array.isArray(inMem.data) && inMem.data.length > 0) {
    return inMem.data as T;
  }

  // 2. LocalStorage check (0 ms)
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        memoryCache.set(cacheKey, { data: parsed, time: Date.now() });
        return parsed as T;
      }
    }
  } catch {}

  return null;
}

export function setCachedApi<T>(endpoint: string, data: T): void {
  if (typeof window === "undefined") return;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  const cacheKey = `api_cache_${tenantCompanyId}_${endpoint}`;
  memoryCache.set(cacheKey, { data, time: Date.now() });
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch {}
}

export function invalidateApiCache(endpointPrefix?: string): void {
  if (typeof window === "undefined") return;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  if (!endpointPrefix) {
    memoryCache.clear();
    return;
  }
  const prefix = `api_cache_${tenantCompanyId}_${endpointPrefix}`;
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix) || k.includes(endpointPrefix)) {
      memoryCache.delete(k);
    }
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith(prefix) || k.includes(endpointPrefix))) {
        localStorage.removeItem(k);
      }
    }
  } catch {}
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const tenantCompanyId = getStoredCompanyId() || "comp-001";
  const method = (options.method || "GET").toUpperCase();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Company-Id": tenantCompanyId,
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
