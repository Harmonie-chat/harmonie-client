import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useImageFileDraft } from './useImageFileDraft';

describe('useImageFileDraft', () => {
  it('creates and clears image draft previews', () => {
    const file = new File(['image'], 'image.png', { type: 'image/png' });
    vi.mocked(URL.createObjectURL).mockReturnValueOnce('blob:image');
    const { result, unmount } = renderHook(() => useImageFileDraft());

    act(() => {
      result.current.onFileChange({
        target: { files: [file] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.file).toBe(file);
    expect(result.current.previewUrl).toBe('blob:image');

    act(() => result.current.clear());

    expect(result.current.file).toBeNull();
    expect(result.current.previewUrl).toBeUndefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:image');

    unmount();
  });

  it('ignores empty file selections', () => {
    const { result } = renderHook(() => useImageFileDraft());

    act(() => {
      result.current.onFileChange({
        target: { files: [] },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.file).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
