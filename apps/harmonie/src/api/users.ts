import { apiFetch } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface AvatarAppearance {
  color?: string;
  icon?: string;
  bg?: string;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  avatar?: AvatarAppearance;
  theme: string;
  language?: string;
}

export const getMe = (): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });
