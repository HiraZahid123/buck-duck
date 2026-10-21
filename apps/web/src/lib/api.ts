const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // In browser (both localhost & production), use relative path so Next.js proxies /api/* directly to the backend
    return '';
  }
  // Server-side (SSR / Node.js):
  return process.env.INTERNAL_API_URL || 'http://127.0.0.1:4000';
};

export async function apiRequest(method: string, path: string, body?: any, token?: string | null) {
  const base = getApiBase();
  let url = `${base}${path}`;
  if (method === 'GET' && body) {
    const qs = new URLSearchParams(
      Object.entries(body)
        .filter(([, v]) => v !== '' && v != null)
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response | null = null;
  const isServer = typeof window === 'undefined';
  const maxAttempts = isServer ? 5 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      });
      break;
    } catch (err: any) {
      if (isServer && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
      throw err;
    }
  }

  if (!res) {
    throw new Error('Failed to reach backend server');
  }

  let data: any = {};
  let rawText = '';
  try {
    rawText = await res.text();
    data = JSON.parse(rawText);
  } catch {
    // response is not JSON
  }

  if (!res.ok) {
    let errorMsg =
      (typeof data.message === 'string' && data.message) ||
      (Array.isArray(data.message) && data.message.join(', ')) ||
      data.error ||
      data.details ||
      (rawText && rawText.length < 300 ? rawText.trim() : null) ||
      `Server Error (Status ${res.status})`;

    if (errorMsg === 'Internal Server Error') {
      errorMsg = 'Backend Service Offline (Port 4000 refused connection). NestJS API is not running or still booting.';
    }

    throw new Error(errorMsg);
  }

  return data;
}

export const formatMoney = (cents: number | null | undefined) => {
  return '$' + ((Number(cents) || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatDate = (d: string | Date, opts?: Intl.DateTimeFormatOptions) => {
  const date = new Date(String(d).length === 10 ? `${d}T00:00:00` : d);
  return date.toLocaleDateString('en-US', opts || { weekday: 'short', month: 'short', day: 'numeric' });
};

export const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
};
