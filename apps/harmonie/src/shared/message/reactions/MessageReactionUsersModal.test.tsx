import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { MessageReaction, MessageReactionUser } from '@/types/channel';
import { MessageReactionUsersModal } from './MessageReactionUsersModal';

vi.mock('@harmonie/ui', () => ({
  Button: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
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

vi.mock('./MessageReactionUserRow', () => ({
  MessageReactionUserRow: ({
    mappedUser,
    user,
  }: {
    mappedUser?: { displayName?: string | null; username: string };
    user: MessageReactionUser;
  }) => (
    <p>{mappedUser?.displayName ?? mappedUser?.username ?? user.displayName ?? user.username}</p>
  ),
}));

const reactions: MessageReaction[] = [
  { emoji: '👍', count: 2, reactedByMe: true },
  { emoji: '🔥', count: 1, reactedByMe: false },
];

const labels = {
  title: 'Reaction users',
  close: 'Close',
  empty: 'Nobody yet',
  loading: 'Loading users',
  error: 'Could not load users',
  loadMore: 'Load more',
};

describe('MessageReactionUsersModal', () => {
  it('renders users, selects another emoji, loads more, and closes', async () => {
    const onClose = vi.fn();
    const onLoadMore = vi.fn();
    const onSelectEmoji = vi.fn();

    render(
      <MessageReactionUsersModal
        reactions={reactions}
        selectedReaction={reactions[0]}
        users={[{ userId: 'u1', username: 'alice', displayName: 'Alice' }]}
        reactionUserMap={
          new Map([['u1', { userId: 'u1', username: 'mapped', displayName: 'Mapped' }]])
        }
        loading={false}
        error={false}
        nextCursor="cursor-2"
        labels={labels}
        onClose={onClose}
        onSelectEmoji={onSelectEmoji}
        onLoadMore={onLoadMore}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Reaction users' })).toHaveAttribute(
      'data-close-label',
      'Close'
    );
    expect(screen.getByText('Mapped')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '🔥 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await userEvent.click(screen.getByRole('button', { name: 'close modal' }));

    expect(onSelectEmoji).toHaveBeenCalledWith('🔥');
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders empty, loading, and error states', () => {
    const { rerender } = render(
      <MessageReactionUsersModal
        reactions={reactions}
        selectedReaction={reactions[0]}
        users={[]}
        loading={false}
        error={false}
        nextCursor={null}
        labels={labels}
        onClose={vi.fn()}
        onSelectEmoji={vi.fn()}
        onLoadMore={vi.fn()}
      />
    );

    expect(screen.getByText('Nobody yet')).toBeInTheDocument();

    rerender(
      <MessageReactionUsersModal
        reactions={reactions}
        selectedReaction={reactions[0]}
        users={[]}
        loading
        error={false}
        nextCursor="cursor-2"
        labels={labels}
        onClose={vi.fn()}
        onSelectEmoji={vi.fn()}
        onLoadMore={vi.fn()}
      />
    );

    expect(screen.getByText('Loading users')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();

    rerender(
      <MessageReactionUsersModal
        reactions={reactions}
        selectedReaction={reactions[0]}
        users={[]}
        loading={false}
        error
        nextCursor={null}
        labels={labels}
        onClose={vi.fn()}
        onSelectEmoji={vi.fn()}
        onLoadMore={vi.fn()}
      />
    );

    expect(screen.getByText('Could not load users')).toBeInTheDocument();
  });

  it('uses raw reaction users when no mapped user is available', () => {
    render(
      <MessageReactionUsersModal
        reactions={reactions}
        selectedReaction={reactions[0]}
        users={[{ userId: 'u2', username: 'fallback', displayName: null }]}
        loading={false}
        error={false}
        nextCursor={null}
        labels={labels}
        onClose={vi.fn()}
        onSelectEmoji={vi.fn()}
        onLoadMore={vi.fn()}
      />
    );

    expect(screen.getByText('fallback')).toBeInTheDocument();
  });
});
