import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  getWebPushPublicKey: vi.fn(),
  registerWebPushSubscription: vi.fn(),
}));

vi.mock('@/api/notifications', () => ({
  getWebPushPublicKey: apiMocks.getWebPushPublicKey,
  registerWebPushSubscription: apiMocks.registerWebPushSubscription,
}));

const setNotificationPermission = (
  permission: NotificationPermission,
  requestPermission = vi.fn<() => Promise<NotificationPermission>>()
) => {
  Object.defineProperty(window, 'Notification', {
    configurable: true,
    value: {
      permission,
      requestPermission,
    },
  });
};

const setWebPushSupport = (registration: ServiceWorkerRegistration) => {
  Object.defineProperty(window, 'isSecureContext', {
    configurable: true,
    value: true,
  });
  Object.defineProperty(window, 'PushManager', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: vi.fn().mockResolvedValue(registration),
      register: vi.fn().mockResolvedValue(registration),
    },
  });
};

describe('webPush', () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
  });

  it('reports unsupported browsers', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    const { getInitialPushNotificationStatus, isWebPushSupported } = await import('./webPush');

    expect(isWebPushSupported()).toBe(false);
    expect(getInitialPushNotificationStatus()).toBe('unsupported');
  });

  it('reports denied browser permissions', async () => {
    setNotificationPermission('denied');
    setWebPushSupport({} as ServiceWorkerRegistration);
    const { getInitialPushNotificationStatus } = await import('./webPush');

    expect(getInitialPushNotificationStatus()).toBe('denied');
  });

  it('persists and clears soft-prompt dismissal', async () => {
    const { getPushNotificationsPromptDismissed, setPushNotificationsPromptDismissed } =
      await import('./webPush');

    expect(getPushNotificationsPromptDismissed()).toBe(false);

    setPushNotificationsPromptDismissed(true);
    expect(getPushNotificationsPromptDismissed()).toBe(true);

    setPushNotificationsPromptDismissed(false);
    expect(getPushNotificationsPromptDismissed()).toBe(false);
  });

  it('reports prompt, enabled, and disabled states from the local preference', async () => {
    setNotificationPermission('default');
    setWebPushSupport({} as ServiceWorkerRegistration);
    const { getInitialPushNotificationStatus } = await import('./webPush');

    expect(getInitialPushNotificationStatus()).toBe('prompt');

    setNotificationPermission('granted');
    expect(getInitialPushNotificationStatus()).toBe('disabled');

    localStorage.setItem('harmonie-push-notifications-enabled', 'true');

    expect(getInitialPushNotificationStatus()).toBe('enabled');
  });

  it('handles unsupported, denied, and dismissed permission outcomes', async () => {
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    const { enableWebPushNotifications } = await import('./webPush');

    await expect(enableWebPushNotifications()).resolves.toBe('unsupported');

    setNotificationPermission('denied');
    setWebPushSupport({} as ServiceWorkerRegistration);
    await expect(enableWebPushNotifications()).resolves.toBe('denied');

    setNotificationPermission('default', vi.fn().mockResolvedValue('default'));
    await expect(enableWebPushNotifications()).resolves.toBe('disabled');
    expect(apiMocks.getWebPushPublicKey).not.toHaveBeenCalled();
  });

  it('subscribes and registers the device when enabled', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted');
    const subscriptionJson = {
      endpoint: 'https://push.example/subscription',
      expirationTime: null,
      keys: {
        p256dh: 'p256dh-key',
        auth: 'auth-key',
      },
    };
    const subscription = {
      toJSON: vi.fn(() => subscriptionJson),
    };
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(null),
        subscribe: vi.fn().mockResolvedValue(subscription),
      },
    } as unknown as ServiceWorkerRegistration;
    setNotificationPermission('default', requestPermission);
    setWebPushSupport(registration);
    vi.mocked(navigator.serviceWorker.getRegistration).mockResolvedValue(undefined);
    apiMocks.getWebPushPublicKey.mockResolvedValue({ publicKey: 'AQAB' });
    apiMocks.registerWebPushSubscription.mockResolvedValue(undefined);
    const { enableWebPushNotifications } = await import('./webPush');

    await expect(enableWebPushNotifications()).resolves.toBe('enabled');

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(registration.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: expect.any(Uint8Array),
    });
    expect(apiMocks.registerWebPushSubscription).toHaveBeenCalledWith(subscriptionJson);
    expect(localStorage.getItem('harmonie-push-notifications-enabled')).toBe('true');
  });

  it('reuses an existing service worker registration and subscription', async () => {
    const subscriptionJson = {
      endpoint: 'https://push.example/existing-subscription',
      expirationTime: null,
      keys: { p256dh: 'existing-p256dh', auth: 'existing-auth' },
    };
    const subscription = { toJSON: vi.fn(() => subscriptionJson) };
    const subscribe = vi.fn();
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(subscription),
        subscribe,
      },
    } as unknown as ServiceWorkerRegistration;
    setNotificationPermission('granted');
    setWebPushSupport(registration);
    apiMocks.getWebPushPublicKey.mockResolvedValue({ publicKey: 'AQAB' });
    apiMocks.registerWebPushSubscription.mockResolvedValue(undefined);
    const { enableWebPushNotifications } = await import('./webPush');

    await expect(enableWebPushNotifications()).resolves.toBe('enabled');

    expect(navigator.serviceWorker.register).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
    expect(apiMocks.registerWebPushSubscription).toHaveBeenCalledWith(subscriptionJson);
  });

  it('resyncs only an enabled and permitted preference', async () => {
    localStorage.setItem('harmonie-push-notifications-enabled', 'true');
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: false,
    });
    const { resyncWebPushNotifications } = await import('./webPush');

    await expect(resyncWebPushNotifications()).resolves.toBe('unsupported');

    setNotificationPermission('denied');
    setWebPushSupport({} as ServiceWorkerRegistration);

    await expect(resyncWebPushNotifications()).resolves.toBe('denied');

    localStorage.removeItem('harmonie-push-notifications-enabled');
    setNotificationPermission('granted');

    await expect(resyncWebPushNotifications()).resolves.toBe('disabled');
    expect(apiMocks.getWebPushPublicKey).not.toHaveBeenCalled();
  });

  it('restores a previously enabled subscription during resync', async () => {
    const subscription = {
      toJSON: vi.fn(() => ({
        endpoint: 'https://push.example/resynced-subscription',
        expirationTime: null,
        keys: { p256dh: 'resynced-p256dh', auth: 'resynced-auth' },
      })),
    };
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue(subscription),
        subscribe: vi.fn(),
      },
    } as unknown as ServiceWorkerRegistration;
    localStorage.setItem('harmonie-push-notifications-enabled', 'true');
    setNotificationPermission('granted');
    setWebPushSupport(registration);
    apiMocks.getWebPushPublicKey.mockResolvedValue({ publicKey: 'AQAB' });
    apiMocks.registerWebPushSubscription.mockResolvedValue(undefined);
    const { resyncWebPushNotifications } = await import('./webPush');

    await expect(resyncWebPushNotifications()).resolves.toBe('enabled');

    expect(apiMocks.registerWebPushSubscription).toHaveBeenCalledWith(subscription.toJSON());
  });

  it('unsubscribes locally when disabled', async () => {
    const unsubscribe = vi.fn().mockResolvedValue(true);
    const registration = {
      pushManager: {
        getSubscription: vi.fn().mockResolvedValue({ unsubscribe }),
      },
    } as unknown as ServiceWorkerRegistration;
    setNotificationPermission('granted');
    setWebPushSupport(registration);
    localStorage.setItem('harmonie-push-notifications-enabled', 'true');
    const { disableWebPushNotificationsLocally } = await import('./webPush');

    await expect(disableWebPushNotificationsLocally()).resolves.toBe('disabled');

    expect(unsubscribe).toHaveBeenCalledOnce();
    expect(localStorage.getItem('harmonie-push-notifications-enabled')).toBeNull();
  });
});
