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
      'relative flex items-center gap-3 px-4 py-3 rounded-sm border transition-colors select-none',
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
      className="peer absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-0"
    />
    <span
      aria-hidden="true"
      className={[
        'flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
        checked ? 'border-primary' : 'border-border-2',
      ].join(' ')}
      style={{
        backgroundColor: checked
          ? 'color-mix(in srgb, var(--color-primary) 16%, transparent)'
          : 'transparent',
      }}
    >
      {checked && <span className="size-2 rounded-full bg-primary" />}
    </span>
    <span className="text-sm font-body text-text-1">{children}</span>
  </label>
);
