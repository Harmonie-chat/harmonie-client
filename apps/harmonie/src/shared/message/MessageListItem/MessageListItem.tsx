import { useRef, useState } from 'react';
import { Avatar, type RichTextMentionOption } from '@harmonie/ui';
import { useTranslation } from 'react-i18next';
import { Pin } from 'lucide-react';
import type { Message } from '@/types/channel';
import type { UserProfile } from '@/types/user';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { formatContextualDateTime } from '@/shared/utils/date';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { MessageAttachments } from '@/shared/message/attachments/MessageAttachments';
import { MessageReactions } from '@/shared/message/reactions/MessageReactions';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageEmojiPicker } from './MessageEmojiPicker';
import { MessageInlineEditor } from './MessageInlineEditor';
import { MessageLinkPreviews } from './MessageLinkPreviews';
import { MessageReplyPreview } from './MessageReplyPreview';

interface MessageListItemProps<TAuthor extends MessageAuthor = MessageAuthor> {
  message: Message;
  member?: TAuthor;
  rowState?: {
    grouped?: boolean;
    isOwn?: boolean;
    isEditing?: boolean;
    isMenuOpen?: boolean;
    isMentioned?: boolean;
    isSelected?: boolean;
  };
  onAvatarClick?: (member: TAuthor, rect: DOMRect) => void;
  onEdit?: (messageId: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: (messageId: string, content: string, mentionedUserIds: string[]) => Promise<void>;
  mentionOptions?: RichTextMentionOption[];
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onReplyClick?: (messageId: string) => void;
  onPinToggle?: (messageId: string, isPinned: boolean) => void;
  onAttachmentDeleted?: (attachmentFileId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  reactionSource?: {
    type: 'channel' | 'conversation';
    entityId: string;
  };
  reactionUserMap?: ReadonlyMap<string, MessageAuthor>;
  currentUser?: UserProfile | null;
  onOpenMenu?: (
    event: React.MouseEvent<HTMLElement>,
    messageId: string,
    horizontalAnchor?: 'left' | 'right'
  ) => void;
  onOpenMenuAt?: (
    messageId: string,
    position: { x: number; y: number },
    horizontalAnchor?: 'left' | 'right'
  ) => void;
}

export const MessageListItem = <TAuthor extends MessageAuthor = MessageAuthor>({
  message,
  member,
  rowState,
  onAvatarClick,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  mentionOptions,
  onDelete,
  onReply,
  onReplyClick,
  onPinToggle,
  onAttachmentDeleted,
  onReact,
  reactionSource,
  reactionUserMap,
  currentUser,
  onOpenMenu,
  onOpenMenuAt,
}: MessageListItemProps<TAuthor>) => {
  const { t, i18n } = useTranslation();
  const grouped = rowState?.grouped ?? false;
  const isOwn = rowState?.isOwn ?? false;
  const isEditing = rowState?.isEditing ?? false;
  const isMenuOpen = rowState?.isMenuOpen ?? false;
  const isMentioned = rowState?.isMentioned ?? false;
  const isSelected = rowState?.isSelected ?? false;
  const [pickerAnchorRect, setPickerAnchorRect] = useState<DOMRect | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const ignoreContextMenuUntilRef = useRef(0);
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const label = member
    ? (member.displayName ?? member.username)
    : t('channel.messages.memberNotFound');
  const avatarIcon = member?.avatar?.icon ?? (member ? 'PawPrint' : 'User');
  const avatarColor =
    member?.avatar?.color ?? (member ? 'var(--color-cat-1-fg)' : 'var(--color-text-3)');
  const avatarBg = member?.avatar?.bg ?? (member ? 'var(--color-cat-1)' : 'var(--color-surface-3)');

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!member || !onAvatarClick) return;
    onAvatarClick(member, event.currentTarget.getBoundingClientRect());
  };

