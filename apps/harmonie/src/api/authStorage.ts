import type { TokensPayload } from '@/types/auth';

const REFRESH_TOKEN_KEY = 'refreshToken';

let _accessToken: string | null = null;
const tokenChangeListeners = new Set<(accessToken: string | null) => void>();

const notifyTokenChange = () => {
  tokenChangeListeners.forEach((listener) => listener(_accessToken));
};

export const storeTokens = (response: TokensPayload) => {
  _accessToken = response.accessToken;
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
  notifyTokenChange();
};

export const getAccessToken = () => _accessToken;

export const isAccessTokenExpiring = (
  accessToken: string,
  expirationBufferMs = 30_000,
  now = Date.now()
) => {
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return true;

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    return typeof exp !== 'number' || exp * 1000 <= now + expirationBufferMs;
  } catch {
    return true;
  }
};

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const subscribeToTokenChanges = (listener: (accessToken: string | null) => void) => {
  tokenChangeListeners.add(listener);
  return () => {
    tokenChangeListeners.delete(listener);
  };
};

export const clearTokens = () => {
  _accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyTokenChange();
};
