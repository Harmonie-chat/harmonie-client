import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('./client', () => ({
  apiFetch: apiFetchMock,
}));

describe('users api', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('loads the current profile', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ userId: 'me' }));
    const { getMe } = await import('./users');

    await expect(getMe()).resolves.toEqual({ userId: 'me' });
    expect(apiFetchMock).toHaveBeenCalledWith('https://harmonie-api.arastorn.ovh/api/users/me');
  });

  it('patches the current profile', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ displayName: 'Laurine' }));
    const { patchMe } = await import('./users');

    await patchMe({ displayName: 'Laurine' });

    expect(apiFetchMock).toHaveBeenCalledWith('https://harmonie-api.arastorn.ovh/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'Laurine' }),
    });
  });

  it('uploads and removes avatar images', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ avatarFileId: 'avatar-1' }))
      .mockResolvedValueOnce(Response.json({}));
    const { removeAvatarImage, uploadAvatarImage } = await import('./users');

    await expect(uploadAvatarImage(new File(['avatar'], 'avatar.png'))).resolves.toEqual({
      avatarFileId: 'avatar-1',
    });
    await expect(removeAvatarImage()).resolves.toBeUndefined();

    const uploadInit = apiFetchMock.mock.calls[0][1] as RequestInit;
    expect(apiFetchMock.mock.calls[0][0]).toBe(
      'https://harmonie-api.arastorn.ovh/api/users/me/avatar'
    );
    expect(uploadInit.method).toBe('PUT');
    expect(uploadInit.body).toBeInstanceOf(FormData);
    expect(apiFetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ avatarFileId: null }),
    });
  });

  it('throws parsed API errors', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ code: 'BAD_PROFILE' }, { status: 400 }));
    const { getMe } = await import('./users');

    await expect(getMe()).rejects.toEqual({ code: 'BAD_PROFILE' });
  });
});
