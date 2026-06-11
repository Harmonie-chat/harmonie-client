import { beforeEach, describe, expect, it } from 'vitest';
import { clearTokens, getAccessToken, getRefreshToken, storeTokens } from './authStorage';

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
});
