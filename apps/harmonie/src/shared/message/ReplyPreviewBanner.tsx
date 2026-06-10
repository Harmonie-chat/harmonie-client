import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@harmonie/ui';
import type { ReplyPreview } from '@/types/channel';
import { stripHtmlToText } from './utils/messageHtml';

interface ReplyPreviewBannerProps {
  replyTo: ReplyPreview;
  onCancelReply?: () => void;
}

export const ReplyPreviewBanner = ({ replyTo, onCancelReply }: ReplyPreviewBannerProps) => {
  const { t } = useTranslation();

  return (
    <div className="mb-2 flex max-w-full items-start gap-2 overflow-hidden rounded-md border border-border-2 bg-surface-2 px-3 py-2">
      <div className="mt-0.5 h-8 w-0.5 shrink-0 rounded-full bg-primary" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-text-1 truncate">
          {replyTo.isDeleted
            ? t('channel.messages.replyDeleted')
            : t('channel.messages.replyingTo', {
                name: replyTo.authorDisplayName ?? replyTo.authorUsername,
              })}
        </div>
        {!replyTo.isDeleted && (
          <div className="text-xs text-text-3 truncate">
            {replyTo.content
              ? stripHtmlToText(replyTo.content)
              : replyTo.hasAttachments
                ? t('channel.messages.attachmentOnly')
                : t('channel.messages.replyEmpty')}
          </div>
        )}
      </div>
      <IconButton
        type="button"
        size="small"
        onClick={onCancelReply}
        title={t('channel.messages.cancelReply')}
        className="shrink-0"
      >
        <X size={14} />
      </IconButton>
    </div>
  );
};
