import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal, Separator, type RichTextMentionOption } from '@harmonie/ui';
import { Pin } from 'lucide-react';
import type { Message, PinnedMessageList, ReplyPreview } from '@/types/channel';
import type { UserProfile } from '@/types/user';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { MessageComposer } from './MessageComposer';
import { MessageListItem } from './MessageListItem/MessageListItem';
import { MessageContextMenu, type MessageMenuState } from './MessageListItem/MessageContextMenu';
import { MessageEmojiPicker } from './MessageListItem/MessageEmojiPicker';
import { PinnedMessagesModal } from './PinnedMessagesModal';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { areMessagesGrouped, getDaySeparatorLabel } from './utils/messagePresentation';
import { scheduleCenterMessageIfOutsideView } from './utils/scrollMessageIntoView';

const PINNED_MESSAGE_HIGHLIGHT_MS = 1200;

interface MessageThreadUiState {
  messageMenu: MessageMenuState | null;
  reactionPicker: {
    messageId: string;
    anchorRect: DOMRect;
  } | null;
  pendingDeleteMessageId: string | null;
  replyTo: ReplyPreview | null;
  pinnedMessagesOpen: boolean;
  pinnedHighlightMessageId: string | null;
  separatorDismissed: boolean;
  showScrollToBottom: boolean;
}

type MessageThreadUiAction = {
  type: 'patch';
  patch: Partial<MessageThreadUiState>;
};

const messageThreadInitialUiState: MessageThreadUiState = {
  messageMenu: null,
  reactionPicker: null,
  pendingDeleteMessageId: null,
  replyTo: null,
  pinnedMessagesOpen: false,
  pinnedHighlightMessageId: null,
  separatorDismissed: false,
  showScrollToBottom: false,
};

const messageThreadUiReducer = (
  state: MessageThreadUiState,
  action: MessageThreadUiAction
): MessageThreadUiState => {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
  }
};

export interface MessageThreadRefs {
  scrollRef: RefObject<HTMLDivElement | null>;
  messagesContentRef: RefObject<HTMLDivElement | null>;
  scrollAnchorRef: MutableRefObject<{ scrollTop: number; scrollHeight: number } | null>;
  previousMessageCountRef: MutableRefObject<number>;
  suppressNextScrollEffectsRef: MutableRefObject<boolean>;
  shouldStickToBottomRef: MutableRefObject<boolean>;
}

export const useMessageThreadRefs = (): MessageThreadRefs => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesContentRef = useRef<HTMLDivElement>(null);
  const scrollAnchorRef = useRef<{ scrollTop: number; scrollHeight: number } | null>(null);
  const previousMessageCountRef = useRef(0);
  const suppressNextScrollEffectsRef = useRef(false);
  const shouldStickToBottomRef = useRef(false);

  return {
    scrollRef,
    messagesContentRef,
    scrollAnchorRef,
    previousMessageCountRef,
    suppressNextScrollEffectsRef,
    shouldStickToBottomRef,
  };
};

interface MessageThreadLabels {
  loading: string;
  error: string;
  empty: string;
}

interface MessageThreadComposerConfig {
  draftKey: string;
  sendFn: (
    content: string,
    attachmentFileIds: string[],
    replyToMessageId?: string | null,
    mentionedUserIds?: string[]
  ) => Promise<unknown>;
  onTypingStart?: () => void;
  mentionOptions?: RichTextMentionOption[];
}

interface MessageThreadPinnedConfig {
  entityId: string;
  fetchPinnedMessages: (entityId: string, cursor?: string | null) => Promise<PinnedMessageList>;
}

interface MessageThreadSearchState {
  activeSearchTarget?: unknown;
  selectedMessageId?: string | null;
  seekingTargetRef?: MutableRefObject<boolean>;
}

