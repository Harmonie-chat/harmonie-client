import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildJoinForm } from './GuildJoinForm';

const mocks = vi.hoisted(() => ({
  fetchGuilds: vi.fn(),
  joinGuild: vi.fn(),
  useInvitePreview: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { count?: number }) =>
      values?.count === undefined ? key : `${key}:${values.count}`,
  }),
}));

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    disabled,
    isLoading,
    type,
  }: {
    children: ReactNode;
    disabled?: boolean;
    isLoading?: boolean;
    type?: 'button' | 'submit';
  }) => (
    <button type={type ?? 'button'} disabled={disabled} data-loading={String(isLoading)}>
      {children}
    </button>
  ),
  GuildAvatar: ({
    bg,
    color,
    icon,
    iconUrl,
    size,
  }: {
    bg?: string;
    color?: string;
    icon?: string;
    iconUrl?: string | null;
    size: number;
  }) => (
    <span
      data-bg={bg ?? ''}
      data-color={color ?? ''}
      data-icon={icon ?? ''}
      data-icon-url={iconUrl ?? ''}
      data-size={size}
      data-testid="guild-avatar"
    />
  ),
  Input: ({
    autoFocus,
    error,
    label,
    onChange,
    placeholder,
    value,
  }: {
    autoFocus?: boolean;
    error?: string;
    label: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    value: string;
  }) => (
    <label>
      {label}
      <input
        autoFocus={autoFocus}
        aria-label={label}
        data-error={error ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        value={value}
      />
    </label>
  ),
}));

vi.mock('@/api/guilds', () => ({
  joinGuild: (...args: unknown[]) => mocks.joinGuild(...args),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => ({ fetchGuilds: mocks.fetchGuilds }),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/features/guild/join/useInvitePreview', () => ({
  useInvitePreview: (...args: unknown[]) => mocks.useInvitePreview(...args),
}));

describe('GuildJoinForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useInvitePreview.mockReturnValue({
      preview: null,
      isLoading: false,
      notFound: false,
    });
  });

  it('renders the empty state and keeps submit disabled without a preview', () => {
    render(<GuildJoinForm onSuccess={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'guild.createJoin.joinButton' })).toBeDisabled();
    expect(screen.getByText('———')).toBeInTheDocument();
    expect(screen.getByText('——')).toBeInTheDocument();
  });

  it('renders loading and not found preview states', () => {
    const { rerender } = render(<GuildJoinForm onSuccess={vi.fn()} />);

    mocks.useInvitePreview.mockReturnValue({
      preview: null,
      isLoading: true,
      notFound: false,
    });
    rerender(<GuildJoinForm onSuccess={vi.fn()} />);
    expect(screen.queryByText('———')).not.toBeInTheDocument();

    mocks.useInvitePreview.mockReturnValue({
      preview: null,
      isLoading: false,
      notFound: true,
    });
    rerender(<GuildJoinForm onSuccess={vi.fn()} />);
    expect(screen.getByText('guild.createJoin.previewNotFound')).toBeInTheDocument();
  });

  it('joins a guild from a trimmed invite code and refreshes guilds', async () => {
    const onSuccess = vi.fn();
    mocks.useInvitePreview.mockReturnValue({
      preview: {
        guildName: 'Design Guild',
        guildIconFileId: 'icon-1',
        guildIcon: { name: 'Sparkles', color: '#111111', bg: '#eeeeee' },
        memberCount: 7,
      },
      isLoading: false,
      notFound: false,
    });
    mocks.joinGuild.mockResolvedValue({});

    render(<GuildJoinForm onSuccess={onSuccess} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.createJoin.joinCodeLabel' }), {
      target: { value: '  invite-code  ' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.createJoin.joinButton' }));

    expect(await screen.findByText('Design Guild')).toBeInTheDocument();
    expect(screen.getByText('guild.createJoin.previewMembers:7')).toBeInTheDocument();
    expect(screen.getByTestId('guild-avatar')).toHaveAttribute('data-icon-url', 'blob:icon-1');
    expect(mocks.joinGuild).toHaveBeenCalledWith('invite-code');
    expect(mocks.fetchGuilds).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('maps banned join errors and clears them when typing again', async () => {
    mocks.useInvitePreview.mockReturnValue({
      preview: {
        guildName: 'Design Guild',
        guildIconFileId: null,
        guildIcon: null,
        memberCount: 1,
      },
      isLoading: false,
      notFound: false,
    });
    mocks.joinGuild.mockRejectedValue({ code: 'GUILD_USER_BANNED' });

    render(<GuildJoinForm onSuccess={vi.fn()} />);

    const input = screen.getByRole('textbox', { name: 'guild.createJoin.joinCodeLabel' });
    fireEvent.change(input, { target: { value: 'banned' } });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.createJoin.joinButton' }));

    expect(
      await screen.findByRole('textbox', { name: 'guild.createJoin.joinCodeLabel' })
    ).toHaveAttribute('data-error', 'guild.createJoin.joinErrorBanned');

    fireEvent.change(input, { target: { value: 'new-code' } });
    expect(input).toHaveAttribute('data-error', '');
  });

  it('maps generic join errors', async () => {
    mocks.useInvitePreview.mockReturnValue({
      preview: {
        guildName: 'Design Guild',
        guildIconFileId: null,
        guildIcon: null,
        memberCount: 1,
      },
      isLoading: false,
      notFound: false,
    });
    mocks.joinGuild.mockRejectedValue(new Error('nope'));

    render(<GuildJoinForm onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'guild.createJoin.joinCodeLabel' }), {
      target: { value: 'broken' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'guild.createJoin.joinButton' }));

    expect(
      await screen.findByRole('textbox', { name: 'guild.createJoin.joinCodeLabel' })
    ).toHaveAttribute('data-error', 'guild.createJoin.joinError');
  });
});
