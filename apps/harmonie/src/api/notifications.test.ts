import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('./client', () => ({
  apiFetch: apiFetchMock,
}));

describe('notifications api', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('loads the web push public key', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ publicKey: 'vapid-key' }));
    const { getWebPushPublicKey } = await import('./notifications');

    await expect(getWebPushPublicKey()).resolves.toEqual({ publicKey: 'vapid-key' });
    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://localhost:5000/api/notifications/web-push-public-key'
    );
  });

  it('registers a serialized web push subscription', async () => {
    apiFetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { registerWebPushSubscription } = await import('./notifications');

    await expect(
      registerWebPushSubscription({
        endpoint: 'https://push.example/subscription',
        expirationTime: null,
        keys: {
          p256dh: 'p256dh-key',
          auth: 'auth-key',
        },
      })
    ).resolves.toBeUndefined();

    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://localhost:5000/api/notifications/push-subscriptions',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: 'https://push.example/subscription',
          expirationTime: null,
          keys: {
            p256dh: 'p256dh-key',
            auth: 'auth-key',
          },
        }),
      }
    );
  });

  it('throws parsed API errors', async () => {
    apiFetchMock.mockResolvedValueOnce(
      Response.json({ code: 'NOTIFICATION_WEB_PUSH_NOT_CONFIGURED' }, { status: 503 })
    );
    const { getWebPushPublicKey } = await import('./notifications');

    await expect(getWebPushPublicKey()).rejects.toEqual({
      code: 'NOTIFICATION_WEB_PUSH_NOT_CONFIGURED',
    });
  });
});
