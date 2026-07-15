import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageActivityProvider, useMessageActivity } from './MessageActivityContext';
import type { PushNotificationStatus } from '@/shared/notifications/webPush';
import { REALTIME_SERVER_EVENTS } from './constants';

type Handler = (event: Record<string, unknown>) => void;

const mocks = vi.hoisted(() => ({
  applySinkId: vi.fn(),
  channels: undefined as
    | Array<{ channelId: string; type: string; hasUnread?: boolean }>
    | undefined,
  connection: null as null | {
    on: ReturnType<typeof vi.fn>;
    off: ReturnType<typeof vi.fn>;
  },
  conversations: undefined as Array<{ conversationId: string; hasUnread?: boolean }> | undefined,
  guilds: [] as Array<{ guildId: string; hasUnread?: boolean }>,
  handlers: new Map<string, Handler>(),
  outputMuted: false,
  params: {} as { guildId?: string },
  playMessageNotificationSound: vi.fn(),
  pushNotificationStatus: 'prompt' as PushNotificationStatus,
  showNotification: vi.fn(),
  textChannelMatch: null as null | { params: { channelId?: string } },
  conversationMatch: null as null | { params: { conversationId?: string } },
  user: { userId: 'user-1' } as null | { userId: string },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useMatch: (pattern: string) => {
      if (pattern === '/guilds/:guildId/channels/:channelId') return mocks.textChannelMatch;
      if (pattern === '/conversations/:conversationId') return mocks.conversationMatch;
      return null;
    },
    useParams: () => mocks.params,
  };
});

vi.mock('@/features/channel/ChannelContext', () => ({
  useChannels: () => ({ channels: mocks.channels }),
}));

