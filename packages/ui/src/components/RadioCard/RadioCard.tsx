import type { ReactNode } from 'react';

export interface RadioCardProps {
  name: string;
  value: string;
  checked: boolean;
  onChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export const RadioCard = ({
  name,
  value,
  checked,
  onChange,
  disabled,
  children,
}: RadioCardProps) => (
  <label
    className={[
      'flex items-center gap-3 px-4 py-3 rounded-sm border transition-colors select-none',
      disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer',
    ].join(' ')}
    style={{
      borderColor: checked ? 'var(--color-primary)' : 'var(--color-border-2)',
      backgroundColor: checked
        ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
        : 'transparent',
    }}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={() => onChange?.(value)}
      disabled={disabled}
      className="accent-primary"
    />
    <span className="text-sm font-body text-text-1">{children}</span>
  </label>
);
