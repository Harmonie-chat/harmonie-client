import { describe, expect, it, vi } from 'vitest';
import { insertTextAtSelection, restoreTextareaSelection } from './emojiInsertion';

describe('insertTextAtSelection', () => {
  it('inserts text at the current selection', () => {
    expect(insertTextAtSelection('hello world', 6, 11, 'Harmonie')).toBe('hello Harmonie');
  });

  it('replaces a selected range', () => {
    expect(insertTextAtSelection('hello world', 0, 5, 'bonjour')).toBe('bonjour world');
  });
});

describe('restoreTextareaSelection', () => {
  it('restores the cursor position on the next animation frame', () => {
    const textarea = document.createElement('textarea');
    const setSelectionRange = vi.spyOn(textarea, 'setSelectionRange');
    const focus = vi.spyOn(textarea, 'focus');
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        callback(0);
        return 1;
      });

    restoreTextareaSelection(textarea, 3, true);

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    expect(setSelectionRange).toHaveBeenCalledWith(3, 3);
  });
});
