import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMessages, type UseMessagesApi } from './useMessages';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { Message, MessageList } from '@/types/channel';

type Handler = (event: Record<string, unknown>) => void;

const message = (input: Partial<Message> = {}): Message => ({
  messageId: 'message-1',
  authorUserId: 'user-2',
  content: 'Hello',
  mentionedUserIds: [],
  attachments: [],
  reactions: [],
  linkPreviews: null,
  isPinned: false,
  replyTo: null,
  createdAtUtc: '2024-01-01T00:00:00.000Z',
  updatedAtUtc: null,
  ...input,
});

const messageList = (input: Partial<MessageList> = {}): MessageList => ({
  channelId: 'channel-1',
  items: [message()],
  nextCursor: null,
  lastReadMessageId: null,
  ...input,
});

const createApi = (): UseMessagesApi => ({
  fetchMessages: vi.fn(),
  ackMessage: vi.fn().mockResolvedValue(undefined),
  updateMessage: vi.fn(),
  deleteMessage: vi.fn().mockResolvedValue(undefined),
  deleteAttachment: vi.fn().mockResolvedValue(undefined),
  pinMessage: vi.fn().mockResolvedValue(undefined),
  unpinMessage: vi.fn().mockResolvedValue(undefined),
  addReaction: vi.fn().mockResolvedValue(undefined),
  removeReaction: vi.fn().mockResolvedValue(undefined),
});

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

