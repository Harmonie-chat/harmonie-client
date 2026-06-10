import type { ReactNode, Ref, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'className'
> {
  label?: string;
  error?: string;
  bottomRightElement?: ReactNode;
  bottomRightElementWide?: boolean;
  topContent?: ReactNode;
  ref?: Ref<HTMLTextAreaElement>;
}

export const Textarea = ({
  label,
  error,
  disabled,
  id,
  bottomRightElement,
  bottomRightElementWide,
  topContent,
  ref,
  ...props
}: TextareaProps) => {
  const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const borderStateClasses = error
    ? 'border-error-fg shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-error-fg)_14%,transparent)]'
    : topContent
      ? 'focus-within:border-secondary-fg focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-secondary-fg)_14%,transparent)]'
      : 'focus:border-secondary-fg focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-secondary-fg)_14%,transparent)]';

  const textareaClasses = [
    'w-full px-4 py-3 font-body text-sm text-text-2 caret-primary outline-none resize-none',
    'transition-[border-color,box-shadow] duration-150',
    'placeholder:text-text-3',
    bottomRightElement && !bottomRightElementWide ? 'pb-9 pr-10' : '',
    bottomRightElement && bottomRightElementWide ? 'pb-9 pr-16' : '',
    topContent
      ? 'bg-transparent border-0'
      : `rounded-sm bg-surface-2 border border-border-2 ${borderStateClasses}`,
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
  ]
    .filter(Boolean)
    .join(' ');

  const inputArea = (
    <div className="relative">
      <textarea
        id={textareaId}
        ref={ref}
        disabled={disabled}
        className={textareaClasses}
        {...props}
      />
      {bottomRightElement && (
        <div className="absolute inset-y-0 right-3 z-10 flex items-start pt-2.5">
          {bottomRightElement}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className={[
            'font-body text-sm font-semibold',
            disabled ? 'text-text-2 opacity-50' : 'text-text-1',
          ].join(' ')}
        >
          {label}
        </label>
      )}
      {topContent ? (
        <div
          className={[
            'rounded-sm bg-surface-2 border border-border-2',
            'transition-[border-color,box-shadow] duration-150',
            borderStateClasses,
            disabled ? 'opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="px-4 pt-3 pb-1">{topContent}</div>
          {inputArea}
        </div>
      ) : (
        inputArea
      )}
      {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}
    </div>
  );
};

Textarea.displayName = 'Textarea';
