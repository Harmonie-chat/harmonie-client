import type { HubConnection } from '@microsoft/signalr';
import { describe, expect, it, vi } from 'vitest';
import {
  sendAcceptConversationCall,
  sendDeclineConversationCall,
  sendStartConversationCall,
  subscribeConversationCallEvents,
} from './conversationCallRealtime';

type RealtimeHandler = (payload: unknown) => void;

const createConnection = () => {
  const handlers = new Map<string, RealtimeHandler>();
  const connection = {
    send: vi.fn<(_method: string, _conversationId: string) => Promise<void>>(() =>
      Promise.resolve()
    ),
    on: vi.fn((eventName: string, handler: RealtimeHandler) => {
      handlers.set(eventName, handler);
    }),
    off: vi.fn((eventName: string, handler: RealtimeHandler) => {
      if (handlers.get(eventName) === handler) {
        handlers.delete(eventName);
      }
    }),
  };

  return {
    connection: connection as unknown as HubConnection,
    handlers,
    send: connection.send,
    on: connection.on,
    off: connection.off,
  };
};

describe('conversationCallRealtime', () => {
  it('sends the first available realtime method and ignores missing connections', async () => {
    await sendStartConversationCall(null, 'conversation-1');

    const { connection, send } = createConnection();
    send.mockRejectedValueOnce(new Error('legacy method unavailable')).mockResolvedValueOnce();

    await sendStartConversationCall(connection, 'conversation-1');
    await sendAcceptConversationCall(connection, 'conversation-2');

    expect(send).toHaveBeenNthCalledWith(1, 'StartConversationCall', 'conversation-1');
    expect(send).toHaveBeenNthCalledWith(2, 'StartConversationVoiceCall', 'conversation-1');
    expect(send).toHaveBeenNthCalledWith(3, 'AcceptConversationCall', 'conversation-2');
  });

  it('warns when no realtime method succeeds', async () => {
    const { connection, send } = createConnection();
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = new Error('offline');
    send.mockRejectedValue(error);

    await sendDeclineConversationCall(connection, 'conversation-3');

    expect(send).toHaveBeenCalledWith('DeclineConversationCall', 'conversation-3');
    expect(send).toHaveBeenCalledWith('DeclineConversationVoiceCall', 'conversation-3');
    expect(consoleWarn).toHaveBeenCalledWith(
      '[ConversationCall] No SignalR call method succeeded.',
      expect.objectContaining({
        conversationId: 'conversation-3',
        error,
        methods: ['DeclineConversationCall', 'DeclineConversationVoiceCall'],
      })
    );
  });

  it('subscribes to call events, normalizes payload variants, and unsubscribes', () => {
    const { connection, handlers, on, off } = createConnection();
    const onIncoming = vi.fn();
    const onDismissed = vi.fn();
    const onEnded = vi.fn();

    const unsubscribe = subscribeConversationCallEvents(connection, {
      onIncoming,
      onDismissed,
      onEnded,
    });

    handlers.get('ConversationVoiceCallIncoming')?.({
      ConversationId: 'conversation-1',
      CallerId: 'caller-1',
      Username: 'alice',
      DisplayName: 'Alice',
      ConversationName: 'Design',
      ConversationType: 'Group',
      StartedAtUtc: '2026-01-01T00:00:00.000Z',
    });
    handlers.get('ConversationCallIncoming')?.({ conversationName: 'missing id' });
    handlers.get('ConversationCallAccepted')?.({ conversationId: 'conversation-1' });
    handlers.get('ConversationVoiceCallEnded')?.({ ConversationId: 'conversation-1' });
    handlers.get('IncomingConversationCall')?.(null);
    handlers.get('ConversationCallDeclined')?.({});

    expect(on).toHaveBeenCalledTimes(11);
    expect(onIncoming).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      callerUserId: 'caller-1',
      callerUsername: 'alice',
      callerDisplayName: 'Alice',
      conversationName: 'Design',
      conversationType: 'Group',
      startedAtUtc: '2026-01-01T00:00:00.000Z',
    });
    expect(onIncoming).toHaveBeenCalledTimes(1);
    expect(onDismissed).toHaveBeenCalledWith({ conversationId: 'conversation-1' });
    expect(onDismissed).toHaveBeenCalledTimes(1);
    expect(onEnded).toHaveBeenCalledWith({ conversationId: 'conversation-1' });

    unsubscribe();

    expect(off).toHaveBeenCalledTimes(11);
    expect(handlers.size).toBe(0);
  });
});
