import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRichTextLinks } from './useRichTextLinks';

const createQuill = () => ({
  focus: vi.fn(),
  formatText: vi.fn(),
  getBounds: vi.fn((index: number) => ({ height: 10, left: index * 10, top: 40, width: 8 })),
  getFormat: vi.fn(() => ({ link: 'https://example.com' })),
  getLength: vi.fn(() => 5),
  getSelection: vi.fn(() => ({ index: 0, length: 4 })),
  getText: vi.fn(() => 'Docs\n'),
  insertText: vi.fn(),
  setSelection: vi.fn(),
  deleteText: vi.fn(),
});

describe('useRichTextLinks', () => {
  it('opens, saves, removes, and clears link state', () => {
    const quill = createQuill();
    const { result } = renderHook(() => useRichTextLinks());

    act(() => result.current.openLinkDialog(quill as never));

    expect(result.current.linkDialogOpen).toBe(true);
    expect(result.current.linkText).toBe('Docs');
    expect(result.current.linkUrl).toBe('https://example.com');

    act(() => {
      result.current.setLinkText('Docs');
      result.current.setLinkUrl('example.com');
    });
    act(() => result.current.submitLinkDialog(quill as never));

    expect(quill.deleteText).toHaveBeenCalledWith(0, 4, 'user');
    expect(quill.insertText).toHaveBeenCalledWith(
      0,
      'Docs',
      { link: 'https://example.com' },
      'user'
    );
    expect(result.current.linkDialogOpen).toBe(false);

    act(() => result.current.showLinkBubble(quill as never, { index: 0, length: 0 }, true));
    expect(result.current.linkBubble).toEqual({
      left: 19,
      top: 8,
      url: 'https://example.com',
    });

    act(() => result.current.removeCurrentLink(quill as never));
    expect(quill.formatText).toHaveBeenCalledWith(0, 4, 'link', false, 'user');

    act(() => result.current.updateLinkBubble(quill as never, { index: 0, length: 1 }));
    expect(result.current.linkBubble).toBeNull();
  });

  it('ignores incomplete link operations', () => {
    const quill = createQuill();
    quill.getSelection.mockReturnValueOnce(null as never);
    const { result } = renderHook(() => useRichTextLinks());

    act(() => result.current.openLinkDialog(quill as never));
    act(() => result.current.submitLinkDialog(null));
    act(() => result.current.removeCurrentLink(null));
    act(() => result.current.showLinkBubble(quill as never, null as never));

    expect(result.current.linkDialogOpen).toBe(false);
    expect(quill.insertText).not.toHaveBeenCalled();
    expect(quill.formatText).not.toHaveBeenCalled();
  });
});
