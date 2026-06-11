import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTyping } from './useTyping';

type Handler = (event: Record<string, string>) => void;

const createConnection = () => {
  const handlers = new Map<string, Handler>();

  return {
    handlers,
    connection: {
      on: vi.fn((eventName: string, handler: Handler) => handlers.set(eventName, handler)),
      off: vi.fn((eventName: string, handler: Handler) => {
        if (handlers.get(eventName) === handler) handlers.delete(eventName);
      }),
    },
  };
};

describe('useTyping', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to typing events and expires typing users', () => {
    const { connection, handlers } = createConnection();
    const { result } = renderHook(() =>
      useTyping({
        entityId: 'channel-1',
        connection: connection as never,
        currentUserId: 'user-1',
        eventName: 'UserTyping',
        entityIdField: 'channelId',
      })
    );

    act(() => {
      handlers.get('UserTyping')?.({ channelId: 'channel-1', userId: 'user-2' });
      handlers.get('UserTyping')?.({ channelId: 'channel-2', userId: 'user-3' });
      handlers.get('UserTyping')?.({ channelId: 'channel-1', userId: 'user-1' });
    });

    expect(result.current.typingUserIds).toEqual(['user-2']);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.typingUserIds).toEqual([]);
  });

  it('keeps typing users unique and refreshes their timeout', () => {
    const { connection, handlers } = createConnection();
    const { result } = renderHook(() =>
      useTyping({
        entityId: 'channel-1',
        connection: connection as never,
        eventName: 'UserTyping',
        entityIdField: 'channelId',
      })
    );

    act(() => {
      handlers.get('UserTyping')?.({ channelId: 'channel-1', userId: 'user-2' });
      vi.advanceTimersByTime(3000);
      handlers.get('UserTyping')?.({ channelId: 'channel-1', userId: 'user-2' });
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.typingUserIds).toEqual(['user-2']);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.typingUserIds).toEqual([]);
  });

  it('clears typing users when the entity changes and unregisters handlers', () => {
    const { connection, handlers } = createConnection();
    const { result, rerender, unmount } = renderHook(
      ({ entityId }) =>
        useTyping({
          entityId,
          connection: connection as never,
          eventName: 'UserTyping',
          entityIdField: 'channelId',
        }),
      { initialProps: { entityId: 'channel-1' } }
    );

    act(() => {
      handlers.get('UserTyping')?.({ channelId: 'channel-1', userId: 'user-2' });
    });
    expect(result.current.typingUserIds).toEqual(['user-2']);

    rerender({ entityId: 'channel-2' });

    expect(result.current.typingUserIds).toEqual([]);

    unmount();

    expect(connection.off).toHaveBeenCalled();
  });

  it('does not subscribe while connection, entity, or readiness is missing', () => {
    const { connection } = createConnection();
    renderHook(() =>
      useTyping({
        entityId: 'channel-1',
        ready: false,
        connection: connection as never,
        eventName: 'UserTyping',
        entityIdField: 'channelId',
      })
    );

    expect(connection.on).not.toHaveBeenCalled();
  });
});
