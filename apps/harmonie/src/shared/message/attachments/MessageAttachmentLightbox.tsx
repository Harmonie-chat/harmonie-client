import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, Lightbox } from '@harmonie/ui';
import { useFileDownload } from '@/shared/hooks/useFileDownload';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { formatContextualDateTime } from '@/shared/utils/date';
import type { MessageAuthor } from '@/shared/message/messageAuthor';

export interface MessageAttachmentLightboxProps {
  fileId: string;
  fileName: string;
  member?: MessageAuthor;
  createdAtUtc: string;
  onClose: () => void;
}

export const MessageAttachmentLightbox = ({
  fileId,
  fileName,
  member,
  createdAtUtc,
  onClose,
}: MessageAttachmentLightboxProps) => {
  const { t, i18n } = useTranslation();
  const blobUrl = useFileBlobUrl(fileId);
  const avatarUrl = useFileBlobUrl(member?.avatarFileId);
  const { download, downloading } = useFileDownload();

  const name = member
    ? (member.displayName ?? member.username)
    : t('channel.messages.memberNotFound');
  const avatarIcon = member?.avatar?.icon ?? (member ? 'PawPrint' : 'User');
  const avatarColor =
    member?.avatar?.color ?? (member ? 'var(--color-cat-1-fg)' : 'var(--color-text-3)');
  const avatarBg = member?.avatar?.bg ?? (member ? 'var(--color-cat-1)' : 'var(--color-surface-3)');

  return (
    <Lightbox
      src={blobUrl}
      alt={fileName}
      headerLeft={
        <div className="flex items-center gap-2">
          <Avatar
            alt={name}
            avatarUrl={avatarUrl}
            icon={avatarIcon}
            color={avatarColor}
            bg={avatarBg}
            size={32}
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">{name}</span>
            <span className="text-xs text-white/60">
              {formatContextualDateTime(createdAtUtc, i18n.language, t)}
            </span>
          </div>
        </div>
      }
      headerActions={
        <button
          type="button"
          onClick={() => void download(fileId, fileName)}
          disabled={downloading}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-50"
          aria-label={t('channel.messages.download')}
          title={t('channel.messages.download')}
        >
          <Download size={18} />
        </button>
      }
      onClose={onClose}
      zoomInLabel={t('channel.messages.zoomIn')}
      zoomOutLabel={t('channel.messages.zoomOut')}
      closeLabel={t('channel.messages.closeImage')}
    />
  );
};
