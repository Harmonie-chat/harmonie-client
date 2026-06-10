import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export type SelectSize = 'default' | 'sm';

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  label?: string;
  error?: string;
  size?: SelectSize;
  placeholder?: string;
  name?: string;
  className?: string;
  'aria-label'?: string;
}

const VIEWPORT_MARGIN = 6;

const sizeClasses: Record<SelectSize, string> = {
  default: 'px-4 py-3 text-sm rounded-sm',
  sm: 'px-3 py-1.5 text-xs rounded-sm',
};

const chevronSizeMap: Record<SelectSize, number> = {
  default: 16,
  sm: 13,
};

const optionSizeClasses: Record<SelectSize, string> = {
  default: 'px-3 py-2 text-sm',
  sm: 'px-2.5 py-1.5 text-xs',
};

export const Select = ({
  options,
  value,
  onChange,
  disabled,
  id,
  label,
  error,
  size = 'default',
  placeholder,
  className,
  ...rest
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((o) => o.value === value);
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current || !dropdownRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = dropdownRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = triggerRect.top - VIEWPORT_MARGIN;
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

    setDropdownStyle({
      position: 'fixed',
      left: triggerRect.left,
      width: triggerRect.width,
      zIndex: 50,
      ...(openUpward
        ? { bottom: window.innerHeight - triggerRect.top + 4 }
        : { top: triggerRect.bottom + 4 }),
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      )
        return;
      setIsOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (optValue: string) => {
    onChange?.(optValue);
    setIsOpen(false);
  };

  const triggerClasses = [
    'w-full flex items-center gap-2 font-body font-medium text-text-1 bg-surface-2',
    'border border-border-2 outline-none cursor-pointer text-left',
    'transition-[border-color,box-shadow] duration-150',
    sizeClasses[size],
    error
      ? 'border-error-fg shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-error-fg)_14%,transparent)]'
      : isOpen
        ? 'border-secondary-fg shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-secondary-fg)_14%,transparent)]'
        : 'hover:border-border-1',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={['flex flex-col gap-1.5', className ?? ''].filter(Boolean).join(' ')}>
      {label && (
        <label
          htmlFor={selectId}
          className={[
            'font-body text-sm font-semibold',
            disabled ? 'text-text-2 opacity-50' : 'text-text-1',
          ].join(' ')}
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((o) => !o)}
        className={triggerClasses}
        {...rest}
      >
        <span className="flex-1 truncate">{selectedOption?.label ?? placeholder ?? ''}</span>
        <ChevronDown
          size={chevronSizeMap[size]}
          className={[
            'shrink-0 text-text-3 transition-transform duration-150',
            isOpen ? 'rotate-180' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </button>

      {isOpen && (
        <menu
          ref={dropdownRef}
          style={dropdownStyle}
          className="m-0 max-h-52 list-none overflow-y-auto rounded-sm border border-border-2 bg-surface-1 p-1 shadow-lg"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={opt.value === value}
              onClick={() => handleSelect(opt.value)}
              className={[
                'flex items-center gap-2 w-full font-body font-medium text-text-2',
                'hover:bg-surface-2 hover:text-text-1 cursor-pointer transition-colors text-left rounded-sm',
                optionSizeClasses[size],
                opt.value === value ? 'text-text-1' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="flex-1 truncate">{opt.label}</span>
              {opt.value === value && (
                <Check size={chevronSizeMap[size]} className="shrink-0 text-primary" />
              )}
            </button>
          ))}
        </menu>
      )}

      {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}
    </div>
  );
};

Select.displayName = 'Select';
