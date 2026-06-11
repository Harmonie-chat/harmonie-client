import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { Message, ReplyPreview } from '@/types/channel';
import type { MessageAuthor } from '../messageAuthor';
import { MessageActions } from './MessageActions';
import { MessageContent } from './MessageContent';
import { MessageContextMenu } from './MessageContextMenu';
import { MessageInlineEditor } from './MessageInlineEditor';
import { MessageLinkPreviews } from './MessageLinkPreviews';
import { MessageListItem } from './MessageListItem';
import { MessageReplyPreview } from './MessageReplyPreview';

const downloadState = vi.hoisted(() => ({
  download: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, values?: Record<string, string | number>) =>
      values?.name ? `${key}:${values.name}` : key,
  }),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/shared/hooks/useFileDownload', () => ({
  useFileDownload: () => downloadState,
}));

vi.mock('@/shared/message/attachments/MessageAttachments', () => ({
  MessageAttachments: ({
    attachments,
    onDelete,
    onDeleteDirect,
  }: {
    attachments: Array<{ contentType?: string; fileId: string; fileName: string }>;
    onDelete?: (fileId: string) => void;
    onDeleteDirect?: () => void;
  }) => (
    <div aria-label="attachments">
      {attachments.map((attachment) => (
        <div key={attachment.fileId}>
          {attachment.contentType?.startsWith('image/') && (
            <img
              alt={attachment.fileName}
              data-message-attachment-file-id={attachment.fileId}
              src={`blob:${attachment.fileId}`}
            />
          )}
          <button
            onClick={() => {
              onDelete?.(attachment.fileId);
              onDeleteDirect?.();
            }}
            type="button"
          >
            {attachment.fileName}
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/shared/message/reactions/MessageReactions', () => ({
  MessageReactions: ({
    reactions,
    onToggle,
  }: {
    reactions: Array<{ emoji: string }>;
    onToggle?: (emoji: string) => void;
  }) => (
    <div aria-label="reactions">
      {reactions.map((reaction) => (
        <button key={reaction.emoji} onClick={() => onToggle?.(reaction.emoji)} type="button">
          react {reaction.emoji}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@harmonie/ui', () => {
  const RichTextMessageInput = ({
    autoFocus,
    disabled,
    error,
    mentionOptions,
    onChange,
    onEscape,
    onMentionSelected,
    onSubmit,
    onToggleFormattingTools,
    showFormattingTools,
    value,
  }: {
    autoFocus?: boolean;
    disabled?: boolean;
    error?: string;
    mentionOptions?: Array<{ userId: string; username: string; displayName?: string | null }>;
    onChange: (value: string) => void;
    onEscape?: () => void;
    onMentionSelected?: (mention: {
      userId: string;
      username: string;
      displayName?: string | null;
    }) => void;
    onSubmit: () => void;
    onToggleFormattingTools?: () => void;
    showFormattingTools?: boolean;
    value: string;
  }) => (
    <section data-autofocus={String(autoFocus)} data-formatting-open={String(showFormattingTools)}>
      <textarea
        aria-label="rich input"
        disabled={disabled}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={value}
      />
      <button onClick={onSubmit} type="button">
        submit rich input
      </button>
      <button onClick={onEscape} type="button">
        escape rich input
      </button>
      <button
        onClick={() => {
          const mention = mentionOptions?.[0];
          if (mention) onMentionSelected?.(mention);
        }}
        type="button"
      >
        select rich mention
      </button>
      <button onClick={onToggleFormattingTools} type="button">
        toggle rich formatting
      </button>
      <output aria-label="rich error">{error ?? ''}</output>
    </section>
  );

  return {
    Avatar: ({ alt, avatarUrl }: { alt: string; avatarUrl?: string | null }) => (
      <img alt={alt} src={avatarUrl ?? 'avatar:placeholder'} />
    ),
    ContextMenu: ({
      items,
      onClose,
      position,
      touchExpanded,
      touchHeader,
    }: {
      items: Array<{ label: string; onClick: () => void }>;
      onClose: () => void;
      position: { x: number; y: number };
      touchExpanded?: boolean;
      touchHeader?: ReactNode;
    }) => (
      <div
        aria-label="context menu"
        data-expanded={String(touchExpanded)}
        data-position={`${position.x},${position.y}`}
      >
        <button onClick={onClose} type="button">
          close menu
        </button>
        {touchHeader}
        {items.map((item, index) => (
          <button key={`${item.label}-${index}`} onClick={item.onClick} type="button">
            {item.label}
          </button>
        ))}
      </div>
    ),
    EmojiPickerBase: ({
      onEmojiClick,
      searchPlaceholder,
    }: {
      onEmojiClick: (data: { emoji: string }) => void;
      searchPlaceholder: string;
    }) => (
      <div aria-label={searchPlaceholder}>
        <button onClick={() => onEmojiClick({ emoji: '😀' })} type="button">
          pick emoji
        </button>
      </div>
    ),
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
      delete buttonProps.size;
      delete buttonProps.tooltipSide;
      delete buttonProps.variant;

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
    LinkPreview: ({
      ariaLabel,
      host,
      title,
      url,
    }: {
      ariaLabel: string;
      host: string;
      title?: string | null;
      url: string;
    }) => (
      <a aria-label={ariaLabel} href={url}>
        {title ?? host}
      </a>
    ),
    RichTextMessageInput,
  };
});

const installBrowserMocks = () => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
};

const member: MessageAuthor = {
  avatarFileId: 'avatar-1',
  displayName: 'Ada Lovelace',
  userId: 'user-1',
  username: 'ada',
};

const mentionAuthor: MessageAuthor = {
  displayName: 'Grace Hopper',
  userId: 'user-2',
  username: 'grace',
};

const replyTo: ReplyPreview = {
  authorDisplayName: 'Linus',
  authorUserId: 'user-3',
  authorUsername: 'linus',
  content: '<p>Parent message</p>',
  deletedAtUtc: null,
  hasAttachments: false,
  isDeleted: false,
  messageId: 'reply-1',
};

const baseMessage: Message = {
  attachments: [
    {
      contentType: 'text/plain',
      fileId: 'file-1',
      fileName: 'notes.txt',
      sizeBytes: 42,
    },
  ],
  authorUserId: member.userId,
  content: 'Hello @Grace Hopper -> https://example.com/docs',
  createdAtUtc: '2026-01-01T10:00:00.000Z',
  isPinned: true,
  linkPreviews: [
    {
      description: 'Docs',
      imageUrl: null,
      siteName: null,
      title: 'Example Docs',
      url: 'https://www.example.com/docs',
    },
  ],
  mentionedUserIds: ['user-2'],
  messageId: 'message-1',
  reactions: [{ count: 1, emoji: '👍', reactedByMe: false }],
  replyTo,
  updatedAtUtc: '2026-01-01T10:01:00.000Z',
};

describe('MessageListItem', () => {
  beforeEach(() => {
    installBrowserMocks();
    downloadState.download.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders message metadata and wires primary actions, mentions, replies and reactions', async () => {
    const user = userEvent.setup();
    const onAvatarClick = vi.fn();
    const onAttachmentDeleted = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const onOpenMenu = vi.fn();
    const onPinToggle = vi.fn();
    const onReact = vi.fn();
    const onReply = vi.fn();
    const onReplyClick = vi.fn();
    const reactionUserMap = new Map([
      [member.userId, member],
      [mentionAuthor.userId, mentionAuthor],
    ]);

    render(
      <MessageListItem
        currentUser={{
          language: 'fr',
          theme: 'default',
          userId: member.userId,
          username: member.username,
        }}
        member={member}
        message={baseMessage}
        onAttachmentDeleted={onAttachmentDeleted}
        onAvatarClick={onAvatarClick}
        onDelete={onDelete}
        onEdit={onEdit}
        onOpenMenu={onOpenMenu}
        onPinToggle={onPinToggle}
        onReact={onReact}
        onReply={onReply}
        onReplyClick={onReplyClick}
        reactionSource={{ entityId: 'channel-1', type: 'channel' }}
        reactionUserMap={reactionUserMap}
        rowState={{ isMentioned: true, isOwn: true, isSelected: true }}
      />
    );

    await user.click(
      screen.getByRole('button', {
        name: 'channel.messages.openMemberProfile:Ada Lovelace',
      })
    );
    await user.click(screen.getByRole('button', { name: /Parent message/u }));
    await user.click(screen.getByRole('button', { name: '@Grace Hopper' }));
    await user.click(screen.getByRole('button', { name: 'notes.txt' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.reply' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.unpin' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.edit' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.delete' }));
    await user.click(screen.getByRole('button', { name: 'react 👍' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.react' }));
    await user.click(await screen.findByRole('button', { name: 'pick emoji' }));

    fireEvent.contextMenu(screen.getByText('Ada Lovelace').closest('[data-message-id]')!);

    expect(screen.getByText('channel.messages.pinned')).toBeInTheDocument();
    expect(screen.getByText('channel.messages.edited')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /https:\/\/example.com\/docs/u })).toHaveAttribute(
      'href',
      'https://example.com/docs'
    );
    expect(screen.getByRole('link', { name: 'channel.messages.openLinkPreview' })).toHaveAttribute(
      'href',
      'https://www.example.com/docs'
    );
    expect(onAvatarClick).toHaveBeenCalledWith(member, expect.any(Object));
    expect(onAvatarClick).toHaveBeenCalledWith(mentionAuthor, expect.any(Object));
    expect(onReplyClick).toHaveBeenCalledWith('reply-1');
    expect(onAttachmentDeleted).toHaveBeenCalledWith('file-1');
    expect(onDelete).toHaveBeenCalledWith('message-1');
    expect(onReply).toHaveBeenCalledWith('message-1');
    expect(onPinToggle).toHaveBeenCalledWith('message-1', false);
    expect(onEdit).toHaveBeenCalledWith('message-1');
    expect(onReact).toHaveBeenCalledWith('message-1', '👍');
    expect(onReact).toHaveBeenCalledWith('message-1', '😀');
    expect(onOpenMenu).toHaveBeenCalledWith(expect.any(Object), 'message-1', 'left', undefined);
  });

  it('passes the targeted image attachment to the context menu', () => {
    const onOpenMenu = vi.fn();

    render(
      <MessageListItem
        member={member}
        message={{
          ...baseMessage,
          attachments: [
            {
              contentType: 'image/png',
              fileId: 'image-1',
              fileName: 'image.png',
              sizeBytes: 42,
            },
          ],
        }}
        onOpenMenu={onOpenMenu}
        onReply={vi.fn()}
        rowState={{ isOwn: false }}
      />
    );

    fireEvent.contextMenu(screen.getByRole('img', { name: 'image.png' }));

    expect(onOpenMenu).toHaveBeenCalledWith(expect.any(Object), 'message-1', 'left', {
      fileId: 'image-1',
      fileName: 'image.png',
    });
  });

  it('saves and cancels inline edits with filtered mentions and mapped API errors', async () => {
    const user = userEvent.setup();
    const onCancelEdit = vi.fn();
    const onSaveEdit = vi
      .fn()
      .mockRejectedValueOnce({ code: 'MESSAGE_MENTIONED_USER_NOT_FOUND' })
      .mockResolvedValueOnce(undefined);

    render(
      <MessageListItem
        member={member}
        mentionOptions={[
          {
            userId: mentionAuthor.userId,
            username: mentionAuthor.username,
            displayName: 'Grace Hopper',
          },
        ]}
        message={{ ...baseMessage, content: 'Old @Grace Hopper', mentionedUserIds: ['user-2'] }}
        onCancelEdit={onCancelEdit}
        onSaveEdit={onSaveEdit}
        rowState={{ isEditing: true, isOwn: true }}
      />
    );

    fireEvent.change(screen.getByLabelText('rich input'), {
      target: { value: 'Updated @Grace Hopper' },
    });
    await user.click(screen.getByRole('button', { name: 'select rich mention' }));
    await user.click(screen.getByRole('button', { name: 'channel.input.saveEdit' }));

    await waitFor(() =>
      expect(screen.getByLabelText('rich error')).toHaveTextContent(
        'channel.input.mentionUserNotFound'
      )
    );

    await user.click(screen.getByRole('button', { name: 'channel.input.saveEdit' }));
    await user.click(screen.getByRole('button', { name: 'channel.input.cancelEdit' }));

    expect(onSaveEdit).toHaveBeenLastCalledWith('message-1', 'Updated @Grace Hopper', ['user-2']);
    expect(onCancelEdit).toHaveBeenCalledTimes(1);
  });

  it('opens touch menus on long press and replies on left swipe', () => {
    vi.useFakeTimers();
    const onOpenMenuAt = vi.fn();
    const onReply = vi.fn();

    render(
      <MessageListItem
        member={member}
        message={baseMessage}
        onOpenMenuAt={onOpenMenuAt}
        onReply={onReply}
        rowState={{ isOwn: false }}
      />
    );

    const row = screen.getByText('Ada Lovelace').closest('[data-message-id]')!;

    fireEvent.touchStart(row, { touches: [{ clientX: 100, clientY: 20 }] });
    vi.advanceTimersByTime(520);

    expect(onOpenMenuAt).toHaveBeenCalledWith('message-1', { x: 100, y: 20 }, 'left');

    fireEvent.touchMove(row, { touches: [{ clientX: 20, clientY: 24 }] });
    fireEvent.touchEnd(row);

    expect(onReply).toHaveBeenCalledWith('message-1');
  });
});

describe('MessageListItem subcomponents', () => {
  beforeEach(() => {
    installBrowserMocks();
  });

  it('returns no action toolbar when no action is available', () => {
    const { container } = render(
      <MessageActions
        availability={{
          canDelete: false,
          canEdit: false,
          canPin: false,
          canReact: false,
          canReply: false,
        }}
        labels={{
          delete: 'delete',
          edit: 'edit',
          pin: 'pin',
          react: 'react',
          reply: 'reply',
          unpin: 'unpin',
        }}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
        onPickerOpen={vi.fn()}
        onPinToggle={vi.fn()}
        onReply={vi.fn()}
        state={{ isPinned: false }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders sanitized rich HTML and plain text fallback content', () => {
    const { rerender } = render(
      <MessageContent content="<p>Hello <script>bad()</script><strong>world</strong></p>" />
    );

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('world')).toBeInTheDocument();
    expect(screen.queryByText('bad()')).not.toBeInTheDocument();

    rerender(<MessageContent content="A -> B" />);

    expect(screen.getByText(/A/u)).toHaveTextContent('A -⁠> B');
  });

  it('handles empty, invalid and deleted previews', async () => {
    const user = userEvent.setup();
    const onReplyClick = vi.fn();
    const { container, rerender } = render(<MessageLinkPreviews previews={[]} />);

    expect(container).toBeEmptyDOMElement();

    rerender(
      <MessageLinkPreviews
        previews={[
          {
            description: null,
            imageUrl: null,
            siteName: null,
            title: null,
            url: 'not a url',
          },
        ]}
      />
    );

    expect(
      screen.getByRole('link', { name: 'channel.messages.openLinkPreview' })
    ).toHaveTextContent('not a url');

    render(
      <MessageReplyPreview
        onClick={onReplyClick}
        replyTo={{
          ...replyTo,
          content: null,
          hasAttachments: true,
          isDeleted: true,
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'channel.messages.replyDeleted' }));

    expect(onReplyClick).toHaveBeenCalledWith('reply-1');
  });

  it('blocks invalid inline editor saves and maps generic update errors', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue({});

    render(<MessageInlineEditor initialValue="Initial" onCancel={vi.fn()} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText('rich input'), { target: { value: '' } });
    await user.click(screen.getByRole('button', { name: 'channel.input.saveEdit' }));

    expect(onSave).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('rich input'), { target: { value: 'x'.repeat(4001) } });

    expect(screen.getByLabelText('rich error')).toHaveTextContent('channel.input.tooLong');

    fireEvent.change(screen.getByLabelText('rich input'), { target: { value: 'Valid edit' } });
    await user.click(screen.getByRole('button', { name: 'submit rich input' }));

    await waitFor(() =>
      expect(screen.getByLabelText('rich error')).toHaveTextContent('channel.input.updateError')
    );
  });

  it('renders context menu actions, quick reactions and expanded emoji picker', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onDelete = vi.fn();
    const onEdit = vi.fn();
    const onPinToggle = vi.fn();
    const onReact = vi.fn();
    const onReply = vi.fn();
    const menu = {
      canDelete: true,
      canEdit: true,
      canReact: true,
      canReply: true,
      horizontalAnchor: 'left' as const,
      isPinned: false,
      messageId: 'message-1',
      position: { x: 12, y: 34 },
      imageAttachment: { fileId: 'image-1', fileName: 'image.png' },
    };
    const { container, rerender } = render(
      <MessageContextMenu
        menu={null}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        onPinToggle={onPinToggle}
        onReact={onReact}
        onReply={onReply}
      />
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <MessageContextMenu
        menu={menu}
        onClose={onClose}
        onDelete={onDelete}
        onEdit={onEdit}
        onPinToggle={onPinToggle}
        onReact={onReact}
        onReply={onReply}
      />
    );

    expect(screen.getByLabelText('context menu')).toHaveAttribute('data-position', '12,34');

    await user.click(screen.getByRole('button', { name: '👍' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.reply' }));
    await user.click(screen.getAllByRole('button', { name: 'channel.messages.react' })[1]);
    await user.click(screen.getByRole('button', { name: 'channel.messages.downloadImage' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.edit' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.pin' }));
    await user.click(screen.getByRole('button', { name: 'channel.messages.delete' }));

    expect(onReact).toHaveBeenCalledWith('message-1', '👍');
    expect(onReact).toHaveBeenCalledWith('message-1', { x: 12, y: 34 });
    expect(downloadState.download).toHaveBeenCalledWith('image-1', 'image.png');
    expect(onReply).toHaveBeenCalledWith('message-1');
    expect(onEdit).toHaveBeenCalledWith('message-1');
    expect(onPinToggle).toHaveBeenCalledWith('message-1', true);
    expect(onDelete).toHaveBeenCalledWith('message-1');
    expect(onClose).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: 'channel.messages.react' })[0]);

    expect(screen.getByLabelText('context menu')).toHaveAttribute('data-expanded', 'true');

    await user.click(screen.getByRole('button', { name: 'pick emoji' }));

    expect(onReact).toHaveBeenCalledWith('message-1', '😀');
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
