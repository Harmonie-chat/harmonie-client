import { createRef, type RefObject } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PlainEmojiTextarea } from './EmojiTextarea';

vi.mock('../EmojiPickerBase/EmojiPickerBase', () => ({
  EmojiPickerBase: ({ onEmojiClick }: { onEmojiClick: (data: { emoji: string }) => void }) => (
    <button type="button" onClick={() => onEmojiClick({ emoji: '😀' })}>
      Pick grin
    </button>
  ),
}));

describe('PlainEmojiTextarea', () => {
  it('renders inside controls, extra actions, top content, and inserts emoji', () => {
    const onChange = vi.fn();
    const textareaRef = createRef<HTMLTextAreaElement>();

    render(
      <PlainEmojiTextarea
        value="hello"
        onChange={onChange}
        textareaRef={textareaRef as RefObject<HTMLTextAreaElement>}
        aria-label="Message"
        emojiButtonLabel="Emoji"
        extraActions={<button type="button">Attach</button>}
        topContent={<span>Replying</span>}
      />
    );

    const textarea = screen.getByRole('textbox', { name: 'Message' }) as HTMLTextAreaElement;
    textarea.setSelectionRange(5, 5);

    fireEvent.change(textarea, { target: { value: 'changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'Emoji' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pick grin' }));

    expect(screen.getByText('Replying')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Attach' })).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith('changed');
    expect(onChange).toHaveBeenCalledWith('hello😀');
  });

  it('renders below controls and closes the picker on outside clicks', () => {
    render(
      <PlainEmojiTextarea
        value=""
        onChange={vi.fn()}
        aria-label="Message"
        emojiButtonLabel="Emoji"
        controlsPlacement="below"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Emoji' }));
    expect(screen.getByRole('button', { name: 'Pick grin' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Pick grin' })).not.toBeInTheDocument();
  });
});
