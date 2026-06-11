import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMessageFormattingPreference } from './useMessageFormattingPreference';

describe('useMessageFormattingPreference', () => {
  it('starts closed when no stored preference exists', () => {
    const { result } = renderHook(() => useMessageFormattingPreference());

    expect(result.current.formattingOpen).toBe(false);
    expect(localStorage.getItem('harmonie:message-formatting-open')).toBe('false');
  });

  it('reads and persists the formatting toolbar preference', () => {
    localStorage.setItem('harmonie:message-formatting-open', 'true');
    const { result } = renderHook(() => useMessageFormattingPreference());

    expect(result.current.formattingOpen).toBe(true);

    act(() => result.current.toggleFormattingOpen());

    expect(result.current.formattingOpen).toBe(false);
    expect(localStorage.getItem('harmonie:message-formatting-open')).toBe('false');
  });
});
