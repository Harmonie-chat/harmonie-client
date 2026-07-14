import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsSection } from './NotificationsSection';
import type { PushNotificationStatus } from '@/shared/notifications/webPush';

const mocks = vi.hoisted(() => ({
  disable: vi.fn(),
  enable: vi.fn(),
  status: 'prompt' as PushNotificationStatus,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/shared/notifications/PushNotificationContext', () => ({
  usePushNotifications: () => ({
    disable: mocks.disable,
    enable: mocks.enable,
    status: mocks.status,
  }),
}));

describe('NotificationsSection', () => {
  beforeEach(() => {
    mocks.disable.mockReset();
    mocks.enable.mockReset();
    mocks.enable.mockResolvedValue(undefined);
    mocks.disable.mockResolvedValue(undefined);
    mocks.status = 'prompt';
  });

  it('enables push notifications from the prompt state', () => {
    render(<NotificationsSection />);

    expect(screen.getByText('notifications.push.disabledDescription')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'notifications.push.enable' }));

    expect(mocks.enable).toHaveBeenCalledOnce();
    expect(mocks.disable).not.toHaveBeenCalled();
  });

  it('disables push notifications from the enabled state', () => {
    mocks.status = 'enabled';

    render(<NotificationsSection />);

    expect(screen.getByText('notifications.push.enabledDescription')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'notifications.push.disable' }));

    expect(mocks.disable).toHaveBeenCalledOnce();
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it('disables the action when permission is denied', () => {
    mocks.status = 'denied';

    render(<NotificationsSection />);

    expect(screen.getByText('notifications.push.denied')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'notifications.push.enable' })).toBeDisabled();
  });
});
