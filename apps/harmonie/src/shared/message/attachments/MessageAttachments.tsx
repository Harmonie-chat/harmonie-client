import { useState } from 'react';
import type { MessageAttachment } from '@/types/channel';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { MessageAttachmentDeleteModal } from './MessageAttachmentDeleteModal';
import { MessageAttachmentFileChip } from './MessageAttachmentFileChip';
import { MessageAttachmentImage } from './MessageAttachmentImage';
import { MessageAttachmentLightbox } from './MessageAttachmentLightbox';
import type { LightboxState } from './MessageAttachmentLightboxState';

export interface MessageAttachmentsProps {
  attachments: MessageAttachment[];
  isOwn?: boolean;
  member?: MessageAuthor;
  messageCreatedAt: string;
  onDelete?: (attachmentFileId: string) => void;
  onDeleteDirect?: (attachmentFileId: string) => void;
}

export const MessageAttachments = ({
  attachments,
  isOwn = false,
  member,
  messageCreatedAt,
  onDelete,
  onDeleteDirect,
}: MessageAttachmentsProps) => {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MessageAttachment | null>(null);

  const handleDeleteRequest = onDeleteDirect
    ? (attachment: MessageAttachment) => onDeleteDirect(attachment.fileId)
    : onDelete
      ? setPendingDelete
      : undefined;

  if (!attachments.length) return null;

  const images = attachments.filter((a) => a.contentType.startsWith('image/'));
  const files = attachments.filter((a) => !a.contentType.startsWith('image/'));

  return (
    <>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1 min-w-0 max-w-full">
          {images.map((attachment) => (
            <MessageAttachmentImage
              key={attachment.fileId}
              attachment={attachment}
              isOwn={isOwn}
              member={member}
              createdAtUtc={messageCreatedAt}
              onOpenLightbox={setLightbox}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-col gap-1 mt-1 min-w-0 max-w-full">
          {files.map((attachment) => (
            <MessageAttachmentFileChip
              key={attachment.fileId}
              attachment={attachment}
              isOwn={isOwn}
              onDeleteRequest={handleDeleteRequest}
            />
          ))}
        </div>
      )}
      {lightbox && (
        <MessageAttachmentLightbox
          fileId={lightbox.fileId}
          fileName={lightbox.fileName}
          member={lightbox.member}
          createdAtUtc={lightbox.createdAtUtc}
          onClose={() => setLightbox(null)}
        />
      )}
      {pendingDelete && (
        <MessageAttachmentDeleteModal
          fileName={pendingDelete.fileName}
          onConfirm={() => {
            onDelete?.(pendingDelete.fileId);
            setPendingDelete(null);
          }}
          onClose={() => setPendingDelete(null)}
        />
      )}
    </>
  );
};
