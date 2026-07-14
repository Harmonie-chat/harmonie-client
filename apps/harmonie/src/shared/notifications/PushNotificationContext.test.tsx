import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PushNotificationProvider } from './PushNotificationContext';
import type { PushNotificationStatus } from './webPush';

const mocks = vi.hoisted(() => ({
  dismissPrompt: vi.fn(),
  enable: vi.fn(),
  getInitialStatus: vi.fn<() => PushNotificationStatus>(),
  getPromptDismissed: vi.fn(),
  isAuthenticated: true,
  resync: vi.fn<() => Promise<PushNotificationStatus>>(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));

vi.mock('./webPush', () => ({
  disableWebPushNotificationsLocally: vi.fn(),
  enableWebPushNotifications: mocks.enable,
  getInitialPushNotificationStatus: mocks.getInitialStatus,
  getPushNotificationsPromptDismissed: mocks.getPromptDismissed,
  resyncWebPushNotifications: mocks.resync,
  setPushNotificationsPromptDismissed: mocks.dismissPrompt,
}));

describe('PushNotificationProvider', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    mocks.dismissPrompt.mockReset();
    mocks.enable.mockReset();
    mocks.getInitialStatus.mockReset();
    mocks.getPromptDismissed.mockReset();
    mocks.resync.mockReset();
    mocks.isAuthenticated = true;
    mocks.getInitialStatus.mockReturnValue('prompt');
    mocks.getPromptDismissed.mockReturnValue(false);
    mocks.resync.mockResolvedValue('prompt');
    mocks.enable.mockResolvedValue('enabled');
  });

  it('shows and dismisses the soft prompt for authenticated users', () => {
    render(
      <PushNotificationProvider>
        <div>app</div>
      </PushNotificationProvider>
    );

    expect(screen.getByText('notifications.push.promptTitle')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'notifications.push.dismiss' }));

    expect(mocks.dismissPrompt).toHaveBeenCalledWith(true);
    expect(screen.queryByText('notifications.push.promptTitle')).not.toBeInTheDocument();
  });

  it('enables push notifications from the soft prompt', async () => {
    render(
      <PushNotificationProvider>
        <div>app</div>
      </PushNotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'notifications.push.enable' }));

    await waitFor(() => expect(mocks.enable).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.queryByText('notifications.push.promptTitle')).not.toBeInTheDocument()
    );
  });

  it('keeps the soft prompt open with feedback when setup fails', async () => {
    mocks.enable.mockRejectedValueOnce(new Error('setup failed'));

    render(
      <PushNotificationProvider>
        <div>app</div>
      </PushNotificationProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'notifications.push.enable' }));

    expect(await screen.findByText('notifications.push.error')).toBeInTheDocument();
    expect(screen.getByText('notifications.push.promptTitle')).toBeInTheDocument();
  });
});
