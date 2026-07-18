import { act, renderHook } from '@testing-library/react';
import type { RefObject } from 'react';
import type Quill from 'quill';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRichTextContextMenu } from './useRichTextContextMenu';

const clipboardMocks = {
  readText: vi.fn<() => Promise<string>>(),
  writeText: vi.fn<(text: string) => Promise<void>>(),
};

const createQuill = (range: { index: number; length: number } | null, length = 6) => ({
  deleteText: vi.fn(),
  focus: vi.fn(),
  formatText: vi.fn(),
  getLength: vi.fn(() => length),
  getSelection: vi.fn(() => range),
  getText: vi.fn(() => 'ell'),
  insertText: vi.fn(),
  setSelection: vi.fn(),
});

const createQuillRef = (quill: ReturnType<typeof createQuill> | null) =>
  ({ current: quill }) as unknown as RefObject<Quill | null>;

const createContextMenuEvent = () => ({
  clientX: 24,
  clientY: 32,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
});

describe('useRichTextContextMenu', () => {
  beforeEach(() => {
    clipboardMocks.readText.mockReset().mockResolvedValue('');
    clipboardMocks.writeText.mockReset().mockResolvedValue();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboardMocks,
    });
  });

  it('opens, copies, cuts, selects all, and closes the menu', async () => {
    const quill = createQuill({ index: 1, length: 3 });
    const { result } = renderHook(() =>
      useRichTextContextMenu({ disabled: false, quillRef: createQuillRef(quill) })
    );
    const event = createContextMenuEvent();

    act(() => result.current.handleContextMenu(event as never));

    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(event.stopPropagation).toHaveBeenCalledOnce();
    expect(result.current.contextMenu).toEqual({
      hasContent: true,
      position: { x: 24, y: 32 },
      range: { index: 1, length: 3 },
    });
    expect(result.current.canCopy).toBe(true);
    expect(result.current.canCut).toBe(true);
    expect(result.current.canPaste).toBe(true);
    expect(result.current.canSelectAll).toBe(true);

    await act(async () => result.current.copy());
    await act(async () => result.current.cut());
    act(() => result.current.selectAll());

    expect(clipboardMocks.writeText).toHaveBeenNthCalledWith(1, 'ell');
    expect(clipboardMocks.writeText).toHaveBeenNthCalledWith(2, 'ell');
    expect(quill.deleteText).toHaveBeenCalledWith(1, 3, 'user');
    expect(quill.setSelection).toHaveBeenCalledWith(1, 0, 'silent');
    expect(quill.setSelection).toHaveBeenCalledWith(0, 5, 'user');

    act(() => result.current.closeContextMenu());
    expect(result.current.contextMenu).toBeNull();
  });

  it('pastes plain text and URLs with and without a selection', async () => {
    const plainQuill = createQuill({ index: 1, length: 2 });
    const plainHook = renderHook(() =>
      useRichTextContextMenu({ disabled: false, quillRef: createQuillRef(plainQuill) })
    );
    clipboardMocks.readText.mockResolvedValueOnce('hello');
    act(() => plainHook.result.current.handleContextMenu(createContextMenuEvent() as never));
    await act(async () => plainHook.result.current.paste());

    expect(plainQuill.deleteText).toHaveBeenCalledWith(1, 2, 'user');
    expect(plainQuill.insertText).toHaveBeenCalledWith(1, 'hello', 'user');
    expect(plainQuill.setSelection).toHaveBeenCalledWith(6, 0, 'silent');

    const selectedUrlQuill = createQuill({ index: 1, length: 2 });
    const selectedUrlHook = renderHook(() =>
      useRichTextContextMenu({ disabled: false, quillRef: createQuillRef(selectedUrlQuill) })
    );
    clipboardMocks.readText.mockResolvedValueOnce(' https://example.com ');
    act(() => selectedUrlHook.result.current.handleContextMenu(createContextMenuEvent() as never));
    await act(async () => selectedUrlHook.result.current.paste());

    expect(selectedUrlQuill.formatText).toHaveBeenCalledWith(
      1,
      2,
      'link',
      'https://example.com',
      'user'
    );
    expect(selectedUrlQuill.setSelection).toHaveBeenCalledWith(3, 0, 'silent');

    const cursorQuill = createQuill(null);
    const cursorHook = renderHook(() =>
      useRichTextContextMenu({ disabled: false, quillRef: createQuillRef(cursorQuill) })
    );
    clipboardMocks.readText.mockResolvedValueOnce('https://example.com');
    act(() => cursorHook.result.current.handleContextMenu(createContextMenuEvent() as never));
    await act(async () => cursorHook.result.current.paste());

    expect(cursorHook.result.current.contextMenu?.range).toEqual({ index: 5, length: 0 });
    expect(cursorQuill.insertText).toHaveBeenCalledWith(
      5,
      'https://example.com',
      { link: 'https://example.com' },
      'user'
    );
    expect(cursorQuill.setSelection).toHaveBeenCalledWith(24, 0, 'silent');
  });

  it('disables unavailable actions and safely handles missing editor content', async () => {
    const quill = createQuill({ index: 0, length: 2 }, 1);
    const quillRef = createQuillRef(quill);
    const { result, rerender } = renderHook(
      ({ disabled }) => useRichTextContextMenu({ disabled, quillRef }),
      { initialProps: { disabled: true } }
    );

    act(() => result.current.handleContextMenu(createContextMenuEvent() as never));
    expect(result.current.canCopy).toBe(true);
    expect(result.current.canCut).toBe(false);
    expect(result.current.canPaste).toBe(false);
    expect(result.current.canSelectAll).toBe(false);

    await act(async () => result.current.cut());
    await act(async () => result.current.paste());
    act(() => result.current.selectAll());
    expect(quill.deleteText).not.toHaveBeenCalled();
    expect(quill.insertText).not.toHaveBeenCalled();
    expect(quill.setSelection).not.toHaveBeenCalled();

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    rerender({ disabled: false });
    expect(result.current.canCopy).toBe(false);
    expect(result.current.canCut).toBe(false);
    expect(result.current.canPaste).toBe(false);

    quillRef.current = null;
    act(() => result.current.handleContextMenu(createContextMenuEvent() as never));
    await act(async () => result.current.copy());
  });

  it('stops a pending cut when the editor instance changes', async () => {
    const quill = createQuill({ index: 1, length: 2 });
    const quillRef = createQuillRef(quill);
    const { result } = renderHook(() => useRichTextContextMenu({ disabled: false, quillRef }));
    act(() => result.current.handleContextMenu(createContextMenuEvent() as never));

    let resolveWrite: (() => void) | undefined;
    clipboardMocks.writeText.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      })
    );

    const cutPromise = result.current.cut();
    quillRef.current = createQuill({ index: 0, length: 0 }) as never;
    resolveWrite?.();
    await act(async () => cutPromise);

    expect(quill.deleteText).not.toHaveBeenCalled();
  });

  it('does not mutate editor content when clipboard access fails or is empty', async () => {
    const quill = createQuill({ index: 1, length: 2 });
    const { result } = renderHook(() =>
      useRichTextContextMenu({ disabled: false, quillRef: createQuillRef(quill) })
    );
    act(() => result.current.handleContextMenu(createContextMenuEvent() as never));

    clipboardMocks.writeText.mockRejectedValue(new Error('denied'));
    await act(async () => result.current.copy());
    await act(async () => result.current.cut());
    expect(quill.deleteText).not.toHaveBeenCalled();

    clipboardMocks.readText.mockRejectedValueOnce(new Error('denied')).mockResolvedValueOnce('');
    await act(async () => result.current.paste());
    await act(async () => result.current.paste());
    expect(quill.insertText).not.toHaveBeenCalled();
  });
});
