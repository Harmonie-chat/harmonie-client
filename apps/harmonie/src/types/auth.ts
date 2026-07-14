export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  avatar: {
    color: string | null;
    icon: string | null;
    bg: string | null;
  };
  theme: string | null;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface TokensPayload {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
