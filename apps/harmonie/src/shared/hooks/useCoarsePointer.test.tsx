import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { isCoarsePointerDevice, useCoarsePointer } from './useCoarsePointer';

const matchMediaResult = (matches: boolean) => ({
  matches,
  media: '',
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('useCoarsePointer', () => {
  it('detects coarse pointer devices', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce(matchMediaResult(true));

    expect(isCoarsePointerDevice()).toBe(true);
  });

  it('subscribes to media query changes', () => {
    const media = matchMediaResult(false);
    vi.mocked(window.matchMedia).mockReturnValue(media);

    const { result, unmount } = renderHook(() => useCoarsePointer());

    expect(result.current).toBe(false);
    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