interface MessageThreadProps<TAuthor extends MessageAuthor = MessageAuthor> {
  resetKey?: string;
  title: ReactNode;
  leadingActions?: ReactNode;
  beforePinActions?: ReactNode;
  afterPinActions?: ReactNode;
  refs: MessageThreadRefs;
  messages: Message[];
  loading: boolean;
  error: boolean;
  loadingMore: boolean;
  editingMessageId: string | null;
  lastReadMessageId: string | null;
  latestOwnMessage: Message | null;
  typingUserIds: string[];
  labels: MessageThreadLabels;
  currentUser?: UserProfile | null;
  authorMap: ReadonlyMap<string, TAuthor>;
  reactionSource: {
    type: 'channel' | 'conversation';
    entityId: string;
  };
  composer: MessageThreadComposerConfig;
  pinned: MessageThreadPinnedConfig;
  searchState?: MessageThreadSearchState;
  loadMore: () => Promise<Message[]>;
  loadUntilMessage: (messageId: string) => Promise<boolean>;
  startEditing: (messageId: string) => void;
  cancelEditing: () => void;
  dismissNewMessagesSeparator: () => void;
  saveEdit: (messageId: string, content: string, mentionedUserIds: string[]) => Promise<void>;
  removeMessage: (messageId: string) => void;
  removeAttachment: (messageId: string, attachmentFileId: string) => void;
  setMessagePinned: (messageId: string, isPinned: boolean) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  onAvatarClick?: (author: TAuthor, rect: DOMRect) => void;
}

export const MessageThread = <TAuthor extends MessageAuthor = MessageAuthor>(
  props: MessageThreadProps<TAuthor>
) => <MessageThreadContent key={props.resetKey} {...props} />;

