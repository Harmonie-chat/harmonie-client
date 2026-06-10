import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { Input, type InputProps } from '../Input/Input';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';

const PICKER_WIDTH = 300;
const PICKER_HEIGHT = 380;

export interface EmojiInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'rightElement' | 'ref'
> {
  value: string;
  onChange: (value: string) => void;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  pickerPlacement?: 'top' | 'bottom';
  emojiButtonLabel?: string;
}

export const EmojiInput = ({
  value,
  onChange,
  pickerProps,
  pickerPlacement = 'bottom',
  emojiButtonLabel = 'Open emoji picker',
  ...inputProps
}: EmojiInputProps) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPickerOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPickerOpen]);

  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) {
      onChange(`${value}${emoji}`);
      setIsPickerOpen(false);
      return;
    }

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    onChange(`${value.slice(0, start)}${emoji}${value.slice(end)}`);
    setIsPickerOpen(false);

    requestAnimationFrame(() => {
      input.focus();
      const nextCursorPosition = start + emoji.length;
      input.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    insertEmoji(emojiData.emoji);
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rightElement={
        <div ref={pickerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsPickerOpen((previous) => !previous)}
            className="flex size-6 items-center justify-center cursor-pointer rounded text-text-3 transition-colors hover:text-text-1"
            aria-label={emojiButtonLabel}
          >
            <Smile size={16} />
          </button>
          {isPickerOpen && (
            <div
              className={[
                'absolute right-0 z-20 shadow-lg',
                pickerPlacement === 'top'
                  ? 'bottom-[calc(100%+0.5rem)]'
                  : 'top-[calc(100%+0.5rem)]',
              ].join(' ')}
            >
              <EmojiPickerBase
                onEmojiClick={handleEmojiClick}
                width={PICKER_WIDTH}
                height={PICKER_HEIGHT}
                {...(pickerProps ?? {})}
              />
            </div>
          )}
        </div>
      }
      {...inputProps}
    />
  );
};
