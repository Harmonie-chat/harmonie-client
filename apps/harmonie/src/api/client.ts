import { clearTokens, getAccessToken, getRefreshToken, storeTokens } from './authStorage';
import { refreshTokens } from './auth';

let onLogout: (() => void) | null = null;
let refreshPromise: Promise<void> | null = null;

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

const doRefresh = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    onLogout?.();
    return;
  }
  try {
    const response = await refreshTokens({ refreshToken });
    storeTokens(response);
  } catch {
    clearTokens();
    onLogout?.();
  }
};

export const apiFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const res = await fetch(input, withBearer(init));
  if (res.status !== 401) return res;

  // Guard: don't retry refresh calls to avoid infinite loop
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  if (url.includes('/auth/refresh')) return res;

  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;

  return fetch(input, withBearer(init));
};

export const parseOrThrow = async <T>(res: Response): Promise<T> => {
  if (!res.ok) throw await res.json();
  return res.json();
};
