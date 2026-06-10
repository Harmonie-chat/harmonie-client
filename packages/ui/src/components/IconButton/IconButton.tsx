import { useId, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Tooltip, TooltipSide } from '../Tooltip/Tooltip';

export type IconButtonSize = 'normal' | 'small' | 'medium';
export type IconButtonVariant = 'ghost' | 'filled' | 'overlay' | 'primary' | 'danger';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  selected?: boolean;
  tooltipSide?: TooltipSide;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const sizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-[36px] h-[36px] rounded-full',
  small: 'w-[28px] h-[28px] rounded-full',
  medium: 'w-[40px] h-[40px] rounded-full',
};

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-tertiary-fg hover:bg-surface-3',
  filled: 'bg-surface-3 text-text-2 hover:bg-surface-2',
  overlay: 'bg-transparent text-primary-fg hover:bg-transparent',
  primary: 'bg-primary text-primary-fg hover:opacity-90',
  danger: 'bg-[var(--color-danger-action)] text-[var(--color-danger-action-fg)] hover:opacity-90',
};

const selectedClasses = 'bg-primary text-primary-fg hover:bg-primary';

export const IconButton = ({
  size = 'normal',
  variant = 'ghost',
  selected = false,
  disabled,
  children,
  className,
  tooltipSide,
  title,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  ref,
  ...props
}: IconButtonProps) => {
  const generatedTooltipId = useId();
  const tooltipId = typeof title === 'string' && title.length > 0 ? generatedTooltipId : undefined;
  const classes = [
    'inline-flex items-center justify-center',
    '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease]',
    'hover:scale-[1.04]',
    sizeClasses[size],
    selected ? selectedClasses : variantClasses[variant],
    disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const button = (
    <button
      type="button"
      ref={ref}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
      aria-describedby={[ariaDescribedBy, tooltipId].filter(Boolean).join(' ') || undefined}
      {...props}
    >
      {children}
    </button>
  );

  if (typeof title !== 'string' || title.length === 0) return button;

  return (
    <Tooltip content={title} id={tooltipId} side={tooltipSide}>
      {button}
    </Tooltip>
  );
};
