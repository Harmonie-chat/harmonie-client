import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conversation, ConversationParticipant } from '@/types/conversation';
import type { UserProfile } from '@/types/user';
import { ConversationView } from './ConversationView';

type MessageThreadProps = {
  afterPinActions?: ReactNode;
  authorMap: Map<string, ConversationParticipant>;
  composer: {
    mentionOptions: Array<{ userId: string; username: string; displayName: string | null }>;
    onTypingStart: () => void;
    sendFn: (
      content: string,
      fileIds: string[],
      replyToMessageId?: string | null,
      mentionedUserIds?: string[]
    ) => Promise<unknown>;
  };
  currentUser: UserProfile | null;
  dismissNewMessagesSeparator: () => void;
  labels: { empty: string; error: string; loading: string };
  leadingActions?: ReactNode;
  loadMore: () => void;
  loadUntilMessage: (messageId: string) => void;
  onAvatarClick: (participant: ConversationParticipant, rect: DOMRect) => void;
  pinned: {
    entityId: string;
    fetchPinnedMessages: (entityId: string) => Promise<unknown>;
  };
  removeAttachment: (messageId: string, fileId: string) => void;
  removeMessage: (messageId: string) => void;
  resetKey: string;
  saveEdit: (messageId: string, content: string) => void;
  setMessagePinned: (messageId: string, isPinned: boolean) => void;
  startEditing: (messageId: string) => void;
  title: string;
  toggleReaction: (messageId: string, emoji: string) => void;
};

