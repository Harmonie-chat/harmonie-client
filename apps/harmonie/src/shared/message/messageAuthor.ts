import type { AvatarAppearance } from '@/types/user';

export interface MessageAuthor {
  userId: string;
  username: string;
  displayName?: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance | null;
}
