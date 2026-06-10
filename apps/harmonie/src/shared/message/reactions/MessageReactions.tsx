import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getChannelReactionUsers } from '@/api/channels';
import { getConversationReactionUsers } from '@/api/conversations';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import type { MessageReaction, MessageReactionUser } from '@/types/channel';
import type { UserProfile } from '@/types/user';
import {
  formatReactionUserNames,
  getReactionPreviewUsers,
} from '@/shared/message/utils/messageReactionPreview';
import { MessageReactionTooltip } from './MessageReactionTooltip';
import { MessageReactionUsersModal } from './MessageReactionUsersModal';

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  onToggle: (emoji: string) => void;
  reactionSource?: {
    type: 'channel' | 'conversation';
    entityId: string;
  };
  reactionUserMap?: ReadonlyMap<string, MessageAuthor>;
  currentUser?: UserProfile | null;
}

interface ReactionUsersState {
  emoji: string | null;
  users: MessageReactionUser[];
  nextCursor: string | null;
  error: boolean;
}

export const MessageReactions = ({
  messageId,
  reactions,
  onToggle,
  reactionSource,
  reactionUserMap,
  currentUser,
}: MessageReactionsProps) => {
  const { t } = useTranslation();
  const tooltipId = useId();
  const closeTooltipTimeoutRef = useRef<number | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<{
    reaction: MessageReaction;
    anchorRect: DOMRect;
  } | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [reactionUsersState, setReactionUsersState] = useState<ReactionUsersState>({
    emoji: null,
    users: [],
    nextCursor: null,
    error: false,
  });
  const [loadingMoreReactionUsers, setLoadingMoreReactionUsers] = useState(false);
  const reactionUsers = reactionUsersState.emoji === selectedEmoji ? reactionUsersState.users : [];
  const reactionUsersNextCursor =
    reactionUsersState.emoji === selectedEmoji ? reactionUsersState.nextCursor : null;
  const loadingReactionUsers =
    selectedEmoji !== null &&
    (reactionUsersState.emoji !== selectedEmoji || loadingMoreReactionUsers);
  const reactionUsersError =
    reactionUsersState.emoji === selectedEmoji ? reactionUsersState.error : false;

  const selectedReaction = selectedEmoji
    ? reactions.find((reaction) => reaction.emoji === selectedEmoji)
    : null;

  const hoveredUsers = hoveredReaction
    ? getReactionPreviewUsers(hoveredReaction.reaction, currentUser)
    : [];
  const hoveredUserNames = hoveredUsers.map((user) => user.displayName ?? user.username);
  const hoveredRemainingCount = hoveredReaction
    ? Math.max(0, hoveredReaction.reaction.count - hoveredUsers.length)
    : 0;
  const hoveredNamesLabel = formatReactionUserNames(
    hoveredUserNames,
    hoveredRemainingCount,
    t('channel.messages.reactionUsersSeparator'),
    t('channel.messages.reactionUsersLastSeparator'),
    t('channel.messages.reactionUsersRemaining', { count: hoveredRemainingCount })
  );
  const hoveredSentence = hoveredReaction
    ? t(
        hoveredReaction.reaction.count === 1
          ? 'channel.messages.reactionUsersSentenceOne'
          : 'channel.messages.reactionUsersSentence',
        { names: hoveredNamesLabel }
      )
    : '';
  const tooltipStyle = hoveredReaction
    ? {
        left: hoveredReaction.anchorRect.left + hoveredReaction.anchorRect.width / 2,
        top: hoveredReaction.anchorRect.top - 8,
      }
    : undefined;

  const clearCloseTooltipTimeout = () => {
    if (closeTooltipTimeoutRef.current === null) return;
    window.clearTimeout(closeTooltipTimeoutRef.current);
    closeTooltipTimeoutRef.current = null;
  };

  const closeTooltipSoon = () => {
    clearCloseTooltipTimeout();
    closeTooltipTimeoutRef.current = window.setTimeout(() => setHoveredReaction(null), 100);
  };

  const showTooltip = (reaction: MessageReaction, anchorRect: DOMRect) => {
    clearCloseTooltipTimeout();
    setHoveredReaction({ reaction, anchorRect });
  };

  const openReactionUsers = (emoji: string) => {
    if (!reactionSource) return;
    setSelectedEmoji(emoji);
    setHoveredReaction(null);
  };

  const fetchReactionUsers = async (emoji: string, cursor?: string | null) => {
    if (!reactionSource) return;

    if (cursor) setLoadingMoreReactionUsers(true);
    try {
      const data =
        reactionSource.type === 'channel'
          ? await getChannelReactionUsers(reactionSource.entityId, messageId, emoji, cursor)
          : await getConversationReactionUsers(reactionSource.entityId, messageId, emoji, cursor);
      setReactionUsersState((prev) => ({
        emoji,
        users: cursor && prev.emoji === emoji ? [...prev.users, ...data.users] : data.users,
        nextCursor: data.nextCursor,
        error: false,
      }));
    } catch {
      setReactionUsersState((prev) => ({
        emoji,
        users: cursor && prev.emoji === emoji ? prev.users : [],
        nextCursor: cursor && prev.emoji === emoji ? prev.nextCursor : null,
        error: true,
      }));
    }
    setLoadingMoreReactionUsers(false);
  };

  useEffect(() => {
    if (!selectedEmoji || !reactionSource) return;
    let active = true;
    const emoji = selectedEmoji;
    const loadInitialReactionUsers = async () => {
      try {
        const data =
          reactionSource.type === 'channel'
            ? await getChannelReactionUsers(reactionSource.entityId, messageId, emoji)
            : await getConversationReactionUsers(reactionSource.entityId, messageId, emoji);
        if (!active) return;
        setReactionUsersState({
          emoji,
          users: data.users,
          nextCursor: data.nextCursor,
          error: false,
        });
      } catch {
        if (!active) return;
        setReactionUsersState({ emoji, users: [], nextCursor: null, error: true });
      }
    };
    void loadInitialReactionUsers();
    return () => {
      active = false;
    };
  }, [messageId, reactionSource, selectedEmoji]);

  useEffect(
    () => () => {
      if (closeTooltipTimeoutRef.current === null) return;
      window.clearTimeout(closeTooltipTimeoutRef.current);
      closeTooltipTimeoutRef.current = null;
    },
    []
  );

  if (reactions.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-1 mt-1">
        {reactions.map((reaction) => {
          const reactionTooltipId = `${tooltipId}-${reaction.emoji}`;

          return (
            <button
              key={reaction.emoji}
              type="button"
              onClick={() => onToggle(reaction.emoji)}
              onMouseEnter={(event) =>
                showTooltip(reaction, event.currentTarget.getBoundingClientRect())
              }
              onMouseLeave={closeTooltipSoon}
              onFocus={(event) =>
                showTooltip(reaction, event.currentTarget.getBoundingClientRect())
              }
              onBlur={() => setHoveredReaction(null)}
              aria-describedby={reactionTooltipId}
              className={[
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors cursor-pointer',
                reaction.reactedByMe
                  ? 'bg-primary/20 border-primary/50 text-text-1'
                  : 'bg-surface-2 border-border-2 text-text-2 hover:bg-surface-hover',
              ].join(' ')}
            >
              <span className="text-base leading-none">{reaction.emoji}</span>
              <span className="font-medium">{reaction.count}</span>
            </button>
          );
        })}
      </div>

      {hoveredReaction && tooltipStyle && (
        <MessageReactionTooltip
          id={`${tooltipId}-${hoveredReaction.reaction.emoji}`}
          reaction={hoveredReaction.reaction}
          users={hoveredUsers}
          style={tooltipStyle}
          sentence={hoveredSentence}
          emptyLabel={t('channel.messages.reactionUsersEmpty')}
          canOpenDetails={Boolean(reactionSource)}
          onOpenDetails={() => openReactionUsers(hoveredReaction.reaction.emoji)}
          onMouseEnter={clearCloseTooltipTimeout}
          onMouseLeave={closeTooltipSoon}
        />
      )}

      {selectedReaction && reactionSource && (
        <MessageReactionUsersModal
          reactions={reactions}
          selectedReaction={selectedReaction}
          users={reactionUsers}
          reactionUserMap={reactionUserMap}
          loading={loadingReactionUsers}
          error={reactionUsersError}
          nextCursor={reactionUsersNextCursor}
          labels={{
            title: t('channel.messages.reactionUsersModalTitle'),
            close: t('channel.messages.reactionUsersModalClose'),
            empty: t('channel.messages.reactionUsersEmpty'),
            loading: t('channel.messages.reactionUsersLoading'),
            error: t('channel.messages.reactionUsersError'),
            loadMore: t('channel.messages.reactionUsersLoadMore'),
          }}
          onClose={() => setSelectedEmoji(null)}
          onSelectEmoji={setSelectedEmoji}
          onLoadMore={() => fetchReactionUsers(selectedReaction.emoji, reactionUsersNextCursor)}
        />
      )}
    </>
  );
};
