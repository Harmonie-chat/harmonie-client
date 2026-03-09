import { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-fg hover:opacity-80',
  secondary: 'bg-secondary border border-secondary-fg text-secondary-fg hover:opacity-80',
  tertiary: 'bg-transparent border border-tertiary-fg text-tertiary-fg hover:bg-surface-3',
};

export const Button = ({
  variant = 'primary',
  disabled,
  isLoading,
  children,
  className,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  const classes = [
    'font-body text-sm font-normal px-5 py-2.5 rounded-sm inline-flex items-center justify-center gap-2',
    '[transition:transform_150ms_cubic-bezier(0.34,1.56,0.64,1),background-color_150ms_ease,opacity_150ms_ease,border-color_150ms_ease]',
    'hover:scale-[1.04]',
    variantClasses[variant],
    isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button disabled={isDisabled} className={classes} {...props}>
      {isLoading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
};
