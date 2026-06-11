import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuildMember } from '@/types/guild';
import { RemoveMemberModal } from './RemoveMemberModal';

const removeMember = vi.hoisted(() => vi.fn());

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
  Modal: ({
    children,
    closeLabel,
    onClose,
    title,
  }: {
    children: ReactNode;
    closeLabel: string;
    onClose: () => void;
    title: string;
  }) => (
    <section role="dialog" aria-label={title} data-close-label={closeLabel}>
      <button type="button" onClick={onClose}>
        close modal
      </button>
      {children}
    </section>
  ),
}));

vi.mock('@/api/guilds', () => ({
  removeMember: (...args: unknown[]) => removeMember(...args),
}));

const member: GuildMember = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  avatarFileId: null,
  avatar: { icon: 'PawPrint', color: '#111111', bg: '#eeeeee' },
  isActive: true,
  role: 'Member',
  joinedAtUtc: '2026-01-01T00:00:00.000Z',
};

describe('RemoveMemberModal', () => {
  beforeEach(() => {
    removeMember.mockReset();
  });

  it('removes a member and closes through cancel', async () => {
    const onClose = vi.fn();
    const onRemoved = vi.fn();
    removeMember.mockResolvedValue(undefined);

    render(
      <RemoveMemberModal
        guildId="guild-1"
        member={member}
        onClose={onClose}
        onRemoved={onRemoved}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'guild.members.removeModal.title:Alice' })
    ).toHaveAttribute('data-close-label', 'guild.members.removeModal.cancel');
    expect(screen.getByText('guild.members.removeModal.description:Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.members.removeModal.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'guild.members.removeModal.confirm' }));

    expect(removeMember).toHaveBeenCalledWith('guild-1', 'user-1');
    expect(
      await screen.findByRole('button', { name: 'guild.members.removeModal.confirm' })
    ).toHaveAttribute('data-loading', 'true');
    expect(onRemoved).toHaveBeenCalledWith('user-1');
  });

  it('falls back to username and shows removal errors', async () => {
    removeMember.mockRejectedValue(new Error('nope'));

    render(
      <RemoveMemberModal
        guildId="guild-1"
        member={{ ...member, displayName: null }}
        onClose={vi.fn()}
        onRemoved={vi.fn()}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'guild.members.removeModal.title:alice' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.members.removeModal.confirm' }));

    expect(await screen.findByText('guild.members.removeModal.error')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'guild.members.removeModal.confirm' })
    ).toHaveAttribute('data-loading', 'false');
  });
});
