import { ButtonHTMLAttributes, ReactNode } from 'react';

export type IconButtonSize = 'normal' | 'small';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: IconButtonSize;
  children: ReactNode;
}

const sizeClasses: Record<IconButtonSize, string> = {
  normal: 'w-[45px] h-[30px] rounded-sm',
  small: 'w-[25px] h-[25px] rounded-sm',
};

export const IconButton = ({
  size = 'normal',
  disabled,
  children,
  className,
  ...props
}: IconButtonProps) => {
  const classes = [
    'inline-flex items-center justify-center',
    'bg-transparent text-tertiary-fg',
    'hover:bg-surface-3',
    '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease]',
    'hover:scale-[1.04]',
    sizeClasses[size],
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
