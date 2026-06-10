import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import { GuildSearchBar } from '@/features/guild/search/GuildSearchBar';
import type { GuildMember } from '@/types/guild';
import { useCurrentGuild, useGuildMembers } from '@/features/guild/GuildContext';
import { useChannels } from '@/features/channel/ChannelContext';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_CLIENT_METHODS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import { MemberPopover } from '@/shared/members/MemberPopover';
import { useGuildWorkspace } from '@/features/guild/workspace/GuildWorkspaceProvider';
import { getChannelPinnedMessages, sendMessage } from '@/api/channels';
import { MessageThread, useMessageThreadRefs } from '@/shared/message/MessageThread';
import { useChannelMessages } from './hooks/useChannelMessages';
import { useTextChannelSearchTarget } from './hooks/useTextChannelSearchTarget';

interface SelectedMember {
  member: GuildMember;
  rect: DOMRect;
}

export const TextChannelView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const {
    toggleMembersPanel,
    searchQuery,
    searchAuthorId,
    searchChannelId,
    setSearchQuery,
    setSearchAuthorId,
    setSearchChannelId,
  } = useGuildWorkspace();
  const [selected, setSelected] = useState<SelectedMember | null>(null);

  const members = useGuildMembers(guildId);
  const membersMap = new Map((members ?? []).map((member) => [member.userId, member]));
  const mentionOptions = (members ?? []).map((member) => ({
    userId: member.userId,
    username: member.username,
    displayName: member.displayName,
  }));
  const { channels } = useChannels();
  const { guildsLoading, guild } = useCurrentGuild();
  const { user } = useUser();
  const { connection } = useRealtime();
  const currentChannel = channels?.find((channel) => channel.channelId === channelId);
  const channelReady = Boolean(channelId && channels !== null && currentChannel);

  const {
    messages,
    loading,
    error,
    loadingMore,
    editingMessageId,
    lastReadMessageId,
    latestOwnMessage,
    typingUserIds,
    loadMore,
    loadUntilMessage,
    startEditing,
    cancelEditing,
    dismissNewMessagesSeparator,
    saveEdit,
    removeMessage,
    removeAttachment,
    setMessagePinned,
    toggleReaction,
  } = useChannelMessages({
    channelId,
    channelReady,
    connection,
    currentUserId: user?.userId,
  });
  const threadRefs = useMessageThreadRefs();

  const { activeSearchTarget, setHandledSearchTargetNonce, selectedMessageId, seekingTargetRef } =
    useTextChannelSearchTarget({
      channelId,
      guildId,
      messages,
      scrollRef: threadRefs.scrollRef,
      previousMessageCountRef: threadRefs.previousMessageCountRef,
      suppressNextScrollEffectsRef: threadRefs.suppressNextScrollEffectsRef,
    });

  useEffect(() => {
    const targetMessageId = activeSearchTarget?.messageId;
    if (!targetMessageId) {
      seekingTargetRef.current = false;
      return;
    }

    if (messages.some((message) => message.messageId === targetMessageId)) {
      seekingTargetRef.current = false;
      return;
    }

    if (loading || error || seekingTargetRef.current) return;

    let cancelled = false;
    seekingTargetRef.current = true;

    const ensureMessageVisible = async () => {
      const found = await loadUntilMessage(targetMessageId);
      if (cancelled) return;

      seekingTargetRef.current = false;
      if (!found) {
        setHandledSearchTargetNonce(activeSearchTarget?.nonce ?? null);
        if (guildId && channelId) {
          navigate(`/guilds/${guildId}/channels/${channelId}`, { replace: true, state: null });
        }
      }
    };

    ensureMessageVisible().catch(() => {
      seekingTargetRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeSearchTarget,
    error,
    channelId,
    guildId,
    loadUntilMessage,
    loading,
    messages,
    navigate,
    seekingTargetRef,
    setHandledSearchTargetNonce,
  ]);

  const handleAvatarClick = (member: GuildMember, rect: DOMRect) => {
    setSelected((prev) => (prev?.member.userId === member.userId ? null : { member, rect }));
  };

  if (!guildId || !channelId || guildsLoading || channels === null) {
    return null;
  }

  if (!guild) {
    return <Navigate to="/" replace />;
  }

  if (!currentChannel) {
    return <Navigate to={`/guilds/${guildId}`} replace />;
  }

  return (
    <>
      <MessageThread
        resetKey={channelId}
        title={`# ${currentChannel.name}`}
        leadingActions={
          <IconButton
            className="md:hidden"
            size="small"
            variant="ghost"
            aria-label={t('guild.channels.backToChannels')}
            title={t('guild.channels.backToChannels')}
            tooltipSide="bottom"
            onClick={() => navigate(`/guilds/${guildId}`)}
          >
            <ArrowLeft size={16} />
          </IconButton>
        }
        beforePinActions={
          <GuildSearchBar
            query={searchQuery}
            authorId={searchAuthorId}
            channelId={searchChannelId}
            onQueryChange={setSearchQuery}
            onAuthorChange={setSearchAuthorId}
            onChannelChange={setSearchChannelId}
          />
        }
        afterPinActions={
          <IconButton
            size="small"
            aria-label={t('guild.members.title')}
            title={t('guild.members.title')}
            tooltipSide="bottom"
            onClick={toggleMembersPanel}
          >
            <Users size={16} />
          </IconButton>
        }
        refs={threadRefs}
        messages={messages}
        loading={loading}
        error={error}
        loadingMore={loadingMore}
        editingMessageId={editingMessageId}
        lastReadMessageId={lastReadMessageId}
        latestOwnMessage={latestOwnMessage}
        typingUserIds={typingUserIds}
        labels={{
          loading: t('channel.messages.loading'),
          error: t('channel.messages.error'),
          empty: t('channel.messages.empty'),
        }}
        currentUser={user}
        authorMap={membersMap}
        reactionSource={{ type: 'channel', entityId: channelId }}
        composer={{
          draftKey: `channel:${channelId}`,
          sendFn: (content, fileIds, replyToMessageId, mentionedUserIds) =>
            sendMessage(channelId, content, fileIds, replyToMessageId, mentionedUserIds),
          onTypingStart: () =>
            connection?.send(REALTIME_CLIENT_METHODS.startTypingChannel, channelId).catch(() => {}),
          mentionOptions,
        }}
        pinned={{
          entityId: channelId,
          fetchPinnedMessages: getChannelPinnedMessages,
        }}
        searchState={{
          activeSearchTarget,
          selectedMessageId,
          seekingTargetRef,
        }}
        loadMore={loadMore}
        loadUntilMessage={loadUntilMessage}
        startEditing={startEditing}
        cancelEditing={cancelEditing}
        dismissNewMessagesSeparator={dismissNewMessagesSeparator}
        saveEdit={saveEdit}
        removeMessage={removeMessage}
        removeAttachment={removeAttachment}
        setMessagePinned={(messageId, isPinned) => void setMessagePinned(messageId, isPinned)}
        toggleReaction={toggleReaction}
        onAvatarClick={handleAvatarClick}
      />

      {selected && guildId && (
        <MemberPopover
          member={selected.member}
          guildId={guildId}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
          side="right"
          onRemoved={() => setSelected(null)}
          onBanned={() => setSelected(null)}
        />
      )}
    </>
  );
};
