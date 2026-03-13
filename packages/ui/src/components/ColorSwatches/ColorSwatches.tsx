import { useRef } from 'react';
import { Pipette } from 'lucide-react';

export interface ColorSwatchesProps {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
  showCustomPicker?: boolean;
}

export const ColorSwatches = ({
  colors,
  selected,
  onSelect,
  showCustomPicker = false,
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
          onClick={() => onSelect(color)}
          className="w-7 h-7 rounded-full border-2 transition-all shrink-0 cursor-pointer"
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
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="relative w-7 h-7 rounded-full border-2 shrink-0 cursor-pointer flex items-center justify-center overflow-hidden transition-all"
            style={{
              backgroundColor: isCustomSelected ? selected : 'var(--color-surface-hover)',
              borderColor: isCustomSelected ? 'var(--color-text-1)' : 'var(--color-border-2)',
              outline: isCustomSelected ? '2px solid var(--color-primary)' : 'none',
              outlineOffset: '1px',
            }}
            title="Custom color"
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
          <input
            ref={pickerRef}
            type="color"
            value={pickerValue}
            onChange={(e) => onSelect(e.target.value)}
            className="sr-only"
          />
        </>
      )}
    </div>
  );
};
