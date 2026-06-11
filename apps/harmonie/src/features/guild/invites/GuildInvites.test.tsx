import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { GuildInvite } from '@/types/guild';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildInvites } from './GuildInvites';

const mocks = vi.hoisted(() => ({
  createGuildInvite: vi.fn(),
  listGuildInvites: vi.fn(),
  revokeGuildInvite: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { count?: number; max?: number }) =>
      values ? `${key}:${values.count ?? ''}:${values.max ?? ''}` : key,
  }),
}));

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    disabled,
    isLoading,
    onClick,
    title,
  }: {
    children: ReactNode;
    disabled?: boolean;
    isLoading?: boolean;
    onClick?: () => void;
    title?: string;
  }) => (
    <button type="button" aria-label={title} disabled={disabled || isLoading} onClick={onClick}>
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
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder: string;
    value: string;
  }) => (
    <label>
      {label}
      <input placeholder={placeholder} value={value} onChange={onChange} />
    </label>
  ),
  RowCard: ({ children }: { children: ReactNode }) => <li>{children}</li>,
}));

vi.mock('@/api/guilds', () => ({
  createGuildInvite: (...args: unknown[]) => mocks.createGuildInvite(...args),
  listGuildInvites: (...args: unknown[]) => mocks.listGuildInvites(...args),
  revokeGuildInvite: (...args: unknown[]) => mocks.revokeGuildInvite(...args),
}));

const invite = (input: Partial<GuildInvite> = {}): GuildInvite => ({
  code: input.code ?? 'ABC123',
  creatorId: input.creatorId ?? 'creator-1',
  usesCount: input.usesCount ?? 2,
  maxUses: input.maxUses === undefined ? 5 : input.maxUses,
  expiresAtUtc: input.expiresAtUtc ?? null,
  createdAtUtc: input.createdAtUtc ?? '2026-01-01T00:00:00.000Z',
  revokedAtUtc: input.revokedAtUtc ?? null,
  isExpired: input.isExpired ?? false,
});

describe('GuildInvites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('loads active invites, copies a code, and revokes successfully', async () => {
    mocks.listGuildInvites.mockResolvedValue({
      guildId: 'guild-1',
      invites: [
        invite({ code: 'ACTIVE', maxUses: 3, usesCount: 1 }),
        invite({ code: 'REVOKED', revokedAtUtc: '2026-01-02T00:00:00.000Z' }),
        invite({ code: 'EXPIRED', isExpired: true }),
      ],
    });
    mocks.revokeGuildInvite.mockResolvedValue(undefined);

    render(<GuildInvites guildId="guild-1" />);

    expect(screen.getByText('guild.invites.loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ACTIVE')).toBeInTheDocument());
    expect(screen.queryByText('REVOKED')).not.toBeInTheDocument();
    expect(screen.queryByText('EXPIRED')).not.toBeInTheDocument();
    expect(screen.getByText('guild.invites.usesOf:1:3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.invites.copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('ACTIVE');
    await waitFor(() => expect(screen.getByText('guild.invites.copied')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'guild.invites.revoke' }));

    await waitFor(() => expect(mocks.revokeGuildInvite).toHaveBeenCalledWith('guild-1', 'ACTIVE'));
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument();
    expect(screen.getByText('guild.invites.empty')).toBeInTheDocument();
  });

  it('creates invites with parsed max uses and shows create errors', async () => {
    mocks.listGuildInvites.mockResolvedValue({ guildId: 'guild-1', invites: [] });
    mocks.createGuildInvite
      .mockResolvedValueOnce({
        code: 'NEW',
        creatorId: 'creator-1',
        usesCount: 0,
        maxUses: 10,
        expiresAtUtc: null,
        createdAtUtc: '2026-01-01T00:00:00.000Z',
      })
      .mockRejectedValueOnce(new Error('nope'));

    render(<GuildInvites guildId="guild-1" />);

    await waitFor(() => expect(screen.getByText('guild.invites.empty')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('guild.invites.maxUsesLabel'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guild.invites.create/ }));

    await waitFor(() =>
      expect(mocks.createGuildInvite).toHaveBeenCalledWith('guild-1', {
        maxUses: 10,
        expiresInHours: null,
      })
    );
    expect(screen.getByText('NEW')).toBeInTheDocument();
    expect(screen.getByText('guild.invites.usesOf:0:10')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('guild.invites.maxUsesLabel'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guild.invites.create/ }));

    await waitFor(() => expect(screen.getByText('guild.invites.createError')).toBeInTheDocument());
    expect(mocks.createGuildInvite).toHaveBeenLastCalledWith('guild-1', {
      maxUses: null,
      expiresInHours: null,
    });
  });

  it('keeps invites when loading or revoking fails', async () => {
    mocks.listGuildInvites.mockRejectedValueOnce(new Error('load failed'));

    const { rerender } = render(<GuildInvites guildId="guild-2" />);
    await waitFor(() => expect(screen.getByText('guild.invites.empty')).toBeInTheDocument());

    mocks.listGuildInvites.mockResolvedValueOnce({
      guildId: 'guild-3',
      invites: [invite({ code: 'KEEP', maxUses: null, usesCount: 4 })],
    });
    mocks.revokeGuildInvite.mockRejectedValueOnce(new Error('revoke failed'));
    rerender(<GuildInvites guildId="guild-3" />);

    await waitFor(() => expect(screen.getByText('KEEP')).toBeInTheDocument());
    expect(screen.getByText('guild.invites.uses:4:')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.invites.revoke' }));
    await waitFor(() => expect(mocks.revokeGuildInvite).toHaveBeenCalledWith('guild-3', 'KEEP'));
    expect(screen.getByText('KEEP')).toBeInTheDocument();
  });
});
