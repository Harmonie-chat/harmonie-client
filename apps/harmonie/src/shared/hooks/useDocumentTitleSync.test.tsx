import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDocumentTitleSync } from './useDocumentTitleSync';
import type { Channel, Guild } from '@/types/guild';
import type { Conversation } from '@/types/conversation';

let routeParams: Record<string, string | undefined> = {};
let guilds: Guild[] = [];
let channels: Channel[] | null = null;
let unreadCount = 0;
let currentUser: { userId: string } | null = null;
let conversation: Conversation | undefined;

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => routeParams,
  };
});

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => ({ guilds }),
}));

vi.mock('@/features/channel/ChannelContext', () => ({
  useChannels: () => ({ channels }),
}));

vi.mock('@/features/conversation/ConversationContext', () => ({
  useConversation: () => conversation,
}));

vi.mock('@/features/realtime/MessageActivityContext', () => ({
  useMessageActivity: () => ({ totalUnreadCount: unreadCount }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: currentUser }),
}));

const guild = (input: Partial<Guild>): Guild => ({
  guildId: 'guild-1',
  name: 'Guild',
  ownerUserId: 'owner-1',
  role: 'Member',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  iconFileId: null,
  icon: null,
  ...input,
});

const channel = (input: Partial<Channel>): Channel => ({
  channelId: 'channel-1',
  name: 'general',
  type: 'Text',
  isDefault: true,
  position: 0,
  ...input,
});

describe('useDocumentTitleSync', () => {
  it('sets the base title when no workspace context is selected', () => {
    routeParams = {};
    guilds = [];
    channels = [];
    unreadCount = 0;
    conversation = undefined;

    renderHook(() => useDocumentTitleSync());

    expect(document.title).toBe('Harmonie');
  });

  it('uses the current channel and guild names', () => {
    routeParams = { guildId: 'guild-1', channelId: 'channel-1' };
    guilds = [guild({ guildId: 'guild-1', name: 'Engineering' })];
    channels = [channel({ channelId: 'channel-1', name: 'standup' })];
    unreadCount = 3;
    conversation = undefined;

    renderHook(() => useDocumentTitleSync());

    expect(document.title).toBe('(3) Harmonie | standup | Engineering');
  });

  it('prefers the conversation label over channel and guild names', () => {
    routeParams = {
      guildId: 'guild-1',
      channelId: 'channel-1',
      conversationId: 'conversation-1',
    };
    guilds = [guild({ guildId: 'guild-1', name: 'Engineering' })];
    channels = [channel({ channelId: 'channel-1', name: 'standup' })];
    unreadCount = 0;
    currentUser = { userId: 'user-1' };
    conversation = {
      conversationId: 'conversation-1',
      type: 'Direct',
      name: null,
      participants: [
        { userId: 'user-1', username: 'ada' },
        { userId: 'user-2', username: 'grace', displayName: 'Grace' },
      ],
      createdAtUtc: '2024-01-01T00:00:00.000Z',
    };

    renderHook(() => useDocumentTitleSync());

    expect(document.title).toBe('Harmonie | Grace');
  });
});
