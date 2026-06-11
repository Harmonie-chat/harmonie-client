import { fireEvent, render, screen } from '@testing-library/react';
import type { GuildMember } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMemberBanActions } from './useMemberBanActions';

const mocks = vi.hoisted(() => ({
  canBanMember: vi.fn(() => true),
  fetchGuildMembers: vi.fn(),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useCurrentGuild: () => ({ guild: { guildId: 'guild-1' } }),
  useGuilds: () => ({ fetchGuildMembers: mocks.fetchGuildMembers }),
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: () => ({ canBanMember: mocks.canBanMember }),
}));

vi.mock('@/features/guild/members/modals/BanMemberModal', () => ({
  BanMemberModal: ({
    member,
    onBanned,
    onClose,
  }: {
    member: GuildMember;
    onBanned: () => void;
    onClose: () => void;
  }) => (
    <section>
      ban modal:{member.username}
      <button type="button" onClick={onBanned}>
        banned
      </button>
      <button type="button" onClick={onClose}>
        close
      </button>
    </section>
  ),
}));

const member: GuildMember = {
  userId: 'member-1',
  username: 'alice',
  displayName: null,
  isActive: true,
  role: 'Member',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
};

const Harness = ({ guildId, onBanned }: { guildId?: string; onBanned?: () => void }) => {
  const actions = useMemberBanActions(guildId, onBanned);

  return (
    <div>
      <output aria-label="can-ban">{String(actions.canBanMember(member))}</output>
      <button type="button" onClick={() => actions.openBanModal(member)}>
        open
      </button>
      {actions.banModal}
    </div>
  );
};

describe('useMemberBanActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canBanMember.mockReturnValue(true);
  });

  it('opens, closes, refreshes, and notifies after banning', () => {
    const onBanned = vi.fn();

    render(<Harness guildId="guild-1" onBanned={onBanned} />);

    expect(screen.getByLabelText('can-ban')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByText('ban modal:alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'banned' }));
    expect(mocks.fetchGuildMembers).toHaveBeenCalledWith('guild-1', true);
    expect(onBanned).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('ban modal:alice')).not.toBeInTheDocument();
  });

  it('does not render the modal without a guild id', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'open' }));

    expect(screen.queryByText('ban modal:alice')).not.toBeInTheDocument();
  });

  it('closes the modal without refreshing members', () => {
    render(<Harness guildId="guild-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByText('ban modal:alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(screen.queryByText('ban modal:alice')).not.toBeInTheDocument();
    expect(mocks.fetchGuildMembers).not.toHaveBeenCalled();
  });
});
