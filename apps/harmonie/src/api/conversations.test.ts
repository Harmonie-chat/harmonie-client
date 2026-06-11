import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
const parseOrThrowMock = vi.fn(async (response: Response) => response.json());
const API_BASE = 'https://harmonie-api.arastorn.ovh/api';

vi.mock('@/api/client', () => ({
  apiFetch: apiFetchMock,
  parseOrThrow: parseOrThrowMock,
}));

describe('conversations api', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    parseOrThrowMock.mockClear();
  });

  it('loads conversations and opens direct/group conversations', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ conversations: [] }))
      .mockResolvedValueOnce(Response.json({ conversationId: 'direct-1' }))
      .mockResolvedValueOnce(Response.json({ conversationId: 'group-1' }));
    const { createGroupConversation, getConversations, openDirectConversation } =
      await import('./conversations');

    await getConversations();
    await openDirectConversation('user-1');
    await createGroupConversation('', ['user-1', 'user-2']);

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, `${API_BASE}/conversations`);
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, `${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: 'user-1' }),
    });
    expect(apiFetchMock).toHaveBeenNthCalledWith(3, `${API_BASE}/conversations/group`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: null, participantUserIds: ['user-1', 'user-2'] }),
    });
  });

  it('updates conversation names and normalizes empty values to null', async () => {
    apiFetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { updateConversationName } = await import('./conversations');

    await updateConversationName('conversation-1', '  Squad  ');
    await updateConversationName('conversation-1', '   ');

    expect(apiFetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ name: 'Squad' }),
    });
    expect(apiFetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: '{"name":null}',
    });
  });

  it('builds message, pin, reaction, and user-search URLs', async () => {
    apiFetchMock.mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
    const {
      getConversationMessages,
      getConversationPinnedMessages,
      getConversationReactionUsers,
      searchUsers,
    } = await import('./conversations');

    await getConversationMessages('conversation-1', 'before-1');
    await getConversationPinnedMessages('conversation-1', 'before-2');
    await getConversationReactionUsers('conversation-1', 'message-1', '👍', 'cursor-1');
    await searchUsers('ava');

    expect(new URL(apiFetchMock.mock.calls[0][0]).searchParams.get('Before')).toBe('before-1');
    expect(new URL(apiFetchMock.mock.calls[1][0]).searchParams.get('before')).toBe('before-2');
    expect(new URL(apiFetchMock.mock.calls[2][0]).pathname).toBe(
      '/api/conversations/conversation-1/messages/message-1/reactions/%F0%9F%91%8D/users'
    );
    expect(new URL(apiFetchMock.mock.calls[2][0]).searchParams.get('Cursor')).toBe('cursor-1');
    expect(new URL(apiFetchMock.mock.calls[3][0]).searchParams.get('Q')).toBe('ava');
  });

  it('supports participant shapes returned as an array or an object', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json([{ userId: 'user-1' }]))
      .mockResolvedValueOnce(Response.json({ participants: [{ userId: 'user-2' }] }));
    const { getConversationParticipants } = await import('./conversations');

    await expect(getConversationParticipants('conversation-1')).resolves.toEqual([
      { userId: 'user-1' },
    ]);
    await expect(getConversationParticipants('conversation-1')).resolves.toEqual([
      { userId: 'user-2' },
    ]);
  });

  it('sends and updates conversation messages', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ messageId: 'message-1' }))
      .mockResolvedValueOnce(Response.json({ messageId: 'message-1' }));
    const { sendConversationMessage, updateConversationMessage } = await import('./conversations');

    await sendConversationMessage('conversation-1', '', ['file-1'], 'reply-1', ['user-1']);
    await updateConversationMessage('conversation-1', 'message-1', 'Hello', ['user-2']);

    expect(apiFetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        content: null,
        attachmentFileIds: ['file-1'],
        replyToMessageId: 'reply-1',
        mentionedUserIds: ['user-1'],
      }),
    });
    expect(apiFetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ content: 'Hello', mentionedUserIds: ['user-2'] }),
    });
  });

  it('calls void endpoints, reactions, attachments, and voice join', async () => {
    apiFetchMock.mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
    const {
      ackConversation,
      addConversationReaction,
      deleteConversation,
      deleteConversationMessage,
      deleteConversationMessageAttachment,
      joinConversationVoiceCall,
      pinConversationMessage,
      removeConversationReaction,
      unpinConversationMessage,
    } = await import('./conversations');

    await deleteConversationMessage('conversation-1', 'message-1');
    await pinConversationMessage('conversation-1', 'message-1');
    await unpinConversationMessage('conversation-1', 'message-1');
    await deleteConversationMessageAttachment('conversation-1', 'message-1', 'attachment / 1');
    await ackConversation('conversation-1', 'message-1');
    await addConversationReaction('conversation-1', 'message-1', '👍');
    await removeConversationReaction('conversation-1', 'message-1', '👍');
    await deleteConversation('conversation-1');
    await joinConversationVoiceCall('conversation-1');

    expect(apiFetchMock).toHaveBeenCalledWith(
      `${API_BASE}/conversations/conversation-1/messages/message-1/attachments/attachment%20%2F%201`,
      { method: 'DELETE' }
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      `${API_BASE}/conversations/conversation-1/messages/message-1/reactions/%F0%9F%91%8D`,
      { method: 'PUT' }
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      `${API_BASE}/conversations/conversation-1/voice/join`,
      {
        method: 'POST',
      }
    );
  });

  it('throws errors for failed void endpoints', async () => {
    apiFetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { deleteConversation } = await import('./conversations');

    await expect(deleteConversation('conversation-1')).rejects.toThrow(
      'Failed to delete conversation'
    );
  });
});
