const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });
    const json = await res.json();
    
    if (!res.ok || json.success === false) {
      throw new Error(json.message || `API Error (${res.status})`);
    }
    
    return json.data as T;
  } catch (err: any) {
    console.error(`Fetch API Error [${endpoint}]:`, err.message);
    throw err;
  }
}
