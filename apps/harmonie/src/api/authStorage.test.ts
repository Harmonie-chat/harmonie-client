import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiring,
  storeTokens,
  subscribeToTokenChanges,
} from './authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('stores the access token in memory and the refresh token in localStorage', () => {
    storeTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    expect(getAccessToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
    expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
  });

  it('clears both tokens', () => {
    storeTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });

    clearTokens();

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });

  it('detects access tokens that are expired or close to expiry', () => {
    const accessToken = `header.${btoa(JSON.stringify({ exp: 130 }))}.signature`;

    expect(isAccessTokenExpiring(accessToken, 30_000, 100_000)).toBe(true);
    expect(isAccessTokenExpiring(accessToken, 29_000, 100_000)).toBe(false);
  });

  it('treats opaque or malformed access tokens as unusable', () => {
    expect(isAccessTokenExpiring('opaque-token')).toBe(true);
    expect(isAccessTokenExpiring('header.not-json.signature')).toBe(true);
  });

  it('notifies subscribers when tokens change', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToTokenChanges(listener);

    storeTokens({ accessToken: 'access-token', refreshToken: 'refresh-token' });
    clearTokens();
    unsubscribe();
    storeTokens({ accessToken: 'next-token', refreshToken: 'next-refresh-token' });

    expect(listener).toHaveBeenNthCalledWith(1, 'access-token');
    expect(listener).toHaveBeenNthCalledWith(2, null);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
