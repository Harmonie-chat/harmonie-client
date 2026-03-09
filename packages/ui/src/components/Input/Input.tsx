import { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Input = ({ label, error, disabled, id, rightElement, ...props }: InputProps) => {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const inputClasses = [
    'w-full px-4 py-3 rounded-sm font-body text-sm text-text-1 bg-surface-2',
    'border border-border-2 outline-none',
    'transition-[border-color,box-shadow] duration-150',
    rightElement ? 'pr-10' : '',
    error
      ? 'border-error-fg shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-error-fg)_20%,transparent)]'
      : 'focus:border-secondary-fg focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-secondary-fg)_20%,transparent)]',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={[
            'font-body text-sm font-semibold',
            disabled ? 'text-text-2 opacity-50' : 'text-text-1',
          ].join(' ')}
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input id={inputId} disabled={disabled} className={inputClasses} {...props} />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-3">
            {rightElement}
          </div>
        )}
      </div>
      {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}
    </div>
  );
};
