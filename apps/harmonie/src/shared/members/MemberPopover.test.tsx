import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { GuildMember } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberPopover } from './MemberPopover';

const mocks = vi.hoisted(() => ({
  canBanMember: vi.fn(() => true),
  canRemoveMember: vi.fn(() => true),
  fetchGuildMembers: vi.fn(),
  openDirectConversation: vi.fn(),
  theme: 'light',
  user: { userId: 'current-user' } as { userId: string } | null,
  guild: { guildId: 'guild-1', ownerUserId: 'owner-1' } as {
    guildId: string;
    ownerUserId: string;
  } | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  UserPopover: ({
    actions,
    avatarBg,
    avatarColor,
    avatarIcon,
    avatarUrl,
    badges,
    bio,
    bioLabel,
    headerBackground,
    label,
    onClose,
    side,
    username,
  }: {
    actions: Array<{ label: string; onClick: () => void }>;
    avatarBg: string;
    avatarColor: string;
    avatarIcon: string;
    avatarUrl: string | null;
    badges: Array<{ label: string; variant?: string }>;
    bio?: string;
    bioLabel: string;
    headerBackground: string;
    label: string;
    onClose: () => void;
    side: string;
    username?: string;
  }) => (
    <section data-header={headerBackground} data-side={side}>
      <h2>{label}</h2>
      {username ? <p>{username}</p> : null}
      <span
        data-avatar-bg={avatarBg}
        data-avatar-color={avatarColor}
        data-avatar-icon={avatarIcon}
        data-testid="avatar"
      >
        {avatarUrl}
      </span>
      <p>
        {bioLabel}:{bio}
      </p>
      {badges.map((badge) => (
        <span
          key={`${badge.label}-${badge.variant ?? 'default'}`}
          data-variant={badge.variant ?? ''}
        >
          badge:{badge.label}
        </span>
      ))}
      {actions.map((action) => (
        <button key={action.label} type="button" onClick={action.onClick}>
          {action.label}
        </button>
      ))}
      <button type="button" onClick={onClose}>
        close popover
      </button>
    </section>
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/features/user/ThemeContext', () => ({
  useTheme: () => ({ theme: mocks.theme }),
}));

vi.mock('@/shared/utils/user', () => ({
  getUserGradient: (userId: string, obsidian: boolean) => `gradient:${userId}:${obsidian}`,
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useCurrentGuild: () => ({ guild: mocks.guild }),
  useGuilds: () => ({ fetchGuildMembers: mocks.fetchGuildMembers }),
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: () => ({
    canBanMember: mocks.canBanMember,
    canRemoveMember: mocks.canRemoveMember,
  }),
}));

vi.mock('@/features/conversation/useOpenDirectConversation', () => ({
  useOpenDirectConversation: () => mocks.openDirectConversation,
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
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
        confirm ban
      </button>
      <button type="button" onClick={onClose}>
        close ban
      </button>
    </section>
  ),
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
        confirm remove
      </button>
      <button type="button" onClick={onClose}>
        close remove
      </button>
    </section>
  ),
}));

