import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { Input, type InputProps } from '../Input/Input';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';

const PICKER_WIDTH = 300;
const PICKER_HEIGHT = 380;
const PICKER_OFFSET = 8;

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
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const updatePickerPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const preferredTop =
      pickerPlacement === 'top'
        ? rect.top - PICKER_HEIGHT - PICKER_OFFSET
        : rect.bottom + PICKER_OFFSET;
    const maxTop = window.innerHeight - PICKER_HEIGHT - PICKER_OFFSET;
    const maxLeft = window.innerWidth - PICKER_WIDTH - PICKER_OFFSET;

    setPickerPosition({
      top: Math.max(PICKER_OFFSET, Math.min(preferredTop, maxTop)),
      left: Math.max(PICKER_OFFSET, Math.min(rect.right - PICKER_WIDTH, maxLeft)),
    });
    setPortalTarget(buttonRef.current?.closest('dialog') ?? document.body);
  };
  const updatePickerPositionEvent = useEffectEvent(updatePickerPosition);

  useEffect(() => {
    if (!isPickerOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !pickerRef.current?.contains(target)) {
        setIsPickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPickerOpen]);

  useEffect(() => {
    if (!isPickerOpen) return;

    const handleViewportChange = () => {
      updatePickerPositionEvent();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isPickerOpen]);

  const togglePicker = () => {
    if (isPickerOpen) {
      setIsPickerOpen(false);
      return;
    }

    updatePickerPosition();
    setIsPickerOpen(true);
  };

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
        <>
          <button
            ref={buttonRef}
            type="button"
            onClick={togglePicker}
            className="flex size-6 items-center justify-center cursor-pointer rounded text-text-3 transition-colors hover:text-text-1"
            aria-label={emojiButtonLabel}
          >
            <Smile size={16} />
          </button>
          {isPickerOpen &&
            portalTarget &&
            createPortal(
              <div ref={pickerRef} className="fixed z-50 shadow-lg" style={pickerPosition}>
                <EmojiPickerBase
                  onEmojiClick={handleEmojiClick}
                  width={PICKER_WIDTH}
                  height={PICKER_HEIGHT}
                  {...(pickerProps ?? {})}
                />
              </div>,
              portalTarget
            )}
        </>
      }
      {...inputProps}
    />
  );
};
