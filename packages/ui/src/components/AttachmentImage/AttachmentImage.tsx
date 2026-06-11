import { type ReactNode } from 'react';

export interface AttachmentImageProps {
  src?: string;
  alt: string;
  onOpen?: () => void;
  openLabel?: string;
  topRightAction?: ReactNode;
  imageDataAttributes?: Record<`data-${string}`, string>;
}

export const AttachmentImage = ({
  src,
  alt,
  onOpen,
  openLabel = 'Open image',
  topRightAction,
  imageDataAttributes,
}: AttachmentImageProps) => {
  if (!src) {
    return (
      <div className="w-full max-w-[42rem] aspect-[4/3] rounded-md bg-surface-3 animate-pulse shrink-0" />
    );
  }

  return (
    <div className="relative w-full max-w-[42rem] min-w-0 shrink group/img">
      <button
        type="button"
        onClick={onOpen}
        className="w-full rounded-md overflow-hidden border border-border-2 hover:opacity-90 transition-opacity cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-primary block"
        aria-label={openLabel}
      >
        <img
          src={src}
          alt={alt}
          className="w-full max-h-[60vh] object-contain block"
          {...imageDataAttributes}
        />
      </button>
      {topRightAction && (
        <div className="absolute top-1 right-1 opacity-0 group-hover/img:opacity-100 transition-opacity">
          {topRightAction}
        </div>
      )}
    </div>
  );
};
