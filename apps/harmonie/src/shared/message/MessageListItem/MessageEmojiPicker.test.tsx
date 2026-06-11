import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageEmojiPicker } from './MessageEmojiPicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  EmojiPickerBase: ({
    onEmojiClick,
    searchPlaceholder,
  }: {
    onEmojiClick: (data: { emoji: string }) => void;
    searchPlaceholder: string;
    width: number;
    height: number;
  }) => (
    <section aria-label={searchPlaceholder}>
      <button type="button" onClick={() => onEmojiClick({ emoji: '✨' })}>
        choose emoji
      </button>
    </section>
  ),
}));

const anchorRect = (input: Partial<DOMRect> = {}) =>
  ({
    bottom: 140,
    height: 40,
    left: 500,
    right: 560,
    top: 100,
    width: 60,
    x: 500,
    y: 100,
    toJSON: vi.fn(),
    ...input,
  }) as DOMRect;

const renderPicker = (props: { anchor?: DOMRect; onClose?: () => void; onSelect?: () => void }) => {
  const onClose = props.onClose ?? vi.fn();
  const onSelect = props.onSelect ?? vi.fn();

  return {
    ...render(
      <MessageEmojiPicker
        anchorRect={props.anchor ?? anchorRect()}
        onClose={onClose}
        onSelect={onSelect}
      />
    ),
    onClose,
    onSelect,
  };
};

describe('MessageEmojiPicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects an emoji and closes', async () => {
    const { onClose, onSelect } = renderPicker({});

    fireEvent.click(screen.getByRole('button', { name: 'choose emoji' }));

    expect(onSelect).toHaveBeenCalledWith('✨');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on escape and outside clicks after the delayed listener is installed', async () => {
    const { onClose } = renderPicker({});

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    vi.runOnlyPendingTimers();
    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps inside clicks open, flips above the anchor when needed, and cleans listeners', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const { container, onClose, unmount } = renderPicker({
      anchor: anchorRect({ bottom: 740, left: 24, right: 80, top: 700 }),
    });

    const picker = container.ownerDocument.body.querySelector('.fixed') as HTMLElement;
    expect(picker.style.top).toBe('312px');
    expect(picker.style.left).toBe('8px');

    vi.runOnlyPendingTimers();
    fireEvent.mouseDown(screen.getByLabelText('channel.input.emojiSearchPlaceholder'));
    expect(onClose).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
