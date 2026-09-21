export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

const baseUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '');
let accessToken: string | null = null;
let generation = 0;
let refreshPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function setAccessToken(token: string) {
  generation += 1;
  accessToken = token;
}

export function clearSession() {
  generation += 1;
  accessToken = null;
  listeners.forEach(listener => listener());
}

export function onSessionExpired(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

async function send(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: 'include', signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new ApiError(0, 'TIMEOUT', 'The server took too long to respond. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener('abort', abort);
  }
}

async function decode<T>(response: Response): Promise<ApiResponse<T>> {
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true) {
    throw new ApiError(response.status, body?.error?.code || 'REQUEST_FAILED', body?.error?.message || `Request failed (${response.status})`);
  }
  return body;
}

// All concurrent 401s share one cookie rotation. Tokens never enter browser storage.
export async function restoreSession(): Promise<void> {
  if (!refreshPromise) {
    const started = generation;
    refreshPromise = (async () => {
      try {
        const response = await send('/auth/refresh', { method: 'POST', body: '{}' });
        const { data } = await decode<{ accessToken: string }>(response);
        if (generation !== started) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
        accessToken = data.accessToken;
      } catch (error) {
        if (generation === started) clearSession();
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<ApiResponse<T>> {
  const started = generation;
  const sentToken = accessToken;
  let response = await send(path, options);
  if (authenticated && response.status === 401) {
    if (started !== generation) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
    if (sentToken === accessToken) await restoreSession();
    response = await send(path, options);
    if (response.status === 401) clearSession();
  }
  if (authenticated && started !== generation) throw new ApiError(401, 'SESSION_CHANGED', 'Session changed');
  return decode<T>(response);
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { signal }),
  post: <T>(path: string, body: unknown = {}) => apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown = {}) => apiRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: 'DELETE' }),
};
