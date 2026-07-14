import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpiring,
  storeTokens,
} from './authStorage';
import { refreshTokens } from './auth';

let onLogout: (() => void) | null = null;
let refreshPromise: Promise<string> | null = null;

export const setLogoutHandler = (fn: () => void) => {
  onLogout = fn;
};

const withBearer = (init?: RequestInit): RequestInit => ({
  ...init,
  headers: {
    ...init?.headers,
    Authorization: `Bearer ${getAccessToken() ?? ''}`,
  },
});

const doRefresh = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearTokens();
    onLogout?.();
    throw new Error('No refresh token is available');
  }

  try {
    const response = await refreshTokens({ refreshToken });
    storeTokens(response);
    return response.accessToken;
  } catch (error) {
    clearTokens();
    onLogout?.();
    throw error;
  }
};

export const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const getFreshAccessToken = async (): Promise<string> => {
  const accessToken = getAccessToken();
  if (accessToken && !isAccessTokenExpiring()) return accessToken;

  return refreshAccessToken();
};

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const res = await fetch(input, withBearer(init));
  if (res.status !== 401) return res;

  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/auth/refresh')) return res;

  try {
    await refreshAccessToken();
  } catch {
    return res;
  }

  return fetch(input, withBearer(init));
};

export const parseOrThrow = async <T>(res: Response): Promise<T> => {
  if (!res.ok) throw await res.json();
  return res.json();
};
