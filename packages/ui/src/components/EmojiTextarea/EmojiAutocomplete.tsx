import { type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { AutocompleteResult } from './emojiReplacer';

interface EmojiAutocompleteProps {
  results: AutocompleteResult[];
  selectedIndex: number;
  pos: { bottom: number; left: number; width: number };
  onSelect: (result: AutocompleteResult) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

const ITEM_H = 36;

export const EmojiAutocomplete = ({
  results,
  selectedIndex,
  pos,
  onSelect,
  containerRef,
}: EmojiAutocompleteProps) => {
  if (results.length === 0) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-50 overflow-hidden rounded-md border border-border-2 bg-surface-1 shadow-lg"
      style={{ bottom: pos.bottom, left: pos.left, width: pos.width }}
    >
      {results.map((result, i) => (
        <div
          key={result.name}
          className={[
            'flex cursor-pointer items-center gap-2 px-3 font-body text-sm transition-colors',
            i === selectedIndex
              ? 'bg-surface-hover text-text-1'
              : 'text-text-2 hover:bg-surface-hover hover:text-text-1',
          ].join(' ')}
          style={{ height: ITEM_H }}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(result);
          }}
        >
          <span className="text-base leading-none">{result.emoji}</span>
          <span>:{result.name}:</span>
        </div>
      ))}
    </div>,
    document.body
  );
};
