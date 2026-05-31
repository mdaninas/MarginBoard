const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ApiError";
  }
}

function buildUrl(path: string, params?: Record<string, string | number | undefined | null>): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

// In-memory response cache. The Online Retail II dataset is historical and
// immutable, so a successful GET for a given URL never changes within a
// session. Caching the resolved promise makes re-navigating to a page
// instant,no network round trip, no loading flash,and also de-duplicates
// the parallel requests a page fires on mount. Failed requests are evicted so
// they can be retried.
const responseCache = new Map<string, Promise<unknown>>();

export function clearApiCache(): void {
  responseCache.clear();
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body?.detail === "string") detail = body.detail;
    } catch {
      // ignore JSON parse failure; fall back to statusText
    }
    throw new ApiError(detail, res.status);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>,
  init?: RequestInit & { noCache?: boolean },
): Promise<T> {
  const url = buildUrl(path, params);
  const { noCache, ...fetchInit } = init ?? {};

  if (!noCache) {
    const cached = responseCache.get(url);
    if (cached) return cached as Promise<T>;
  }

  const promise = fetchJson<T>(url, fetchInit).catch((err) => {
    // Don't cache failures,allow the next call (e.g. "Try again") to retry.
    responseCache.delete(url);
    throw err;
  });

  if (!noCache) responseCache.set(url, promise);
  return promise;
}
