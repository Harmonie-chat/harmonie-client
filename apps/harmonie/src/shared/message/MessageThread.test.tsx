import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message, PinnedMessageList } from '@/types/channel';
import type { UserProfile } from '@/types/user';
import type { MessageAuthor } from './messageAuthor';
import { MessageThread, useMessageThreadRefs } from './MessageThread';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number | null | undefined>) =>
      values?.name
        ? `${key}:${values.name}`
        : values?.name1
          ? `${key}:${values.name1}:${values.name2}`
          : key,
  }),
}));

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => {
    const buttonProps = { ...props };
    delete buttonProps.variant;

    return (
      <button onClick={onClick} type="button" {...buttonProps}>
        {children}
      </button>
    );
  },
  IconButton: ({
    children,
    title,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    size?: string;
    title?: string;
    tooltipSide?: string;
  }) => {
    const buttonProps = { ...props };
    delete buttonProps.size;
    delete buttonProps.tooltipSide;

    return (
      <button
        aria-label={buttonProps['aria-label'] ?? title}
        title={title}
        type="button"
        {...buttonProps}
      >
        {children}
      </button>
    );
  },
  Modal: ({
    children,
    onClose,
    title,
  }: {
    children: ReactNode;
    onClose: () => void;
    title: string;
  }) => (
    <section aria-label={title}>
      <button onClick={onClose} type="button">
        close modal
      </button>
      {children}
    </section>
  ),
  Separator: ({ label, variant }: { label: string; variant?: string }) => (
    <div data-variant={variant ?? 'default'}>{label}</div>
  ),
}));

vi.mock('./MessageListItem/MessageListItem', () => ({
  MessageListItem: ({
    currentUser,
    member,
    message,
    onAttachmentDeleted,
    onAvatarClick,
    onDelete,
    onEdit,
    onOpenMenu,
    onOpenMenuAt,
    onPinToggle,
    onReact,
    onReply,
    onReplyClick,
    onSaveEdit,
    rowState,
  }: {
    currentUser?: UserProfile | null;
    member?: MessageAuthor;
    message: Message;
    onAttachmentDeleted?: (fileId: string) => void;
    onAvatarClick?: (author: MessageAuthor, rect: DOMRect) => void;
    onDelete?: (messageId: string) => void;
    onEdit?: (messageId: string) => void;
    onOpenMenu?: (
      event: React.MouseEvent<HTMLElement>,
      messageId: string,
      horizontalAnchor?: 'left' | 'right',
      imageAttachment?: { fileId: string; fileName: string }
    ) => void;
    onOpenMenuAt?: (
      messageId: string,
      position: { x: number; y: number },
      horizontalAnchor?: 'left' | 'right'
    ) => void;
    onPinToggle?: (messageId: string, isPinned: boolean) => void;
    onReact?: (messageId: string, emoji: string) => void;
    onReply?: (messageId: string) => void;
    onReplyClick?: (messageId: string) => void;
    onSaveEdit?: (messageId: string, content: string, mentionedUserIds: string[]) => Promise<void>;
    rowState?: {
      grouped?: boolean;
      isEditing?: boolean;
      isMentioned?: boolean;
      isMenuOpen?: boolean;
      isOwn?: boolean;
      isSelected?: boolean;
    };
  }) => (
    <article
      data-current-user={currentUser?.userId ?? ''}
      data-editing={String(rowState?.isEditing)}
      data-grouped={String(rowState?.grouped)}
      data-mentioned={String(rowState?.isMentioned)}
      data-menu-open={String(rowState?.isMenuOpen)}
      data-message-id={message.messageId}
      data-own={String(rowState?.isOwn)}
      data-selected={String(rowState?.isSelected)}
    >
      <span>
        message:{message.messageId}:{member?.username ?? 'unknown'}
      </span>
      <button
        onClick={() => member && onAvatarClick?.(member, new DOMRect(1, 2, 3, 4))}
        type="button"
      >
        avatar {message.messageId}
      </button>
      <button onClick={() => onReply?.(message.messageId)} type="button">
        reply {message.messageId}
      </button>
      <button
        onClick={() => onReplyClick?.(message.replyTo?.messageId ?? message.messageId)}
        type="button"
      >
        reply click {message.messageId}
      </button>
      <button onClick={() => onEdit?.(message.messageId)} type="button">
        edit {message.messageId}
      </button>
      <button onClick={() => onDelete?.(message.messageId)} type="button">
        delete {message.messageId}
      </button>
      <button onClick={() => onPinToggle?.(message.messageId, !message.isPinned)} type="button">
        pin {message.messageId}
      </button>
      <button onClick={() => onReact?.(message.messageId, '👍')} type="button">
        react {message.messageId}
      </button>
      <button onClick={() => onAttachmentDeleted?.('file-1')} type="button">
        attachment {message.messageId}
      </button>
      <button onClick={(event) => onOpenMenu?.(event, message.messageId, 'right')} type="button">
        menu {message.messageId}
      </button>
      {message.attachments
        .filter((attachment) => attachment.contentType.startsWith('image/'))
        .map((attachment) => (
          <button
            key={attachment.fileId}
            onClick={(event) =>
              onOpenMenu?.(event, message.messageId, 'right', {
                fileId: attachment.fileId,
                fileName: attachment.fileName,
              })
            }
            type="button"
          >
            image menu {message.messageId}
          </button>
        ))}
      <button
        onClick={() => onOpenMenuAt?.(message.messageId, { x: 10, y: 20 }, 'left')}
        type="button"
      >
        menu at {message.messageId}
      </button>
      <button
        onClick={() => void onSaveEdit?.(message.messageId, 'edited content', ['user-2'])}
        type="button"
      >
        save {message.messageId}
      </button>
    </article>
  ),
}));

