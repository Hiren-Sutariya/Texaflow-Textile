const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.message || `API Error (${res.status})`);
    }

    if (res.status === 204) {
      return null as T;
    }
    
    const json = await res.json();
    return (json.data !== undefined ? json.data : json) as T;
  } catch (err: any) {
    console.warn(`Fetch API Notice [${endpoint}]:`, err.message);
    throw err;
  }
}
