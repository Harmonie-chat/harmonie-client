import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MessageReaction, MessageReactionUser } from '@/types/channel';
import type { UserProfile } from '@/types/user';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageReactions } from './MessageReactions';

const mocks = vi.hoisted(() => ({
  getChannelReactionUsers: vi.fn(),
  getConversationReactionUsers: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { names?: string; count?: number }) =>
      values?.names ? `${key}:${values.names}` : values?.count ? `${key}:${values.count}` : key,
  }),
}));

vi.mock('@/api/channels', () => ({
  getChannelReactionUsers: (...args: unknown[]) => mocks.getChannelReactionUsers(...args),
}));

vi.mock('@/api/conversations', () => ({
  getConversationReactionUsers: (...args: unknown[]) => mocks.getConversationReactionUsers(...args),
}));

vi.mock('./MessageReactionTooltip', () => ({
  MessageReactionTooltip: ({
    canOpenDetails,
    emptyLabel,
    id,
    onMouseEnter,
    onMouseLeave,
    onOpenDetails,
    sentence,
  }: {
    canOpenDetails: boolean;
    emptyLabel: string;
    id: string;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onOpenDetails: () => void;
    sentence: string;
  }) => (
    <section role="tooltip" id={id} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span>{sentence || emptyLabel}</span>
      {canOpenDetails && (
        <button type="button" onClick={onOpenDetails}>
          open details
        </button>
      )}
    </section>
  ),
}));

vi.mock('./MessageReactionUsersModal', () => ({
  MessageReactionUsersModal: ({
    error,
    labels,
    loading,
    nextCursor,
    onClose,
    onLoadMore,
    onSelectEmoji,
    selectedReaction,
    users,
  }: {
    error: boolean;
    labels: { close: string; error: string; loading: string; loadMore: string; title: string };
    loading: boolean;
    nextCursor: string | null;
    onClose: () => void;
    onLoadMore: () => void;
    onSelectEmoji: (emoji: string) => void;
    selectedReaction: MessageReaction;
    users: MessageReactionUser[];
  }) => (
    <section role="dialog" aria-label={labels.title}>
      <p>selected:{selectedReaction.emoji}</p>
      <p>users:{users.map((user) => user.username).join(',')}</p>
      {loading && <p>{labels.loading}</p>}
      {error && <p>{labels.error}</p>}
      {nextCursor && (
        <button type="button" onClick={onLoadMore}>
          {labels.loadMore}
        </button>
      )}
      <button type="button" onClick={() => onSelectEmoji('🔥')}>
        select fire
      </button>
      <button type="button" onClick={onClose}>
        {labels.close}
      </button>
    </section>
  ),
}));

const reactions: MessageReaction[] = [
  {
    emoji: '👍',
    count: 2,
    reactedByMe: true,
    users: [
      { userId: 'me', username: 'me', displayName: 'Me' },
      { userId: 'u1', username: 'alice', displayName: 'Alice' },
    ],
  },
  { emoji: '🔥', count: 1, reactedByMe: false, users: [{ userId: 'u2', username: 'bob' }] },
];

const currentUser: UserProfile = {
  userId: 'me',
  username: 'current',
  displayName: 'Current',
  bio: '',
  avatarFileId: null,
  avatar: { icon: 'PawPrint', color: '#111111', bg: '#eeeeee' },
  theme: 'default',
  language: null,
};

