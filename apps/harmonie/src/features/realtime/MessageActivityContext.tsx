import { createContext, use, useEffect, useReducer, type ReactNode } from 'react';
import { useMatch, useParams } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';
import { useConversations } from '@/features/conversation/ConversationContext';
import { useGuilds } from '@/features/guild/GuildContext';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useUser } from '@/features/user/UserContext';
import type { MessageCreatedEvent } from '@/types/channel';
import type { ConversationMessageCreatedEvent } from '@/types/conversation';
import { showBrowserNotification } from '@/shared/notifications/browserNotification';
import { REALTIME_SERVER_EVENTS } from './constants';

interface MessageActivityContextValue {
  totalUnreadCount: number;
  hasUnreadChannel: (channelId: string) => boolean;
  hasUnreadGuild: (guildId: string) => boolean;
  hasUnreadConversation: (conversationId: string) => boolean;
  hasAnyUnreadConversation: () => boolean;
}

const MessageActivityContext = createContext<MessageActivityContextValue>({
  totalUnreadCount: 0,
  hasUnreadChannel: () => false,
  hasUnreadGuild: () => false,
  hasUnreadConversation: () => false,
  hasAnyUnreadConversation: () => false,
});

const toSenderName = (
  authorUserId: string,
  displayName?: string | null,
  username?: string | null
) => {
  const display = displayName?.trim();
  if (display && display !== authorUserId) return display;

  const user = username?.trim();
  if (user && user !== authorUserId) return user;

  return undefined;
};

const toTitlePart = (value: string | null | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed || fallback;
};

const isDirectConversation = (conversationType: string) =>
  conversationType.trim().toLowerCase() === 'direct';

const addEntity = (prev: Record<string, number>, entityId: string) => ({
  ...prev,
  [entityId]: (prev[entityId] ?? 0) + 1,
});

const removeRecordEntry = <T,>(prev: Record<string, T>, entityId: string) => {
  if (!(entityId in prev)) return prev;
  const next = { ...prev };
  delete next[entityId];
  return next;
};

const markCleared = (prev: Record<string, boolean>, entityId: string) =>
  prev[entityId] ? prev : { ...prev, [entityId]: true };

const hasInitialUnread =
  (initialUnreadIds: Set<string>, clearedIds: Record<string, boolean>) => (entityId: string) =>
    initialUnreadIds.has(entityId) && !clearedIds[entityId];

const countInitialUnread = (initialUnreadIds: Set<string>, clearedIds: Record<string, boolean>) => {
  let count = 0;
  initialUnreadIds.forEach((entityId) => {
    if (!clearedIds[entityId]) count += 1;
  });
  return count;
};

interface ClearedActivityState {
  unreadChannels: Record<string, number>;
  unreadGuilds: Record<string, number>;
  unreadConversations: Record<string, number>;
  unreadCurrentRoute: number;
  clearedInitialChannels: Record<string, boolean>;
  clearedInitialGuilds: Record<string, boolean>;
  clearedInitialConversations: Record<string, boolean>;
  channelGuildIds: Record<string, string>;
}

type ClearedActivityAction =
  | { type: 'mergeChannelGuildIds'; guildId: string; channelIds: string[] }
  | { type: 'messageInOtherGuildChannel'; guildId: string; channelId: string }
  | { type: 'messageInOtherChannel'; guildId: string; channelId: string }
  | { type: 'messageInOtherConversation'; conversationId: string }
  | { type: 'incrementCurrentRoute' }
  | { type: 'clearCurrentRoute' }
  | { type: 'clearActiveChannel'; channelId: string }
  | { type: 'clearActiveGuild'; guildId: string }
  | { type: 'clearActiveConversation'; conversationId: string };

const clearedActivityReducer = (
  state: ClearedActivityState,
  action: ClearedActivityAction
): ClearedActivityState => {
  switch (action.type) {
    case 'mergeChannelGuildIds':
      return {
        ...state,
        channelGuildIds: {
          ...state.channelGuildIds,
          ...Object.fromEntries(action.channelIds.map((channelId) => [channelId, action.guildId])),
        },
      };
    case 'messageInOtherGuildChannel':
      return {
        ...state,
        channelGuildIds: { ...state.channelGuildIds, [action.channelId]: action.guildId },
        clearedInitialGuilds: removeRecordEntry(state.clearedInitialGuilds, action.guildId),
        clearedInitialChannels: removeRecordEntry(state.clearedInitialChannels, action.channelId),
        unreadGuilds: addEntity(state.unreadGuilds, action.guildId),
        unreadChannels: addEntity(state.unreadChannels, action.channelId),
      };
    case 'messageInOtherChannel':
      return {
        ...state,
        channelGuildIds: { ...state.channelGuildIds, [action.channelId]: action.guildId },
        clearedInitialChannels: removeRecordEntry(state.clearedInitialChannels, action.channelId),
        unreadChannels: addEntity(state.unreadChannels, action.channelId),
      };
    case 'messageInOtherConversation':
      return {
        ...state,
        clearedInitialConversations: removeRecordEntry(
          state.clearedInitialConversations,
          action.conversationId
        ),
        unreadConversations: addEntity(state.unreadConversations, action.conversationId),
      };
    case 'incrementCurrentRoute':
      return {
        ...state,
        unreadCurrentRoute: state.unreadCurrentRoute + 1,
      };
    case 'clearCurrentRoute':
      return {
        ...state,
        unreadCurrentRoute: 0,
      };
    case 'clearActiveChannel':
      return {
        ...state,
        clearedInitialChannels: markCleared(state.clearedInitialChannels, action.channelId),
        unreadChannels: removeRecordEntry(state.unreadChannels, action.channelId),
      };
    case 'clearActiveGuild':
      return {
        ...state,
        clearedInitialGuilds: markCleared(state.clearedInitialGuilds, action.guildId),
        unreadGuilds: removeRecordEntry(state.unreadGuilds, action.guildId),
      };
    case 'clearActiveConversation':
      return {
        ...state,
        clearedInitialConversations: markCleared(
          state.clearedInitialConversations,
          action.conversationId
        ),
        unreadConversations: removeRecordEntry(state.unreadConversations, action.conversationId),
      };
  }
};

