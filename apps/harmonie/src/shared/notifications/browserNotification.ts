import i18n from '@/i18n';
import { stripHtmlToText } from '@/shared/message/utils/messageHtml';

export const NOTIFICATION_NAVIGATE_EVENT = 'harmonie:notification-navigate';

export interface BrowserNotificationPayload {
  messageId: string;
  content: string | null;
  attachments: unknown[];
  targetUrl: string;
  senderName?: string;
  title?: string;
}

const buildNotificationBody = (payload: BrowserNotificationPayload): string => {
  const content = payload.content ? stripHtmlToText(payload.content) : '';
  if (content) return content;
  if (payload.attachments.length > 0) return i18n.t('notifications.browser.attachmentOnly');
  return i18n.t('notifications.browser.fallbackBody');
};

const buildNotificationTitle = (payload: BrowserNotificationPayload): string => {
  const baseTitle = payload.title ?? i18n.t('notifications.browser.title');
  if (!payload.senderName) return baseTitle;

  return i18n.t('notifications.browser.titleFrom', {
    title: baseTitle,
    senderName: payload.senderName,
  });
};

export const showBrowserNotification = (payload: BrowserNotificationPayload) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notification = new Notification(buildNotificationTitle(payload), {
    body: buildNotificationBody(payload),
    tag: `message-${payload.messageId}`,
    icon: '/harmonie.png',
  });

  notification.onclick = () => {
    notification.close();
    window.focus();
    window.dispatchEvent(
      new CustomEvent<string>(NOTIFICATION_NAVIGATE_EVENT, { detail: payload.targetUrl })
    );
  };

  window.setTimeout(() => notification.close(), 5000);
};