vi.mock('./MessageComposer', () => ({
  MessageComposer: ({
    latestEditableMessage,
    onCancelReply,
    onEditingRequested,
    onTypingStart,
    replyTo,
    sendFn,
  }: {
    latestEditableMessage?: Message | null;
    onCancelReply?: () => void;
    onEditingRequested?: (messageId: string) => void;
    onTypingStart?: () => void;
    replyTo?: { messageId: string } | null;
    sendFn: (
      content: string,
      attachmentFileIds: string[],
      replyToMessageId?: string | null,
      mentionedUserIds?: string[]
    ) => Promise<unknown>;
  }) => (
    <section aria-label="composer">
      {replyTo && <span>replying to {replyTo.messageId}</span>}
      <button onClick={() => onTypingStart?.()} type="button">
        composer typing
      </button>
      <button
        onClick={() =>
          void sendFn('hello', ['file-1'], replyTo?.messageId ?? null, ['user-2']).then(() =>
            onCancelReply?.()
          )
        }
        type="button"
      >
        composer send
      </button>
      <button
        disabled={!latestEditableMessage}
        onClick={() =>
          latestEditableMessage && onEditingRequested?.(latestEditableMessage.messageId)
        }
        type="button"
      >
        composer edit latest
      </button>
      <button onClick={onCancelReply} type="button">
        composer cancel reply
      </button>
    </section>
  ),
}));

