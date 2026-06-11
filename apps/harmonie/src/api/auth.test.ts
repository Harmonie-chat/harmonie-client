import { beforeEach, describe, expect, it, vi } from 'vitest';

const API_BASE = 'https://harmonie-api.arastorn.ovh/api';

describe('auth api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('logs in and registers with JSON bodies', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(Response.json({ accessToken: 'a', refreshToken: 'r' }))
      .mockResolvedValueOnce(Response.json({ userId: 'user-1' }));
    const { login, register } = await import('./auth');

    await expect(login({ emailOrUsername: 'a@b.com', password: 'Password1!' })).resolves.toEqual({
      accessToken: 'a',
      refreshToken: 'r',
    });
    await register({
      avatar: { bg: null, color: null, icon: null },
      email: 'a@b.com',
      password: 'Password1!',
      theme: null,
      username: 'ava',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'a@b.com', password: 'Password1!' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        avatar: { bg: null, color: null, icon: null },
        email: 'a@b.com',
        password: 'Password1!',
        theme: null,
        username: 'ava',
      }),
    });
  });

  it('refreshes and logs out', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(Response.json({ accessToken: 'new', refreshToken: 'next' }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { logout, refreshTokens } = await import('./auth');

    await expect(refreshTokens({ refreshToken: 'refresh' })).resolves.toEqual({
      accessToken: 'new',
      refreshToken: 'next',
    });
    await logout({ refreshToken: 'refresh' });

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: 'refresh' }),
    });
  });

  it('throws parsed API errors', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(Response.json({ code: 'BAD_LOGIN' }, { status: 401 }));
    const { login } = await import('./auth');

    await expect(login({ emailOrUsername: 'a@b.com', password: 'wrong' })).rejects.toEqual({
      code: 'BAD_LOGIN',
    });
  });
});