const mocks = vi.hoisted(() => ({
  addMessage: vi.fn(),
  cancelEditing: vi.fn(),
  connection: {
    send: vi.fn(),
  },
  conversation: null as Conversation | null,
  fetchPinnedMessages: vi.fn(),
  getConversationParticipants: vi.fn(),
  joinConversation: vi.fn(),
  lastMessageThreadProps: null as MessageThreadProps | null,
  latestOwnMessage: null,
  leaveCall: vi.fn(),
  loadMore: vi.fn(),
  loadUntilMessage: vi.fn(),
  membersOpen: false,
  navigate: vi.fn(),
  params: { conversationId: 'conversation-1' } as { conversationId?: string },
  removeAttachment: vi.fn(),
  removeMessage: vi.fn(),
  saveEdit: vi.fn(),
  sendConversationMessage: vi.fn(),
  sendStartConversationCall: vi.fn(),
  setMembersOpen: vi.fn((open: boolean) => {
    mocks.membersOpen = open;
  }),
  setMessagePinned: vi.fn(),
  startEditing: vi.fn(),
  toggleMembersOpen: vi.fn(() => {
    mocks.membersOpen = !mocks.membersOpen;
  }),
  toggleReaction: vi.fn(),
  updateActiveConversationMeta: vi.fn(),
  user: null as UserProfile | null,
  voice: {
    activeConversationId: null as string | null,
    getConversationParticipants: vi.fn(),
    isJoining: false,
    joinConversation: vi.fn(),
    joinError: null as string | null,
    leaveCall: vi.fn(),
    updateActiveConversationMeta: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => mocks.params,
  };
});

vi.mock('@harmonie/ui', () => {
  return {
    Button: ({
      children,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & {
      isLoading?: boolean;
      size?: string;
      variant?: string;
    }) => {
      const buttonProps = { ...props };
      delete buttonProps.isLoading;
      delete buttonProps.size;
      delete buttonProps.variant;

      return (
        <button type="button" {...buttonProps}>
          {children}
        </button>
      );
    },
    IconButton: ({
      children,
      title,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & {
      size?: string;
      title?: string;
      tooltipSide?: string;
      variant?: string;
    }) => {
      const buttonProps = { ...props };
      delete buttonProps.className;
      delete buttonProps.size;
      delete buttonProps.tooltipSide;
      delete buttonProps.variant;

      return (
        <button
          aria-label={buttonProps['aria-label'] ?? title ?? 'icon button'}
          type="button"
          {...buttonProps}
        >
          {children}
        </button>
      );
    },
  };
});

vi.mock('@/api/conversations', () => ({
  getConversationParticipants: mocks.getConversationParticipants,
  getConversationPinnedMessages: mocks.fetchPinnedMessages,
  sendConversationMessage: mocks.sendConversationMessage,
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
}));

vi.mock('@/shared/message/MessageThread', () => {
  return {
    MessageThread: (props: MessageThreadProps) => {
      mocks.lastMessageThreadProps = props;
      const firstAuthor = props.authorMap.values().next().value as
        | ConversationParticipant
        | undefined;

      return (
        <section aria-label="message thread" data-reset-key={props.resetKey}>
          <h1>{props.title}</h1>
          <span data-testid="thread-current-user">{props.currentUser?.userId ?? 'none'}</span>
          <span data-testid="thread-empty-label">{props.labels.empty}</span>
          <span data-testid="mention-count">{props.composer.mentionOptions.length}</span>
          <span data-testid="author-count">{props.authorMap.size}</span>
          <div aria-label="leading actions">{props.leadingActions}</div>
          <div aria-label="thread actions">{props.afterPinActions}</div>
          <button onClick={() => props.composer.onTypingStart()} type="button">
            type in composer
          </button>
          <button
            onClick={() => void props.composer.sendFn('Hello', ['file-1'], 'reply-1', ['user-2'])}
            type="button"
          >
            send message
          </button>
          <button onClick={() => props.loadMore()} type="button">
            load more
          </button>
          <button onClick={() => props.loadUntilMessage('message-9')} type="button">
            load until
          </button>
          <button onClick={() => props.startEditing('message-1')} type="button">
            start edit
          </button>
          <button onClick={() => props.saveEdit('message-1', 'Edited')} type="button">
            save edit
          </button>
          <button onClick={() => props.removeMessage('message-1')} type="button">
            remove message
          </button>
          <button onClick={() => props.removeAttachment('message-1', 'file-1')} type="button">
            remove attachment
          </button>
          <button onClick={() => props.setMessagePinned('message-1', true)} type="button">
            pin message
          </button>
          <button onClick={() => props.toggleReaction('message-1', 'sparkles')} type="button">
            react
          </button>
          <button onClick={() => props.dismissNewMessagesSeparator()} type="button">
            dismiss separator
          </button>
          <button
            onClick={() => void props.pinned.fetchPinnedMessages(props.pinned.entityId)}
            type="button"
          >
            fetch pinned
          </button>
          {firstAuthor && (
            <button
              onClick={(event) =>
                props.onAvatarClick(firstAuthor, event.currentTarget.getBoundingClientRect())
              }
              type="button"
            >
              open avatar
            </button>
          )}
        </section>
      );
    },
    useMessageThreadRefs: () => ({ composerRef: createRef(), listRef: createRef() }),
  };
});

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  useVoicePresence: () => mocks.voice,
}));

vi.mock('../ConversationContext', () => ({
  useConversation: () => mocks.conversation,
  useConversationMembersPanel: () => ({
    membersOpen: mocks.membersOpen,
    setMembersOpen: mocks.setMembersOpen,
    toggleMembersOpen: mocks.toggleMembersOpen,
  }),
}));

vi.mock('../conversationCallRealtime', () => ({
  sendStartConversationCall: mocks.sendStartConversationCall,
}));

vi.mock('./ConversationCallStage', () => ({
  ConversationCallStage: ({
    conversationId,
    onLeave,
  }: {
    conversationId: string;
    onLeave: () => void;
  }) => (
    <section aria-label="conversation call stage" data-conversation-id={conversationId}>
      <button onClick={onLeave} type="button">
        leave stage
      </button>
    </section>
  ),
}));

