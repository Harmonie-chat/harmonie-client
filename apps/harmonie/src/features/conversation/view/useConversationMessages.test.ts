import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import { useConversationMessages } from './useConversationMessages';

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

describe('useConversationMessages', () => {
  it('connects conversation typing and message hooks with conversation realtime events', () => {
    const connection = {} as never;

    const { result } = renderHook(() =>
      useConversationMessages({
        conversationId: 'conversation-1',
        connection,
        currentUserId: 'user-1',
      })
    );

    expect(result.current).toEqual({ messages: [] });
    expect(mocks.useTyping).toHaveBeenCalledWith({
      entityId: 'conversation-1',
      connection,
      currentUserId: 'user-1',
      eventName: REALTIME_SERVER_EVENTS.conversationUserTyping,
      entityIdField: 'conversationId',
    });
    expect(mocks.useMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        entityId: 'conversation-1',
        connection,
        currentUserId: 'user-1',
        ws: {
          created: REALTIME_SERVER_EVENTS.conversationMessageCreated,
          updated: REALTIME_SERVER_EVENTS.conversationMessageUpdated,
          deleted: REALTIME_SERVER_EVENTS.conversationMessageDeleted,
          entityIdField: 'conversationId',
        },
        typingUserIds: ['user-2'],
      })
    );
  });
});
