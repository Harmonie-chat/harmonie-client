import { createPortal } from 'react-dom';
import type { RefObject } from 'react';
import type { RichTextMentionOption } from '../types';

interface RichTextMentionAutocompleteProps {
  results: RichTextMentionOption[];
  selectedIndex: number;
  pos: { bottom: number; left: number; width: number };
  onSelect: (result: RichTextMentionOption) => void;
  containerRef: RefObject<HTMLDivElement | null>;
}

const ITEM_H = 40;

export const RichTextMentionAutocomplete = ({
  results,
  selectedIndex,
  pos,
  onSelect,
  containerRef,
}: RichTextMentionAutocompleteProps) => {
  if (results.length === 0) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed z-50 overflow-hidden rounded-md border border-border-2 bg-surface-1 shadow-lg"
      style={{ bottom: pos.bottom, left: pos.left, width: pos.width }}
    >
      {results.map((result, index) => {
        const label = result.displayName ?? result.username;

        return (
          <button
            key={result.userId}
            type="button"
            className={[
              'flex w-full cursor-pointer flex-col items-start justify-center px-3 text-left font-body transition-colors',
              index === selectedIndex
                ? 'bg-surface-hover text-text-1'
                : 'text-text-2 hover:bg-surface-hover hover:text-text-1',
            ].join(' ')}
            style={{ height: ITEM_H }}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect(result);
            }}
          >
            <span className="max-w-full truncate text-sm font-medium leading-5">@{label}</span>
            {result.displayName && (
              <span className="max-w-full truncate text-[11px] leading-4 text-text-3">
                @{result.username}
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
};
