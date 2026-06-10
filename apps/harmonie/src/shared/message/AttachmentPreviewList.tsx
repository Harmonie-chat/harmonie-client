import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AttachmentPreview {
  localId: string;
  file: File;
  status: 'uploading' | 'done' | 'error';
  previewUrl?: string;
}

interface AttachmentPreviewListProps {
  attachments: AttachmentPreview[];
  onRemoveAttachment: (localId: string) => void;
}

export const AttachmentPreviewList = ({
  attachments,
  onRemoveAttachment,
}: AttachmentPreviewListProps) => {
  const { t } = useTranslation();
  if (attachments.length === 0) return null;

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.localId}
          className="relative flex items-center rounded-md border border-border-2 bg-surface-3 overflow-hidden"
        >
          {attachment.previewUrl ? (
            <img
              src={attachment.previewUrl}
              alt={attachment.file.name}
              className="size-14 object-cover"
            />
          ) : (
            <div className="size-14 flex items-center justify-center text-xs text-text-3 text-center px-1 leading-tight">
              {attachment.file.name.split('.').pop()?.toUpperCase()}
            </div>
          )}
          {attachment.status === 'uploading' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="size-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            </div>
          )}
          {attachment.status === 'error' && (
            <div className="absolute inset-0 bg-error/40 flex items-center justify-center">
              <span className="text-error-fg text-xs font-medium">!</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemoveAttachment(attachment.localId)}
            className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
            aria-label={t('channel.input.removeAttachment')}
          >
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  );
};
