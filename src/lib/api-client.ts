import { generateRequestId } from '@/lib/request-id';

/**
 * Thrown for any non-2xx response, including 401s that survive a refresh
 * retry. Carries the parsed body when available so UI code can render
 * structured errors (validation message arrays, throttle Retry-After,
 * etc.) without re-fetching.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    public readonly retryAfterSec: number | null = null,
  ) {
    super(`API request failed with status ${status}`);
    this.name = 'ApiError';
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export type RequestOptions = {
  /** Query-string params; encoded with URLSearchParams. */
  params?: Record<string, string | number | boolean | undefined>;
  /**
   * Request body. A `FormData` is sent as multipart/form-data (the browser
   * sets the boundary — we must NOT force a Content-Type). Anything else is
   * stringified to JSON.
   */
  body?: unknown;
  /** Bypass the refresh-on-401 retry — used by the refresh call itself. */
  skipRefresh?: boolean;
  /** AbortController signal pass-through. */
  signal?: AbortSignal;
  /** `blob` returns the raw response body (binary downloads); default JSON. */
  responseType?: 'json' | 'blob';
};

/**
 * The single HTTP entry point for the app. Lives in `lib/` (cross-feature
 * primitive). Token + refresh-handler are INJECTED at runtime by
 * `AuthProvider` — see SPEC §6. This keeps the dependency direction
 * one-way: features depend on lib, lib never imports from features.
 *
 * Behavior:
 *   - GET / POST / PATCH / DELETE convenience wrappers + `request()` core.
 *   - Authorization: Bearer header attached when an access token is set.
 *   - X-Request-ID attached on every request (correlates with backend logs).
 *   - 401 → calls refreshHandler, retries the original request once with
 *     the new token. Concurrent 401s share a single refresh promise (mutex).
 *   - Non-2xx after retry → throws ApiError carrying status + body.
 *
 * The class is exported so tests can construct fresh instances. The
 * default singleton `apiClient` reads its baseUrl from env().
 */
export class ApiClient {
  private accessToken: string | null = null;
  private refreshHandler: (() => Promise<string>) | null = null;
  private refreshInFlight: Promise<string> | null = null;
  private readonly baseUrl: string;

  constructor(opts: { baseUrl: string }) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, '');
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  setRefreshHandler(fn: (() => Promise<string>) | null): void {
    this.refreshHandler = fn;
  }

  get<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, opts);
  }

  post<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...opts, body });
  }

  /** POST multipart/form-data (e.g. a file upload). */
  postForm<T = unknown>(path: string, form: FormData, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...opts, body: form });
  }

  /** GET a binary body as a Blob (e.g. an attachment download). */
  getBlob(path: string, opts?: RequestOptions): Promise<Blob> {
    return this.request<Blob>('GET', path, { ...opts, responseType: 'blob' });
  }

  patch<T = unknown>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, { ...opts, body });
  }

  delete<T = unknown>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, opts);
  }

  async request<T = unknown>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, opts.params);
    const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
    const headers = this.buildHeaders(undefined, isForm);

    const init: RequestInit = {
      method,
      headers,
      signal: opts.signal,
    };

    if (opts.body !== undefined && method !== 'GET') {
      // FormData rides as-is so the browser sets the multipart boundary.
      init.body = isForm ? (opts.body as FormData) : JSON.stringify(opts.body);
    }

    let response = await fetch(url, init);

    if (response.status === 401 && !opts.skipRefresh && this.refreshHandler) {
      try {
        const newToken = await this.runRefresh();
        // Rebuild headers with the new token; original Headers object is
        // immutable in some runtimes (we use Headers directly so .set is fine,
        // but we rebuild anyway for clarity).
        const retryHeaders = this.buildHeaders(newToken, isForm);
        response = await fetch(url, { ...init, headers: retryHeaders });
      } catch {
        // Refresh failed — surface as 401, AuthProvider's effect picks it up
        // and bounces the user to /login.
        throw new ApiError(401, null);
      }
    }

    return this.handleResponse<T>(response, opts.responseType);
  }

  /**
   * Coalesce concurrent refreshes — if 10 requests all hit 401, only ONE
   * /auth/refresh fires; the rest await the same promise. This is the
   * refresh mutex called out in the backend's CLAUDE.md as a frontend concern.
   */
  private runRefresh(): Promise<string> {
    if (this.refreshInFlight) return this.refreshInFlight;
    this.refreshInFlight = (async () => {
      try {
        const token = await this.refreshHandler!();
        this.accessToken = token;
        return token;
      } finally {
        this.refreshInFlight = null;
      }
    })();
    return this.refreshInFlight;
  }

  private buildHeaders(tokenOverride?: string, isForm = false): Headers {
    const h = new Headers();
    h.set('Accept', 'application/json');
    // Never set Content-Type for FormData — the browser must add the
    // multipart boundary itself, or the server can't parse the parts.
    if (!isForm) h.set('Content-Type', 'application/json');
    h.set('X-Request-ID', generateRequestId());
    const token = tokenOverride ?? this.accessToken;
    if (token) h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const base = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    if (!params) return base;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === '') continue;
      qs.set(k, String(v));
    }
    const tail = qs.toString();
    return tail ? `${base}?${tail}` : base;
  }

  private async handleResponse<T>(
    response: Response,
    responseType: 'json' | 'blob' = 'json',
  ): Promise<T> {
    if (response.status === 204) return undefined as T;

    // Binary downloads: return the blob on success, but still surface a
    // structured ApiError on failure (read the error body as text/JSON).
    if (responseType === 'blob' && response.ok) {
      return (await response.blob()) as T;
    }

    // Prefer JSON; fall back to text if the body isn't parseable. The
    // backend sends application/json on every route, but tests and
    // edge cases (proxy 502s, etc.) may not set the header.
    const raw = await response.text();
    let body: unknown = null;
    if (raw.length > 0) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    }

    if (!response.ok) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterSec = retryAfter ? parseInt(retryAfter, 10) : null;
      throw new ApiError(
        response.status,
        body,
        Number.isFinite(retryAfterSec) ? retryAfterSec : null,
      );
    }
    return body as T;
  }
}

// Default singleton — constructed lazily so it works at import time even
// in tests that override env. AuthProvider mutates this instance.
let singleton: ApiClient | null = null;
export function apiClient(): ApiClient {
  if (singleton) return singleton;
  // Avoid importing env() statically — keeps `lib/env` purely test-driven.
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
  singleton = new ApiClient({ baseUrl });
  return singleton;
}
