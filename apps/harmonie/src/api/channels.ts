import { apiFetch, parseOrThrow } from '@/api/client.ts';
import { Channel } from '@/api/guilds.ts';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface Message {
  messageId: string;
  authorUserId: string;
  content: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface MessageList {
  conversationId: string;
  items: Message[];
  nextCursor: string | null;
}

export const getChannelMessages = (channelId: string): Promise<MessageList> =>
  apiFetch(`${API_BASE}/channels/${channelId}/messages`).then((r) => parseOrThrow<MessageList>(r));

export interface UpdateChannelInput {
  name: string;
}

export const updateChannel = (channelId: string, input: UpdateChannelInput): Promise<Channel> =>
  apiFetch(`${API_BASE}/channels/${channelId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((r) => parseOrThrow<Channel>(r));

export const deleteChannel = (channelId: string): Promise<void> =>
  apiFetch(`${API_BASE}/channels/${channelId}`, {
    method: 'DELETE',
  }).then((r) => {
    if (!r.ok) throw new Error('Failed to delete channel');
  });
