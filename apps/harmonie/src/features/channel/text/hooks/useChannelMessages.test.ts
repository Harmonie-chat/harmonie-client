import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useChannelMessages } from './useChannelMessages';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';

const mocks = vi.hoisted(() => ({
  useTyping: vi.fn(() => ({ typingUserIds: ['user-2'] })),
  useMessages: vi.fn(() => ({ messages: [] })),
}));

vi.mock('@/shared/message/hooks/useTyping', () => ({
  useTyping: mocks.useTyping,
}));

vi.mock('@/shared/message/hooks/useMessages', () => ({
  useMessages: mocks.useMessages,
}));

describe('useChannelMessages', () => {
  it('connects channel typing and message hooks with channel realtime events', () => {
    const connection = {} as never;

    const { result } = renderHook(() =>
      useChannelMessages({
        channelId: 'channel-1',
        channelReady: true,
        connection,
        currentUserId: 'user-1',
      })
    );

    expect(result.current).toEqual({ messages: [] });
    expect(mocks.useTyping).toHaveBeenCalledWith({
      entityId: 'channel-1',
      ready: true,
      connection,
      currentUserId: 'user-1',
      eventName: REALTIME_SERVER_EVENTS.userTyping,
      entityIdField: 'channelId',
    });
    expect(mocks.useMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'channel-1',
        ready: true,
        connection,
        currentUserId: 'user-1',
        ws: {
          created: REALTIME_SERVER_EVENTS.messageCreated,
          updated: REALTIME_SERVER_EVENTS.messageUpdated,
          deleted: REALTIME_SERVER_EVENTS.messageDeleted,
          entityIdField: 'channelId',
        },
        typingUserIds: ['user-2'],
      })
    );
  });
});
