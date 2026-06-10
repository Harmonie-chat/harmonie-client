import { useRef } from 'react';
import { Pipette } from 'lucide-react';
import { Tooltip } from '../Tooltip/Tooltip';

export interface ColorSwatchesProps {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
  showCustomPicker?: boolean;
  customColorLabel?: string;
}

export const ColorSwatches = ({
  colors,
  selected,
  onSelect,
  showCustomPicker = false,
  customColorLabel = 'Custom color',
}: ColorSwatchesProps) => {
  const pickerRef = useRef<HTMLInputElement>(null);

  const isCustomSelected = showCustomPicker && !colors.includes(selected);
  const pickerValue = selected.startsWith('#') ? selected : '#000000';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          onClick={() => onSelect(color)}
          className="size-7 rounded-full border-2 transition-all shrink-0 cursor-pointer"
          style={{
            backgroundColor: color,
            borderColor: selected === color ? 'var(--color-text-1)' : 'var(--color-border-2)',
            outline: selected === color ? '2px solid var(--color-primary)' : 'none',
            outlineOffset: '1px',
          }}
        />
      ))}

      {showCustomPicker && (
        <>
          <Tooltip content={customColorLabel}>
            <button
              type="button"
              aria-label={customColorLabel}
              onClick={() => pickerRef.current?.click()}
              className="relative size-7 rounded-full border-2 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden transition-all"
              style={{
                backgroundColor: isCustomSelected ? selected : 'var(--color-surface-hover)',
                borderColor: isCustomSelected ? 'var(--color-text-1)' : 'var(--color-border-2)',
                outline: isCustomSelected ? '2px solid var(--color-primary)' : 'none',
                outlineOffset: '1px',
              }}
            >
              <Pipette
                size={12}
                style={{
                  color: isCustomSelected
                    ? 'color-mix(in srgb, var(--color-text-1) 70%, transparent)'
                    : 'var(--color-text-3)',
                }}
              />
            </button>
          </Tooltip>
          <input
            ref={pickerRef}
            type="color"
            value={pickerValue}
            aria-label={customColorLabel}
            onChange={(e) => onSelect(e.target.value)}
            className="sr-only"
          />
        </>
      )}
    </div>
  );
};
