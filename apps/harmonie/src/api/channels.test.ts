import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
const parseOrThrowMock = vi.fn(async (response: Response) => response.json());

vi.mock('@/api/client', () => ({
  apiFetch: apiFetchMock,
  parseOrThrow: parseOrThrowMock,
}));

describe('channels api', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    parseOrThrowMock.mockClear();
  });

  it('sends messages with null content when empty', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ messageId: 'message-1' }));
    const { sendMessage } = await import('./channels');

    await sendMessage('channel-1', '', ['file-1'], 'reply-1', ['user-1']);

    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/channels/channel-1/messages',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: null,
          attachmentFileIds: ['file-1'],
          replyToMessageId: 'reply-1',
          mentionedUserIds: ['user-1'],
        }),
      }
    );
  });

  it('builds message and pin pagination URLs', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ messages: [] }))
      .mockResolvedValueOnce(Response.json({ messages: [] }));
    const { getChannelMessages, getChannelPinnedMessages } = await import('./channels');

    await getChannelMessages('channel-1', 'before-1');
    await getChannelPinnedMessages('channel-1', 'before-2');

    expect(new URL(apiFetchMock.mock.calls[0][0]).searchParams.get('Before')).toBe('before-1');
    expect(new URL(apiFetchMock.mock.calls[1][0]).searchParams.get('before')).toBe('before-2');
  });

  it('updates channels and messages', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ channelId: 'channel-1' }))
      .mockResolvedValueOnce(Response.json({ messageId: 'message-1' }));
    const { updateChannel, updateMessage } = await import('./channels');

    await updateChannel('channel-1', { name: 'general' });
    await updateMessage('channel-1', 'message-1', 'hello', ['user-1']);

    expect(apiFetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ name: 'general' }),
    });
    expect(apiFetchMock.mock.calls[1][1]).toMatchObject({
      method: 'PATCH',
      body: JSON.stringify({ content: 'hello', mentionedUserIds: ['user-1'] }),
    });
  });

  it('calls void channel endpoints and reaction endpoints', async () => {
    apiFetchMock.mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
    const {
      ackChannel,
      addReaction,
      deleteAttachment,
      deleteChannel,
      deleteMessage,
      joinVoiceChannel,
      pinMessage,
      removeReaction,
      unpinMessage,
    } = await import('./channels');

    await deleteChannel('channel-1');
    await deleteMessage('channel-1', 'message-1');
    await pinMessage('channel-1', 'message-1');
    await unpinMessage('channel-1', 'message-1');
    await ackChannel('channel-1', 'message-1');
    await addReaction('channel-1', 'message-1', '👍');
    await deleteAttachment('channel-1', 'message-1', 'attachment / 1');
    await removeReaction('channel-1', 'message-1', '👍');
    await joinVoiceChannel('channel-1');

    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/channels/channel-1/messages/message-1/reactions/%F0%9F%91%8D',
      { method: 'PUT' }
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/channels/channel-1/messages/message-1/attachments/attachment%20%2F%201',
      { method: 'DELETE' }
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/channels/channel-1/voice/join',
      {
        method: 'POST',
      }
    );
  });

  it('builds reaction user cursor URLs', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ users: [] }));
    const { getChannelReactionUsers } = await import('./channels');

    await getChannelReactionUsers('channel-1', 'message-1', '👍', 'cursor-1');

    const url = new URL(apiFetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe(
      '/api/channels/channel-1/messages/message-1/reactions/%F0%9F%91%8D/users'
    );
    expect(url.searchParams.get('Cursor')).toBe('cursor-1');
  });

  it('throws errors for failed void endpoints', async () => {
    apiFetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { deleteMessage } = await import('./channels');

    await expect(deleteMessage('channel-1', 'message-1')).rejects.toThrow(
      'Failed to delete message'
    );
  });
});