vi.mock('./useConversationMessages', () => ({
  useConversationMessages: () => ({
    addMessage: mocks.addMessage,
    cancelEditing: mocks.cancelEditing,
    dismissNewMessagesSeparator: mocks.cancelEditing,
    editingMessageId: null,
    error: null,
    lastReadMessageId: null,
    latestOwnMessage: mocks.latestOwnMessage,
    loading: false,
    loadingMore: false,
    loadMore: mocks.loadMore,
    loadUntilMessage: mocks.loadUntilMessage,
    messages: [],
    removeAttachment: mocks.removeAttachment,
    removeMessage: mocks.removeMessage,
    saveEdit: mocks.saveEdit,
    setMessagePinned: mocks.setMessagePinned,
    startEditing: mocks.startEditing,
    toggleReaction: mocks.toggleReaction,
    typingUserIds: ['user-2'],
  }),
}));

vi.mock('./ConversationParticipantsPanel', () => ({
  ConversationParticipantPopover: ({
    onClose,
    participant,
    side,
  }: {
    onClose: () => void;
    participant: ConversationParticipant;
    side: string;
  }) => (
    <aside aria-label="participant popover" data-side={side}>
      <span>{participant.displayName ?? participant.username}</span>
      <button onClick={onClose} type="button">
        close popover
      </button>
    </aside>
  ),
  ConversationParticipantsPanel: ({
    onClose,
    participants,
  }: {
    onClose: () => void;
    participants: ConversationParticipant[];
  }) => (
    <aside aria-label="conversation participants">
      <span data-testid="panel-count">{participants.length}</span>
      <button onClick={onClose} type="button">
        close participants
      </button>
    </aside>
  ),
}));

const participant = (input: Partial<ConversationParticipant> = {}): ConversationParticipant => ({
  avatarFileId: null,
  bio: null,
  displayName: 'Ada Lovelace',
  userId: 'user-1',
  username: 'ada',
  ...input,
});

const conversation = (input: Partial<Conversation> = {}): Conversation => ({
  conversationId: 'conversation-1',
  createdAtUtc: '2024-01-01T00:00:00.000Z',
  name: 'Research',
  participants: [
    participant(),
    participant({ displayName: 'Grace Hopper', userId: 'user-2', username: 'grace' }),
  ],
  type: 'Group',
  ...input,
});

const currentUser: UserProfile = {
  avatarFileId: null,
  displayName: 'Ada Lovelace',
  language: 'en',
  theme: 'harmonie-light',
  userId: 'user-1',
  username: 'ada',
};

