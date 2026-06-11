import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuildBan } from '@/types/guild';
import { BanItem } from './BanItem';

const unbanMember = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { name?: string }) => (values?.name ? `${key}:${values.name}` : key),
  }),
}));

vi.mock('@harmonie/ui', () => ({
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
    <button type="button" disabled={disabled} data-loading={String(isLoading)} onClick={onClick}>
      {children}
    </button>
  ),
  IconButton: ({
    children,
    onClick,
    title,
  }: {
    children: ReactNode;
    onClick: () => void;
    title?: string;
  }) => (
    <button type="button" aria-label={title} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/api/guilds', () => ({
  unbanMember: (...args: unknown[]) => unbanMember(...args),
}));

vi.mock('@/features/guild/members/shared/GuildMemberCard', () => ({
  GuildMemberCard: ({ children }: { children: ReactNode }) => <li>{children}</li>,
}));

vi.mock('@/features/guild/members/shared/GuildMemberIdentity', () => ({
  GuildMemberIdentity: ({ label, subtitle }: { label: string; subtitle?: string }) => (
    <span>
      {label}
      {subtitle ? `:${subtitle}` : ''}
    </span>
  ),
}));

const ban: GuildBan = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  avatarFileId: null,
  avatar: { icon: null, color: null, bg: null },
  reason: 'spam',
  bannedBy: 'admin',
  createdAtUtc: '2026-01-01T00:00:00.000Z',
};

describe('BanItem', () => {
  beforeEach(() => {
    unbanMember.mockReset();
  });

  it('confirms, cancels, and unbans a member', async () => {
    const onUnbanned = vi.fn();
    unbanMember.mockResolvedValue(undefined);

    render(<BanItem ban={ban} guildId="guild-1" onUnbanned={onUnbanned} />);

    expect(screen.getByText('Alice:spam')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.unban' }));
    expect(screen.getByText('guild.bans.confirmUnban:Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.cancel' }));
    expect(screen.queryByText('guild.bans.confirmUnban:Alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.unban' }));
    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.unban' }));

    expect(unbanMember).toHaveBeenCalledWith('guild-1', 'user-1');
    await waitFor(() => expect(onUnbanned).toHaveBeenCalledWith('user-1'));
    expect(screen.queryByText('guild.bans.confirmUnban:Alice')).not.toBeInTheDocument();
  });

  it('falls back to username when display name and reason are missing', () => {
    render(
      <BanItem
        ban={{ ...ban, displayName: null, reason: null }}
        guildId="guild-1"
        onUnbanned={vi.fn()}
      />
    );

    expect(screen.getByText('alice')).toBeInTheDocument();
  });
});