  const handleContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!(onReply || onPinToggle || (isOwn && (onEdit || onDelete)))) return;
    event.preventDefault();
    if (Date.now() < ignoreContextMenuUntilRef.current) return;
    onOpenMenu?.(event, message.messageId, 'right');
  };

  const clearLongPress = () => {
    if (!longPressTimeoutRef.current) return;
    clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = null;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (!(onReply || onPinToggle || (isOwn && (onEdit || onDelete)))) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    ignoreContextMenuUntilRef.current = Date.now() + 1200;
    longPressTimeoutRef.current = setTimeout(() => {
      onOpenMenuAt?.(message.messageId, { x: touch.clientX, y: touch.clientY }, 'left');
    }, 520);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    if (!start) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;

    if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) clearLongPress();
    if (!onReply || deltaX >= 0 || Math.abs(deltaY) > 42) return;

    setSwipeOffset(Math.max(deltaX, -84));
  };

  const handleTouchEnd = () => {
    clearLongPress();
    if (swipeOffset <= -64) onReply?.(message.messageId);
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  const handleTouchCancel = () => {
    clearLongPress();
    setSwipeOffset(0);
    touchStartRef.current = null;
  };

  const handlePickerOpen = (rect: DOMRect) => {
    setPickerAnchorRect((prev) => (prev ? null : rect));
  };

  const handleReact = (emoji: string) => {
    onReact?.(message.messageId, emoji);
    setPickerAnchorRect(null);
  };

  const pinnedBadge = message.isPinned ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary shrink-0">
      <Pin size={12} />
      {t('channel.messages.pinned')}
    </span>
  ) : null;

  return (
    <div
      data-message-id={message.messageId}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchCancel={handleTouchCancel}
      style={swipeOffset < 0 ? { transform: `translateX(${swipeOffset}px)` } : undefined}
      className={[
        'group flex items-start gap-2 sm:gap-3 relative px-1 sm:px-2 -mx-1 sm:-mx-2 rounded-sm min-w-0 border-l-2',
        'hover:bg-surface-2 transition-[background-color,box-shadow,transform] duration-200',
        isMentioned ? 'border-primary bg-primary/8' : 'border-transparent',
        isEditing || isMenuOpen || pickerAnchorRect ? 'bg-surface-3' : '',
        isSelected
          ? 'z-10 ring-1 ring-primary/70 shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]'
          : '',
        grouped ? 'py-0.5' : 'pt-3 pb-2',
      ].join(' ')}
    >
      {grouped ? (
        <div className="w-8 shrink-0" />
      ) : member && onAvatarClick ? (
        <button
          type="button"
          onClick={handleAvatarClick}
          aria-label={t('channel.messages.openMemberProfile', { name: label })}
          className="shrink-0 cursor-pointer appearance-none rounded-full p-0 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Avatar
            alt={label}
            avatarUrl={avatarUrl}
            icon={avatarIcon}
            color={avatarColor}
            bg={avatarBg}
            size={32}
          />
        </button>
      ) : (
        <div className="shrink-0">
          <div className={member ? '' : 'opacity-60'}>
            <Avatar
              alt={label}
              avatarUrl={avatarUrl}
              icon={avatarIcon}
              color={avatarColor}
              bg={avatarBg}
              size={32}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {!grouped && (
          <div
            className={[
              'flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-0.5 min-w-0',
              member ? '' : 'opacity-70',
            ].join(' ')}
          >
            <span className="text-sm font-semibold text-text-1 min-w-0 max-w-full truncate">
              {label}
            </span>
            <span className="text-xs text-text-3 shrink-0">
              {formatContextualDateTime(message.createdAtUtc, i18n.language, t)}
            </span>
            {pinnedBadge}
          </div>
        )}

        {grouped && pinnedBadge && <div className="mb-0.5">{pinnedBadge}</div>}
        {message.replyTo && (
          <MessageReplyPreview replyTo={message.replyTo} onClick={onReplyClick} />
        )}

        {isEditing ? (
          <MessageInlineEditor
            initialValue={message.content}
            initialMentionedUserIds={message.mentionedUserIds ?? []}
            onCancel={() => onCancelEdit?.()}
            onSave={(content, mentionedUserIds) =>
              onSaveEdit?.(message.messageId, content, mentionedUserIds) ?? Promise.resolve()
            }
            mentionOptions={mentionOptions}
          />
        ) : (
          <>
            {message.content && (
              <MessageContent
                content={message.content}
                mentionedUserIds={message.mentionedUserIds ?? []}
                mentionMap={reactionUserMap}
                onMentionClick={(mention, rect) => onAvatarClick?.(mention as TAuthor, rect)}
              />
            )}
            {message.updatedAtUtc && (
              <span className="text-xs text-text-3">{t('channel.messages.edited')}</span>
            )}
            <MessageAttachments
              attachments={message.attachments}
              isOwn={isOwn}
              member={member}
              messageCreatedAt={message.createdAtUtc}
              onDelete={onAttachmentDeleted}
              onDeleteDirect={
                onAttachmentDeleted && !message.content && message.attachments.length === 1
                  ? () => onDelete?.(message.messageId)
                  : undefined
              }
            />
            <MessageLinkPreviews previews={message.linkPreviews} />
          </>
        )}
        <MessageReactions
          messageId={message.messageId}
          reactions={message.reactions}
          reactionSource={reactionSource}
          reactionUserMap={reactionUserMap}
          currentUser={currentUser}
          onToggle={(emoji) => onReact?.(message.messageId, emoji)}
        />
      </div>

      {!isEditing && (
        <MessageActions
          availability={{
            canEdit: isOwn && Boolean(onEdit),
            canDelete: isOwn && Boolean(onDelete),
            canPin: Boolean(onPinToggle),
            canReact: Boolean(onReact),
            canReply: Boolean(onReply),
          }}
          state={{ isPinned: message.isPinned }}
          labels={{
            edit: t('channel.messages.edit'),
            delete: t('channel.messages.delete'),
            pin: t('channel.messages.pin'),
            unpin: t('channel.messages.unpin'),
            react: t('channel.messages.react'),
            reply: t('channel.messages.reply'),
          }}
          onEdit={() => onEdit?.(message.messageId)}
          onDelete={() => onDelete?.(message.messageId)}
          onPinToggle={() => onPinToggle?.(message.messageId, !message.isPinned)}
          onPickerOpen={handlePickerOpen}
          onReply={() => onReply?.(message.messageId)}
        />
      )}

      {pickerAnchorRect && (
        <MessageEmojiPicker
          anchorRect={pickerAnchorRect}
          onSelect={handleReact}
          onClose={() => setPickerAnchorRect(null)}
        />
      )}
    </div>
  );
};