describe('ConversationView', () => {
  beforeEach(() => {
    mocks.addMessage.mockReset();
    mocks.cancelEditing.mockReset();
    mocks.connection.send.mockResolvedValue(undefined);
    mocks.fetchPinnedMessages.mockResolvedValue([]);
    mocks.getConversationParticipants.mockResolvedValue([
      participant({ displayName: 'Katherine Johnson', userId: 'user-3', username: 'katherine' }),
    ]);
    mocks.joinConversation.mockReset();
    mocks.lastMessageThreadProps = null;
    mocks.latestOwnMessage = null;
    mocks.leaveCall.mockReset();
    mocks.loadMore.mockReset();
    mocks.loadUntilMessage.mockReset();
    mocks.membersOpen = false;
    mocks.navigate.mockReset();
    mocks.params = { conversationId: 'conversation-1' };
    mocks.removeAttachment.mockReset();
    mocks.removeMessage.mockReset();
    mocks.saveEdit.mockReset();
    mocks.sendConversationMessage.mockResolvedValue({ messageId: 'message-1' });
    mocks.sendStartConversationCall.mockResolvedValue(undefined);
    mocks.setMembersOpen.mockClear();
    mocks.setMessagePinned.mockResolvedValue(undefined);
    mocks.startEditing.mockReset();
    mocks.toggleMembersOpen.mockClear();
    mocks.toggleReaction.mockReset();
    mocks.updateActiveConversationMeta.mockReset();
    mocks.user = currentUser;
    mocks.conversation = conversation();
    mocks.voice.activeConversationId = null;
    mocks.voice.getConversationParticipants.mockReturnValue([]);
    mocks.voice.isJoining = false;
    mocks.voice.joinConversation.mockResolvedValue(undefined);
    mocks.voice.joinError = null;
    mocks.voice.leaveCall.mockReset();
    mocks.voice.updateActiveConversationMeta.mockReset();
  });

  it('renders nothing when no conversation id is available', () => {
    mocks.params = {};

    const { container } = render(<ConversationView />);

    expect(container).toBeEmptyDOMElement();
    expect(mocks.getConversationParticipants).not.toHaveBeenCalled();
  });

  it('renders the message thread and wires conversation actions', async () => {
    const user = userEvent.setup();
    render(<ConversationView />);

    expect(screen.getByRole('heading', { name: 'Research' })).toBeInTheDocument();
    expect(screen.getByTestId('thread-current-user')).toHaveTextContent('user-1');
    expect(screen.getByTestId('thread-empty-label')).toHaveTextContent('conversation.empty');
    expect(screen.getByTestId('author-count')).toHaveTextContent('2');

    await waitFor(() => expect(screen.getByTestId('mention-count')).toHaveTextContent('1'));

    await user.click(
      screen.getAllByRole('button', { name: 'conversation.backToConversations' })[0]
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/conversations');

    await user.click(screen.getByRole('button', { name: 'type in composer' }));
    expect(mocks.connection.send).toHaveBeenCalledWith('StartTypingConversation', 'conversation-1');

    await user.click(screen.getByRole('button', { name: 'send message' }));
    expect(mocks.sendConversationMessage).toHaveBeenCalledWith(
      'conversation-1',
      'Hello',
      ['file-1'],
      'reply-1',
      ['user-2']
    );
    await waitFor(() => expect(mocks.addMessage).toHaveBeenCalledWith({ messageId: 'message-1' }));

    await user.click(screen.getByRole('button', { name: 'load more' }));
    await user.click(screen.getByRole('button', { name: 'load until' }));
    await user.click(screen.getByRole('button', { name: 'start edit' }));
    await user.click(screen.getByRole('button', { name: 'save edit' }));
    await user.click(screen.getByRole('button', { name: 'remove message' }));
    await user.click(screen.getByRole('button', { name: 'remove attachment' }));
    await user.click(screen.getByRole('button', { name: 'pin message' }));
    await user.click(screen.getByRole('button', { name: 'react' }));
    await user.click(screen.getByRole('button', { name: 'dismiss separator' }));
    await user.click(screen.getByRole('button', { name: 'fetch pinned' }));

    expect(mocks.loadMore).toHaveBeenCalledTimes(1);
    expect(mocks.loadUntilMessage).toHaveBeenCalledWith('message-9');
    expect(mocks.startEditing).toHaveBeenCalledWith('message-1');
    expect(mocks.saveEdit).toHaveBeenCalledWith('message-1', 'Edited');
    expect(mocks.removeMessage).toHaveBeenCalledWith('message-1');
    expect(mocks.removeAttachment).toHaveBeenCalledWith('message-1', 'file-1');
    expect(mocks.setMessagePinned).toHaveBeenCalledWith('message-1', true);
    expect(mocks.toggleReaction).toHaveBeenCalledWith('message-1', 'sparkles');
    expect(mocks.cancelEditing).toHaveBeenCalledTimes(1);
    expect(mocks.fetchPinnedMessages).toHaveBeenCalledWith('conversation-1');
  });

  it('shows and hides the participant popover from avatar clicks', async () => {
    const user = userEvent.setup();
    render(<ConversationView />);

    await user.click(screen.getByRole('button', { name: 'open avatar' }));
    expect(screen.getByRole('complementary', { name: 'participant popover' })).toHaveTextContent(
      'Ada Lovelace'
    );

    await user.click(screen.getByRole('button', { name: 'open avatar' }));
    expect(
      screen.queryByRole('complementary', { name: 'participant popover' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'open avatar' }));
    await user.click(screen.getByRole('button', { name: 'close popover' }));
    expect(
      screen.queryByRole('complementary', { name: 'participant popover' })
    ).not.toBeInTheDocument();
  });

  it('opens group members and falls back to existing participants when autocomplete loading fails', async () => {
    const user = userEvent.setup();
    mocks.getConversationParticipants.mockRejectedValue(new Error('offline'));

    render(<ConversationView />);

    await waitFor(() => expect(screen.getByTestId('mention-count')).toHaveTextContent('2'));

    await user.click(screen.getByRole('button', { name: 'conversation.participantsTitle' }));
    expect(mocks.toggleMembersOpen).toHaveBeenCalledTimes(1);

    mocks.membersOpen = true;
    render(<ConversationView />);
    expect(
      screen.getByRole('complementary', { name: 'conversation participants' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('panel-count')).toHaveTextContent('2');

    await user.click(screen.getByRole('button', { name: 'close participants' }));
    expect(mocks.setMembersOpen).toHaveBeenCalledWith(false);
  });

  it('starts a conversation call and can return to chat', async () => {
    const user = userEvent.setup();
    render(<ConversationView />);

    const actions = screen.getByLabelText('thread actions');
    await user.click(within(actions).getByRole('button', { name: 'conversation.call.start' }));

    await waitFor(() =>
      expect(mocks.sendStartConversationCall).toHaveBeenCalledWith(
        mocks.connection,
        'conversation-1'
      )
    );
    expect(mocks.voice.joinConversation).toHaveBeenCalledWith('conversation-1', 'Research');
    expect(mocks.voice.updateActiveConversationMeta).toHaveBeenCalledWith('Research');
    expect(screen.getByText('conversation.call.readyToJoin')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /conversation.call.showChat/ }));
    expect(screen.getByRole('heading', { name: 'Research' })).toBeInTheDocument();
  });

  it('joins an existing remote call and leaves an active call', async () => {
    const user = userEvent.setup();
    mocks.voice.getConversationParticipants.mockReturnValue([{ userId: 'user-2' }]);

    render(<ConversationView />);

    await user.click(screen.getByRole('button', { name: /conversation.call.join/ }));
    expect(mocks.voice.joinConversation).toHaveBeenCalledWith('conversation-1', 'Research');
    expect(screen.getByText('conversation.call.readyToJoin')).toBeInTheDocument();

    await user.click(
      screen.getAllByRole('button', { name: 'conversation.backToConversations' })[0]
    );
    expect(mocks.navigate).toHaveBeenCalledWith('/conversations');

    await user.click(screen.getByRole('button', { name: /voice.join/ }));
    expect(mocks.voice.joinConversation).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: /voice.leave/ }));
    expect(mocks.voice.leaveCall).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /conversation.call.join/ }));

    mocks.voice.activeConversationId = 'conversation-1';
    render(<ConversationView />);
    expect(screen.getByRole('region', { name: 'conversation call stage' })).toHaveAttribute(
      'data-conversation-id',
      'conversation-1'
    );

    await user.click(screen.getByRole('button', { name: 'leave stage' }));
    expect(mocks.voice.leaveCall).toHaveBeenCalledTimes(2);
  });

  it('handles direct conversations, missing user, joining state, and join errors', () => {
    mocks.conversation = conversation({
      name: null,
      type: 'Direct',
    });
    mocks.user = null;
    mocks.voice.getConversationParticipants.mockReturnValue([{ userId: 'remote-user' }]);
    mocks.voice.isJoining = true;
    mocks.voice.joinError = 'voice.microphoneDenied';

    render(<ConversationView />);

    expect(screen.getByRole('heading', { name: 'Ada Lovelace' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'conversation.participantsTitle' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conversation.call.join/ })).toBeInTheDocument();
  });
});