describe('MessageReactions', () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    mocks.getChannelReactionUsers.mockResolvedValue({
      messageId: 'message-1',
      emoji: '👍',
      totalCount: 2,
      users: [{ userId: 'u1', username: 'alice', displayName: 'Alice' }],
      nextCursor: 'cursor-2',
    });
    mocks.getConversationReactionUsers.mockResolvedValue({
      messageId: 'message-1',
      emoji: '👍',
      totalCount: 1,
      users: [{ userId: 'u2', username: 'bob', displayName: 'Bob' }],
      nextCursor: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing without reactions', () => {
    const { container } = render(
      <MessageReactions messageId="message-1" reactions={[]} onToggle={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('toggles reactions, shows tooltip, opens channel users, loads more, and closes', async () => {
    const onToggle = vi.fn();

    render(
      <MessageReactions
        messageId="message-1"
        reactions={reactions}
        onToggle={onToggle}
        reactionSource={{ type: 'channel', entityId: 'channel-1' }}
        currentUser={currentUser}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '👍 2' }));
    expect(onToggle).toHaveBeenCalledWith('👍');

    fireEvent.mouseEnter(screen.getByRole('button', { name: '👍 2' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('channel.messages.reactionUsersSentence');

    fireEvent.blur(screen.getByRole('button', { name: '👍 2' }));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.focus(screen.getByRole('button', { name: '👍 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'open details' }));

    expect(
      screen.getByRole('dialog', { name: 'channel.messages.reactionUsersModalTitle' })
    ).toBeInTheDocument();
    expect(mocks.getChannelReactionUsers).toHaveBeenCalledWith('channel-1', 'message-1', '👍');

    await waitFor(() => expect(screen.getByText('users:alice')).toBeInTheDocument());

    mocks.getChannelReactionUsers.mockResolvedValueOnce({
      messageId: 'message-1',
      emoji: '👍',
      totalCount: 2,
      users: [{ userId: 'u3', username: 'carol', displayName: 'Carol' }],
      nextCursor: null,
    });
    fireEvent.click(screen.getByRole('button', { name: 'channel.messages.reactionUsersLoadMore' }));
    await waitFor(() =>
      expect(mocks.getChannelReactionUsers).toHaveBeenLastCalledWith(
        'channel-1',
        'message-1',
        '👍',
        'cursor-2'
      )
    );
    await waitFor(() => expect(screen.getByText('users:alice,carol')).toBeInTheDocument());

    fireEvent.click(
      screen.getByRole('button', { name: 'channel.messages.reactionUsersModalClose' })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses conversation API and exposes error state', async () => {
    mocks.getConversationReactionUsers.mockRejectedValueOnce(new Error('nope'));

    render(
      <MessageReactions
        messageId="message-1"
        reactions={reactions}
        onToggle={vi.fn()}
        reactionSource={{ type: 'conversation', entityId: 'conversation-1' }}
      />
    );

    fireEvent.focus(screen.getByRole('button', { name: '🔥 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'open details' }));

    expect(mocks.getConversationReactionUsers).toHaveBeenCalledWith(
      'conversation-1',
      'message-1',
      '🔥'
    );
    await waitFor(() =>
      expect(screen.getByText('channel.messages.reactionUsersError')).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: 'select fire' }));
    await waitFor(() =>
      expect(mocks.getConversationReactionUsers).toHaveBeenLastCalledWith(
        'conversation-1',
        'message-1',
        '🔥'
      )
    );
  });

  it('does not open details without a reaction source and clears tooltip on blur', () => {
    render(<MessageReactions messageId="message-1" reactions={reactions} onToggle={vi.fn()} />);

    fireEvent.focus(screen.getByRole('button', { name: '🔥 1' }));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    expect(screen.queryByRole('button', { name: 'open details' })).not.toBeInTheDocument();
    fireEvent.blur(screen.getByRole('button', { name: '🔥 1' }));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('delays tooltip close, cancels it on tooltip hover, and clears pending timeouts on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(
      <MessageReactions
        messageId="message-1"
        reactions={reactions}
        onToggle={vi.fn()}
        reactionSource={{ type: 'channel', entityId: 'channel-1' }}
        currentUser={currentUser}
      />
    );

    fireEvent.mouseEnter(screen.getByRole('button', { name: '👍 2' }));
    fireEvent.mouseLeave(screen.getByRole('button', { name: '👍 2' }));
    vi.advanceTimersByTime(99);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('tooltip'));
    vi.advanceTimersByTime(1);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('tooltip'));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
