import { getWebPushPublicKey, registerWebPushSubscription } from '@/api/notifications';

const PUSH_NOTIFICATIONS_ENABLED_KEY = 'harmonie-push-notifications-enabled';
const PUSH_NOTIFICATIONS_PROMPT_DISMISSED_KEY = 'harmonie-push-notifications-prompt-dismissed';

export type PushNotificationStatus =
  | 'unsupported'
  | 'disabled'
  | 'prompt'
  | 'enabled'
  | 'denied'
  | 'syncing'
  | 'error';

export const isWebPushSupported = () =>
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

const getPushNotificationsEnabledPreference = () =>
  localStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY) === 'true';

const setPushNotificationsEnabledPreference = (enabled: boolean) => {
  if (enabled) {
    localStorage.setItem(PUSH_NOTIFICATIONS_ENABLED_KEY, 'true');
    return;
  }

  localStorage.removeItem(PUSH_NOTIFICATIONS_ENABLED_KEY);
};

export const getPushNotificationsPromptDismissed = () =>
  localStorage.getItem(PUSH_NOTIFICATIONS_PROMPT_DISMISSED_KEY) === 'true';

export const setPushNotificationsPromptDismissed = (dismissed: boolean) => {
  if (dismissed) {
    localStorage.setItem(PUSH_NOTIFICATIONS_PROMPT_DISMISSED_KEY, 'true');
    return;
  }

  localStorage.removeItem(PUSH_NOTIFICATIONS_PROMPT_DISMISSED_KEY);
};

export const getInitialPushNotificationStatus = (): PushNotificationStatus => {
  if (!isWebPushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  if (getPushNotificationsEnabledPreference()) return 'enabled';
  if (Notification.permission === 'default') return 'prompt';
  return 'disabled';
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

const ensureServiceWorkerRegistration = async () => {
  const existingRegistration = await navigator.serviceWorker.getRegistration('/');
  if (existingRegistration) return existingRegistration;
  return navigator.serviceWorker.register('/sw.js');
};

const getCurrentPushSubscription = async () => {
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) return null;
  return registration.pushManager.getSubscription();
};

export const enableWebPushNotifications = async () => {
  if (!isWebPushSupported()) return 'unsupported' as const;

  const permission =
    Notification.permission === 'default'
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission === 'denied') return 'denied' as const;
  if (permission !== 'granted') return 'disabled' as const;

  const [{ publicKey }, registration] = await Promise.all([
    getWebPushPublicKey(),
    ensureServiceWorkerRegistration(),
  ]);
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  await registerWebPushSubscription(subscription.toJSON());
  setPushNotificationsEnabledPreference(true);
  setPushNotificationsPromptDismissed(false);

  return 'enabled' as const;
};

export const resyncWebPushNotifications = async () => {
  if (!getPushNotificationsEnabledPreference()) return getInitialPushNotificationStatus();
  if (!isWebPushSupported()) return 'unsupported' as const;
  if (Notification.permission !== 'granted') return getInitialPushNotificationStatus();
  return enableWebPushNotifications();
};

export const disableWebPushNotificationsLocally = async () => {
  const subscription = await getCurrentPushSubscription();
  await subscription?.unsubscribe();
  setPushNotificationsEnabledPreference(false);
  return getInitialPushNotificationStatus();
};
