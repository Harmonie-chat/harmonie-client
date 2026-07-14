import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearTokens, storeTokens } from './authStorage';

const API_BASE = 'https://localhost:5000/api';
const FUTURE_EXPIRATION = '2100-01-01T00:00:00.000Z';

describe('auth api', () => {
  beforeEach(() => {
    clearTokens();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('logs in and registers with credentialed JSON requests', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(Response.json({ accessToken: 'a', expiresAt: FUTURE_EXPIRATION }))
      .mockResolvedValueOnce(Response.json({ userId: 'user-1' }));
    const { login, register } = await import('./auth');

    await expect(login({ emailOrUsername: 'a@b.com', password: 'Password1!' })).resolves.toEqual({
      accessToken: 'a',
      expiresAt: FUTURE_EXPIRATION,
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
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrUsername: 'a@b.com', password: 'Password1!' }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_BASE}/auth/register`, {
      method: 'POST',
      credentials: 'include',
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

  it('refreshes and logs out with the HttpOnly cookie', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(Response.json({ accessToken: 'new', expiresAt: FUTURE_EXPIRATION }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    storeTokens({ accessToken: 'access-token', expiresAt: FUTURE_EXPIRATION });
    const { logout, refreshTokens } = await import('./auth');

    await expect(refreshTokens()).resolves.toEqual({
      accessToken: 'new',
      expiresAt: FUTURE_EXPIRATION,
    });
    await logout();

    const emptyRefreshTokenBody = JSON.stringify({ refreshToken: '' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: emptyRefreshTokenBody,
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer access-token',
      },
      body: emptyRefreshTokenBody,
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
