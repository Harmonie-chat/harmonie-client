import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { GuildMember } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemberRow } from './MemberRow';

const mocks = vi.hoisted(() => ({
  banMember: vi.fn(),
  removeMember: vi.fn(),
  transferOwnership: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { name?: string }) => (values?.name ? `${key}:${values.name}` : key),
  }),
}));

vi.mock('@harmonie/ui', () => ({
  Badge: ({ children, variant }: { children: ReactNode; variant: string }) => (
    <span data-variant={variant}>{children}</span>
  ),
  Button: ({
    children,
    disabled,
    isLoading,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void;
  }) => (
    <button type="button" disabled={disabled || isLoading} onClick={onClick}>
      {children}
    </button>
  ),
  IconButton: ({
    'aria-label': ariaLabel,
    children,
    onClick,
  }: {
    'aria-label': string;
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  Input: ({
    disabled,
    onChange,
    placeholder,
    value,
  }: {
    disabled?: boolean;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder: string;
    value: string;
  }) => <input disabled={disabled} onChange={onChange} placeholder={placeholder} value={value} />,
  Select: ({
    'aria-label': ariaLabel,
    disabled,
    onChange,
    options,
    value,
  }: {
    'aria-label': string;
    disabled?: boolean;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    value: string;
  }) => (
    <select
      aria-label={ariaLabel}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock('@/api/guilds', () => ({
  banMember: (...args: unknown[]) => mocks.banMember(...args),
  removeMember: (...args: unknown[]) => mocks.removeMember(...args),
  transferOwnership: (...args: unknown[]) => mocks.transferOwnership(...args),
}));

vi.mock('@/features/guild/members/shared/GuildMemberCard', () => ({
  GuildMemberCard: ({ children, extra }: { children: ReactNode; extra?: ReactNode }) => (
    <article>
      <div>{children}</div>
      {extra ? <aside>{extra}</aside> : null}
    </article>
  ),
}));

vi.mock('@/features/guild/members/shared/GuildMemberIdentity', () => ({
  GuildMemberIdentity: ({ label, subtitle }: { label: string; subtitle?: string }) => (
    <div>
      <strong>{label}</strong>
      {subtitle ? <span>{subtitle}</span> : null}
    </div>
  ),
}));

const member: GuildMember = {
  userId: 'member-1',
  username: 'alice',
  displayName: 'Alice',
  avatarFileId: null,
  avatar: { icon: 'PawPrint', color: '#111111', bg: '#eeeeee' },
  isActive: true,
  role: 'Member',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
};

const permissions = {
  isOwner: false,
  canRemove: true,
  canBan: true,
  canEditRole: true,
  canTransferOwnership: true,
};

const renderRow = (overrides?: Partial<React.ComponentProps<typeof MemberRow>>) =>
  render(
    <MemberRow
      member={member}
      guildId="guild-1"
      permissions={permissions}
      roleState={{ isChangingRole: false }}
      onRemoved={vi.fn()}
      onBanned={vi.fn()}
      onRoleChange={vi.fn()}
      onOwnershipTransferred={vi.fn()}
      {...overrides}
    />
  );

describe('MemberRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders owner and read-only role states', () => {
    const { rerender } = renderRow({
      permissions: { ...permissions, isOwner: true, canEditRole: false },
    });

    expect(screen.getByText('guild.members.popover.ownerLabel')).toHaveAttribute(
      'data-variant',
      'owner'
    );

    rerender(
      <MemberRow
        member={{ ...member, displayName: null, role: 'Admin' }}
        guildId="guild-1"
        permissions={{ ...permissions, canEditRole: false }}
        roleState={{ isChangingRole: false }}
        onRemoved={vi.fn()}
        onBanned={vi.fn()}
        onRoleChange={vi.fn()}
        onOwnershipTransferred={vi.fn()}
      />
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toHaveAttribute('data-variant', 'default');
  });

  it('changes role with the selected value and disables while role is changing', () => {
    const onRoleChange = vi.fn();

    renderRow({ onRoleChange, roleState: { isChangingRole: true } });

    expect(screen.getByLabelText('guild.members.admin.roleLabel')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('guild.members.admin.roleLabel'), {
      target: { value: 'Admin' },
    });

    expect(onRoleChange).toHaveBeenCalledWith('member-1', 'Admin');
  });

  it('confirms member removal and can cancel confirmation', async () => {
    const onRemoved = vi.fn();
    mocks.removeMember.mockResolvedValue(undefined);

    renderRow({ onRemoved });

    fireEvent.click(screen.getByLabelText('guild.members.kickAction'));
    expect(screen.getByText('guild.members.admin.confirmKick:Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.members.admin.cancel' }));
    expect(screen.queryByText('guild.members.admin.confirmKick:Alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('guild.members.kickAction'));
    fireEvent.click(screen.getByRole('button', { name: 'guild.members.kickAction' }));

    await waitFor(() => expect(mocks.removeMember).toHaveBeenCalledWith('guild-1', 'member-1'));
    expect(onRemoved).toHaveBeenCalledWith('member-1');
  });

  it('confirms bans with a trimmed reason and clears failed ban state', async () => {
    const onBanned = vi.fn();
    mocks.banMember.mockResolvedValueOnce(undefined);

    const { unmount } = renderRow({ onBanned });

    fireEvent.click(screen.getByLabelText('guild.bans.banAction'));
    fireEvent.change(screen.getByPlaceholderText('guild.bans.reasonPlaceholder'), {
      target: { value: '  repeated spam  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.banAction' }));

    await waitFor(() =>
      expect(mocks.banMember).toHaveBeenCalledWith('guild-1', {
        userId: 'member-1',
        reason: 'repeated spam',
        purgeMessagesDays: 0,
      })
    );
    expect(onBanned).toHaveBeenCalledWith('member-1');

    unmount();

    mocks.banMember.mockRejectedValueOnce(new Error('nope'));
    renderRow({ onBanned });

    fireEvent.click(screen.getByLabelText('guild.bans.banAction'));
    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.banAction' }));

    await waitFor(() =>
      expect(mocks.banMember).toHaveBeenLastCalledWith('guild-1', {
        userId: 'member-1',
        reason: null,
        purgeMessagesDays: 0,
      })
    );
    expect(screen.queryByText('guild.members.admin.confirmBan:Alice')).not.toBeInTheDocument();
  });

  it('confirms ownership transfer and resets confirmation after failures', async () => {
    const onOwnershipTransferred = vi.fn();
    mocks.transferOwnership
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('nope'));

    renderRow({ onOwnershipTransferred });

    fireEvent.click(screen.getByLabelText('guild.members.admin.transferOwnershipAction'));
    expect(
      screen.getByText('guild.members.admin.confirmTransferOwnership:Alice')
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'guild.members.admin.transferOwnershipAction' })
    );

    await waitFor(() =>
      expect(mocks.transferOwnership).toHaveBeenCalledWith('guild-1', 'member-1')
    );
    expect(onOwnershipTransferred).toHaveBeenCalledTimes(1);

    screen.getByText('guild.members.admin.confirmTransferOwnership:Alice');
  });

  it('resets ownership transfer confirmation after failures', async () => {
    mocks.transferOwnership.mockRejectedValueOnce(new Error('nope'));

    renderRow();

    fireEvent.click(screen.getByLabelText('guild.members.admin.transferOwnershipAction'));
    fireEvent.click(
      screen.getByRole('button', { name: 'guild.members.admin.transferOwnershipAction' })
    );

    await waitFor(() =>
      expect(mocks.transferOwnership).toHaveBeenCalledWith('guild-1', 'member-1')
    );
    expect(
      screen.queryByText('guild.members.admin.confirmTransferOwnership:Alice')
    ).not.toBeInTheDocument();
  });
});
