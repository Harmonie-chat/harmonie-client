import { apiFetch } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface WebPushPublicKeyResponse {
  publicKey: string;
}

export interface WebPushSubscriptionRequest {
  endpoint: string;
  expirationTime: number | string | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const getWebPushPublicKey = (): Promise<WebPushPublicKeyResponse> =>
  apiFetch(`${API_BASE}/notifications/web-push-public-key`).then(async (res) => {
    if (!res.ok) throw await res.json();
    return res.json();
  });

export const registerWebPushSubscription = (subscription: PushSubscriptionJSON): Promise<void> => {
  const body: WebPushSubscriptionRequest = {
    endpoint: subscription.endpoint ?? '',
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys?.p256dh ?? '',
      auth: subscription.keys?.auth ?? '',
    },
  };

  return apiFetch(`${API_BASE}/notifications/push-subscriptions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => {
    if (!res.ok) throw await res.json();
  });
};
