import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { GuildBan } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildBans } from './GuildBans';

const listGuildBans = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/guilds', () => ({
  listGuildBans: (...args: unknown[]) => listGuildBans(...args),
}));

vi.mock('@/features/guild/members/admin/BanItem', () => ({
  BanItem: ({
    ban,
    guildId,
    onUnbanned,
  }: {
    ban: GuildBan;
    guildId: string;
    onUnbanned: (userId: string) => void;
  }) => (
    <li>
      {guildId}:{ban.username}
      <button type="button" onClick={() => onUnbanned(ban.userId)}>
        unban {ban.username}
      </button>
    </li>
  ),
}));

const ban: GuildBan = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  avatarFileId: null,
  avatar: { icon: null, color: null, bg: null },
  reason: null,
  bannedBy: 'admin',
  createdAtUtc: '2026-01-01T00:00:00.000Z',
};

describe('GuildBans', () => {
  beforeEach(() => {
    listGuildBans.mockReset();
  });

  it('loads bans and removes a row after unban', async () => {
    listGuildBans.mockResolvedValue({ guildId: 'guild-1', bans: [ban] });

    render(<GuildBans guildId="guild-1" />);

    expect(screen.getByText('guild.bans.loading')).toBeInTheDocument();
    expect(await screen.findByText('guild-1:alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'unban alice' }));
    await waitFor(() => expect(screen.queryByText('guild-1:alice')).not.toBeInTheDocument());
    expect(screen.getByText('guild.bans.empty')).toBeInTheDocument();
  });

  it('shows empty state when loading fails and reloads for a new guild', async () => {
    listGuildBans.mockRejectedValueOnce(new Error('nope'));

    const { rerender } = render(<GuildBans guildId="guild-1" />);

    expect(await screen.findByText('guild.bans.empty')).toBeInTheDocument();

    listGuildBans.mockResolvedValueOnce({ guildId: 'guild-2', bans: [ban] });
    rerender(<GuildBans guildId="guild-2" />);

    expect(screen.getByText('guild.bans.loading')).toBeInTheDocument();
    await waitFor(() => expect(listGuildBans).toHaveBeenLastCalledWith('guild-2'));
    expect(await screen.findByText('guild-2:alice')).toBeInTheDocument();
  });
});
