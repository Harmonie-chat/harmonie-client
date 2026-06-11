import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useRichTextMentions } from './useRichTextMentions';

const mentionOptions = [
  { userId: 'user-1', username: 'ada', displayName: 'Ada Lovelace' },
  { userId: 'user-2', username: 'grace' },
];

const createHostRef = () => {
  const host = document.createElement('div');
  vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
    bottom: 180,
    height: 60,
    left: 24,
    right: 204,
    top: 120,
    width: 180,
    x: 24,
    y: 120,
    toJSON: () => ({}),
  } as DOMRect);
  const ref = createRef<HTMLDivElement>();
  Object.defineProperty(ref, 'current', { value: host });
  return ref;
};

const createQuill = () => ({
  deleteText: vi.fn(),
  format: vi.fn(),
  getSelection: vi.fn(() => ({ index: 3, length: 0 })),
  getText: vi.fn(() => '@ad'),
  insertText: vi.fn(),
  setSelection: vi.fn(),
});

describe('useRichTextMentions', () => {
  it('filters mentions, inserts the selected mention and clears the list', () => {
    const quill = createQuill();
    const onMentionSelected = vi.fn();
    const { result } = renderHook(() =>
      useRichTextMentions(createHostRef(), mentionOptions, onMentionSelected)
    );

    act(() => result.current.updateMentions(quill as never, { index: 3, length: 0 }));

    expect(result.current.mentionResults).toEqual([mentionOptions[0]]);
    expect(result.current.mentionPos).toEqual({
      bottom: window.innerHeight - 120 + 8,
      left: 24,
      width: 240,
    });

    act(() => result.current.handleSelectMention(quill as never, mentionOptions[0]));

    expect(quill.deleteText).toHaveBeenCalledWith(0, 3, 'api');
    expect(quill.insertText).toHaveBeenCalledWith(0, '@Ada Lovelace', { mention: 'user-1' }, 'api');
    expect(onMentionSelected).toHaveBeenCalledWith(mentionOptions[0]);
    expect(result.current.mentionResults).toEqual([]);
  });

  it('clears mentions for missing ranges, missing matches and empty results', () => {
    const quill = createQuill();
    const { result } = renderHook(() => useRichTextMentions(createHostRef(), mentionOptions));

    act(() => result.current.updateMentions(quill as never, null));
    quill.getText.mockReturnValueOnce('hello');
    act(() => result.current.updateMentions(quill as never, { index: 5, length: 0 }));
    quill.getText.mockReturnValueOnce('@zz');
    act(() => result.current.updateMentions(quill as never, { index: 3, length: 0 }));

    expect(result.current.mentionPos).toBeNull();
    expect(result.current.mentionResults).toEqual([]);
  });
});
