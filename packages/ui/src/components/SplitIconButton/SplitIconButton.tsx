import type { ReactNode, Ref } from 'react';
import type { IconButtonSize } from '../IconButton/IconButton';

export interface SplitIconButtonProps {
  size?: IconButtonSize;
  selected?: boolean;
  selectedVariant?: 'primary' | 'danger';
  open?: boolean;
  disabled?: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  primaryIcon: ReactNode;
  secondaryIcon: ReactNode;
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

const containerSizeClasses: Record<IconButtonSize, string> = {
  normal: 'h-[36px]',
  small: 'h-[28px]',
  medium: 'h-[40px]',
};

const primarySizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-[36px]',
  small: 'w-[28px]',
  medium: 'w-[40px]',
};

const secondarySizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-6',
  small: 'w-5',
  medium: 'w-7',
};

const selectedVariantClasses = {
  primary: 'bg-primary text-primary-fg',
  danger: 'bg-[var(--color-danger-action)] text-[var(--color-danger-action-fg)]',
} as const;

export const SplitIconButton = ({
  size = 'small',
  selected = false,
  selectedVariant = 'primary',
  open = false,
  disabled = false,
  primaryLabel,
  secondaryLabel,
  primaryIcon,
  secondaryIcon,
  onPrimaryClick,
  onSecondaryClick,
  className,
  ref,
}: SplitIconButtonProps) => {
  const disabledClasses = disabled ? 'opacity-40 pointer-events-none' : '';

  return (
    <div
      className={[
        'inline-flex items-center overflow-hidden rounded-full bg-transparent',
        containerSizeClasses[size],
        disabledClasses,
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={primaryLabel}
        onClick={onPrimaryClick}
        className={[
          'flex items-center justify-center cursor-pointer rounded-l-full',
          '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease]',
          'hover:scale-[1.04]',
          containerSizeClasses[size],
          primarySizeClasses[size],
          selected
            ? selectedVariantClasses[selectedVariant]
            : 'bg-transparent text-tertiary-fg hover:bg-surface-3',
        ].join(' ')}
      >
        {primaryIcon}
      </button>
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={secondaryLabel}
        onClick={onSecondaryClick}
        className={[
          'flex items-center justify-center cursor-pointer rounded-r-full',
          '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease,color_150ms_ease]',
          'hover:scale-[1.04]',
          containerSizeClasses[size],
          secondarySizeClasses[size],
          selected
            ? selectedVariantClasses[selectedVariant]
            : open
              ? 'bg-surface-3 text-text-2'
              : 'bg-transparent text-tertiary-fg hover:bg-surface-3',
        ].join(' ')}
      >
        {secondaryIcon}
      </button>
    </div>
  );
};
