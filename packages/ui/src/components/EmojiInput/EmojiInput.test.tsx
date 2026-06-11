import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmojiInput } from './EmojiInput';

vi.mock('../EmojiPickerBase/EmojiPickerBase', () => ({
  EmojiPickerBase: ({ onEmojiClick }: { onEmojiClick: (data: { emoji: string }) => void }) => (
    <button type="button" onClick={() => onEmojiClick({ emoji: '✨' })}>
      Pick sparkle
    </button>
  ),
}));

describe('EmojiInput', () => {
  it('edits text and inserts an emoji', () => {
    const onChange = vi.fn();

    render(
      <EmojiInput
        value="hello"
        onChange={onChange}
        aria-label="Message"
        emojiButtonLabel="Emoji"
        pickerPlacement="top"
      />
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Message' }), {
      target: { value: 'updated' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Emoji' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pick sparkle' }));

    expect(onChange).toHaveBeenCalledWith('updated');
    expect(onChange).toHaveBeenCalledWith('hello✨');
    expect(screen.queryByRole('button', { name: 'Pick sparkle' })).not.toBeInTheDocument();
  });

  it('closes the picker on outside clicks', () => {
    render(
      <EmojiInput value="" onChange={vi.fn()} aria-label="Message" emojiButtonLabel="Emoji" />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Emoji' }));
    expect(screen.getByRole('button', { name: 'Pick sparkle' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Pick sparkle' })).not.toBeInTheDocument();
  });
});