vi.mock('./MessageListItem/MessageContextMenu', () => ({
  MessageContextMenu: ({
    menu,
    onClose,
    onDelete,
    onEdit,
    onPinToggle,
    onReact,
    onReply,
  }: {
    menu: {
      canDelete: boolean;
      canEdit: boolean;
      canReact: boolean;
      canReply: boolean;
      isPinned: boolean;
      imageAttachment?: { fileId: string; fileName: string };
      messageId: string;
      position: { x: number; y: number };
    } | null;
    onClose: () => void;
    onDelete: (messageId: string) => void;
    onEdit: (messageId: string) => void;
    onPinToggle: (messageId: string, isPinned: boolean) => void;
    onReact: (messageId: string, value: string | { x: number; y: number }) => void;
    onReply: (messageId: string) => void;
  }) =>
    menu ? (
      <section aria-label="message menu">
        <span>
          menu:{menu.messageId}:{menu.position.x}:{menu.position.y}
        </span>
        <button onClick={onClose} type="button">
          menu close
        </button>
        {menu.canReply && (
          <button onClick={() => onReply(menu.messageId)} type="button">
            menu reply
          </button>
        )}
        {menu.canReact && (
          <>
            <button onClick={() => onReact(menu.messageId, '😀')} type="button">
              menu quick react
            </button>
            <button onClick={() => onReact(menu.messageId, menu.position)} type="button">
              menu picker
            </button>
          </>
        )}
        {menu.canEdit && (
          <button onClick={() => onEdit(menu.messageId)} type="button">
            menu edit
          </button>
        )}
        {menu.imageAttachment && <button type="button">menu download image</button>}
        <button onClick={() => onPinToggle(menu.messageId, !menu.isPinned)} type="button">
          menu pin
        </button>
        {menu.canDelete && (
          <button onClick={() => onDelete(menu.messageId)} type="button">
            menu delete
          </button>
        )}
      </section>
    ) : null,
}));

vi.mock('./MessageListItem/MessageEmojiPicker', () => ({
  MessageEmojiPicker: ({
    anchorRect,
    onClose,
    onSelect,
  }: {
    anchorRect: DOMRect;
    onClose: () => void;
    onSelect: (emoji: string) => void;
  }) => (
    <section aria-label="reaction picker" data-left={anchorRect.left}>
      <button onClick={() => onSelect('🔥')} type="button">
        picker select
      </button>
      <button onClick={onClose} type="button">
        picker close
      </button>
    </section>
  ),
}));

vi.mock('./PinnedMessagesModal', () => ({
  PinnedMessagesModal: ({
    onClose,
    onMessageSelected,
    onMessageUnpinned,
  }: {
    onClose: () => void;
    onMessageSelected: (messageId: string) => void;
    onMessageUnpinned: (messageId: string) => void;
  }) => (
    <section aria-label="pinned modal">
      <button onClick={() => onMessageSelected('message-2')} type="button">
        select pinned
      </button>
      <button onClick={() => onMessageUnpinned('message-1')} type="button">
        unpin pinned
      </button>
      <button onClick={onClose} type="button">
        close pinned
      </button>
    </section>
  ),
}));

vi.mock('./ScrollToBottomButton', () => ({
  ScrollToBottomButton: ({ label, onClick }: { label: string; onClick: () => void }) => (
    <button onClick={onClick} type="button">
      {label}
    </button>
  ),
}));

vi.mock('./utils/scrollMessageIntoView', () => ({
  scheduleCenterMessageIfOutsideView: vi.fn(() => () => {}),
}));

const currentUser: UserProfile = {
  language: 'en',
  theme: 'light',
  userId: 'user-1',
  username: 'ada',
};

const authors = new Map<string, MessageAuthor>([
  ['user-1', { userId: 'user-1', username: 'ada', displayName: 'Ada' }],
  ['user-2', { userId: 'user-2', username: 'grace', displayName: 'Grace' }],
  ['user-3', { userId: 'user-3', username: 'linus' }],
  ['user-4', { userId: 'user-4', username: 'margaret', displayName: 'Margaret' }],
]);

const makeMessage = (
  messageId: string,
  authorUserId = 'user-2',
  overrides: Partial<Message> = {}
): Message => ({
  attachments: [],
  authorUserId,
  content: `content ${messageId}`,
  createdAtUtc: '2026-01-01T10:00:00.000Z',
  isPinned: false,
  messageId,
  reactions: [],
  replyTo: null,
  updatedAtUtc: null,
  ...overrides,
});

