import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOTIFICATION_NAVIGATE_EVENT, showBrowserNotification } from './browserNotification';

vi.mock('@/i18n', () => ({
  default: {
    t: (key: string, values?: Record<string, string>) => {
      const translations: Record<string, string> = {
        'notifications.browser.attachmentOnly': 'New message with attachment.',
        'notifications.browser.fallbackBody': 'Harmonie - New message.',
        'notifications.browser.title': 'New message',
      };

      if (key === 'notifications.browser.titleFrom') {
        return `${values?.senderName} - ${values?.title}`;
      }

      return translations[key] ?? key;
    },
  },
}));

interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
}

class MockNotification {
  static permission: NotificationPermission = 'default';
  static instances: MockNotification[] = [];

  onclick: (() => void) | null = null;
  close = vi.fn();

  constructor(
    public title: string,
    public options?: NotificationOptions
  ) {
    MockNotification.instances.push(this);
  }
}

describe('browserNotification', () => {
  beforeEach(() => {
    MockNotification.permission = 'default';
    MockNotification.instances = [];
    vi.stubGlobal('Notification', MockNotification);
  });

  it('shows a browser notification when permission is granted', () => {
    MockNotification.permission = 'granted';

    showBrowserNotification({
      messageId: 'message-1',
      content: '<p>Hello&nbsp;there</p>',
      attachments: [],
      targetUrl: '/channels/general',
      senderName: 'Ava',
      title: 'General',
    });

    expect(MockNotification.instances).toHaveLength(1);
    expect(MockNotification.instances[0].title).toBe('Ava - General');
    expect(MockNotification.instances[0].options).toMatchObject({
      body: 'Hello there',
      icon: '/harmonie.png',
      tag: 'message-message-1',
    });
  });

  it('dispatches the navigation event when the notification is clicked', () => {
    vi.useFakeTimers();
    MockNotification.permission = 'granted';
    const focus = vi.spyOn(window, 'focus').mockImplementation(() => {});
    const onNavigate = vi.fn();
    window.addEventListener(NOTIFICATION_NAVIGATE_EVENT, onNavigate);

    showBrowserNotification({
      messageId: 'message-1',
      content: null,
      attachments: [{}],
      targetUrl: '/channels/general',
    });
    MockNotification.instances[0].onclick?.();

    expect(MockNotification.instances[0].close).toHaveBeenCalledOnce();
    expect(focus).toHaveBeenCalledOnce();
    expect(onNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ detail: '/channels/general' })
    );

    window.removeEventListener(NOTIFICATION_NAVIGATE_EVENT, onNavigate);
    vi.useRealTimers();
  });
});
