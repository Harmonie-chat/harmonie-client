import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { GuildMember } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MembersPanel } from './MembersPanel';

const mocks = vi.hoisted(() => ({
  members: null as GuildMember[] | null,
  openBanModal: vi.fn(),
  openRemoveModal: vi.fn(),
  canBanMember: vi.fn((member: GuildMember) => member.role === 'Member'),
  canRemoveMember: vi.fn((member: GuildMember) => member.role === 'Member'),
  afterBanAction: undefined as (() => void) | undefined,
  afterRemoveAction: undefined as (() => void) | undefined,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) =>
      values?.count === undefined ? key : `${key}:${values.count}`,
  }),
}));

vi.mock('@harmonie/ui', () => ({
  IconButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button type="button" aria-label="close panel" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuildMembers: () => mocks.members,
}));

vi.mock('@/features/guild/members/modals/useMemberBanActions', () => ({
  useMemberBanActions: (_guildId: string | undefined, afterAction: () => void) => {
    mocks.afterBanAction = afterAction;
    return {
      banModal: <section>ban modal</section>,
      canBanMember: mocks.canBanMember,
      openBanModal: mocks.openBanModal,
    };
  },
}));

vi.mock('@/features/guild/members/modals/useMemberRemoveActions', () => ({
  useMemberRemoveActions: (_guildId: string | undefined, afterAction: () => void) => {
    mocks.afterRemoveAction = afterAction;
    return {
      removeModal: <section>remove modal</section>,
      canRemoveMember: mocks.canRemoveMember,
      openRemoveModal: mocks.openRemoveModal,
    };
  },
}));

vi.mock('@/shared/members/MemberItem', () => ({
  MemberItem: ({
    member,
    onBan,
    onRemove,
    onSelect,
  }: {
    member: GuildMember;
    onBan?: (member: GuildMember) => void;
    onRemove?: (member: GuildMember) => void;
    onSelect: (member: GuildMember, rect: DOMRect) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onSelect(member, new DOMRect(1, 2, 3, 4))}>
        select {member.username}
      </button>
      {onBan && (
        <button type="button" onClick={() => onBan(member)}>
          ban {member.username}
        </button>
      )}
      {onRemove && (
        <button type="button" onClick={() => onRemove(member)}>
          remove {member.username}
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/shared/members/MemberPopover', () => ({
  MemberPopover: ({
    member,
    onBanned,
    onClose,
    onRemoved,
  }: {
    member: GuildMember;
    onBanned: () => void;
    onClose: () => void;
    onRemoved: () => void;
  }) => (
    <section>
      popover:{member.username}
      <button type="button" onClick={onClose}>
        close popover
      </button>
      <button type="button" onClick={onRemoved}>
        removed member
      </button>
      <button type="button" onClick={onBanned}>
        banned member
      </button>
    </section>
  ),
}));

const makeMember = (input: Partial<GuildMember>): GuildMember => ({
  userId: input.userId ?? 'user-1',
  username: input.username ?? 'alice',
  displayName: input.displayName ?? null,
  avatarFileId: null,
  avatar: { icon: 'PawPrint', color: '#111111', bg: '#eeeeee' },
  isActive: input.isActive ?? true,
  role: input.role ?? 'Member',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
});

const renderPanel = (path = '/guilds/guild-1/channels/channel-1') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/guilds/:guildId/channels/:channelId"
          element={<MembersPanel onClose={vi.fn()} />}
        />
        <Route path="/no-guild" element={<MembersPanel onClose={vi.fn()} />} />
      </Routes>
    </MemoryRouter>
  );

describe('MembersPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.members = null;
  });

  it('renders loading, moderation modals, and closes from the header', () => {
    renderPanel();

    expect(screen.getByText('guild.members.loading')).toBeInTheDocument();
    expect(screen.getByText('ban modal')).toBeInTheDocument();
    expect(screen.getByText('remove modal')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('close panel'));
    expect(screen.getByLabelText('close panel')).toBeInTheDocument();
  });

  it('groups members, toggles popover selection, and forwards moderation actions', () => {
    mocks.members = [
      makeMember({ userId: 'online-1', username: 'alice', isActive: true, role: 'Member' }),
      makeMember({ userId: 'offline-1', username: 'bob', isActive: false, role: 'Admin' }),
    ];

    renderPanel();

    expect(screen.getByText('guild.members.online:1')).toBeInTheDocument();
    expect(screen.getByText('guild.members.offline:1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    expect(screen.getByText('popover:alice')).toBeInTheDocument();

    act(() => {
      mocks.afterRemoveAction?.();
    });
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    act(() => {
      mocks.afterBanAction?.();
    });
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    expect(screen.getByText('popover:alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close popover' }));
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'removed member' }));
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'banned member' }));
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    expect(screen.getByText('popover:alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'ban alice' }));
    fireEvent.click(screen.getByRole('button', { name: 'remove alice' }));

    expect(mocks.openBanModal).toHaveBeenCalledWith(expect.objectContaining({ username: 'alice' }));
    expect(mocks.openRemoveModal).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'alice' })
    );
    expect(screen.queryByRole('button', { name: 'ban bob' })).not.toBeInTheDocument();
  });

  it('renders an offline-only group without the online spacing class', () => {
    mocks.members = [makeMember({ userId: 'offline-1', username: 'bob', isActive: false })];

    renderPanel();

    expect(screen.queryByText('guild.members.online:1')).not.toBeInTheDocument();
    expect(screen.getByText('guild.members.offline:1')).toBeInTheDocument();
    expect(screen.getByText('guild.members.offline:1').closest('div')).not.toHaveClass('mt-4');
  });

  it('does not select a member without a guild id', () => {
    mocks.members = [makeMember({ username: 'alice' })];

    renderPanel('/no-guild');

    fireEvent.click(screen.getByRole('button', { name: 'select alice' }));
    expect(screen.queryByText('popover:alice')).not.toBeInTheDocument();
  });
});