const messages = [
  makeMessage('message-1', 'user-1', {
    attachments: [
      {
        contentType: 'image/png',
        fileId: 'image-1',
        fileName: 'image.png',
        sizeBytes: 10,
      },
      {
        contentType: 'text/plain',
        fileId: 'file-1',
        fileName: 'notes.txt',
        sizeBytes: 10,
      },
    ],
    isPinned: true,
    mentionedUserIds: ['user-1'],
  }),
  makeMessage('message-2', 'user-2', {
    createdAtUtc: '2026-01-01T10:04:00.000Z',
    replyTo: {
      authorDisplayName: 'Ada',
      authorUserId: 'user-1',
      authorUsername: 'ada',
      content: 'parent',
      deletedAtUtc: null,
      hasAttachments: false,
      isDeleted: false,
      messageId: 'message-1',
    },
  }),
  makeMessage('message-3', 'user-2', {
    createdAtUtc: '2026-01-02T10:00:00.000Z',
  }),
];

const pinnedList: PinnedMessageList = {
  channelId: 'channel-1',
  items: [],
  nextCursor: null,
};

type ThreadProps = Partial<React.ComponentProps<typeof MessageThread<MessageAuthor>>>;

const renderThread = (overrides: ThreadProps = {}) => {
  const props = {
    afterPinActions: <span>after pin</span>,
    authorMap: authors,
    beforePinActions: <span>before pin</span>,
    cancelEditing: vi.fn(),
    composer: {
      draftKey: 'draft-1',
      mentionOptions: [{ userId: 'user-2', username: 'grace', displayName: 'Grace' }],
      onTypingStart: vi.fn(),
      sendFn: vi.fn().mockResolvedValue(undefined),
    },
    currentUser,
    dismissNewMessagesSeparator: vi.fn(),
    editingMessageId: null,
    error: false,
    labels: {
      empty: 'No messages',
      error: 'Could not load',
      loading: 'Loading',
    },
    lastReadMessageId: 'message-1',
    latestOwnMessage: messages[0],
    leadingActions: <span>leading action</span>,
    loadMore: vi.fn().mockResolvedValue([]),
    loadUntilMessage: vi.fn().mockResolvedValue(true),
    loading: false,
    loadingMore: false,
    messages,
    onAvatarClick: vi.fn(),
    pinned: {
      entityId: 'channel-1',
      fetchPinnedMessages: vi.fn().mockResolvedValue(pinnedList),
    },
    reactionSource: {
      entityId: 'channel-1',
      type: 'channel' as const,
    },
    removeAttachment: vi.fn(),
    removeMessage: vi.fn(),
    resetKey: 'thread-1',
    saveEdit: vi.fn().mockResolvedValue(undefined),
    searchState: {
      selectedMessageId: null,
    },
    setMessagePinned: vi.fn(),
    startEditing: vi.fn(),
    title: 'General',
    toggleReaction: vi.fn(),
    typingUserIds: [],
    ...overrides,
  };

  const Harness = () => {
    const refs = useMessageThreadRefs();
    return <MessageThread {...props} refs={refs} />;
  };

  return {
    ...render(<Harness />),
    props,
  };
};

const setScrollMetrics = (element: Element, metrics: Partial<HTMLElement>) => {
  for (const [key, value] of Object.entries(metrics)) {
    Object.defineProperty(element, key, {
      configurable: true,
      value,
      writable: true,
    });
  }
};

