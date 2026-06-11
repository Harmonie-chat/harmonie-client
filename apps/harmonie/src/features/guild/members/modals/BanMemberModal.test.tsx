import { fireEvent, render, screen } from '@testing-library/react';
import type { ChangeEvent, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuildMember } from '@/types/guild';
import { BanMemberModal } from './BanMemberModal';

const banMember = vi.hoisted(() => vi.fn());

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
  Input: ({
    label,
    onChange,
    placeholder,
    value,
  }: {
    label: string;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    value: string;
  }) => <input aria-label={label} onChange={onChange} placeholder={placeholder} value={value} />,
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
  banMember: (...args: unknown[]) => banMember(...args),
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

describe('BanMemberModal', () => {
  beforeEach(() => {
    banMember.mockReset();
  });

  it('bans a member with a trimmed reason and closes through cancel', async () => {
    const onClose = vi.fn();
    const onBanned = vi.fn();
    banMember.mockResolvedValue({});

    render(
      <BanMemberModal guildId="guild-1" member={member} onClose={onClose} onBanned={onBanned} />
    );

    expect(screen.getByRole('dialog', { name: 'guild.bans.modalTitle:Alice' })).toHaveAttribute(
      'data-close-label',
      'guild.bans.cancel'
    );
    expect(screen.getByText('guild.bans.modalDescription:Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.bans.reasonLabel' }), {
      target: { value: '  spam  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.confirm' }));

    expect(banMember).toHaveBeenCalledWith('guild-1', {
      userId: 'user-1',
      reason: 'spam',
      purgeMessagesDays: 0,
    });
    expect(await screen.findByRole('button', { name: 'guild.bans.confirm' })).toHaveAttribute(
      'data-loading',
      'true'
    );
    expect(onBanned).toHaveBeenCalledWith('user-1');
  });

  it('sends null for empty reason and shows errors', async () => {
    banMember.mockRejectedValue(new Error('nope'));

    render(
      <BanMemberModal
        guildId="guild-1"
        member={{ ...member, displayName: null }}
        onClose={vi.fn()}
        onBanned={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: 'guild.bans.modalTitle:alice' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.bans.reasonLabel' }), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'guild.bans.confirm' }));

    expect(banMember).toHaveBeenCalledWith('guild-1', {
      userId: 'user-1',
      reason: null,
      purgeMessagesDays: 0,
    });
    expect(await screen.findByText('guild.bans.error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'guild.bans.confirm' })).toHaveAttribute(
      'data-loading',
      'false'
    );
  });
});
