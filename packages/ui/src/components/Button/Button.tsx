import { ButtonHTMLAttributes, useId } from 'react';
import { Loader2 } from 'lucide-react';
import { Tooltip } from '../Tooltip/Tooltip';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
export type ButtonSize = 'normal' | 'small';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:opacity-80',
  secondary: 'bg-secondary border border-secondary-fg text-secondary-fg hover:opacity-80',
  tertiary: 'bg-transparent border border-tertiary-fg text-tertiary-fg hover:bg-surface-3',
  danger: 'bg-[var(--color-danger-action)] text-[var(--color-danger-action-fg)] hover:opacity-90',
};

const sizeClasses: Record<ButtonSize, string> = {
  normal: 'px-5 py-2.5 text-sm',
  small: 'px-3 h-7 text-xs',
};

export const Button = ({
  variant = 'primary',
  size = 'normal',
  disabled,
  isLoading,
  children,
  className,
  title,
  'aria-describedby': ariaDescribedBy,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;
  const generatedTooltipId = useId();
  const tooltipId = typeof title === 'string' && title.length > 0 ? generatedTooltipId : undefined;

  const classes = [
    'font-body font-normal rounded-full inline-flex items-center justify-center gap-2',
    sizeClasses[size],
    '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease,border-color_150ms_ease]',
    'hover:scale-[1.04]',
    variantClasses[variant],
    isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const button = (
    <button
      type="button"
      disabled={isDisabled}
      className={classes}
      aria-describedby={[ariaDescribedBy, tooltipId].filter(Boolean).join(' ') || undefined}
      {...props}
    >
      {isLoading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );

  if (typeof title !== 'string' || title.length === 0) return button;

  return (
    <Tooltip content={title} id={tooltipId}>
      {button}
    </Tooltip>
  );
};