describe('MessageThread', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(() => ({
        disconnect: vi.fn(),
        observe: vi.fn(),
      }))
    );
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  it('renders loading, error, empty and typing states', () => {
    const loadingView = renderThread({ loading: true, loadingMore: true, messages: [] });

    expect(screen.getAllByText('Loading')).toHaveLength(2);

    loadingView.unmount();
    const errorView = renderThread({ error: true, messages: [] });

    expect(screen.getByText('Could not load')).toBeInTheDocument();

    errorView.unmount();
    const emptyView = renderThread({ messages: [] });

    expect(screen.getByText('No messages')).toBeInTheDocument();

    emptyView.unmount();
    const oneTypingView = renderThread({ typingUserIds: ['user-2'] });

    expect(screen.getByText('channel.typing.one:Grace')).toBeInTheDocument();

    oneTypingView.unmount();
    renderThread({ typingUserIds: ['user-3', 'missing-user'] });

    expect(screen.getByText('channel.typing.two:linus:missing-user')).toBeInTheDocument();
  });

  it('wires message actions, composer replies, delete confirmation and pinned modal actions', async () => {
    const user = userEvent.setup();
    const { props } = renderThread({
      editingMessageId: 'message-2',
      searchState: { selectedMessageId: 'message-3' },
      typingUserIds: ['user-2', 'user-3', 'user-4'],
    });

    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('leading action')).toBeInTheDocument();
    expect(screen.getByText('before pin')).toBeInTheDocument();
    expect(screen.getByText('after pin')).toBeInTheDocument();
    expect(screen.getByText('channel.messages.newMessages')).toBeInTheDocument();
    expect(screen.getByText('channel.typing.several')).toBeInTheDocument();
    expect(screen.getByText('message:message-2:grace').closest('article')).toHaveAttribute(
      'data-editing',
      'true'
    );
    expect(screen.getByText('message:message-3:grace').closest('article')).toHaveAttribute(
      'data-selected',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'avatar message-2' }));
    await user.click(screen.getByRole('button', { name: 'reply message-2' }));

    expect(props.cancelEditing).toHaveBeenCalledTimes(1);
    expect(screen.getByText('replying to message-2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'composer send' }));

    await waitFor(() =>
      expect(props.composer.sendFn).toHaveBeenCalledWith('hello', ['file-1'], 'message-2', [
        'user-2',
      ])
    );
    expect(screen.queryByText('replying to message-2')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'composer typing' }));
    await user.click(screen.getByRole('button', { name: 'composer edit latest' }));
    await user.click(screen.getByRole('button', { name: 'save message-2' }));
    await user.click(screen.getByRole('button', { name: 'attachment message-1' }));
    await user.click(screen.getByRole('button', { name: 'react message-2' }));
    await user.click(screen.getByRole('button', { name: 'pin message-1' }));

    expect(props.onAvatarClick).toHaveBeenCalledWith(authors.get('user-2'), expect.any(DOMRect));
    expect(props.composer.onTypingStart).toHaveBeenCalledTimes(1);
    expect(props.startEditing).toHaveBeenCalledWith('message-1');
    expect(props.saveEdit).toHaveBeenCalledWith('message-2', 'edited content', ['user-2']);
    expect(props.removeAttachment).toHaveBeenCalledWith('message-1', 'file-1');
    expect(props.toggleReaction).toHaveBeenCalledWith('message-2', '👍');
    expect(props.setMessagePinned).toHaveBeenCalledWith('message-1', false);

    await user.click(screen.getByRole('button', { name: 'delete message-2' }));

    expect(screen.getByRole('region', { name: 'channel.messages.delete' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'channel.messages.deleteConfirmButton' }));

    expect(props.removeMessage).toHaveBeenCalledWith('message-2');

    await user.click(screen.getByRole('button', { name: 'channel.messages.pinnedMessages' }));

    expect(screen.getByLabelText('pinned modal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'unpin pinned' }));
    await user.click(screen.getByRole('button', { name: 'select pinned' }));

    await waitFor(() => expect(props.loadUntilMessage).toHaveBeenCalledWith('message-2'));
    expect(props.setMessagePinned).toHaveBeenCalledWith('message-1', false);

    await user.click(screen.getByRole('button', { name: 'close pinned' }));
    expect(screen.queryByLabelText('pinned modal')).not.toBeInTheDocument();
  });

  it('opens context menus, reaction picker and loads more while scrolling', async () => {
    const user = userEvent.setup();
    const { container, props } = renderThread();
    const scrollElement = container.querySelector('.overflow-y-auto')!;
    setScrollMetrics(scrollElement, {
      clientHeight: 100,
      scrollHeight: 600,
      scrollTop: 20,
    });

    fireEvent.wheel(scrollElement);
    fireEvent.scroll(scrollElement);

    await waitFor(() => expect(props.loadMore).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole('button', { name: 'channel.messages.scrollToBottom' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'channel.messages.scrollToBottom' }));

    expect(
      screen.queryByRole('button', { name: 'channel.messages.scrollToBottom' })
    ).not.toBeInTheDocument();
    fireEvent.transitionEnd(screen.getByText('channel.messages.newMessages').parentElement!);
    expect(props.dismissNewMessagesSeparator).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'menu message-1' }));

    expect(screen.getByLabelText('message menu')).toHaveTextContent('menu:message-1');
    expect(screen.queryByRole('button', { name: 'menu download image' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'menu close' }));
    expect(screen.queryByLabelText('message menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'image menu message-1' }));
    expect(screen.getByRole('button', { name: 'menu download image' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'menu close' }));

    await user.click(screen.getByRole('button', { name: 'menu message-1' }));
    await user.click(screen.getByRole('button', { name: 'menu reply' }));
    expect(screen.getByText('replying to message-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'composer cancel reply' }));

    await user.click(screen.getByRole('button', { name: 'menu message-1' }));
    await user.click(screen.getByRole('button', { name: 'menu quick react' }));

    expect(props.toggleReaction).toHaveBeenCalledWith('message-1', '😀');

    await user.click(screen.getByRole('button', { name: 'menu at message-2' }));
    await user.click(screen.getByRole('button', { name: 'menu picker' }));

    expect(screen.getByLabelText('reaction picker')).toHaveAttribute('data-left', '10');

    await user.click(screen.getByRole('button', { name: 'picker close' }));
    expect(screen.queryByLabelText('reaction picker')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'menu at message-2' }));
    await user.click(screen.getByRole('button', { name: 'menu picker' }));

    await user.click(screen.getByRole('button', { name: 'picker select' }));

    expect(props.toggleReaction).toHaveBeenCalledWith('message-2', '🔥');

    await user.click(screen.getByRole('button', { name: 'menu at message-1' }));
    await user.click(screen.getByRole('button', { name: 'menu edit' }));

    expect(props.startEditing).toHaveBeenCalledWith('message-1');

    await user.click(screen.getByRole('button', { name: 'menu message-1' }));
    await user.click(screen.getByRole('button', { name: 'menu delete' }));
    await user.click(screen.getByRole('button', { name: 'close modal' }));

    expect(
      screen.queryByRole('region', { name: 'channel.messages.delete' })
    ).not.toBeInTheDocument();
  });

  it('does not load more when already away from the top', async () => {
    const { container, props } = renderThread();
    const scrollElement = container.querySelector('.overflow-y-auto')!;
    setScrollMetrics(scrollElement, {
      clientHeight: 100,
      scrollHeight: 600,
      scrollTop: 120,
    });

    fireEvent.wheel(scrollElement);
    fireEvent.scroll(scrollElement);

    expect(props.loadMore).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'channel.messages.scrollToBottom' })
    ).toBeInTheDocument();
  });

  it('clears an active reply when that message is deleted', async () => {
    const user = userEvent.setup();
    const { props } = renderThread();

    await user.click(screen.getByRole('button', { name: 'reply message-2' }));
    expect(screen.getByText('replying to message-2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'delete message-2' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.deleteConfirmButton' }));

    expect(props.removeMessage).toHaveBeenCalledWith('message-2');
    expect(screen.queryByText('replying to message-2')).not.toBeInTheDocument();
  });

  it('does not highlight when loading a referenced message fails', async () => {
    const user = userEvent.setup();
    const loadUntilMessage = vi.fn().mockResolvedValue(false);
    const { props } = renderThread({ loadUntilMessage });

    await user.click(screen.getByRole('button', { name: 'reply click message-2' }));

    await waitFor(() => expect(props.loadUntilMessage).toHaveBeenCalledWith('message-1'));
    expect(screen.getByText('message:message-1:ada').closest('article')).toHaveAttribute(
      'data-selected',
      'false'
    );
  });
});
