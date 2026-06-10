import type { Message } from '@/types/channel';

export const sortMessagesAsc = (items: Message[]) =>
  items
    .slice()
    .sort((a, b) => new Date(a.createdAtUtc).getTime() - new Date(b.createdAtUtc).getTime());