export const MessageActivityProvider = ({ children }: { children: ReactNode }) => {
  const { connection } = useRealtime();
  const { user } = useUser();
  const { guilds } = useGuilds();
  const { channels } = useChannels();
  const { conversations } = useConversations();
  const { guildId: currentRouteGuildId } = useParams<{ guildId: string }>();
  const textChannelMatch = useMatch('/guilds/:guildId/channels/:channelId');
  const activeTextChannelId = textChannelMatch?.params.channelId;
  const conversationMatch = useMatch('/conversations/:conversationId');
  const activeConversationId = conversationMatch?.params.conversationId;
  const [clearedActivity, dispatchClearedActivity] = useReducer(clearedActivityReducer, {
    unreadChannels: {},
    unreadGuilds: {},
    unreadConversations: {},
    unreadCurrentRoute: 0,
    clearedInitialChannels: {},
    clearedInitialGuilds: {},
    clearedInitialConversations: {},
    channelGuildIds: {},
  });
  const {
    clearedInitialChannels,
    clearedInitialGuilds,
    clearedInitialConversations,
    channelGuildIds,
    unreadChannels,
    unreadGuilds,
    unreadConversations,
    unreadCurrentRoute,
  } = clearedActivity;

  const initialUnreadChannels = new Set<string>();
  for (const channel of channels ?? []) {
    if (channel.type === 'Text' && channel.hasUnread) initialUnreadChannels.add(channel.channelId);
  }

  const initialUnreadGuilds = new Set<string>();
  for (const guild of guilds) {
    if (guild.hasUnread) initialUnreadGuilds.add(guild.guildId);
  }

  const initialUnreadConversations = new Set<string>();
  for (const conversation of conversations ?? []) {
    if (conversation.hasUnread) initialUnreadConversations.add(conversation.conversationId);
  }

  useEffect(() => {
    if (!currentRouteGuildId || !channels) return;
    dispatchClearedActivity({
      type: 'mergeChannelGuildIds',
      guildId: currentRouteGuildId,
      channelIds: channels.map((channel) => channel.channelId),
    });
  }, [channels, currentRouteGuildId]);

  // Clear current-route unread when the tab regains focus
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleFocus = () => dispatchClearedActivity({ type: 'clearCurrentRoute' });
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Guild channel messages
  useEffect(() => {
    if (!connection) return;

    const handleMessageCreated = (event: MessageCreatedEvent) => {
      if (event.authorUserId === user?.userId) return;

      const targetUrl = `/guilds/${event.guildId}/channels/${event.channelId}`;
      const senderName =
        toSenderName(event.authorUserId, event.authorDisplayName, event.authorUsername) ??
        event.authorUserId;
      const title = `${toTitlePart(event.guildName, event.guildId)} | ${toTitlePart(
        event.channelName,
        event.channelId
      )} | ${senderName}`;

      const notify = () =>
        showBrowserNotification({
          messageId: event.messageId,
          content: event.content,
          attachments: event.attachments,
          targetUrl,
          title,
        });

      if (event.guildId !== currentRouteGuildId) {
        dispatchClearedActivity({
          type: 'messageInOtherGuildChannel',
          guildId: event.guildId,
          channelId: event.channelId,
        });
        notify();
        return;
      }

      if (event.channelId !== activeTextChannelId) {
        dispatchClearedActivity({
          type: 'messageInOtherChannel',
          guildId: event.guildId,
          channelId: event.channelId,
        });
        notify();
        return;
      }

      // Same channel but tab not focused: notify and increment title counter
      if (!document.hasFocus()) dispatchClearedActivity({ type: 'incrementCurrentRoute' });
      notify();
    };

    connection.on(REALTIME_SERVER_EVENTS.messageCreated, handleMessageCreated);
    return () => connection.off(REALTIME_SERVER_EVENTS.messageCreated, handleMessageCreated);
  }, [connection, currentRouteGuildId, activeTextChannelId, user?.userId]);

  // Conversation messages
  useEffect(() => {
    if (!connection) return;

    const handleConversationMessageCreated = (event: ConversationMessageCreatedEvent) => {
      if (event.authorUserId === user?.userId) return;

      const targetUrl = `/conversations/${event.conversationId}`;
      const senderName =
        toSenderName(event.authorUserId, event.authorDisplayName, event.authorUsername) ??
        event.authorUserId;
      const conversationName = event.conversationName?.trim();
      const title =
        isDirectConversation(event.conversationType) || !conversationName
          ? senderName
          : `${conversationName} | ${senderName}`;

      const notify = () =>
        showBrowserNotification({
          messageId: event.messageId,
          content: event.content,
          attachments: event.attachments ?? [],
          targetUrl,
          title,
        });

      if (event.conversationId !== activeConversationId) {
        dispatchClearedActivity({
          type: 'messageInOtherConversation',
          conversationId: event.conversationId,
        });
        notify();
        return;
      }

      // Same conversation but tab not focused: notify and increment title counter
      if (!document.hasFocus()) dispatchClearedActivity({ type: 'incrementCurrentRoute' });
      notify();
    };

    connection.on(
      REALTIME_SERVER_EVENTS.conversationMessageCreated,
      handleConversationMessageCreated
    );
    return () =>
      connection.off(
        REALTIME_SERVER_EVENTS.conversationMessageCreated,
        handleConversationMessageCreated
      );
  }, [connection, activeConversationId, user?.userId]);

  useEffect(() => {
    if (!activeTextChannelId) return;
    dispatchClearedActivity({ type: 'clearActiveChannel', channelId: activeTextChannelId });
  }, [activeTextChannelId]);

  useEffect(() => {
    if (!activeTextChannelId || !currentRouteGuildId) return;

    const hasOtherRealtimeUnreadChannel = Object.keys(unreadChannels).some(
      (channelId) =>
        channelId !== activeTextChannelId && channelGuildIds[channelId] === currentRouteGuildId
    );
    const hasOtherInitialUnreadChannel = (channels ?? []).some(
      (channel) =>
        channel.type === 'Text' &&
        channel.channelId !== activeTextChannelId &&
        channel.hasUnread &&
        !clearedInitialChannels[channel.channelId]
    );

    if (hasOtherRealtimeUnreadChannel || hasOtherInitialUnreadChannel) return;

    dispatchClearedActivity({ type: 'clearActiveGuild', guildId: currentRouteGuildId });
  }, [
    activeTextChannelId,
    channels,
    channelGuildIds,
    clearedInitialChannels,
    currentRouteGuildId,
    unreadChannels,
  ]);

  useEffect(() => {
    if (!activeConversationId) return;
    dispatchClearedActivity({
      type: 'clearActiveConversation',
      conversationId: activeConversationId,
    });
  }, [activeConversationId]);

  const hasInitialUnreadChannel = hasInitialUnread(initialUnreadChannels, clearedInitialChannels);
  const hasInitialUnreadGuild = hasInitialUnread(initialUnreadGuilds, clearedInitialGuilds);
  const hasInitialUnreadConversation = hasInitialUnread(
    initialUnreadConversations,
    clearedInitialConversations
  );
  const hasUnreadCurrentGuildChannel = (guildId: string) =>
    currentRouteGuildId === guildId &&
    (Object.keys(unreadChannels).some((channelId) => channelGuildIds[channelId] === guildId) ||
      countInitialUnread(initialUnreadChannels, clearedInitialChannels) > 0);

  const value: MessageActivityContextValue = {
    totalUnreadCount:
      Object.values(unreadChannels).reduce((sum, count) => sum + count, 0) +
      Object.values(unreadGuilds).reduce((sum, count) => sum + count, 0) +
      Object.values(unreadConversations).reduce((sum, count) => sum + count, 0) +
      countInitialUnread(initialUnreadChannels, clearedInitialChannels) +
      countInitialUnread(initialUnreadGuilds, clearedInitialGuilds) +
      countInitialUnread(initialUnreadConversations, clearedInitialConversations) +
      unreadCurrentRoute,
    hasUnreadChannel: (channelId: string) =>
      (unreadChannels[channelId] ?? 0) > 0 || hasInitialUnreadChannel(channelId),
    hasUnreadGuild: (guildId: string) =>
      (unreadGuilds[guildId] ?? 0) > 0 ||
      hasInitialUnreadGuild(guildId) ||
      hasUnreadCurrentGuildChannel(guildId),
    hasUnreadConversation: (conversationId: string) =>
      (unreadConversations[conversationId] ?? 0) > 0 ||
      hasInitialUnreadConversation(conversationId),
    hasAnyUnreadConversation: () =>
      Object.values(unreadConversations).some((c) => c > 0) ||
      countInitialUnread(initialUnreadConversations, clearedInitialConversations) > 0,
  };

  return (
    <MessageActivityContext.Provider value={value}>{children}</MessageActivityContext.Provider>
  );
};

export const useMessageActivity = () => use(MessageActivityContext);
