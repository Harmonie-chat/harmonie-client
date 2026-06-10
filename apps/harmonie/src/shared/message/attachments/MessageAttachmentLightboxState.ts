import type { MessageAuthor } from '@/shared/message/messageAuthor';

export interface LightboxState {
  fileId: string;
  fileName: string;
  member?: MessageAuthor;
  createdAtUtc: string;
}
