import { apiFetch } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export const getMe = (): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });
