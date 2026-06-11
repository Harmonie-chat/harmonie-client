import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AttachmentImage } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { MessageAttachment } from '@/types/channel';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import type { LightboxState } from './MessageAttachmentLightboxState';

interface MessageAttachmentImageProps {
  attachment: MessageAttachment;
  isOwn: boolean;
  member?: MessageAuthor;
  createdAtUtc: string;
  onOpenLightbox: (state: LightboxState) => void;
  onDeleteRequest?: (attachment: MessageAttachment) => void;
}

export const MessageAttachmentImage = ({
  attachment,
  isOwn,
  member,
  createdAtUtc,
  onOpenLightbox,
  onDeleteRequest,
}: MessageAttachmentImageProps) => {
  const { t } = useTranslation();
  const blobUrl = useFileBlobUrl(attachment.fileId);

  return (
    <AttachmentImage
      src={blobUrl}
      alt={attachment.fileName}
      onOpen={() =>
        onOpenLightbox({
          fileId: attachment.fileId,
          fileName: attachment.fileName,
          member,
          createdAtUtc,
        })
      }
      imageDataAttributes={{
        'data-message-attachment-file-id': attachment.fileId,
        'data-message-attachment-file-name': attachment.fileName,
      }}
      openLabel={t('channel.messages.openImage')}
      topRightAction={
        isOwn && onDeleteRequest ? (
          <button
            type="button"
            onClick={() => onDeleteRequest(attachment)}
            className="p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
            aria-label={t('channel.messages.deleteAttachment')}
            title={t('channel.messages.deleteAttachment')}
          >
            <X size={12} />
          </button>
        ) : undefined
      }
    />
  );
};
