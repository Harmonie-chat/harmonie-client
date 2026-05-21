import { LinkPreview as LinkPreviewCard } from '@harmonie/ui';
import { useTranslation } from 'react-i18next';
import type { LinkPreview } from '@/types/channel';

interface MessageLinkPreviewsProps {
  previews?: LinkPreview[] | null;
}

const getPreviewHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

export const MessageLinkPreviews = ({ previews }: MessageLinkPreviewsProps) => {
  const { t } = useTranslation();
  const visiblePreviews = previews?.filter((preview) => preview.url) ?? [];

  if (visiblePreviews.length === 0) return null;

  return (
    <div className="mt-2 flex max-w-xl flex-col gap-2">
      {visiblePreviews.map((preview) => {
        const host = getPreviewHost(preview.url);
        const label = preview.siteName || host;

        return (
          <LinkPreviewCard
            key={preview.url}
            url={preview.url}
            label={label}
            host={host}
            title={preview.title}
            description={preview.description}
            imageUrl={preview.imageUrl}
            ariaLabel={t('channel.messages.openLinkPreview', { title: preview.title || label })}
            imageAlt={t('channel.messages.linkPreviewImageAlt', {
              title: preview.title || label,
            })}
          />
        );
      })}
    </div>
  );
};
