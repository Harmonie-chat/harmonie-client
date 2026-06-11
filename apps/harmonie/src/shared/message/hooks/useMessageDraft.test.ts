import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useMessageDraft } from './useMessageDraft';

describe('useMessageDraft', () => {
  it('reads an existing draft from local storage', () => {
    localStorage.setItem('harmonie:message-draft:channel-1', '<p>saved</p>');

    const { result } = renderHook(() => useMessageDraft('channel-1'));

    expect(result.current.content).toBe('<p>saved</p>');
  });

  it('writes non-empty draft content and removes empty content', () => {
    const { result } = renderHook(() => useMessageDraft('channel-1'));

    act(() => result.current.setContent('<p>Hello</p>'));
    expect(result.current.content).toBe('<p>Hello</p>');
    expect(localStorage.getItem('harmonie:message-draft:channel-1')).toBe('<p>Hello</p>');

    act(() => result.current.setContent('<p><br></p>'));
    expect(result.current.content).toBe('<p><br></p>');
    expect(localStorage.getItem('harmonie:message-draft:channel-1')).toBeNull();
  });

  it('clears draft state and storage', () => {
    localStorage.setItem('harmonie:message-draft:channel-1', '<p>saved</p>');
    const { result } = renderHook(() => useMessageDraft('channel-1'));

    act(() => result.current.clearDraft());

    expect(result.current.content).toBe('');
    expect(localStorage.getItem('harmonie:message-draft:channel-1')).toBeNull();
  });

  it('keeps local state without a storage key', () => {
    const { result } = renderHook(() => useMessageDraft());

    act(() => result.current.setContent('<p>Hello</p>'));
    act(() => result.current.clearDraft());

    expect(result.current.content).toBe('');
    expect(localStorage.length).toBe(0);
  });

  it('ignores local storage read and write failures', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { result } = renderHook(() => useMessageDraft('channel-1'));

    expect(result.current.content).toBe('');

    act(() => result.current.setContent('<p>Hello</p>'));
    act(() => result.current.clearDraft());

    expect(result.current.content).toBe('');
  });
});
