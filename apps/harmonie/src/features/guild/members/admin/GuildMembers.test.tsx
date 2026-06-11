import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Guild, GuildMember, GuildMemberRole } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildMembers } from './GuildMembers';

const mocks = vi.hoisted(() => ({
  fetchGuildMembers: vi.fn(),
  fetchGuilds: vi.fn(),
  members: null as GuildMember[] | null,
  updateMemberRole: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/api/guilds', () => ({
  updateMemberRole: (...args: unknown[]) => mocks.updateMemberRole(...args),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuildMembers: () => mocks.members,
  useGuilds: () => ({
    fetchGuildMembers: mocks.fetchGuildMembers,
    fetchGuilds: mocks.fetchGuilds,
  }),
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: () => ({
    canBanMember: (member: GuildMember) => member.role !== 'Admin',
    canEditMemberRole: () => true,
    canRemoveMember: (member: GuildMember) => member.role !== 'Admin',
    canTransferOwnership: (member: GuildMember) => member.role === 'Admin',
  }),
}));

vi.mock('@/features/guild/members/admin/MemberRow', () => ({
  MemberRow: ({
    member,
    onBanned,
    onOwnershipTransferred,
    onRemoved,
    onRoleChange,
    permissions,
    roleState,
  }: {
    member: GuildMember;
    onBanned: () => void;
    onOwnershipTransferred: () => void;
    onRemoved: () => void;
    onRoleChange: (userId: string, role: GuildMemberRole) => void;
    permissions: {
      canBan: boolean;
      canEditRole: boolean;
      canRemove: boolean;
      canTransferOwnership: boolean;
      isOwner: boolean;
    };
    roleState: { isChangingRole: boolean };
  }) => (
    <li
      data-ban={String(permissions.canBan)}
      data-changing-role={String(roleState.isChangingRole)}
      data-edit-role={String(permissions.canEditRole)}
      data-owner={String(permissions.isOwner)}
      data-remove={String(permissions.canRemove)}
      data-transfer={String(permissions.canTransferOwnership)}
    >
      {member.username}
      <button type="button" onClick={() => onRoleChange(member.userId, 'Admin')}>
        promote {member.username}
      </button>
      <button type="button" onClick={onRemoved}>
        removed {member.username}
      </button>
      <button type="button" onClick={onBanned}>
        banned {member.username}
      </button>
      <button type="button" onClick={onOwnershipTransferred}>
        transferred {member.username}
      </button>
    </li>
  ),
}));

const guild: Guild = {
  guildId: 'guild-1',
  name: 'Guild',
  ownerUserId: 'owner',
  role: 'Admin',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
  iconFileId: null,
  icon: null,
};

const member: GuildMember = {
  userId: 'member-1',
  username: 'member',
  displayName: null,
  avatarFileId: null,
  avatar: { icon: 'PawPrint', color: '#111111', bg: '#eeeeee' },
  isActive: true,
  role: 'Member',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
};

describe('GuildMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.members = null;
  });

  it('renders loading and empty states', () => {
    const { rerender } = render(<GuildMembers guild={guild} />);

    expect(screen.getByText('guild.members.admin.loading')).toBeInTheDocument();

    mocks.members = [];
    rerender(<GuildMembers guild={guild} />);
    expect(screen.getByText('guild.members.admin.empty')).toBeInTheDocument();
  });

  it('renders member rows, changes roles, and refreshes after actions', async () => {
    const onOwnershipTransferred = vi.fn();
    mocks.members = [member, { ...member, userId: 'owner', username: 'owner', role: 'Admin' }];
    mocks.updateMemberRole.mockResolvedValue(undefined);

    render(<GuildMembers guild={guild} onOwnershipTransferred={onOwnershipTransferred} />);

    expect(screen.getByText('member').closest('li')).toHaveAttribute('data-owner', 'false');
    expect(screen.getByText('member').closest('li')).toHaveAttribute('data-ban', 'true');
    expect(screen.getByText('owner').closest('li')).toHaveAttribute('data-owner', 'true');
    expect(screen.getByText('owner').closest('li')).toHaveAttribute('data-transfer', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'promote member' }));

    expect(mocks.updateMemberRole).toHaveBeenCalledWith('guild-1', 'member-1', { role: 'Admin' });
    await waitFor(() => expect(mocks.fetchGuildMembers).toHaveBeenCalledWith('guild-1', true));

    fireEvent.click(screen.getByRole('button', { name: 'removed member' }));
    fireEvent.click(screen.getByRole('button', { name: 'banned member' }));
    fireEvent.click(screen.getByRole('button', { name: 'transferred member' }));

    expect(mocks.fetchGuildMembers).toHaveBeenCalledTimes(4);
    expect(mocks.fetchGuilds).toHaveBeenCalledTimes(1);
    expect(onOwnershipTransferred).toHaveBeenCalledTimes(1);
  });

  it('clears changing role state when role update fails', async () => {
    mocks.members = [member];
    mocks.updateMemberRole.mockRejectedValue(new Error('nope'));

    render(<GuildMembers guild={guild} />);

    fireEvent.click(screen.getByRole('button', { name: 'promote member' }));

    expect(mocks.updateMemberRole).toHaveBeenCalledWith('guild-1', 'member-1', { role: 'Admin' });
    await waitFor(() =>
      expect(screen.getByText('member').closest('li')).toHaveAttribute(
        'data-changing-role',
        'false'
      )
    );
  });
});
