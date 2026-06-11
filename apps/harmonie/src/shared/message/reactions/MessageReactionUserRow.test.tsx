import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MessageReactionUserRow } from './MessageReactionUserRow';

const useFileBlobUrlMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: useFileBlobUrlMock,
}));

vi.mock('@harmonie/ui', async () => {
  const actual = await vi.importActual<typeof import('@harmonie/ui')>('@harmonie/ui');
  return {
    ...actual,
    Avatar: ({ alt, avatarUrl }: { alt: string; avatarUrl?: string }) => (
      <img alt={alt} src={avatarUrl || undefined} />
    ),
  };
});

describe('MessageReactionUserRow', () => {
  it('renders display name, username, and mapped avatar', () => {
    useFileBlobUrlMock.mockReturnValue('blob:avatar');

    render(
      <MessageReactionUserRow
        user={{ userId: 'user-1', username: 'ada', displayName: 'Ada' }}
        mappedUser={{
          userId: 'user-1',
          username: 'ada',
          displayName: 'Ada',
          avatarFileId: 'avatar-1',
          avatar: { icon: 'User', color: '#111111', bg: '#ffffff' },
        }}
      />
    );

    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Ada' })).toHaveAttribute('src', 'blob:avatar');
  });

  it('falls back to username without a mapped profile', () => {
    useFileBlobUrlMock.mockReturnValue(undefined);

    render(<MessageReactionUserRow user={{ userId: 'user-1', username: 'ada' }} />);

    expect(screen.getByText('ada')).toBeInTheDocument();
    expect(screen.queryByText('@ada')).not.toBeInTheDocument();
  });
});
