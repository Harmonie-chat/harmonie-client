import { getAccessToken } from './authStorage';
import type {
  LoginRequest,
  LoginResponse,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from '@/types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const login = async (body: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};

export const register = async (body: RegisterRequest): Promise<RegisterResponse> => {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};

export const refreshTokens = async (): Promise<RefreshResponse> => {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};

export const logout = async (): Promise<void> => {
  const accessToken = getAccessToken();
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
};