const renderUseMessages = ({
  api = createApi(),
  connection = null,
  entityId = 'channel-1',
  ready = true,
  currentUserId = 'user-1',
  typingUserIds = [],
}: Partial<{
  api: UseMessagesApi;
  connection: unknown;
  entityId?: string;
  ready: boolean;
  currentUserId?: string;
  typingUserIds: string[];
}> = {}) =>
  renderHook(() =>
    useMessages({
      entityId,
      ready,
      connection: connection as never,
      currentUserId,
      api,
      ws: {
        created: 'MessageCreated',
        updated: 'MessageUpdated',
        deleted: 'MessageDeleted',
        entityIdField: 'channelId',
      },
      typingUserIds,
    })
  );

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches, sorts, marks the last message as read, and exposes visible state', async () => {
    const api = createApi();
    vi.mocked(api.fetchMessages).mockResolvedValueOnce(
      messageList({
        items: [
          message({ messageId: 'message-2', createdAtUtc: '2024-01-02T00:00:00.000Z' }),
          message({ messageId: 'message-1', createdAtUtc: '2024-01-01T00:00:00.000Z' }),
        ],
        lastReadMessageId: 'message-1',
        nextCursor: 'cursor-1',
      })
    );

    const { result } = renderUseMessages({ api, typingUserIds: ['user-3'] });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.messages.map((item) => item.messageId)).toEqual([
      'message-1',
      'message-2',
    ]);
    expect(result.current.lastReadMessageId).toBe('message-1');
    expect(result.current.typingUserIds).toEqual(['user-3']);
    expect(api.ackMessage).toHaveBeenCalledWith('channel-1', 'message-2');

    act(() => result.current.dismissNewMessagesSeparator());

    expect(result.current.lastReadMessageId).toBeNull();
  });

  it('loads more messages and deduplicates existing ids', async () => {
    const api = createApi();
    vi.mocked(api.fetchMessages)
      .mockResolvedValueOnce(
        messageList({
          items: [message({ messageId: 'message-3', createdAtUtc: '2024-01-03T00:00:00.000Z' })],
          nextCursor: 'cursor-1',
        })
      )
      .mockResolvedValueOnce(
        messageList({
          items: [
            message({ messageId: 'message-2', createdAtUtc: '2024-01-02T00:00:00.000Z' }),
            message({ messageId: 'message-3', createdAtUtc: '2024-01-03T00:00:00.000Z' }),
          ],
          nextCursor: 'cursor-2',
        })
      )
      .mockResolvedValueOnce(messageList({ items: [], nextCursor: null }));

    const { result } = renderUseMessages({ api });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.messages.map((item) => item.messageId)).toEqual([
      'message-2',
      'message-3',
    ]);

    expect(result.current.messages.map((item) => item.messageId)).toEqual([
      'message-2',
      'message-3',
    ]);
  });

  it('reports whether a requested message is already loaded or unavailable', async () => {
    const api = createApi();
    vi.mocked(api.fetchMessages).mockResolvedValueOnce(
      messageList({
        items: [message({ messageId: 'message-3', createdAtUtc: '2024-01-03T00:00:00.000Z' })],
        nextCursor: null,
      })
    );

    const { result } = renderUseMessages({ api });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(result.current.loadUntilMessage('message-3')).resolves.toBe(true);
    await expect(result.current.loadUntilMessage('missing-message')).resolves.toBe(false);
  });

  it('applies realtime create, update, delete, reaction, preview, and pin events', async () => {
    const api = createApi();
    const { connection, handlers } = createConnection();
    vi.mocked(api.fetchMessages).mockResolvedValueOnce(messageList({ items: [message()] }));
    const { result } = renderUseMessages({ api, connection });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      handlers.get('MessageCreated')?.({
        channelId: 'channel-1',
        messageId: 'message-2',
        authorUserId: 'user-1',
        content: 'New',
        attachments: [],
        createdAtUtc: '2024-01-02T00:00:00.000Z',
      });
    });
    expect(result.current.messages.map((item) => item.messageId)).toEqual([
      'message-1',
      'message-2',
    ]);

    act(() => {
      handlers.get('MessageCreated')?.({
        channelId: 'channel-1',
        messageId: 'message-2',
        authorUserId: 'user-1',
        content: 'New',
        attachments: [],
        createdAtUtc: '2024-01-02T00:00:00.000Z',
      });
    });
    expect(result.current.messages.map((item) => item.messageId)).toEqual([
      'message-1',
      'message-2',
    ]);

    act(() => {
      handlers.get('MessageUpdated')?.({
        channelId: 'channel-1',
        messageId: 'message-1',
        content: 'Updated',
        updatedAtUtc: '2024-01-03T00:00:00.000Z',
      });
      handlers.get(REALTIME_SERVER_EVENTS.reactionAdded)?.({
        channelId: 'channel-1',
        messageId: 'message-1',
        emoji: '👍',
        userId: 'user-3',
        reactorUsername: 'grace',
      });
      handlers.get(REALTIME_SERVER_EVENTS.messagePreviewUpdated)?.({
        channelId: 'channel-1',
        messageId: 'message-1',
        previews: [{ url: 'https://example.com', title: 'Example' }],
      });
      handlers.get(REALTIME_SERVER_EVENTS.messagePinned)?.({
        channelId: 'channel-1',
        messageId: 'message-1',
      });
    });

    expect(result.current.messages[0]).toMatchObject({
      content: 'Updated',
      isPinned: true,
      reactions: [{ emoji: '👍', count: 1, reactedByMe: false }],
      linkPreviews: [{ url: 'https://example.com', title: 'Example' }],
    });

    act(() => {
      handlers.get(REALTIME_SERVER_EVENTS.reactionRemoved)?.({
        channelId: 'channel-1',
        messageId: 'message-1',
        emoji: '👍',
        userId: 'user-3',
      });
      handlers.get(REALTIME_SERVER_EVENTS.messageUnpinned)?.({
        channelId: 'channel-1',
        messageId: 'message-1',
      });
      result.current.startEditing('message-1');
    });

    expect(result.current.messages[0].reactions).toEqual([]);
    expect(result.current.messages[0].isPinned).toBe(false);
    expect(result.current.editingMessageId).toBe('message-1');

    act(() => {
      handlers.get('MessageDeleted')?.({ channelId: 'channel-1', messageId: 'message-1' });
    });

    expect(result.current.messages.map((item) => item.messageId)).toEqual(['message-2']);
    expect(result.current.editingMessageId).toBeNull();
  });

  it('adds a sent message from the API response and deduplicates the realtime echo', async () => {
    const api = createApi();
    const { connection, handlers } = createConnection();
    vi.mocked(api.fetchMessages).mockResolvedValueOnce(messageList({ items: [message()] }));
    const { result } = renderUseMessages({ api, connection });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.addMessage(
        message({
          messageId: 'message-2',
          authorUserId: 'user-1',
          content: 'Sent',
          createdAtUtc: '2024-01-02T00:00:00.000Z',
        })
      );
    });

    act(() => {
      handlers.get('MessageCreated')?.({
        channelId: 'channel-1',
        messageId: 'message-2',
        authorUserId: 'user-1',
        content: 'Sent',
        attachments: [],
        createdAtUtc: '2024-01-02T00:00:00.000Z',
      });
    });

    expect(result.current.messages.map((item) => item.messageId)).toEqual([
      'message-1',
      'message-2',
    ]);
    expect(api.ackMessage).toHaveBeenCalledWith('channel-1', 'message-2');
  });

  it('performs edit, delete, attachment, pin, and reaction actions optimistically', async () => {
    const api = createApi();
    vi.mocked(api.fetchMessages).mockResolvedValueOnce(
      messageList({
        items: [
          message({
            messageId: 'message-1',
            attachments: [
              { fileId: 'file-1', fileName: 'a.txt', contentType: 'text/plain', sizeBytes: 1 },
            ],
            reactions: [{ emoji: '👍', count: 1, reactedByMe: false }],
          }),
        ],
      })
    );
    vi.mocked(api.updateMessage).mockResolvedValueOnce(
      message({
        messageId: 'message-1',
        content: 'Saved',
        attachments: [
          { fileId: 'file-1', fileName: 'a.txt', contentType: 'text/plain', sizeBytes: 1 },
        ],
        reactions: [{ emoji: '👍', count: 1, reactedByMe: false }],
        updatedAtUtc: '2024-01-02T00:00:00.000Z',
      })
    );
    const { result } = renderUseMessages({ api });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.startEditing('message-1');
      await result.current.saveEdit('message-1', 'Saved', ['user-3']);
    });
    expect(result.current.editingMessageId).toBeNull();
    expect(result.current.messages[0].content).toBe('Saved');

    await act(async () => {
      await result.current.removeAttachment('message-1', 'file-1');
    });
    expect(result.current.messages[0].attachments).toEqual([]);
    expect(api.deleteAttachment).toHaveBeenCalledWith('channel-1', 'message-1', 'file-1');

    await act(async () => {
      await result.current.setMessagePinned('message-1', true);
    });
    expect(result.current.messages[0].isPinned).toBe(true);
    expect(api.pinMessage).toHaveBeenCalledWith('channel-1', 'message-1');

    await act(async () => {
      await result.current.toggleReaction('message-1', '👍');
    });
    expect(result.current.messages[0].reactions[0]).toMatchObject({
      emoji: '👍',
      count: 2,
      reactedByMe: true,
    });
    expect(api.addReaction).toHaveBeenCalledWith('channel-1', 'message-1', '👍');

    await act(async () => {
      await result.current.removeMessage('message-1');
    });
    expect(result.current.messages).toEqual([]);
    expect(api.deleteMessage).toHaveBeenCalledWith('channel-1', 'message-1');
  });

  it('exposes fetch errors for the loaded entity', async () => {
    const api = createApi();
    vi.mocked(api.fetchMessages).mockRejectedValueOnce(new Error('network'));

    const { result } = renderUseMessages({ api });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe(true);
    expect(result.current.messages).toEqual([]);
  });
});
