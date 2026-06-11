import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GuildMemberCard } from './GuildMemberCard';
import { GuildMemberIdentity } from './GuildMemberIdentity';

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    alt,
    avatarUrl,
    bg,
    color,
    icon,
    size,
  }: {
    alt: string;
    avatarUrl: string | null;
    bg: string;
    color: string;
    icon: string;
    size: number;
  }) => (
    <span
      data-alt={alt}
      data-avatar-url={avatarUrl ?? ''}
      data-bg={bg}
      data-color={color}
      data-icon={icon}
      data-size={size}
      data-testid="avatar"
    />
  ),
  RowCard: ({ children, className }: { children: ReactNode; className?: string }) => (
    <article data-class-name={className ?? ''}>{children}</article>
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

describe('Guild member shared components', () => {
  it('renders member card identity with avatar and extra content', () => {
    render(
      <GuildMemberCard
        user={{
          username: 'alice',
          displayName: 'Alice',
          avatarFileId: 'avatar-1',
          avatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
        }}
        extra={<button type="button">extra action</button>}
      >
        <GuildMemberIdentity label="Alice" subtitle="Admin" />
      </GuildMemberCard>
    );

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-alt', 'Alice');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-avatar-url', 'blob:avatar-1');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-icon', 'Rocket');
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'extra action' })).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveAttribute(
      'data-class-name',
      'flex-col gap-2 items-stretch'
    );
  });

  it('falls back to username and default avatar values without extra content', () => {
    render(
      <GuildMemberCard user={{ username: 'fallback', displayName: null }}>
        <GuildMemberIdentity label="fallback" />
      </GuildMemberCard>
    );

    expect(screen.getByTestId('avatar')).toHaveAttribute('data-alt', 'fallback');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-avatar-url', '');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', 'var(--color-cat-1-fg)');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-bg', 'var(--color-cat-1)');
    expect(screen.getByRole('article')).toHaveAttribute('data-class-name', '');
  });
});