const useMessageThreadContent = <TAuthor extends MessageAuthor = MessageAuthor>({
  title,
  leadingActions,
  beforePinActions,
  afterPinActions,
  refs,
  messages,
  loading,
  error,
  loadingMore,
  editingMessageId,
  lastReadMessageId,
  latestOwnMessage,
  typingUserIds,
  labels,
  currentUser,
  authorMap,
  reactionSource,
  composer,
  pinned,
  searchState,
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
  onAvatarClick,
}: MessageThreadProps<TAuthor>) => {
  const { t } = useTranslation();
  const [uiState, dispatchUi] = useReducer(messageThreadUiReducer, messageThreadInitialUiState);
  const {
    messageMenu,
    reactionPicker,
    pendingDeleteMessageId,
    replyTo,
    pinnedMessagesOpen,
    pinnedHighlightMessageId,
    separatorDismissed,
    showScrollToBottom,
  } = uiState;
  const pinnedHighlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userScrollIntentRef = useRef(false);
  const userScrollIntentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    scrollRef,
    messagesContentRef,
    scrollAnchorRef,
    previousMessageCountRef,
    suppressNextScrollEffectsRef,
    shouldStickToBottomRef,
  } = refs;

  const clearUserScrollIntent = () => {
    userScrollIntentRef.current = false;
    if (userScrollIntentTimeoutRef.current) {
      clearTimeout(userScrollIntentTimeoutRef.current);
      userScrollIntentTimeoutRef.current = null;
    }
  };

  const markUserScrollIntent = () => {
    userScrollIntentRef.current = true;
    if (userScrollIntentTimeoutRef.current) {
      clearTimeout(userScrollIntentTimeoutRef.current);
    }
    userScrollIntentTimeoutRef.current = setTimeout(() => {
      userScrollIntentRef.current = false;
      userScrollIntentTimeoutRef.current = null;
    }, 350);
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    clearUserScrollIntent();
    shouldStickToBottomRef.current = true;
    dispatchUi({ type: 'patch', patch: { showScrollToBottom: false } });

    if (behavior === 'smooth') {
      suppressNextScrollEffectsRef.current = true;
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior });
      return;
    }

    suppressNextScrollEffectsRef.current = true;
    scrollElement.scrollTop = scrollElement.scrollHeight;

    requestAnimationFrame(() => {
      const nextScrollElement = scrollRef.current;
      if (!nextScrollElement) return;
      suppressNextScrollEffectsRef.current = true;
      nextScrollElement.scrollTop = nextScrollElement.scrollHeight;
    });
  };

  useLayoutEffect(() => {
    previousMessageCountRef.current = 0;
    scrollAnchorRef.current = null;
    suppressNextScrollEffectsRef.current = false;
    shouldStickToBottomRef.current = false;
    if (pinnedHighlightTimeoutRef.current) {
      clearTimeout(pinnedHighlightTimeoutRef.current);
      pinnedHighlightTimeoutRef.current = null;
    }
    userScrollIntentRef.current = false;
    if (userScrollIntentTimeoutRef.current) {
      clearTimeout(userScrollIntentTimeoutRef.current);
      userScrollIntentTimeoutRef.current = null;
    }
  }, [
    previousMessageCountRef,
    scrollAnchorRef,
    shouldStickToBottomRef,
    suppressNextScrollEffectsRef,
  ]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    if (scrollAnchorRef.current) {
      const { scrollTop, scrollHeight } = scrollAnchorRef.current;
      suppressNextScrollEffectsRef.current = true;
      element.scrollTop = scrollTop + (element.scrollHeight - scrollHeight);
      scrollAnchorRef.current = null;
      return;
    }

    if (searchState?.activeSearchTarget || searchState?.seekingTargetRef?.current) {
      previousMessageCountRef.current = messages.length;
      return;
    }

    const previousMessageCount = previousMessageCountRef.current;
    const hasNewMessages = messages.length > previousMessageCount;
    const isInitialLoad = previousMessageCount === 0 && messages.length > 0;

    if (hasNewMessages || isInitialLoad) {
      suppressNextScrollEffectsRef.current = true;
      shouldStickToBottomRef.current = true;
      requestAnimationFrame(() => {
        const nextScrollElement = scrollRef.current;
        if (!nextScrollElement) return;
        nextScrollElement.scrollTop = nextScrollElement.scrollHeight;
      });
    }

    previousMessageCountRef.current = messages.length;
  }, [
    messages,
    previousMessageCountRef,
    scrollAnchorRef,
    scrollRef,
    searchState?.activeSearchTarget,
    searchState?.seekingTargetRef,
    shouldStickToBottomRef,
    suppressNextScrollEffectsRef,
  ]);

  useEffect(() => {
    const contentEl = messagesContentRef.current;
    const scrollEl = scrollRef.current;
    if (!contentEl || !scrollEl) return;

    const observer = new ResizeObserver(() => {
      if (shouldStickToBottomRef.current) {
        requestAnimationFrame(() => {
          const nextScrollElement = scrollRef.current;
          if (!nextScrollElement) return;
          suppressNextScrollEffectsRef.current = true;
          nextScrollElement.scrollTop = nextScrollElement.scrollHeight;
        });
      }
    });

    observer.observe(contentEl);
    observer.observe(scrollEl);
    return () => observer.disconnect();
  }, [
    messages.length,
    messagesContentRef,
    scrollRef,
    shouldStickToBottomRef,
    suppressNextScrollEffectsRef,
  ]);

  useEffect(() => {
    if (!editingMessageId) return;

    const element = scrollRef.current;
    if (!element) return;

    const messageElement = element.querySelector<HTMLElement>(
      `[data-message-id="${editingMessageId}"]`
    );
    if (!messageElement) return;

    suppressNextScrollEffectsRef.current = true;
    shouldStickToBottomRef.current = false;
    return scheduleCenterMessageIfOutsideView(element, messageElement);
  }, [editingMessageId, scrollRef, shouldStickToBottomRef, suppressNextScrollEffectsRef]);

  useEffect(() => {
    if (lastReadMessageId === null || separatorDismissed) return;
    const element = scrollRef.current;
    if (!element) return;
    const rafId = requestAnimationFrame(() => {
      if (element.scrollHeight <= element.clientHeight) {
        dispatchUi({ type: 'patch', patch: { separatorDismissed: true } });
      }
    });
    return () => cancelAnimationFrame(rafId);
  }, [lastReadMessageId, scrollRef, separatorDismissed]);

  const handleMessagesScroll = () => {
    const element = scrollRef.current;
    if (!element) return;

    if (suppressNextScrollEffectsRef.current) {
      suppressNextScrollEffectsRef.current = false;
      if (!userScrollIntentRef.current) return;
    }

    if (lastReadMessageId !== null && !separatorDismissed) {
      dispatchUi({ type: 'patch', patch: { separatorDismissed: true } });
    }
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;

    if (!userScrollIntentRef.current && shouldStickToBottomRef.current && distanceFromBottom > 1) {
      scrollToBottom();
      return;
    }

    shouldStickToBottomRef.current = distanceFromBottom < 50;
    dispatchUi({ type: 'patch', patch: { showScrollToBottom: distanceFromBottom > 160 } });
    if (element.scrollTop >= 100) return;
    scrollAnchorRef.current = {
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
    };
    void loadMore();
  };

  const openMessageMenuAt = (
    messageId: string,
    position: { x: number; y: number },
    horizontalAnchor: 'left' | 'right' = 'left'
  ) => {
    const message = messages.find((item) => item.messageId === messageId);
    const isOwnMessage = message?.authorUserId === currentUser?.userId;
    dispatchUi({
      type: 'patch',
      patch: {
        messageMenu: {
          messageId,
          position,
          horizontalAnchor,
          isPinned: message?.isPinned ?? false,
          canReply: Boolean(message),
          canReact: Boolean(message),
          canEdit: isOwnMessage,
          canDelete: isOwnMessage,
        },
      },
    });
  };

  const handleOpenMessageMenu = (
    event: React.MouseEvent<HTMLElement>,
    messageId: string,
    horizontalAnchor: 'left' | 'right' = 'left',
    imageAttachment?: MessageMenuState['imageAttachment']
  ) => {
    event.preventDefault();
    const message = messages.find((item) => item.messageId === messageId);
    const isOwnMessage = message?.authorUserId === currentUser?.userId;
    dispatchUi({
      type: 'patch',
      patch: {
        messageMenu: {
          messageId,
          position: { x: event.clientX, y: event.clientY },
          horizontalAnchor,
          imageAttachment,
          isPinned: message?.isPinned ?? false,
          canReply: Boolean(message),
          canReact: Boolean(message),
          canEdit: isOwnMessage,
          canDelete: isOwnMessage,
        },
      },
    });
  };

  const handleStartEditing = (messageId: string) => {
    dispatchUi({ type: 'patch', patch: { messageMenu: null, replyTo: null } });
    startEditing(messageId);
  };

  const handleStartReply = (messageId: string) => {
    const message = messages.find((item) => item.messageId === messageId);
    if (!message) return;
    dispatchUi({ type: 'patch', patch: { messageMenu: null } });
    cancelEditing();
    const author = authorMap.get(message.authorUserId);
    dispatchUi({
      type: 'patch',
      patch: {
        replyTo: {
          messageId: message.messageId,
          authorUserId: message.authorUserId,
          authorDisplayName: author?.displayName ?? null,
          authorUsername: author?.username ?? t('channel.messages.memberNotFound'),
          content: message.content,
          hasAttachments: message.attachments.length > 0,
          isDeleted: false,
          deletedAtUtc: null,
        },
      },
    });
  };

  const handleOpenReactionPicker = (
    messageId: string,
    value: string | { x: number; y: number }
  ) => {
    dispatchUi({ type: 'patch', patch: { messageMenu: null } });
    if (typeof value === 'string') {
      toggleReaction(messageId, value);
      return;
    }

    dispatchUi({
      type: 'patch',
      patch: {
        reactionPicker: {
          messageId,
          anchorRect: {
            x: value.x,
            y: value.y,
            width: 1,
            height: 1,
            top: value.y,
            right: value.x + 1,
            bottom: value.y + 1,
            left: value.x,
            toJSON: () => ({}),
          },
        },
      },
    });
  };

  const handleMenuReactionSelected = (emoji: string) => {
    if (!reactionPicker) return;
    toggleReaction(reactionPicker.messageId, emoji);
    dispatchUi({ type: 'patch', patch: { reactionPicker: null } });
  };

  const handleDeleteRequest = (messageId: string) => {
    dispatchUi({ type: 'patch', patch: { messageMenu: null, pendingDeleteMessageId: messageId } });
  };

  const handlePinToggle = (messageId: string, isPinned: boolean) => {
    dispatchUi({ type: 'patch', patch: { messageMenu: null } });
    const scrollElement = scrollRef.current;
    const scrollTop = scrollElement?.scrollTop;
    suppressNextScrollEffectsRef.current = true;
    shouldStickToBottomRef.current = false;
    setMessagePinned(messageId, isPinned);
    requestAnimationFrame(() => {
      if (scrollTop === undefined) return;
      const nextScrollElement = scrollRef.current;
      if (!nextScrollElement) return;
      nextScrollElement.scrollTop = scrollTop;
    });
  };

  const revealMessage = async (messageId: string) => {
    const loaded = await loadUntilMessage(messageId);
    if (!loaded) return;
    if (pinnedHighlightTimeoutRef.current) clearTimeout(pinnedHighlightTimeoutRef.current);
    dispatchUi({ type: 'patch', patch: { pinnedHighlightMessageId: messageId } });
    pinnedHighlightTimeoutRef.current = setTimeout(() => {
      dispatchUi({ type: 'patch', patch: { pinnedHighlightMessageId: null } });
      pinnedHighlightTimeoutRef.current = null;
    }, PINNED_MESSAGE_HIGHLIGHT_MS);
    requestAnimationFrame(() => {
      const scrollElement = scrollRef.current;
      const messageElement = scrollElement?.querySelector<HTMLElement>(
        `[data-message-id="${messageId}"]`
      );
      if (!scrollElement || !messageElement) return;
      suppressNextScrollEffectsRef.current = true;
      shouldStickToBottomRef.current = false;
      scheduleCenterMessageIfOutsideView(scrollElement, messageElement);
    });
  };

  const handlePinnedMessageSelected = (messageId: string) => {
    void revealMessage(messageId);
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteMessageId) {
      removeMessage(pendingDeleteMessageId);
      if (replyTo?.messageId === pendingDeleteMessageId) {
        dispatchUi({ type: 'patch', patch: { replyTo: null } });
      }
    }
    dispatchUi({ type: 'patch', patch: { pendingDeleteMessageId: null } });
  };

  const typingNames = typingUserIds.map(
    (id) => authorMap.get(id)?.displayName ?? authorMap.get(id)?.username ?? id
  );

  return (
    <>
      <div className="flex flex-col flex-1 min-w-0 h-full bg-surface-1 md:rounded-md overflow-hidden">
        <div className="flex items-center justify-between px-4 h-14 shrink-0 bg-surface-2 md:rounded-t-md">
          <div className="flex min-w-0 items-center gap-2">
            {leadingActions}
            <span className="truncate text-sm font-semibold text-text-1">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {beforePinActions}
            <IconButton
              size="small"
              aria-label={t('channel.messages.pinnedMessages')}
              title={t('channel.messages.pinnedMessages')}
              tooltipSide="bottom"
              onClick={() => dispatchUi({ type: 'patch', patch: { pinnedMessagesOpen: true } })}
            >
              <Pin size={16} />
            </IconButton>
            {afterPinActions}
          </div>
        </div>

        {loadingMore && (
          <div className="flex justify-center py-1 text-text-3 text-xs shrink-0">
            {labels.loading}
          </div>
        )}

        <div className="relative flex-1 min-h-0">
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto px-2 sm:px-4 py-4 gap-0"
            onTouchMove={markUserScrollIntent}
            onScroll={handleMessagesScroll}
            onWheel={markUserScrollIntent}
          >
            {loading ? (
              <div className="flex h-full items-center justify-center text-text-3 text-sm">
                {labels.loading}
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center text-error-fg text-sm">
                {labels.error}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-text-3 text-sm">
                {labels.empty}
              </div>
            ) : (
              <div ref={messagesContentRef}>
                {messages.map((message, index) => {
                  const previousMessage = messages[index - 1];
                  const daySeparatorLabel = getDaySeparatorLabel(previousMessage, message);
                  const grouped = daySeparatorLabel
                    ? false
                    : areMessagesGrouped(previousMessage, message);
                  const isFirstUnread =
                    lastReadMessageId !== null && previousMessage?.messageId === lastReadMessageId;
                  const isMentioned =
                    Boolean(currentUser?.userId) &&
                    (message.mentionedUserIds ?? []).includes(currentUser?.userId ?? '');

                  return (
                    <div key={message.messageId}>
                      {daySeparatorLabel && <Separator label={daySeparatorLabel} />}
                      {isFirstUnread && (
                        <div
                          className={`transition-opacity duration-500 ${separatorDismissed ? 'opacity-0' : 'opacity-100'}`}
                          onTransitionEnd={() => {
                            if (separatorDismissed) dismissNewMessagesSeparator();
                          }}
                        >
                          <Separator label={t('channel.messages.newMessages')} variant="accent" />
                        </div>
                      )}
                      <MessageListItem
                        message={message}
                        member={authorMap.get(message.authorUserId)}
                        rowState={{
                          grouped,
                          isOwn: message.authorUserId === currentUser?.userId,
                          isEditing: message.messageId === editingMessageId,
                          isMenuOpen: message.messageId === messageMenu?.messageId,
                          isMentioned,
                          isSelected:
                            message.messageId === searchState?.selectedMessageId ||
                            message.messageId === pinnedHighlightMessageId,
                        }}
                        onAvatarClick={onAvatarClick}
                        onEdit={handleStartEditing}
                        onCancelEdit={cancelEditing}
                        onSaveEdit={saveEdit}
                        mentionOptions={composer.mentionOptions}
                        onDelete={handleDeleteRequest}
                        onReply={handleStartReply}
                        onReplyClick={(messageId) => void revealMessage(messageId)}
                        onPinToggle={handlePinToggle}
                        onAttachmentDeleted={(fileId) =>
                          removeAttachment(message.messageId, fileId)
                        }
                        onReact={toggleReaction}
                        reactionSource={reactionSource}
                        reactionUserMap={authorMap}
                        currentUser={currentUser}
                        onOpenMenu={handleOpenMessageMenu}
                        onOpenMenuAt={openMessageMenuAt}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {showScrollToBottom && (
            <ScrollToBottomButton
              label={t('channel.messages.scrollToBottom')}
              onClick={() => scrollToBottom()}
            />
          )}
        </div>

        {typingNames.length > 0 && (
          <div className="px-4 py-1 text-xs text-text-3 shrink-0 h-6">
            {typingNames.length === 1
              ? t('channel.typing.one', { name: typingNames[0] })
              : typingNames.length === 2
                ? t('channel.typing.two', { name1: typingNames[0], name2: typingNames[1] })
                : t('channel.typing.several')}
          </div>
        )}

        <div className="mt-auto flex min-w-0 items-end px-4 pb-[calc(1rem+var(--keyboard-inset))] transition-[padding-bottom] duration-150">
          <MessageComposer
            key={composer.draftKey}
            draftKey={composer.draftKey}
            sendFn={composer.sendFn}
            onTypingStart={composer.onTypingStart}
            latestEditableMessage={latestOwnMessage}
            onEditingRequested={handleStartEditing}
            replyTo={replyTo}
            onCancelReply={() => dispatchUi({ type: 'patch', patch: { replyTo: null } })}
            mentionOptions={composer.mentionOptions}
          />
        </div>
      </div>

      <MessageContextMenu
        menu={messageMenu}
        onClose={() => dispatchUi({ type: 'patch', patch: { messageMenu: null } })}
        onReply={handleStartReply}
        onReact={handleOpenReactionPicker}
        onEdit={handleStartEditing}
        onDelete={handleDeleteRequest}
        onPinToggle={handlePinToggle}
      />

      {reactionPicker && (
        <MessageEmojiPicker
          anchorRect={reactionPicker.anchorRect}
          onSelect={handleMenuReactionSelected}
          onClose={() => dispatchUi({ type: 'patch', patch: { reactionPicker: null } })}
        />
      )}

      {pinnedMessagesOpen && (
        <PinnedMessagesModal
          entityId={pinned.entityId}
          title={t('channel.messages.pinnedMessages')}
          emptyLabel={t('channel.messages.noPinnedMessages')}
          errorLabel={t('channel.messages.pinnedMessagesError')}
          loadingLabel={labels.loading}
          loadMoreLabel={t('channel.messages.pinnedMessagesLoadMore')}
          closeLabel={t('common.close')}
          fetchPinnedMessages={pinned.fetchPinnedMessages}
          authorMap={authorMap}
          onMessageSelected={handlePinnedMessageSelected}
          onMessageUnpinned={(messageId) => setMessagePinned(messageId, false)}
          onClose={() => dispatchUi({ type: 'patch', patch: { pinnedMessagesOpen: false } })}
        />
      )}

      {pendingDeleteMessageId && (
        <Modal
          title={t('channel.messages.delete')}
          onClose={() => dispatchUi({ type: 'patch', patch: { pendingDeleteMessageId: null } })}
        >
          <p className="font-body text-sm text-text-2">{t('channel.messages.deleteConfirm')}</p>
          <div className="flex justify-end gap-2">
            <Button
              variant="tertiary"
              onClick={() => dispatchUi({ type: 'patch', patch: { pendingDeleteMessageId: null } })}
            >
              {t('channel.messages.deleteCancel')}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              {t('channel.messages.deleteConfirmButton')}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};

const MessageThreadContent = <TAuthor extends MessageAuthor = MessageAuthor>(
  props: MessageThreadProps<TAuthor>
) => useMessageThreadContent(props);
