import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { PinnedMessage, PinnedMessageList } from '@/types/channel';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { describe, expect, it, vi } from 'vitest';
import { PinnedMessagesModal } from './PinnedMessagesModal';

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    isLoading,
    onClick,
  }: {
    children: ReactNode;
    isLoading?: boolean;
    onClick?: () => void;
  }) => (
    <button type="button" disabled={isLoading} onClick={onClick}>
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
    <section aria-label={title}>
      <button type="button" onClick={onClose}>
        {closeLabel}
      </button>
      {children}
    </section>
  ),
}));

vi.mock('./PinnedMessageRow', () => ({
  PinnedMessageRow: ({
    member,
    message,
    onSelect,
    onUnpin,
  }: {
    member?: MessageAuthor;
    message: PinnedMessage;
    onSelect: (messageId: string) => void;
    onUnpin: (messageId: string) => void;
  }) => (
    <article>
      row:{message.messageId}:{member?.username ?? 'unknown'}
      <button type="button" onClick={() => onSelect(message.messageId)}>
        select {message.messageId}
      </button>
      <button type="button" onClick={() => onUnpin(message.messageId)}>
        unpin {message.messageId}
      </button>
    </article>
  ),
}));

const makeMessage = (messageId: string, authorUserId = 'author-1'): PinnedMessage => ({
  messageId,
  authorUserId,
  authorUsername: 'author',
  authorDisplayName: 'Author',
  content: 'Pinned',
  attachments: [],
  createdAtUtc: '2026-01-01T00:00:00.000Z',
  updatedAtUtc: null,
  pinnedByUserId: 'pin-user',
  pinnedAtUtc: '2026-01-01T00:01:00.000Z',
});

const makeList = (items: PinnedMessage[], nextCursor: string | null = null): PinnedMessageList => ({
  channelId: 'channel-1',
  items,
  nextCursor,
});

const renderModal = (
  fetchPinnedMessages: (entityId: string, cursor?: string | null) => Promise<PinnedMessageList>,
  overrides?: Partial<React.ComponentProps<typeof PinnedMessagesModal>>
) =>
  render(
    <PinnedMessagesModal
      entityId="channel-1"
      title="Pinned messages"
      emptyLabel="No pins"
      errorLabel="Could not load pins"
      loadingLabel="Loading pins"
      loadMoreLabel="Load more"
      closeLabel="Close"
      fetchPinnedMessages={fetchPinnedMessages}
      onMessageSelected={vi.fn()}
      onMessageUnpinned={vi.fn()}
      onClose={vi.fn()}
      {...overrides}
    />
  );

describe('PinnedMessagesModal', () => {
  it('loads, deduplicates, paginates, selects, and unpins messages', async () => {
    const fetchPinnedMessages = vi
      .fn()
      .mockResolvedValueOnce(makeList([makeMessage('m1'), makeMessage('m1')], 'cursor-2'))
      .mockResolvedValueOnce(makeList([makeMessage('m2', 'author-2')]));
    const onMessageSelected = vi.fn();
    const onMessageUnpinned = vi.fn();
    const onClose = vi.fn();
    const authorMap = new Map<string, MessageAuthor>([
      ['author-1', { userId: 'author-1', username: 'alice' }],
      ['author-2', { userId: 'author-2', username: 'bob' }],
    ]);

    renderModal(fetchPinnedMessages, {
      authorMap,
      onMessageSelected,
      onMessageUnpinned,
      onClose,
    });

    expect(screen.getByText('Loading pins')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('row:m1:alice')).toBeInTheDocument());
    expect(screen.getAllByText(/row:m1/)).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() =>
      expect(fetchPinnedMessages).toHaveBeenLastCalledWith('channel-1', 'cursor-2')
    );
    expect(screen.getByText('row:m2:bob')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'select m1' }));
    await waitFor(() => expect(onMessageSelected).toHaveBeenCalledWith('m1'));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'unpin m2' }));
    await waitFor(() => expect(onMessageUnpinned).toHaveBeenCalledWith('m2'));
    expect(screen.queryByText('row:m2:bob')).not.toBeInTheDocument();
  });

  it('shows empty and error states', async () => {
    const { rerender } = renderModal(vi.fn().mockResolvedValue(makeList([])));

    await waitFor(() => expect(screen.getByText('No pins')).toBeInTheDocument());

    rerender(
      <PinnedMessagesModal
        entityId="channel-2"
        title="Pinned messages"
        emptyLabel="No pins"
        errorLabel="Could not load pins"
        loadingLabel="Loading pins"
        loadMoreLabel="Load more"
        closeLabel="Close"
        fetchPinnedMessages={vi.fn().mockRejectedValue(new Error('nope'))}
        onMessageSelected={vi.fn()}
        onMessageUnpinned={vi.fn()}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByText('Could not load pins')).toBeInTheDocument());
  });
});
