import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearTokens,
  discardLegacyRefreshToken,
  getAccessToken,
  isAccessTokenExpiring,
  storeTokens,
  subscribeToTokenChanges,
} from './authStorage';

const FUTURE_EXPIRATION = '2100-01-01T00:00:00.000Z';

describe('authStorage', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('stores the access token and its expiration in memory', () => {
    storeTokens({
      accessToken: 'access-token',
      expiresAt: FUTURE_EXPIRATION,
    });

    expect(getAccessToken()).toBe('access-token');
    expect(isAccessTokenExpiring()).toBe(false);
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('clears the access token and its expiration', () => {
    storeTokens({
      accessToken: 'access-token',
      expiresAt: FUTURE_EXPIRATION,
    });

    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(isAccessTokenExpiring()).toBe(true);
  });

  it('removes refresh tokens left by older clients', () => {
    localStorage.setItem('refreshToken', 'legacy-refresh-token');

    discardLegacyRefreshToken();

    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('detects access tokens that are expired or close to expiry', () => {
    storeTokens({
      accessToken: 'access-token',
      expiresAt: '1970-01-01T00:02:10.000Z',
    });

    expect(isAccessTokenExpiring(30_000, 100_000)).toBe(true);
    expect(isAccessTokenExpiring(29_000, 100_000)).toBe(false);
  });

  it('treats a missing or invalid expiration as unusable', () => {
    expect(isAccessTokenExpiring()).toBe(true);

    storeTokens({
      accessToken: 'access-token',
      expiresAt: 'invalid-date',
    });

    expect(isAccessTokenExpiring()).toBe(true);
  });

  it('notifies subscribers when tokens change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTokenChanges(listener);

    storeTokens({
      accessToken: 'access-token',
      expiresAt: FUTURE_EXPIRATION,
    });
    clearTokens();
    unsubscribe();
    storeTokens({
      accessToken: 'next-token',
      expiresAt: FUTURE_EXPIRATION,
    });

    expect(listener).toHaveBeenNthCalledWith(1, 'access-token');
    expect(listener).toHaveBeenNthCalledWith(2, null);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
