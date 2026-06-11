import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
const parseOrThrowMock = vi.fn(async (response: Response) => response.json());

vi.mock('./client', () => ({
  apiFetch: apiFetchMock,
  parseOrThrow: parseOrThrowMock,
}));

describe('guilds api', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    parseOrThrowMock.mockClear();
  });

  it('lists guilds and channels', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ guilds: [] }))
      .mockResolvedValueOnce(Response.json({ channels: [] }));
    const { listChannels, listGuilds } = await import('./guilds');

    await expect(listGuilds()).resolves.toEqual({ guilds: [] });
    await expect(listChannels('guild-1')).resolves.toEqual({ channels: [] });

    expect(apiFetchMock).toHaveBeenNthCalledWith(1, 'https://harmonie-api.arastorn.ovh/api/guilds');
    expect(apiFetchMock).toHaveBeenNthCalledWith(
      2,
      'https://harmonie-api.arastorn.ovh/api/guilds/guild-1/channels'
    );
  });

  it('creates, updates, and reorders guild resources with JSON bodies', async () => {
    apiFetchMock
      .mockResolvedValueOnce(Response.json({ guildId: 'guild-1' }))
      .mockResolvedValueOnce(Response.json({ name: 'Updated' }))
      .mockResolvedValueOnce(Response.json({ channels: [] }))
      .mockResolvedValueOnce(Response.json({ channelId: 'channel-1' }));
    const { createChannel, createGuild, reorderChannels, updateGuild } = await import('./guilds');

    await createGuild({ name: 'Guild', iconFileId: null, icon: { type: 'initials' } as never });
    await updateGuild('guild-1', { name: 'Updated' });
    await reorderChannels('guild-1', { channelIds: ['channel-1'] } as never);
    await createChannel('guild-1', { name: 'general', position: 1, type: 'Text' });

    expect(
      apiFetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit).method])
    ).toEqual([
      ['https://harmonie-api.arastorn.ovh/api/guilds', 'POST'],
      ['https://harmonie-api.arastorn.ovh/api/guilds/guild-1', 'PATCH'],
      ['https://harmonie-api.arastorn.ovh/api/guilds/guild-1/channels/reorder', 'PATCH'],
      ['https://harmonie-api.arastorn.ovh/api/guilds/guild-1/channels', 'POST'],
    ]);
    expect(apiFetchMock.mock.calls[0][1]).toMatchObject({
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Guild', iconFileId: null, icon: { type: 'initials' } }),
    });
  });

  it('handles guild membership and invite endpoints', async () => {
    apiFetchMock.mockImplementation(() => Promise.resolve(Response.json({ ok: true })));
    const {
      banMember,
      createGuildInvite,
      getInvitePreview,
      joinGuild,
      leaveGuild,
      listGuildBans,
      listGuildInvites,
      listGuildMembers,
      removeMember,
      revokeGuildInvite,
      transferOwnership,
      unbanMember,
      updateMemberRole,
    } = await import('./guilds');

    await listGuildMembers('guild-1');
    await getInvitePreview('abc');
    await joinGuild('abc');
    await leaveGuild('guild-1');
    await createGuildInvite('guild-1', { expiresAtUtc: null } as never);
    await listGuildInvites('guild-1');
    await revokeGuildInvite('guild-1', 'abc');
    await banMember('guild-1', { userId: 'user-1' } as never);
    await listGuildBans('guild-1');
    await unbanMember('guild-1', 'user-1');
    await removeMember('guild-1', 'user-1');
    await updateMemberRole('guild-1', 'user-1', { role: 'admin' } as never);
    await transferOwnership('guild-1', 'user-2');

    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/guilds/guild-1/members'
    );
    expect(apiFetchMock).toHaveBeenCalledWith('https://harmonie-api.arastorn.ovh/api/invites/abc');
    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/invites/abc/accept',
      { method: 'POST' }
    );
    expect(apiFetchMock).toHaveBeenCalledWith(
      'https://harmonie-api.arastorn.ovh/api/guilds/guild-1/owner/transfer',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: 'user-2' }),
      }
    );
  });

  it('builds guild message search query params', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ messages: [] }));
    const { searchGuildMessages } = await import('./guilds');

    await searchGuildMessages('guild-1', {
      q: 'hello',
      channelId: 'channel-1',
      authorId: 'user-1',
      before: '2026-01-01',
      after: '2025-01-01',
      cursor: 'cursor-1',
      limit: 25,
    });

    const url = new URL(apiFetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe('/api/guilds/guild-1/messages/search');
    expect(Object.fromEntries(url.searchParams.entries())).toEqual({
      Q: 'hello',
      ChannelId: 'channel-1',
      AuthorId: 'user-1',
      Before: '2026-01-01',
      After: '2025-01-01',
      Cursor: 'cursor-1',
      Limit: '25',
    });
  });

  it('throws parsed errors for void guild endpoints', async () => {
    apiFetchMock.mockResolvedValueOnce(Response.json({ code: 'NOPE' }, { status: 403 }));
    const { deleteGuild } = await import('./guilds');

    await expect(deleteGuild('guild-1')).rejects.toEqual({ code: 'NOPE' });
  });
});