vi.mock('@/features/conversation/ConversationContext', () => ({
  useConversations: () => ({ conversations: mocks.conversations }),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => ({ guilds: mocks.guilds }),
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

vi.mock('@/features/user/audio/AudioOutputContext', () => ({
  useAudioOutput: () => ({
    applySinkId: mocks.applySinkId,
    muted: mocks.outputMuted,
  }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
}));

vi.mock('@/shared/notifications/browserNotification', () => ({
  showBrowserNotification: mocks.showNotification,
}));

vi.mock('@/shared/notifications/messageNotificationSound', () => ({
  playMessageNotificationSound: mocks.playMessageNotificationSound,
}));

vi.mock('@/shared/notifications/PushNotificationContext', () => ({
  usePushNotifications: () => ({ status: mocks.pushNotificationStatus }),
}));

const ActivityConsumer = () => {
  const activity = useMessageActivity();

  return (
    <div>
      <span data-testid="total">{activity.totalUnreadCount}</span>
      <span data-testid="channel-1">{String(activity.hasUnreadChannel('channel-1'))}</span>
      <span data-testid="channel-2">{String(activity.hasUnreadChannel('channel-2'))}</span>
      <span data-testid="guild-1">{String(activity.hasUnreadGuild('guild-1'))}</span>
      <span data-testid="guild-2">{String(activity.hasUnreadGuild('guild-2'))}</span>
      <span data-testid="conversation-1">
        {String(activity.hasUnreadConversation('conversation-1'))}
      </span>
      <span data-testid="conversation-2">
        {String(activity.hasUnreadConversation('conversation-2'))}
      </span>
      <span data-testid="any-conversation">{String(activity.hasAnyUnreadConversation())}</span>
    </div>
  );
};

const renderProvider = () =>
  render(
    <MessageActivityProvider>
      <ActivityConsumer />
    </MessageActivityProvider>
  );

const createConnection = () => {
  mocks.connection = {
    on: vi.fn((eventName: string, handler: Handler) => {
      mocks.handlers.set(eventName, handler);
    }),
    off: vi.fn((eventName: string, handler: Handler) => {
      if (mocks.handlers.get(eventName) === handler) mocks.handlers.delete(eventName);
    }),
  };
};

const channelMessage = (input: Record<string, unknown> = {}) => ({
  messageId: 'message-1',
  guildId: 'guild-1',
  guildName: 'Guild One',
  channelId: 'channel-1',
  channelName: 'general',
  authorUserId: 'user-2',
  authorDisplayName: 'Ada',
  authorUsername: 'ada',
  content: '<p>Hello</p>',
  attachments: [],
  ...input,
});

const conversationMessage = (input: Record<string, unknown> = {}) => ({
  messageId: 'conversation-message-1',
  conversationId: 'conversation-1',
  conversationName: 'Design',
  conversationType: 'Group',
  authorUserId: 'user-2',
  authorDisplayName: 'Grace',
  authorUsername: 'grace',
  content: '<p>Hi</p>',
  attachments: [],
  ...input,
});

describe('MessageActivityProvider', () => {
  beforeEach(() => {
    mocks.channels = undefined;
    mocks.connection = null;
    mocks.conversations = undefined;
    mocks.guilds = [];
    mocks.handlers.clear();
    mocks.applySinkId.mockReset();
    mocks.outputMuted = false;
    mocks.params = {};
    mocks.playMessageNotificationSound.mockReset();
    mocks.pushNotificationStatus = 'prompt';
    mocks.showNotification.mockReset();
    mocks.textChannelMatch = null;
    mocks.conversationMatch = null;
    mocks.user = { userId: 'user-1' };
  });

  it('returns inert defaults outside the provider', () => {
    render(<ActivityConsumer />);

    expect(screen.getByTestId('total')).toHaveTextContent('0');
    expect(screen.getByTestId('channel-1')).toHaveTextContent('false');
    expect(screen.getByTestId('guild-1')).toHaveTextContent('false');
    expect(screen.getByTestId('conversation-1')).toHaveTextContent('false');
    expect(screen.getByTestId('any-conversation')).toHaveTextContent('false');
  });

  it('counts initial unread channels, guilds, and conversations', () => {
    mocks.channels = [
      { channelId: 'channel-1', type: 'Text', hasUnread: true },
      { channelId: 'voice-1', type: 'Voice', hasUnread: true },
    ];
    mocks.guilds = [{ guildId: 'guild-1', hasUnread: true }];
    mocks.conversations = [{ conversationId: 'conversation-1', hasUnread: true }];

    renderProvider();

    expect(screen.getByTestId('total')).toHaveTextContent('3');
    expect(screen.getByTestId('channel-1')).toHaveTextContent('true');
    expect(screen.getByTestId('guild-1')).toHaveTextContent('true');
    expect(screen.getByTestId('conversation-1')).toHaveTextContent('true');
    expect(screen.getByTestId('any-conversation')).toHaveTextContent('true');
  });

  it('clears initial unread state for the active channel, guild, and conversation', async () => {
    mocks.params = { guildId: 'guild-1' };
    mocks.textChannelMatch = { params: { channelId: 'channel-1' } };
    mocks.conversationMatch = { params: { conversationId: 'conversation-1' } };
    mocks.channels = [{ channelId: 'channel-1', type: 'Text', hasUnread: true }];
    mocks.guilds = [{ guildId: 'guild-1', hasUnread: true }];
    mocks.conversations = [{ conversationId: 'conversation-1', hasUnread: true }];

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('total')).toHaveTextContent('0'));
    expect(screen.getByTestId('channel-1')).toHaveTextContent('false');
    expect(screen.getByTestId('guild-1')).toHaveTextContent('false');
    expect(screen.getByTestId('conversation-1')).toHaveTextContent('false');
    expect(screen.getByTestId('any-conversation')).toHaveTextContent('false');
  });

  it('tracks realtime guild channel activity and clears current-route counts on focus', async () => {
    createConnection();
    mocks.params = { guildId: 'guild-1' };
    mocks.textChannelMatch = { params: { channelId: 'channel-1' } };
    mocks.channels = [
      { channelId: 'channel-1', type: 'Text' },
      { channelId: 'channel-2', type: 'Text' },
    ];
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);

    renderProvider();

    await waitFor(() =>
      expect(mocks.handlers.has(REALTIME_SERVER_EVENTS.messageCreated)).toBe(true)
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.messageCreated)?.(
        channelMessage({
          guildId: 'guild-2',
          guildName: ' ',
          channelId: 'channel-3',
          channelName: '',
          authorDisplayName: ' ',
          authorUsername: 'grace',
        })
      );
    });

    expect(screen.getByTestId('guild-2')).toHaveTextContent('true');
    expect(mocks.showNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({
        targetUrl: '/guilds/guild-2/channels/channel-3',
        title: 'guild-2 | channel-3 | grace',
      })
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.messageCreated)?.(
        channelMessage({ channelId: 'channel-2', channelName: 'random' })
      );
    });

    expect(screen.getByTestId('channel-2')).toHaveTextContent('true');
    expect(screen.getByTestId('guild-1')).toHaveTextContent('true');

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.messageCreated)?.(
        channelMessage({
          authorDisplayName: '',
          authorUsername: '',
        })
      );
    });

    expect(mocks.showNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({
        targetUrl: '/guilds/guild-1/channels/channel-1',
        title: 'Guild One | general | user-2',
      })
    );
    expect(screen.getByTestId('total')).toHaveTextContent('4');
    expect(mocks.playMessageNotificationSound).toHaveBeenCalledTimes(3);
    expect(mocks.playMessageNotificationSound).toHaveBeenLastCalledWith(mocks.applySinkId, false);

    act(() => {
      fireEvent.focus(window);
    });

    expect(screen.getByTestId('total')).toHaveTextContent('3');
    hasFocus.mockRestore();
  });

  it('tracks realtime conversation activity and ignores messages from the current user', async () => {
    createConnection();
    mocks.conversationMatch = { params: { conversationId: 'conversation-1' } };
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(false);

    renderProvider();

    await waitFor(() =>
      expect(mocks.handlers.has(REALTIME_SERVER_EVENTS.conversationMessageCreated)).toBe(true)
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.conversationMessageCreated)?.(
        conversationMessage({ conversationId: 'conversation-2', conversationType: 'direct' })
      );
    });

    expect(screen.getByTestId('conversation-2')).toHaveTextContent('true');
    expect(screen.getByTestId('any-conversation')).toHaveTextContent('true');
    expect(mocks.showNotification).toHaveBeenLastCalledWith(
      expect.objectContaining({
        targetUrl: '/conversations/conversation-2',
        title: 'Grace',
      })
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.conversationMessageCreated)?.(
        conversationMessage({ conversationName: '' })
      );
    });

    expect(screen.getByTestId('total')).toHaveTextContent('2');

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.conversationMessageCreated)?.(
        conversationMessage({ authorUserId: 'user-1' })
      );
    });

    expect(screen.getByTestId('total')).toHaveTextContent('2');
    expect(mocks.playMessageNotificationSound).toHaveBeenCalledTimes(2);
    expect(mocks.playMessageNotificationSound).toHaveBeenLastCalledWith(mocks.applySinkId, false);
    hasFocus.mockRestore();
  });

  it('keeps the sound silent for the active focused channel and conversation', async () => {
    createConnection();
    mocks.textChannelMatch = { params: { channelId: 'channel-1' } };
    mocks.conversationMatch = { params: { conversationId: 'conversation-1' } };
    const hasFocus = vi.spyOn(document, 'hasFocus').mockReturnValue(true);

    renderProvider();

    await waitFor(() =>
      expect(mocks.handlers.has(REALTIME_SERVER_EVENTS.messageCreated)).toBe(true)
    );
    await waitFor(() =>
      expect(mocks.handlers.has(REALTIME_SERVER_EVENTS.conversationMessageCreated)).toBe(true)
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.messageCreated)?.(channelMessage());
      mocks.handlers.get(REALTIME_SERVER_EVENTS.conversationMessageCreated)?.(
        conversationMessage()
      );
    });

    expect(mocks.playMessageNotificationSound).not.toHaveBeenCalled();

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.messageCreated)?.(
        channelMessage({ channelId: 'channel-2' })
      );
      mocks.handlers.get(REALTIME_SERVER_EVENTS.conversationMessageCreated)?.(
        conversationMessage({ conversationId: 'conversation-2' })
      );
    });

    expect(mocks.playMessageNotificationSound).toHaveBeenCalledTimes(2);
    hasFocus.mockRestore();
  });

  it('does not duplicate browser notifications when web push is enabled', async () => {
    createConnection();
    mocks.pushNotificationStatus = 'enabled';

    renderProvider();

    await waitFor(() =>
      expect(mocks.handlers.has(REALTIME_SERVER_EVENTS.messageCreated)).toBe(true)
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.messageCreated)?.(channelMessage());
    });

    expect(screen.getByTestId('channel-1')).toHaveTextContent('true');
    expect(mocks.showNotification).not.toHaveBeenCalled();
  });

  it('unsubscribes realtime handlers on unmount', async () => {
    createConnection();

    const { unmount } = renderProvider();

    await waitFor(() =>
      expect(mocks.connection?.on).toHaveBeenCalledWith(
        REALTIME_SERVER_EVENTS.messageCreated,
        expect.any(Function)
      )
    );
    unmount();

    expect(mocks.connection?.off).toHaveBeenCalledWith(
      REALTIME_SERVER_EVENTS.messageCreated,
      expect.any(Function)
    );
    expect(mocks.connection?.off).toHaveBeenCalledWith(
      REALTIME_SERVER_EVENTS.conversationMessageCreated,
      expect.any(Function)
    );
  });
});
