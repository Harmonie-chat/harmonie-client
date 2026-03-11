import { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonSize = 'normal' | 'small' | 'medium';
export type IconButtonVariant = 'ghost' | 'filled';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  selected?: boolean;
  children: ReactNode;
}

const sizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-[45px] h-[30px] rounded-sm',
  small: 'w-[25px] h-[25px] rounded-sm',
  medium: 'w-[36px] h-[36px] rounded-sm',
};

const variantClasses: Record<IconButtonVariant, string> = {
  ghost: 'bg-transparent text-tertiary-fg hover:bg-surface-3',
  filled: 'bg-surface-3 text-text-2 hover:bg-surface-2',
};

const selectedClasses = 'bg-primary text-primary-fg hover:bg-primary';

export const IconButton = ({
  size = 'normal',
  variant = 'ghost',
  selected = false,
  disabled,
  children,
  className,
  ...props
}: IconButtonProps) => {
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

  return (
    <button disabled={disabled} className={classes} {...props}>
      {children}
    </button>
  );
};
