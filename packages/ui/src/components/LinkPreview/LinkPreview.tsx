import type { MouseEventHandler } from 'react';
import { ExternalLink } from 'lucide-react';

export interface LinkPreviewProps {
  url: string;
  label: string;
  host: string;
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  ariaLabel?: string;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export const LinkPreview = ({
  url,
  label,
  host,
  title,
  description,
  imageUrl,
  imageAlt,
  ariaLabel,
  className,
  target = '_blank',
  rel = 'noopener noreferrer',
  onClick,
}: LinkPreviewProps) => (
  <a
    href={url}
    target={target}
    rel={rel}
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      'group grid min-w-0 overflow-hidden rounded-md border border-border-2 bg-surface-1',
      'transition-colors hover:border-primary/60 hover:bg-surface-2',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary',
      'focus-visible:shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_70%,transparent)]',
      imageUrl ? 'sm:grid-cols-[minmax(0,1fr)_128px]' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <div className="min-w-0 border-l-2 border-primary/70 px-3 py-2.5">
      <div className="mb-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-text-3">
        <span className="truncate">{label}</span>
        <ExternalLink size={12} className="shrink-0 opacity-70" aria-hidden="true" />
      </div>
      {title && (
        <div className="line-clamp-2 text-sm font-semibold text-text-1 group-hover:text-primary">
          {title}
        </div>
      )}
      {description && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-text-2">{description}</p>
      )}
      <div className="mt-1 truncate text-xs text-text-3">{host}</div>
    </div>
    {imageUrl && (
      <div className="hidden min-h-24 items-center justify-center overflow-hidden border-l border-border-2 bg-surface-3 sm:flex">
        <img
          src={imageUrl}
          alt={imageAlt ?? title ?? label}
          loading="lazy"
          className="block h-auto max-h-48 max-w-full object-contain object-center"
        />
      </div>
    )}
  </a>
);
