import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PinnedMessage } from '@/types/channel';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { PinnedMessageRow } from './PinnedMessageRow';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'fr' }, t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    alt,
    avatarUrl,
    bg,
    color,
    icon,
  }: {
    alt: string;
    avatarUrl: string | null;
    bg: string;
    color: string;
    icon: string;
  }) => (
    <span
      data-avatar-url={avatarUrl ?? ''}
      data-bg={bg}
      data-color={color}
      data-icon={icon}
      data-testid="avatar"
    >
      {alt}
    </span>
  ),
  ClickableRowCard: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
    <div role="button" tabIndex={0} onClick={onClick}>
      {children}
    </div>
  ),
  IconButton: ({
    'aria-label': ariaLabel,
    children,
    onClick,
  }: {
    'aria-label': string;
    children: ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/shared/utils/date', () => ({
  formatContextualDateTime: (value: string) => `formatted:${value}`,
}));

vi.mock('./MessageListItem/MessageContent', () => ({
  MessageContent: ({ content }: { content: string }) => <p>content:{content}</p>,
}));

vi.mock('./attachments/MessageAttachments', () => ({
  MessageAttachments: ({ attachments }: { attachments: unknown[] }) => (
    <div data-testid="attachments">attachments:{attachments.length}</div>
  ),
}));

const baseMessage: PinnedMessage = {
  messageId: 'message-1',
  authorUserId: 'author-1',
  authorUsername: 'author',
  authorDisplayName: 'Author',
  content: 'Hello there',
  attachments: [
    { fileId: 'file-1', fileName: 'image.png', contentType: 'image/png', sizeBytes: 123 },
  ],
  createdAtUtc: '2026-01-01T12:00:00.000Z',
  updatedAtUtc: null,
  pinnedByUserId: 'moderator-1',
  pinnedAtUtc: '2026-01-01T13:00:00.000Z',
};

const member: MessageAuthor = {
  userId: 'author-1',
  username: 'alice',
  displayName: 'Alice',
  avatarFileId: 'avatar-1',
  avatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
};

describe('PinnedMessageRow', () => {
  it('renders member data and separates select from unpin actions', () => {
    const onSelect = vi.fn();
    const onUnpin = vi.fn();

    render(
      <PinnedMessageRow
        message={baseMessage}
        member={member}
        onSelect={onSelect}
        onUnpin={onUnpin}
      />
    );

    expect(screen.getByTestId('avatar')).toHaveTextContent('Alice');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-avatar-url', 'blob:avatar-1');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-icon', 'Rocket');
    expect(screen.getByText('content:Hello there')).toBeInTheDocument();
    expect(screen.getByText('formatted:2026-01-01T12:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByTestId('attachments')).toHaveTextContent('attachments:1');

    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSelect).toHaveBeenCalledWith('message-1');

    fireEvent.click(screen.getByLabelText('channel.messages.unpin'));
    expect(onUnpin).toHaveBeenCalledWith('message-1');
    expect(onSelect).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('attachments'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('falls back to message author and attachment-only copy without member or content', () => {
    render(
      <PinnedMessageRow
        message={{ ...baseMessage, content: null, attachments: [], authorDisplayName: null }}
        onSelect={vi.fn()}
        onUnpin={vi.fn()}
      />
    );

    expect(screen.getByTestId('avatar')).toHaveTextContent('author');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-icon', 'User');
    expect(screen.getByText('channel.messages.attachmentOnly')).toBeInTheDocument();
    expect(screen.getByTestId('attachments')).toHaveTextContent('attachments:0');
  });

  it('falls back to member username and default member avatar appearance', () => {
    render(
      <PinnedMessageRow
        message={baseMessage}
        member={{ ...member, displayName: null, avatarFileId: null, avatar: null }}
        onSelect={vi.fn()}
        onUnpin={vi.fn()}
      />
    );

    expect(screen.getByTestId('avatar')).toHaveTextContent('alice');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-avatar-url', '');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-color', 'var(--color-cat-1-fg)');
    expect(screen.getByTestId('avatar')).toHaveAttribute('data-bg', 'var(--color-cat-1)');
  });
});
