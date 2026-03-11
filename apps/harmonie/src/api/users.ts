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

export const patchMe = (
  data: Partial<
    Pick<UserProfile, 'displayName' | 'bio' | 'avatarUrl' | 'language' | 'avatar' | 'theme'>
  >
): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });

export const uploadAvatarImage = (file: File): Promise<{ avatarUrl: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch(`${API_BASE}/users/me/avatar`, {
    method: 'PUT',
    body: formData,
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });
};

export const removeAvatarImage = (): Promise<void> =>
  apiFetch(`${API_BASE}/users/me/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
  });
