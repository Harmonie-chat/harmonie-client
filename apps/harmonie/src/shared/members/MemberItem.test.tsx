import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemberItem } from './MemberItem';
import type { GuildMember } from '@/types/guild';

const useFileBlobUrlMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: useFileBlobUrlMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => `translated:${key}`,
  }),
}));

vi.mock('@harmonie/ui', async () => {
  const actual = await vi.importActual<typeof import('@harmonie/ui')>('@harmonie/ui');
  return {
    ...actual,
    UserListItem: ({
      label,
      subtitle,
      avatarUrl,
      avatarIcon,
      avatarColor,
      avatarBg,
      onSelect,
      contextItems,
      user,
    }: {
      label: string;
      subtitle: string;
      avatarUrl?: string;
      avatarIcon: string;
      avatarColor: string;
      avatarBg: string;
      onSelect: (member: GuildMember, rect: DOMRect) => void;
      contextItems: { label: string; onClick: () => void }[];
      user: GuildMember;
    }) => (
      <div>
        <button type="button" onClick={() => onSelect(user, new DOMRect())}>
          {label}
        </button>
        <span>{subtitle}</span>
        <span
          data-testid="avatar-props"
          data-icon={avatarIcon}
          data-color={avatarColor}
          data-bg={avatarBg}
        >
          {avatarUrl ?? 'no-avatar-url'}
        </span>
        {contextItems.map((item) => (
          <button key={item.label} type="button" onClick={item.onClick}>
            {item.label}
          </button>
        ))}
      </div>
    ),
  };
});

const member = (input: Partial<GuildMember> = {}): GuildMember => ({
  userId: 'user-1',
  username: 'ada',
  displayName: 'Ada',
  role: 'Admin',
  isActive: true,
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  avatarFileId: 'avatar-1',
  avatar: { icon: 'User', color: '#111111', bg: '#ffffff' },
  ...input,
});

describe('MemberItem', () => {
  it('renders member identity and triggers select and moderation actions', async () => {
    useFileBlobUrlMock.mockReturnValue('blob:avatar');
    const onSelect = vi.fn();
    const onBan = vi.fn();
    const onRemove = vi.fn();

    render(<MemberItem member={member()} onSelect={onSelect} onBan={onBan} onRemove={onRemove} />);

    expect(screen.getByRole('button', { name: 'Ada' })).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('blob:avatar')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-props')).toHaveAttribute('data-icon', 'User');
    expect(screen.getByTestId('avatar-props')).toHaveAttribute('data-color', '#111111');
    expect(screen.getByTestId('avatar-props')).toHaveAttribute('data-bg', '#ffffff');

    await userEvent.click(screen.getByRole('button', { name: 'Ada' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'translated:guild.members.kickAction' })
    );
    await userEvent.click(screen.getByRole('button', { name: 'translated:guild.bans.banAction' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    expect(onBan).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });

  it('falls back to the username and hides missing moderation actions', () => {
    render(<MemberItem member={member({ displayName: null })} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'ada' })).toBeInTheDocument();
    expect(screen.queryByText('translated:guild.members.kickAction')).not.toBeInTheDocument();
    expect(screen.queryByText('translated:guild.bans.banAction')).not.toBeInTheDocument();
  });

  it('uses default avatar appearance when the member has no avatar settings', () => {
    useFileBlobUrlMock.mockReturnValue(undefined);

    render(
      <MemberItem
        member={member({ avatar: undefined, avatarFileId: null, displayName: null })}
        onSelect={vi.fn()}
      />
    );

    const avatarProps = screen.getByTestId('avatar-props');

    expect(screen.getByRole('button', { name: 'ada' })).toBeInTheDocument();
    expect(avatarProps).toHaveTextContent('no-avatar-url');
    expect(avatarProps).toHaveAttribute('data-icon', 'PawPrint');
    expect(avatarProps).toHaveAttribute('data-color', 'var(--color-cat-1-fg)');
    expect(avatarProps).toHaveAttribute('data-bg', 'var(--color-cat-1)');
  });

  it('renders remove and ban moderation actions independently', async () => {
    const onRemove = vi.fn();
    const onBan = vi.fn();
    const { rerender } = render(
      <MemberItem member={member()} onSelect={vi.fn()} onRemove={onRemove} />
    );

    expect(
      screen.getByRole('button', { name: 'translated:guild.members.kickAction' })
    ).toBeInTheDocument();
    expect(screen.queryByText('translated:guild.bans.banAction')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'translated:guild.members.kickAction' })
    );

    rerender(<MemberItem member={member()} onSelect={vi.fn()} onBan={onBan} />);

    expect(screen.queryByText('translated:guild.members.kickAction')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'translated:guild.bans.banAction' })
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'translated:guild.bans.banAction' }));

    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
    expect(onBan).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1' }));
  });
});
