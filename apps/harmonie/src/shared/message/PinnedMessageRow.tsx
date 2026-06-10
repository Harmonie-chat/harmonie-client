import { useTranslation } from 'react-i18next';
import { Avatar, ClickableRowCard, IconButton } from '@harmonie/ui';
import { Pin, X } from 'lucide-react';
import type { PinnedMessage } from '@/types/channel';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { formatContextualDateTime } from '@/shared/utils/date';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { MessageAttachments } from './attachments/MessageAttachments';
import { MessageContent } from './MessageListItem/MessageContent';

interface PinnedMessageRowProps {
  message: PinnedMessage;
  member?: MessageAuthor;
  onSelect: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
}

export const PinnedMessageRow = ({ message, member, onSelect, onUnpin }: PinnedMessageRowProps) => {
  const { t, i18n } = useTranslation();
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const label =
    member?.displayName ?? member?.username ?? message.authorDisplayName ?? message.authorUsername;
  const avatarIcon = member?.avatar?.icon ?? (member ? 'PawPrint' : 'User');
  const avatarColor =
    member?.avatar?.color ?? (member ? 'var(--color-cat-1-fg)' : 'var(--color-text-3)');
  const avatarBg = member?.avatar?.bg ?? (member ? 'var(--color-cat-1)' : 'var(--color-surface-3)');

  return (
    <ClickableRowCard className="relative pr-10" onClick={() => onSelect(message.messageId)}>
      <div className="absolute right-2 top-2">
        <IconButton
          size="small"
          aria-label={t('channel.messages.unpin')}
          title={t('channel.messages.unpin')}
          tooltipSide="left"
          onClick={(event) => {
            event.stopPropagation();
            onUnpin(message.messageId);
          }}
        >
          <X size={14} />
        </IconButton>
      </div>
      <div className="flex items-start gap-3 min-w-0">
        <Avatar
          alt={label}
          avatarUrl={avatarUrl}
          icon={avatarIcon}
          color={avatarColor}
          bg={avatarBg}
          size={32}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
            <span className="text-sm font-semibold text-text-1 truncate">{label}</span>
            <span className="inline-flex items-center gap-1 text-xs text-primary">
              <Pin size={12} />
              {formatContextualDateTime(message.createdAtUtc, i18n.language, t)}
            </span>
          </div>
          {message.content ? (
            <MessageContent content={message.content} />
          ) : (
            <span className="text-sm text-text-3">{t('channel.messages.attachmentOnly')}</span>
          )}
          <div onClick={(event) => event.stopPropagation()}>
            <MessageAttachments
              attachments={message.attachments}
              member={member}
              messageCreatedAt={message.createdAtUtc}
            />
          </div>
        </div>
      </div>
    </ClickableRowCard>
  );
};
