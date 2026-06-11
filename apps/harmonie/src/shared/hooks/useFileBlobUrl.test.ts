import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const downloadFileBlobMock = vi.fn();

const importModule = async () => {
  vi.resetModules();
  vi.doMock('@/api/files', () => ({
    downloadFileBlob: downloadFileBlobMock,
  }));
  return import('./useFileBlobUrl');
};

describe('loadBlobUrl', () => {
  beforeEach(() => {
    vi.useRealTimers();
    downloadFileBlobMock.mockReset();
    vi.mocked(URL.createObjectURL).mockReset();
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:mock-url');
    vi.mocked(URL.revokeObjectURL).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('downloads a file blob and creates a cached object URL', async () => {
    downloadFileBlobMock.mockResolvedValueOnce(new Blob(['hello']));
    vi.mocked(URL.createObjectURL).mockReturnValueOnce('blob:file-1');
    const { loadBlobUrl } = await importModule();

    await expect(loadBlobUrl('file-1')).resolves.toBe('blob:file-1');
    await expect(loadBlobUrl('file-1')).resolves.toBe('blob:file-1');

    expect(downloadFileBlobMock).toHaveBeenCalledOnce();
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('deduplicates concurrent downloads for the same file', async () => {
    downloadFileBlobMock.mockResolvedValueOnce(new Blob(['hello']));
    vi.mocked(URL.createObjectURL).mockReturnValueOnce('blob:file-1');
    const { loadBlobUrl } = await importModule();

    await expect(Promise.all([loadBlobUrl('file-1'), loadBlobUrl('file-1')])).resolves.toEqual([
      'blob:file-1',
      'blob:file-1',
    ]);

    expect(downloadFileBlobMock).toHaveBeenCalledOnce();
  });

  it('returns undefined after a failed download', async () => {
    downloadFileBlobMock.mockRejectedValueOnce(new Error('network'));
    const { loadBlobUrl } = await importModule();

    await expect(loadBlobUrl('file-1')).resolves.toBeUndefined();
    await expect(loadBlobUrl('file-1')).resolves.toBeUndefined();

    expect(downloadFileBlobMock).toHaveBeenCalledOnce();
  });

  it('refreshes expired cache entries and failed-download blocks', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    downloadFileBlobMock
      .mockResolvedValueOnce(new Blob(['first']))
      .mockResolvedValueOnce(new Blob(['second']))
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(new Blob(['recovered']));
    vi.mocked(URL.createObjectURL)
      .mockReturnValueOnce('blob:file-1-old')
      .mockReturnValueOnce('blob:file-1-new')
      .mockReturnValueOnce('blob:file-2');
    const { loadBlobUrl } = await importModule();

    await expect(loadBlobUrl('file-1')).resolves.toBe('blob:file-1-old');

    vi.setSystemTime(new Date('2026-01-01T00:10:01.000Z'));
    await expect(loadBlobUrl('file-1')).resolves.toBe('blob:file-1-new');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:file-1-old');

    await expect(loadBlobUrl('file-2')).resolves.toBeUndefined();
    await expect(loadBlobUrl('file-2')).resolves.toBeUndefined();

    vi.setSystemTime(new Date('2026-01-01T00:10:32.000Z'));
    await expect(loadBlobUrl('file-2')).resolves.toBe('blob:file-2');

    expect(downloadFileBlobMock).toHaveBeenCalledTimes(4);
  });

  it('evicts least recently accessed cache entries when the cache limit is exceeded', async () => {
    downloadFileBlobMock.mockResolvedValue(new Blob(['hello']));
    vi.mocked(URL.createObjectURL).mockImplementation(
      () => `blob:file-${downloadFileBlobMock.mock.calls.length - 1}`
    );
    const { loadBlobUrl } = await importModule();

    for (let i = 0; i <= 200; i += 1) {
      await expect(loadBlobUrl(`file-${i}`)).resolves.toBe(`blob:file-${i}`);
    }

    expect(downloadFileBlobMock).toHaveBeenCalledTimes(201);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:file-0');
  });
});

describe('useFileBlobUrl', () => {
  beforeEach(() => {
    downloadFileBlobMock.mockReset();
    vi.mocked(URL.createObjectURL).mockReset();
    vi.mocked(URL.createObjectURL).mockReturnValue('blob:mock-url');
  });

  it('returns undefined until the blob URL has loaded', async () => {
    downloadFileBlobMock.mockResolvedValueOnce(new Blob(['hello']));
    vi.mocked(URL.createObjectURL).mockReturnValueOnce('blob:file-1');
    const { useFileBlobUrl } = await importModule();

    const { result } = renderHook(() => useFileBlobUrl('file-1'));

    expect(result.current).toBeUndefined();
    await waitFor(() => expect(result.current).toBe('blob:file-1'));
  });

  it('does not start a download without a file id', async () => {
    const { useFileBlobUrl } = await importModule();

    const { result } = renderHook(() => useFileBlobUrl(null));

    expect(result.current).toBeUndefined();
    expect(downloadFileBlobMock).not.toHaveBeenCalled();
  });
});
