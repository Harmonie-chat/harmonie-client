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
  avatarFileId?: string;
  avatar?: AvatarAppearance;
  theme: string;
  language: string | null;
}

export interface PatchMyProfileInput {
  displayName?: string | null;
  bio?: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance | null;
  theme?: string | null;
  language?: string | null;
}

export const getMe = (): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });

export const patchMe = (data: PatchMyProfileInput): Promise<UserProfile> =>
  apiFetch(`${API_BASE}/users/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });

export const uploadAvatarImage = (file: File): Promise<{ avatarFileId: string }> => {
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
  patchMe({ avatarFileId: null }).then(() => undefined);
