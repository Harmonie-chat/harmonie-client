import { fireEvent, render, screen } from '@testing-library/react';
import type { GuildMember } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMemberRemoveActions } from './useMemberRemoveActions';

const mocks = vi.hoisted(() => ({
  canRemoveMember: vi.fn(() => true),
  fetchGuildMembers: vi.fn(),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useCurrentGuild: () => ({ guild: { guildId: 'guild-1' } }),
  useGuilds: () => ({ fetchGuildMembers: mocks.fetchGuildMembers }),
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: () => ({ canRemoveMember: mocks.canRemoveMember }),
}));

vi.mock('@/features/guild/members/modals/RemoveMemberModal', () => ({
  RemoveMemberModal: ({
    member,
    onClose,
    onRemoved,
  }: {
    member: GuildMember;
    onClose: () => void;
    onRemoved: () => void;
  }) => (
    <section>
      remove modal:{member.username}
      <button type="button" onClick={onRemoved}>
        removed
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

const Harness = ({ guildId, onRemoved }: { guildId?: string; onRemoved?: () => void }) => {
  const actions = useMemberRemoveActions(guildId, onRemoved);

  return (
    <div>
      <output aria-label="can-remove">{String(actions.canRemoveMember(member))}</output>
      <button type="button" onClick={() => actions.openRemoveModal(member)}>
        open
      </button>
      {actions.removeModal}
    </div>
  );
};

describe('useMemberRemoveActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canRemoveMember.mockReturnValue(true);
  });

  it('opens, closes, refreshes, and notifies after removal', () => {
    const onRemoved = vi.fn();

    render(<Harness guildId="guild-1" onRemoved={onRemoved} />);

    expect(screen.getByLabelText('can-remove')).toHaveTextContent('true');
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByText('remove modal:alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'removed' }));
    expect(mocks.fetchGuildMembers).toHaveBeenCalledWith('guild-1', true);
    expect(onRemoved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('remove modal:alice')).not.toBeInTheDocument();
  });

  it('closes the modal and does not render it without a guild id', () => {
    const { rerender } = render(<Harness guildId="guild-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByText('remove modal:alice')).not.toBeInTheDocument();

    rerender(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.queryByText('remove modal:alice')).not.toBeInTheDocument();
  });
});
