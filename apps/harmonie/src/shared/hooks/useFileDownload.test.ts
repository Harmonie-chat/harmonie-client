import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFileDownload } from './useFileDownload';

const { loadBlobUrlMock } = vi.hoisted(() => ({
  loadBlobUrlMock: vi.fn(),
}));

vi.mock('./useFileBlobUrl', () => ({
  loadBlobUrl: loadBlobUrlMock,
}));

describe('useFileDownload', () => {
  beforeEach(() => {
    loadBlobUrlMock.mockReset();
  });

  it('creates an anchor download from a loaded blob URL', async () => {
    loadBlobUrlMock.mockResolvedValueOnce('blob:file-1');
    const click = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = click;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.download('file-1', 'report.pdf');
    });

    expect(loadBlobUrlMock).toHaveBeenCalledWith('file-1');
    expect(anchor.href).toBe('blob:file-1');
    expect(anchor.download).toBe('report.pdf');
    expect(click).toHaveBeenCalledOnce();
    expect(result.current.downloading).toBe(false);
  });

  it('does not click a download link when no blob URL is returned', async () => {
    loadBlobUrlMock.mockResolvedValueOnce(undefined);
    const click = vi.fn();
    const anchor = document.createElement('a');
    anchor.click = click;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const { result } = renderHook(() => useFileDownload());

    await act(async () => {
      await result.current.download('file-1', 'report.pdf');
    });

    expect(click).not.toHaveBeenCalled();
  });

  it('ignores duplicate download calls while a download is already running', async () => {
    let resolveDownload: (url: string) => void = () => undefined;
    loadBlobUrlMock.mockReturnValueOnce(
      new Promise<string>((resolve) => {
        resolveDownload = resolve;
      })
    );
    const anchor = document.createElement('a');
    anchor.click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const { result } = renderHook(() => useFileDownload());

    act(() => {
      void result.current.download('file-1', 'report.pdf');
    });
    await waitFor(() => expect(result.current.downloading).toBe(true));

    await act(async () => {
      await result.current.download('file-2', 'ignored.pdf');
      resolveDownload('blob:file-1');
    });

    await waitFor(() => expect(result.current.downloading).toBe(false));
    expect(loadBlobUrlMock).toHaveBeenCalledOnce();
  });

  it('resets the downloading state and rethrows download failures', async () => {
    const error = new Error('network');
    loadBlobUrlMock.mockRejectedValueOnce(error);
    const { result } = renderHook(() => useFileDownload());

    await expect(
      act(async () => {
        await result.current.download('file-1', 'report.pdf');
      })
    ).rejects.toThrow(error);

    expect(result.current.downloading).toBe(false);
  });
});
