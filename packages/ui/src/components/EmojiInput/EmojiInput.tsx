import { useEffect, useRef, useState } from 'react';
import {
  Clock3,
  Flag,
  Hash,
  Leaf,
  Lightbulb,
  Plane,
  Smile,
  Trophy,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import EmojiPicker, { Categories, type EmojiClickData, type PickerProps } from 'emoji-picker-react';
import emojisFr from 'emoji-picker-react/dist/data/emojis-fr';
import emojisEn from 'emoji-picker-react/dist/data/emojis-en';
import { Input, type InputProps } from '../Input/Input';

export interface EmojiInputProps extends Omit<
  InputProps,
  'value' | 'onChange' | 'rightElement' | 'ref'
> {
  value: string;
  onChange: (value: string) => void;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  emojiButtonLabel?: string;
}

const defaultCategoryIcons = {
  [Categories.SUGGESTED]: <Clock3 size={14} strokeWidth={2.25} />,
  [Categories.SMILEYS_PEOPLE]: <Users size={14} strokeWidth={2.25} />,
  [Categories.ANIMALS_NATURE]: <Leaf size={14} strokeWidth={2.25} />,
  [Categories.FOOD_DRINK]: <UtensilsCrossed size={14} strokeWidth={2.25} />,
  [Categories.TRAVEL_PLACES]: <Plane size={14} strokeWidth={2.25} />,
  [Categories.ACTIVITIES]: <Trophy size={14} strokeWidth={2.25} />,
  [Categories.OBJECTS]: <Lightbulb size={14} strokeWidth={2.25} />,
  [Categories.SYMBOLS]: <Hash size={14} strokeWidth={2.25} />,
  [Categories.FLAGS]: <Flag size={14} strokeWidth={2.25} />,
};

export const EmojiInput = ({
  value,
  onChange,
  pickerProps,
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

  const detectedLanguage =
    (typeof document !== 'undefined' && document.documentElement.lang) ||
    (typeof navigator !== 'undefined' ? navigator.language : '') ||
    'en';
  const defaultEmojiData = detectedLanguage.toLowerCase().startsWith('fr') ? emojisFr : emojisEn;

  const { emojiData: pickerEmojiData, ...restPickerProps } = pickerProps ?? {};
  const mergedEmojiData = pickerEmojiData ?? defaultEmojiData;

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
            className="flex h-6 w-6 items-center justify-center cursor-pointer rounded text-text-3 transition-colors hover:text-text-1"
            aria-label={emojiButtonLabel}
          >
            <Smile size={16} />
          </button>
          {isPickerOpen && (
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-20 shadow-lg">
              <EmojiPicker
                className="channel-emoji-picker"
                onEmojiClick={handleEmojiClick}
                emojiData={mergedEmojiData}
                searchDisabled
                autoFocusSearch={false}
                lazyLoadEmojis
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
                categoryIcons={defaultCategoryIcons}
                width={320}
                height={380}
                {...restPickerProps}
              />
            </div>
          )}
        </div>
      }
      {...inputProps}
    />
  );
};
