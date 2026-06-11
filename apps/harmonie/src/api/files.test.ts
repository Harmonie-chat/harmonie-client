import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('./client', () => ({
  apiFetch: apiFetchMock,
}));

describe('files api', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('downloads file blobs with an encoded file id', async () => {
    const blob = new Blob(['content']);
    apiFetchMock.mockResolvedValueOnce(new Response(blob));
    const { downloadFileBlob } = await import('./files');

    await expect(downloadFileBlob('file / 1')).resolves.toBeInstanceOf(Blob);
    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/files/file%20%2F%201'
    );
  });

  it('throws download errors with the response status', async () => {
    apiFetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    const { downloadFileBlob } = await import('./files');

    await expect(downloadFileBlob('missing')).rejects.toThrow('Failed to download file (404)');
  });

  it('deletes files', async () => {
    apiFetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { deleteFile } = await import('./files');

    await deleteFile('file / 1');

    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/files/file%20%2F%201',
      {
        method: 'DELETE',
      }
    );
  });

  it('uploads files as form data and parses the response', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ fileId: 'file-1' }));
    const { uploadFile } = await import('./files');

    await expect(uploadFile(new File(['content'], 'file.txt'))).resolves.toEqual({
      fileId: 'file-1',
    });

    const init = apiFetchMock.mock.calls[0][1] as RequestInit;
    expect(apiFetchMock.mock.calls[0][0]).toBe(
      'https://harmonie-api.arastorn.ovh/api/files/uploads'
    );
    expect(init.method).toBe('POST');
    expect(init.body).toBeInstanceOf(FormData);
  });
});
