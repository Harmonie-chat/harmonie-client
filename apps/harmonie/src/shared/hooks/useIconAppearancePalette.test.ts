import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIconAppearancePalette } from './useIconAppearancePalette';

describe('useIconAppearancePalette', () => {
  it('resolves icon and background color CSS variables', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => `resolved-${name}`,
    } as CSSStyleDeclaration);

    const { result } = renderHook(() => useIconAppearancePalette());

    expect(result.current.iconColors).toEqual([
      'resolved---color-cat-1-fg',
      'resolved---color-cat-2-fg',
      'resolved---color-cat-3-fg',
      'resolved---color-cat-4-fg',
      'resolved---color-cat-5-fg',
    ]);
    expect(result.current.bgColors).toEqual([
      'resolved---color-cat-1',
      'resolved---color-cat-2',
      'resolved---color-cat-3',
      'resolved---color-cat-4',
      'resolved---color-cat-5',
    ]);
    expect(result.current.defaultIconColor).toBe('resolved---color-cat-1-fg');
    expect(result.current.defaultBgColor).toBe('resolved---color-cat-1');
  });
});
