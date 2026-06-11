import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConversationAvatar } from './ConversationAvatar';
import type { Conversation, ConversationParticipant } from '@/types/conversation';

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    alt,
    avatarUrl,
    bg,
    color,
    fallback,
    icon,
    size,
  }: {
    alt: string;
    avatarUrl?: string | null;
    bg?: string;
    color?: string;
    fallback?: string;
    icon?: string;
    size: number;
  }) => (
    <span
      data-alt={alt}
      data-avatar-url={avatarUrl ?? ''}
      data-bg={bg ?? ''}
      data-color={color ?? ''}
      data-icon={icon ?? ''}
      data-size={size}
    >
      {fallback ?? alt}
    </span>
  ),
  AvatarGroup: ({ children, size }: { children: ReactNode; size: number }) => (
    <div data-size={size} data-testid="avatar-group">
      {children}
    </div>
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId: string | null) => (fileId ? `blob:${fileId}` : undefined),
}));

const participant = (input: Partial<ConversationParticipant> = {}): ConversationParticipant =>
  ({
    userId: 'user-2',
    username: 'ada',
    displayName: 'Ada',
    avatarFileId: null,
    avatar: null,
    ...input,
  }) as ConversationParticipant;

const conversation = (input: Partial<Conversation> = {}): Conversation =>
  ({
    conversationId: 'conversation-1',
    name: null,
    type: 'Direct',
    hasUnread: false,
    participants: [],
    lastMessage: null,
    ...input,
  }) as Conversation;

describe('ConversationAvatar', () => {
  it('renders a direct conversation avatar for the other participant', () => {
    render(
      <ConversationAvatar
        conversation={conversation({
          participants: [
            participant({ userId: 'current-user', username: 'me' }),
            participant({
              userId: 'user-2',
              username: 'ada',
              avatarFileId: 'avatar-1',
              avatar: { icon: 'User', color: '#111111', bg: '#ffffff' },
            }),
          ],
        })}
        currentUserId="current-user"
        label="Ada"
      />
    );

    expect(screen.getByText('Ada')).toHaveAttribute('data-avatar-url', 'blob:avatar-1');
    expect(screen.getByText('Ada')).toHaveAttribute('data-size', '24');
  });

  it('uses the first participant when no current user id is available', () => {
    render(
      <ConversationAvatar
        conversation={conversation({
          participants: [
            participant({
              userId: 'user-1',
              username: 'ada',
              avatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
            }),
          ],
        })}
        label="Ada"
      />
    );

    expect(screen.getByText('Ada')).toHaveAttribute('data-icon', 'Rocket');
    expect(screen.getByText('Ada')).toHaveAttribute('data-color', '#111111');
    expect(screen.getByText('Ada')).toHaveAttribute('data-bg', '#eeeeee');
  });

  it('uses the label as direct fallback when no other participant has an avatar', () => {
    render(
      <ConversationAvatar
        conversation={conversation({
          participants: [participant({ userId: 'current-user', username: 'me' })],
        })}
        currentUserId="current-user"
        label="Unknown"
      />
    );

    expect(screen.getByText('Unknown')).toHaveAttribute('data-alt', 'Unknown');
  });

  it('renders up to two non-current participants for group conversations', () => {
    render(
      <ConversationAvatar
        conversation={conversation({
          type: 'Group',
          participants: [
            participant({ userId: 'current-user', username: 'me' }),
            participant({ userId: 'user-2', username: 'ada' }),
            participant({ userId: 'user-3', username: 'grace', avatarFileId: 'avatar-3' }),
            participant({ userId: 'user-4', username: 'linus' }),
          ],
        })}
        currentUserId="current-user"
        label="Team"
      />
    );

    expect(screen.getByTestId('avatar-group')).toHaveAttribute('data-size', '24');
    expect(screen.getByText('ada')).toBeInTheDocument();
    expect(screen.getByText('grace')).toHaveAttribute('data-avatar-url', 'blob:avatar-3');
    expect(screen.queryByText('linus')).not.toBeInTheDocument();
  });

  it('renders group participant avatar appearance without text fallback when an icon exists', () => {
    render(
      <ConversationAvatar
        conversation={conversation({
          type: 'Group',
          participants: [
            participant({
              userId: 'user-2',
              username: 'ada',
              avatar: { icon: 'Sparkles', color: '#222222', bg: '#dddddd' },
            }),
          ],
        })}
        label="Team"
      />
    );

    expect(screen.getByText('ada')).toHaveAttribute('data-icon', 'Sparkles');
    expect(screen.getByText('ada')).toHaveAttribute('data-color', '#222222');
    expect(screen.getByText('ada')).toHaveAttribute('data-bg', '#dddddd');
  });

  it('renders a group fallback icon when every participant is the current user', () => {
    render(
      <ConversationAvatar
        conversation={conversation({
          type: 'Group',
          participants: [participant({ userId: 'current-user', username: 'me' })],
        })}
        currentUserId="current-user"
        label="Team"
      />
    );

    expect(screen.getByText('Team')).toHaveAttribute('data-icon', 'Users');
  });
});
