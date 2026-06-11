import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, storeTokens } from './authStorage';

const refreshTokensMock = vi.fn();

vi.mock('./auth', () => ({
  refreshTokens: refreshTokensMock,
}));

describe('apiFetch', () => {
  beforeEach(() => {
    clearTokens();
    refreshTokensMock.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('adds the current access token to requests', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    storeTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const { apiFetch } = await import('./client');

    await apiFetch('/guilds', { headers: { 'X-Trace': 'trace-id' } });

    expect(fetchMock).toHaveBeenCalledWith('/guilds', {
      headers: {
        Authorization: 'Bearer access-token',
        'X-Trace': 'trace-id',
      },
    });
  });

  it('refreshes tokens and retries once after a 401 response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    refreshTokensMock.mockResolvedValueOnce({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    storeTokens({ accessToken: 'old-access-token', refreshToken: 'refresh-token' });
    const { apiFetch } = await import('./client');

    const response = await apiFetch('/channels');

    expect(response.status).toBe(200);
    expect(refreshTokensMock).toHaveBeenCalledWith({ refreshToken: 'refresh-token' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/channels', {
      headers: {
        Authorization: 'Bearer new-access-token',
      },
    });
    expect(getAccessToken()).toBe('new-access-token');
    expect(getRefreshToken()).toBe('new-refresh-token');
  });

  it('does not refresh refresh-token requests', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }));
    storeTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const { apiFetch } = await import('./client');

    const response = await apiFetch('/auth/refresh');

    expect(response.status).toBe(401);
    expect(refreshTokensMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('clears tokens and calls logout when refresh fails', async () => {
    const fetchMock = vi.mocked(fetch);
    const onLogout = vi.fn();
    fetchMock
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(new Response('{}', { status: 401 }));
    refreshTokensMock.mockRejectedValueOnce(new Error('expired'));
    storeTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    const { apiFetch, setLogoutHandler } = await import('./client');
    setLogoutHandler(onLogout);

    await apiFetch('/users/me');

    expect(onLogout).toHaveBeenCalledOnce();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});

describe('parseOrThrow', () => {
  it('returns parsed JSON for successful responses', async () => {
    const { parseOrThrow } = await import('./client');

    await expect(parseOrThrow<{ id: string }>(Response.json({ id: '123' }))).resolves.toEqual({
      id: '123',
    });
  });

  it('throws the parsed JSON body for failed responses', async () => {
    const { parseOrThrow } = await import('./client');
    const response = Response.json({ code: 'INVALID' }, { status: 400 });

    await expect(parseOrThrow(response)).rejects.toEqual({ code: 'INVALID' });
  });
});
