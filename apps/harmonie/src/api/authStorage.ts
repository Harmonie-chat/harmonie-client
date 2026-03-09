const REFRESH_TOKEN_KEY = 'refreshToken';

let _accessToken: string | null = null;

export interface TokensPayload {
  accessToken: string;
  refreshToken: string;
}

export const storeTokens = (response: TokensPayload) => {
  _accessToken = response.accessToken;
  localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
};

export const getAccessToken = () => _accessToken;

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const clearTokens = () => {
  _accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};
