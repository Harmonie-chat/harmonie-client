import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import { UserProfileRealtimeSync } from './UserProfileRealtimeSync';
import type { UserProfileUpdatedEvent } from '@/types/user';

type Handler = (event: UserProfileUpdatedEvent) => void;

const mocks = vi.hoisted(() => ({
  handlers: new Map<string, Handler>(),
  connection: {
    on: vi.fn((eventName: string, handler: Handler) => mocks.handlers.set(eventName, handler)),
    off: vi.fn((eventName: string, handler: Handler) => {
      if (mocks.handlers.get(eventName) === handler) mocks.handlers.delete(eventName);
    }),
  },
  user: {
    userId: 'user-1',
    username: 'ada',
    displayName: 'Ada',
    avatarFileId: null,
    avatar: {},
    theme: 'default',
    language: 'fr',
  },
  updateUser: vi.fn(),
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

vi.mock('./UserContext', () => ({
  useUser: () => ({ user: mocks.user, updateUser: mocks.updateUser }),
}));

const event = (userId = 'user-1'): UserProfileUpdatedEvent => ({
  userId,
  username: 'ada-next',
  displayName: 'Ada Next',
  avatarFileId: 'avatar-1',
  avatarColor: '#111111',
  avatarIcon: 'User',
  avatarBg: '#ffffff',
});

describe('UserProfileRealtimeSync', () => {
  beforeEach(() => {
    mocks.handlers.clear();
    mocks.connection.on.mockClear();
    mocks.connection.off.mockClear();
    mocks.updateUser.mockReset();
  });

  it('updates the current user from profile realtime events', () => {
    render(<UserProfileRealtimeSync />);

    mocks.handlers.get(REALTIME_SERVER_EVENTS.userProfileUpdated)?.(event());

    expect(mocks.updateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        username: 'ada-next',
        displayName: 'Ada Next',
        avatarFileId: 'avatar-1',
      })
    );
  });

  it('ignores profile updates for other users and unsubscribes on unmount', () => {
    const { unmount } = render(<UserProfileRealtimeSync />);

    mocks.handlers.get(REALTIME_SERVER_EVENTS.userProfileUpdated)?.(event('user-2'));
    unmount();

    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.connection.off).toHaveBeenCalled();
  });
});
