import type { TokensPayload } from '@/types/auth';

const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';
const ACCESS_TOKEN_EXPIRATION_BUFFER_MS = 30_000;

let _accessToken: string | null = null;
let _accessTokenExpiresAt: number | null = null;
const tokenChangeListeners = new Set<(accessToken: string | null) => void>();

const notifyTokenChange = () => {
  tokenChangeListeners.forEach((listener) => listener(_accessToken));
};

export const discardLegacyRefreshToken = () => {
  localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
};

export const storeTokens = (response: TokensPayload) => {
  _accessToken = response.accessToken;
  _accessTokenExpiresAt = Date.parse(response.expiresAt);
  notifyTokenChange();
};

export const getAccessToken = () => _accessToken;

export const isAccessTokenExpiring = (
  expirationBufferMs = ACCESS_TOKEN_EXPIRATION_BUFFER_MS,
  now = Date.now()
) =>
  _accessTokenExpiresAt === null ||
  !Number.isFinite(_accessTokenExpiresAt) ||
  _accessTokenExpiresAt <= now + expirationBufferMs;

export const subscribeToTokenChanges = (listener: (accessToken: string | null) => void) => {
  tokenChangeListeners.add(listener);
  return () => {
    tokenChangeListeners.delete(listener);
  };
};

export const clearTokens = () => {
  _accessToken = null;
  _accessTokenExpiresAt = null;
  discardLegacyRefreshToken();
  notifyTokenChange();
};
