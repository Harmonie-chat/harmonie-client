import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNotificationNavigationSync } from './useNotificationNavigationSync';
import { NOTIFICATION_NAVIGATE_EVENT } from '@/shared/notifications/browserNotification';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('useNotificationNavigationSync', () => {
  it('navigates to notification event detail paths', () => {
    renderHook(() => useNotificationNavigationSync());

    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_NAVIGATE_EVENT, {
        detail: '/guilds/guild-1/channels/channel-1',
      })
    );

    expect(navigateMock).toHaveBeenCalledWith('/guilds/guild-1/channels/channel-1');
  });

  it('ignores notification events without a path', () => {
    renderHook(() => useNotificationNavigationSync());

    window.dispatchEvent(new CustomEvent(NOTIFICATION_NAVIGATE_EVENT));

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('removes the event listener on unmount', () => {
    const { unmount } = renderHook(() => useNotificationNavigationSync());

    unmount();
    window.dispatchEvent(new CustomEvent(NOTIFICATION_NAVIGATE_EVENT, { detail: '/auth' }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
