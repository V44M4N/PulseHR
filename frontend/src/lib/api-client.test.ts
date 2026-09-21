import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { api, apiRequest, clearSession, onSessionExpired, restoreSession, setAccessToken } from './api-client';

const success = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const unauthorized = () => new Response(JSON.stringify({ success: false, error: { code: 'TOKEN_INVALID', message: 'Expired' } }), { status: 401 });

beforeEach(() => { clearSession(); vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => vi.unstubAllGlobals());

describe('authenticated API transport', () => {
  it('attaches an in-memory bearer token and includes the cookie', async () => {
    setAccessToken('access');
    vi.mocked(fetch).mockResolvedValue(success({ id: 'employee' }));
    await api.get('/auth/me');
    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer access');
    expect(options?.credentials).toBe('include');
    expect(localStorage.getItem('pulsehr.token')).toBeNull();
  });

  it('rotates on a 401 then retries once with the new token', async () => {
    setAccessToken('expired');
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(success({ accessToken: 'fresh' })).mockResolvedValueOnce(success(['record']));
    expect((await api.get('/records')).data).toEqual(['record']);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(String(vi.mocked(fetch).mock.calls[1][0])).toMatch(/\/auth\/refresh$/);
    expect(new Headers(vi.mocked(fetch).mock.calls[2][1]?.headers).get('Authorization')).toBe('Bearer fresh');
  });

  it('shares a refresh across simultaneous expired requests', async () => {
    setAccessToken('expired');
    let finish!: (value: Response) => void;
    const rotation = new Promise<Response>(resolve => { finish = resolve; });
    vi.mocked(fetch).mockImplementation(async (url, options) => {
      if (String(url).endsWith('/auth/refresh')) return rotation;
      return new Headers(options?.headers).get('Authorization') === 'Bearer fresh' ? success('ok') : unauthorized();
    });
    const first = api.get('/one'); const second = api.get('/two');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    finish(success({ accessToken: 'fresh' }));
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1);
  });

  it('logs out when refresh fails without retrying the original request', async () => {
    const expired = vi.fn(); const unsubscribe = onSessionExpired(expired);
    vi.mocked(fetch).mockResolvedValue(unauthorized());
    await expect(api.get('/records')).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(2); expect(expired).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it('logs out after the single retry also returns 401', async () => {
    const expired = vi.fn(); const unsubscribe = onSessionExpired(expired);
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized()).mockResolvedValueOnce(success({ accessToken: 'fresh' })).mockResolvedValueOnce(unauthorized());
    await expect(api.get('/records')).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledTimes(3); expect(expired).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it('does not refresh invalid login credentials or forbidden requests', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(unauthorized());
    await expect(apiRequest('/auth/login', { method: 'POST', body: '{}' }, false)).rejects.toMatchObject({ status: 401 });
    vi.mocked(fetch).mockResolvedValueOnce(new Response(JSON.stringify({ success: false, error: { message: 'Forbidden' } }), { status: 403 }));
    await expect(api.get('/admin/settings')).rejects.toMatchObject({ status: 403 });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('times out an unavailable server instead of leaving restoration loading forever', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    }));
    const pending = restoreSession();
    const assertion = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
    await vi.advanceTimersByTimeAsync(15_000);
    await assertion;
    vi.useRealTimers();
  });

  it('does not revive a session cleared during an in-flight refresh', async () => {
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const pending = restoreSession();
    clearSession(); finish(success({ accessToken: 'stale' }));
    await expect(pending).rejects.toMatchObject({ code: 'SESSION_CHANGED' });
    vi.mocked(fetch).mockResolvedValueOnce(success('ok'));
    await api.get('/records');
    expect(new Headers(vi.mocked(fetch).mock.calls[1][1]?.headers).has('Authorization')).toBe(false);
  });
});