const member = (input: Partial<GuildMember> = {}): GuildMember => ({
  userId: input.userId ?? 'member-1',
  username: input.username ?? 'alice',
  displayName: input.displayName === undefined ? 'Alice' : input.displayName,
  avatarFileId: input.avatarFileId ?? 'avatar-1',
  avatar: 'avatar' in input ? input.avatar : { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
  bio: 'bio' in input ? input.bio : 'Hello',
  isActive: input.isActive ?? true,
  role: input.role ?? 'Member',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
});

const anchorRect = new DOMRect(1, 2, 3, 4);

describe('MemberPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canBanMember.mockReturnValue(true);
    mocks.canRemoveMember.mockReturnValue(true);
    mocks.fetchGuildMembers.mockResolvedValue(undefined);
    mocks.openDirectConversation.mockResolvedValue(undefined);
    mocks.theme = 'light';
    mocks.user = { userId: 'current-user' };
    mocks.guild = { guildId: 'guild-1', ownerUserId: 'owner-1' };
  });

  it('renders identity, badges, and opens a direct conversation', async () => {
    const onClose = vi.fn();

    render(
      <MemberPopover
        member={member({ userId: 'owner-1' })}
        guildId="guild-1"
        anchorRect={anchorRect}
        onClose={onClose}
        side="right"
      />
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('guild.members.popover.bioLabel:Hello')).toBeInTheDocument();
    expect(screen.getByText('badge:Member')).toBeInTheDocument();
    expect(screen.getByText('badge:guild.members.popover.ownerLabel')).toHaveAttribute(
      'data-variant',
      'owner'
    );
    expect(screen.getByText('blob:avatar-1')).toHaveAttribute('data-avatar-icon', 'Rocket');
    expect(screen.getByText('blob:avatar-1').closest('section')).toHaveAttribute(
      'data-header',
      'gradient:owner-1:false'
    );

    fireEvent.click(screen.getByRole('button', { name: 'conversation.sendDirectMessage' }));

    await waitFor(() =>
      expect(mocks.openDirectConversation).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'owner-1' })
      )
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens remove and ban modals and refreshes members after confirmation', () => {
    const onClose = vi.fn();
    const onRemoved = vi.fn();
    const onBanned = vi.fn();

    render(
      <MemberPopover
        member={member()}
        guildId="guild-1"
        anchorRect={anchorRect}
        onClose={onClose}
        onRemoved={onRemoved}
        onBanned={onBanned}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'guild.members.kickAction' }));
    expect(screen.getByText('remove modal:alice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'confirm remove' }));
    expect(mocks.fetchGuildMembers).toHaveBeenCalledWith('guild-1', true);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRemoved).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.banAction' }));
    expect(screen.getByText('ban modal:alice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'confirm ban' }));
    expect(mocks.fetchGuildMembers).toHaveBeenCalledWith('guild-1', true);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onBanned).toHaveBeenCalledTimes(1);
  });

  it('hides unavailable actions and uses fallback avatar values', async () => {
    mocks.user = { userId: 'member-1' };
    mocks.guild = null;
    mocks.theme = 'midnight-obsidian';
    mocks.canBanMember.mockReturnValue(false);
    mocks.canRemoveMember.mockReturnValue(false);
    mocks.openDirectConversation.mockRejectedValueOnce(new Error('ignored'));

    render(
      <MemberPopover
        member={member({
          displayName: null,
          avatarFileId: null,
          avatar: undefined,
          bio: undefined,
        })}
        anchorRect={anchorRect}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'conversation.sendDirectMessage' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'guild.members.kickAction' })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'guild.bans.banAction' })).not.toBeInTheDocument();
    expect(screen.getByText('badge:Member')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-avatar-icon', 'PawPrint');
    expect(screen.getByTestId('avatar')).toHaveAttribute(
      'data-avatar-color',
      'var(--color-cat-1-fg)'
    );
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-avatar-bg', 'var(--color-cat-1)');
  });

  it('closes moderation modals without refreshing and swallows direct message failures', async () => {
    const onClose = vi.fn();
    mocks.openDirectConversation.mockRejectedValueOnce(new Error('conversation failed'));

    render(
      <MemberPopover
        member={member()}
        guildId="guild-1"
        anchorRect={anchorRect}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'conversation.sendDirectMessage' }));
    await waitFor(() =>
      expect(mocks.openDirectConversation).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'member-1' })
      )
    );
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'guild.members.kickAction' }));
    expect(screen.getByText('remove modal:alice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close remove' }));
    expect(screen.queryByText('remove modal:alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.banAction' }));
    expect(screen.getByText('ban modal:alice')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close ban' }));
    expect(screen.queryByText('ban modal:alice')).not.toBeInTheDocument();

    expect(mocks.fetchGuildMembers).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
