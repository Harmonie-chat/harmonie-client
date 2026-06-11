import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useRichTextAutocomplete } from './useRichTextAutocomplete';

const createHostRef = () => {
  const host = document.createElement('div');
  const wrapper = document.createElement('div');
  wrapper.appendChild(host);
  vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
    bottom: 200,
    height: 80,
    left: 32,
    right: 232,
    top: 120,
    width: 180,
    x: 32,
    y: 120,
    toJSON: () => ({}),
  } as DOMRect);
  const ref = createRef<HTMLDivElement>();
  Object.defineProperty(ref, 'current', { value: host });
  return ref;
};

const createQuill = () => ({
  deleteText: vi.fn(),
  getSelection: vi.fn(() => ({ index: 4, length: 0 })),
  getText: vi.fn(() => ':smi'),
  insertText: vi.fn(),
  setSelection: vi.fn(),
});

describe('useRichTextAutocomplete', () => {
  it('positions autocomplete results and inserts the selected emoji', () => {
    const quill = createQuill();
    const { result } = renderHook(() => useRichTextAutocomplete(createHostRef()));

    act(() => result.current.updateAutocomplete(quill as never, { index: 4, length: 0 }));

    expect(result.current.autocompleteResults[0]?.name).toBe('smiley');
    expect(result.current.autocompletePos).toEqual({
      bottom: window.innerHeight - 120 + 8,
      left: 32,
      width: 220,
    });

    const selected = result.current.autocompleteResults[0]!;
    act(() => result.current.handleSelectAutocomplete(quill as never, selected));

    expect(quill.deleteText).toHaveBeenCalledWith(0, 4, 'api');
    expect(quill.insertText).toHaveBeenCalledWith(0, selected.emoji, 'api');
    expect(result.current.autocompleteResults).toEqual([]);
  });

  it('clears autocomplete for missing ranges and incomplete matches', () => {
    const quill = createQuill();
    quill.getText.mockReturnValue('plain');
    quill.getSelection.mockReturnValue(null as never);
    const { result } = renderHook(() => useRichTextAutocomplete(createHostRef()));

    act(() => result.current.updateAutocomplete(quill as never, null));
    act(() => result.current.updateAutocomplete(quill as never, { index: 5, length: 0 }));
    act(() =>
      result.current.handleSelectAutocomplete(quill as never, { emoji: '😄', name: 'smile' })
    );

    expect(result.current.autocompletePos).toBeNull();
    expect(quill.insertText).not.toHaveBeenCalled();
  });
});
