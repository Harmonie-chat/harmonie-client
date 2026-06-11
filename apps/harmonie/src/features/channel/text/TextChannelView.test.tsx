import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { MutableRefObject, ReactNode, RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from '@/types/channel';
import type { Channel, Guild, GuildMember } from '@/types/guild';
import type { UserProfile } from '@/types/user';
import { TextChannelView } from './TextChannelView';

type ThreadRefs = {
  previousMessageCountRef: MutableRefObject<number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  suppressNextScrollEffectsRef: MutableRefObject<boolean>;
};

type MessageThreadProps = {
  afterPinActions?: ReactNode;
  authorMap: Map<string, GuildMember>;
  beforePinActions?: ReactNode;
  composer: {
    draftKey: string;
    mentionOptions: Array<{ userId: string; username: string; displayName?: string | null }>;
    onTypingStart?: () => void;
    sendFn: (
      content: string,
      fileIds: string[],
      replyToMessageId?: string | null,
      mentionedUserIds?: string[]
    ) => Promise<unknown>;
  };
  currentUser: UserProfile | null;
  cancelEditing: () => void;
  dismissNewMessagesSeparator: () => void;
  leadingActions?: ReactNode;
  loadMore: () => void;
  loadUntilMessage: (messageId: string) => Promise<boolean>;
  onAvatarClick: (member: GuildMember, rect: DOMRect) => void;
  pinned: {
    entityId: string;
    fetchPinnedMessages: (entityId: string) => Promise<unknown>;
  };
  refs: ThreadRefs;
  removeAttachment: (messageId: string, fileId: string) => void;
  removeMessage: (messageId: string) => void;
  reactionSource: { type: string; entityId: string };
  saveEdit: (messageId: string, content: string) => void;
  searchState: {
    activeSearchTarget: { messageId: string; nonce: string } | null;
    selectedMessageId: string | null;
    seekingTargetRef: MutableRefObject<boolean>;
  };
  setMessagePinned: (messageId: string, pinned: boolean) => void;
  startEditing: (messageId: string) => void;
  title: string;
  toggleReaction: (messageId: string, emoji: string) => void;
};

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: {
    guildId: 'guild-1' as string | undefined,
    channelId: 'channel-1' as string | undefined,
  },
}));

const apiMocks = vi.hoisted(() => ({
  getChannelPinnedMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

const workspaceMocks = vi.hoisted(() => ({
  searchAuthorId: null as string | null,
  searchChannelId: null as string | null,
  searchQuery: '',
  setSearchAuthorId: vi.fn(),
  setSearchChannelId: vi.fn(),
  setSearchQuery: vi.fn(),
  toggleMembersPanel: vi.fn(),
}));

const contextMocks = vi.hoisted(() => ({
  channels: null as Channel[] | null,
  connection: { send: vi.fn() },
  guild: null as Guild | null,
  guildsLoading: false,
  members: [] as GuildMember[],
  user: null as UserProfile | null,
}));

const messageMocks = vi.hoisted(() => ({
  cancelEditing: vi.fn(),
  dismissNewMessagesSeparator: vi.fn(),
  editingMessageId: null as string | null,
  error: false,
  lastReadMessageId: null as string | null,
  latestOwnMessage: null as Message | null,
  loadMore: vi.fn(),
  loadUntilMessage: vi.fn(),
  loading: false,
  loadingMore: false,
  messages: [] as Message[],
  removeAttachment: vi.fn(),
  removeMessage: vi.fn(),
  saveEdit: vi.fn(),
  setMessagePinned: vi.fn(),
  startEditing: vi.fn(),
  toggleReaction: vi.fn(),
  typingUserIds: [] as string[],
}));

const searchMocks = vi.hoisted(() => ({
  activeSearchTarget: null as { messageId: string; nonce: string } | null,
  selectedMessageId: null as string | null,
  setHandledSearchTargetNonce: vi.fn(),
  seekingTargetRef: { current: false } as MutableRefObject<boolean>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  ArrowLeft: ({ size }: { size?: number }) => <span data-testid="arrow-left">{size}</span>,
  Users: ({ size }: { size?: number }) => <span data-testid="users-icon">{size}</span>,
}));

vi.mock('react-router-dom', () => ({
  Navigate: ({ replace, to }: { replace?: boolean; to: string }) => (
    <div data-replace={replace ? 'true' : 'false'} data-testid="navigate">
      {to}
    </div>
  ),
  useNavigate: () => routerMocks.navigate,
  useParams: () => routerMocks.params,
}));

vi.mock('@harmonie/ui', () => ({
  IconButton: ({
    children,
    onClick,
    title,
  }: {
    children: ReactNode;
    onClick?: () => void;
    title?: string;
  }) => (
    <button type="button" onClick={onClick}>
      {title}
      {children}
    </button>
  ),
}));

vi.mock('@/features/guild/search/GuildSearchBar', () => ({
  GuildSearchBar: ({
    authorId,
    channelId,
    onAuthorChange,
    onChannelChange,
    onQueryChange,
    query,
  }: {
    authorId: string | null;
    channelId: string | null;
    onAuthorChange: (value: string | null) => void;
    onChannelChange: (value: string | null) => void;
    onQueryChange: (value: string) => void;
    query: string;
  }) => (
    <div data-author={authorId ?? ''} data-channel={channelId ?? ''} data-query={query}>
      <button type="button" onClick={() => onQueryChange('needle')}>
        set query
      </button>
      <button type="button" onClick={() => onAuthorChange('user-2')}>
        set author
      </button>
      <button type="button" onClick={() => onChannelChange('channel-1')}>
        set channel
      </button>
    </div>
  ),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useCurrentGuild: () => ({
    guild: contextMocks.guild,
    guildsLoading: contextMocks.guildsLoading,
  }),
  useGuildMembers: (guildId?: string) => (guildId === 'guild-1' ? contextMocks.members : []),
}));

vi.mock('@/features/channel/ChannelContext', () => ({
  useChannels: () => ({ channels: contextMocks.channels }),
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: contextMocks.connection }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: contextMocks.user }),
}));

vi.mock('@/features/guild/workspace/GuildWorkspaceProvider', () => ({
  useGuildWorkspace: () => workspaceMocks,
}));

vi.mock('@/api/channels', () => ({
  getChannelPinnedMessages: apiMocks.getChannelPinnedMessages,
  sendMessage: apiMocks.sendMessage,
}));

vi.mock('./hooks/useChannelMessages', () => ({
  useChannelMessages: vi.fn(() => messageMocks),
}));

vi.mock('./hooks/useTextChannelSearchTarget', () => ({
  useTextChannelSearchTarget: vi.fn(() => searchMocks),
}));

vi.mock('@/shared/members/MemberPopover', () => ({
  MemberPopover: ({
    member,
    onBanned,
    onClose,
    onRemoved,
    side,
  }: {
    anchorRect: DOMRect;
    guildId: string;
    member: GuildMember;
    onBanned?: () => void;
    onClose: () => void;
    onRemoved?: () => void;
    side: string;
  }) => (
    <div role="dialog" aria-label="member popover" data-side={side}>
      <span>{member.displayName ?? member.username}</span>
      <button type="button" onClick={onClose}>
        close popover
      </button>
      <button type="button" onClick={onRemoved}>
        removed
      </button>
      <button type="button" onClick={onBanned}>
        banned
      </button>
    </div>
  ),
}));

vi.mock('@/shared/message/MessageThread', () => ({
  MessageThread: ({
    afterPinActions,
    authorMap,
    beforePinActions,
    composer,
    cancelEditing,
    dismissNewMessagesSeparator,
    leadingActions,
    loadMore,
    loadUntilMessage,
    onAvatarClick,
    pinned,
    reactionSource,
    removeAttachment,
    removeMessage,
    saveEdit,
    searchState,
    setMessagePinned,
    startEditing,
    title,
    toggleReaction,
  }: MessageThreadProps) => (
    <section
      data-reaction-entity={reactionSource.entityId}
      data-reaction-type={reactionSource.type}
    >
      <h1>{title}</h1>
      <div>{leadingActions}</div>
      <div>{beforePinActions}</div>
      <div>{afterPinActions}</div>
      <span data-testid="draft-key">{composer.draftKey}</span>
      <span data-testid="mention-count">{composer.mentionOptions.length}</span>
      <span data-testid="selected-message">{searchState.selectedMessageId ?? ''}</span>
      <button
        type="button"
        onClick={() => void composer.sendFn('hello', ['file-1'], 'reply-1', ['user-2'])}
      >
        send from composer
      </button>
      <button type="button" onClick={composer.onTypingStart}>
        typing start
      </button>
      <button type="button" onClick={() => void pinned.fetchPinnedMessages(pinned.entityId)}>
        fetch pinned
      </button>
      <button type="button" onClick={loadMore}>
        load more
      </button>
      <button type="button" onClick={() => void loadUntilMessage('message-target')}>
        load until
      </button>
      <button type="button" onClick={() => startEditing('message-1')}>
        start edit
      </button>
      <button type="button" onClick={() => saveEdit('message-1', 'updated')}>
        save edit
      </button>
      <button type="button" onClick={cancelEditing}>
        cancel edit
      </button>
      <button type="button" onClick={() => removeMessage('message-1')}>
        remove message
      </button>
      <button type="button" onClick={() => removeAttachment('message-1', 'file-1')}>
        remove attachment
      </button>
      <button type="button" onClick={() => setMessagePinned('message-1', true)}>
        pin message
      </button>
      <button type="button" onClick={() => toggleReaction('message-1', '👍')}>
        react
      </button>
      <button type="button" onClick={dismissNewMessagesSeparator}>
        dismiss separator
      </button>
      <button
        type="button"
        onClick={() => {
          const member = authorMap.get('user-2');
          if (member) onAvatarClick(member, new DOMRect(1, 2, 3, 4));
        }}
      >
        avatar click
      </button>
    </section>
  ),
  useMessageThreadRefs: (): ThreadRefs => ({
    previousMessageCountRef: { current: 0 },
    scrollRef: { current: null },
    suppressNextScrollEffectsRef: { current: false },
  }),
}));

const guild: Guild = {
  guildId: 'guild-1',
  name: 'Guild',
  ownerUserId: 'owner',
  role: 'Admin',
  joinedAtUtc: '2026-01-01T00:00:00Z',
  iconFileId: null,
  icon: null,
};

const channel: Channel = {
  channelId: 'channel-1',
  name: 'general',
  type: 'Text',
  isDefault: true,
  position: 1,
};

const user: UserProfile = {
  userId: 'user-1',
  username: 'me',
  displayName: 'Me',
  avatarFileId: null,
  avatar: undefined,
  theme: 'default',
  language: 'fr',
};

const member: GuildMember = {
  userId: 'user-2',
  username: 'ada',
  displayName: 'Ada',
  avatarFileId: null,
  avatar: undefined,
  isActive: true,
  role: 'Member',
  joinedAtUtc: '2026-01-01T00:00:00Z',
};

describe('TextChannelView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.params = { guildId: 'guild-1', channelId: 'channel-1' };
    contextMocks.channels = [channel];
    contextMocks.connection = { send: vi.fn().mockResolvedValue(undefined) };
    contextMocks.guild = guild;
    contextMocks.guildsLoading = false;
    contextMocks.members = [member];
    contextMocks.user = user;
    messageMocks.cancelEditing.mockReset();
    messageMocks.dismissNewMessagesSeparator.mockReset();
    messageMocks.editingMessageId = null;
    messageMocks.error = false;
    messageMocks.lastReadMessageId = null;
    messageMocks.latestOwnMessage = null;
    messageMocks.loadMore.mockReset();
    messageMocks.loadUntilMessage.mockReset();
    messageMocks.loadUntilMessage.mockResolvedValue(true);
    messageMocks.loading = false;
    messageMocks.loadingMore = false;
    messageMocks.messages = [];
    messageMocks.removeAttachment.mockReset();
    messageMocks.removeMessage.mockReset();
    messageMocks.saveEdit.mockReset();
    messageMocks.setMessagePinned.mockReset();
    messageMocks.startEditing.mockReset();
    messageMocks.toggleReaction.mockReset();
    messageMocks.typingUserIds = [];
    searchMocks.activeSearchTarget = null;
    searchMocks.selectedMessageId = null;
    searchMocks.seekingTargetRef.current = false;
    workspaceMocks.searchAuthorId = null;
    workspaceMocks.searchChannelId = null;
    workspaceMocks.searchQuery = '';
    apiMocks.getChannelPinnedMessages.mockResolvedValue({ messages: [] });
    apiMocks.sendMessage.mockResolvedValue({ messageId: 'message-new' });
  });

  it('renders nothing while route data is incomplete and redirects invalid guild or channel', () => {
    routerMocks.params = { guildId: undefined, channelId: 'channel-1' };
    const { container, rerender } = render(<TextChannelView />);
    expect(container).toBeEmptyDOMElement();

    routerMocks.params = { guildId: 'guild-1', channelId: 'channel-1' };
    contextMocks.guild = null;
    rerender(<TextChannelView />);
    expect(screen.getByTestId('navigate')).toHaveTextContent('/');

    contextMocks.guild = guild;
    contextMocks.channels = [];
    rerender(<TextChannelView />);
    expect(screen.getByTestId('navigate')).toHaveTextContent('/guilds/guild-1');
  });

  it('wires thread actions, search controls, composer, pinned messages, and member popover', async () => {
    render(<TextChannelView />);

    expect(screen.getByRole('heading', { name: '# general' })).toBeInTheDocument();
    expect(screen.getByTestId('draft-key')).toHaveTextContent('channel:channel-1');
    expect(screen.getByTestId('mention-count')).toHaveTextContent('1');

    fireEvent.click(screen.getByRole('button', { name: /guild.channels.backToChannels/ }));
    fireEvent.click(screen.getByRole('button', { name: /guild.members.title/ }));
    fireEvent.click(screen.getByRole('button', { name: 'set query' }));
    fireEvent.click(screen.getByRole('button', { name: 'set author' }));
    fireEvent.click(screen.getByRole('button', { name: 'set channel' }));
    fireEvent.click(screen.getByRole('button', { name: 'send from composer' }));
    fireEvent.click(screen.getByRole('button', { name: 'typing start' }));
    fireEvent.click(screen.getByRole('button', { name: 'fetch pinned' }));
    fireEvent.click(screen.getByRole('button', { name: 'load more' }));
    fireEvent.click(screen.getByRole('button', { name: 'load until' }));
    fireEvent.click(screen.getByRole('button', { name: 'start edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'save edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'cancel edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'remove message' }));
    fireEvent.click(screen.getByRole('button', { name: 'remove attachment' }));
    fireEvent.click(screen.getByRole('button', { name: 'pin message' }));
    fireEvent.click(screen.getByRole('button', { name: 'react' }));
    fireEvent.click(screen.getByRole('button', { name: 'dismiss separator' }));
    fireEvent.click(screen.getByRole('button', { name: 'avatar click' }));

    expect(routerMocks.navigate).toHaveBeenCalledWith('/guilds/guild-1');
    expect(workspaceMocks.toggleMembersPanel).toHaveBeenCalledTimes(1);
    expect(workspaceMocks.setSearchQuery).toHaveBeenCalledWith('needle');
    expect(workspaceMocks.setSearchAuthorId).toHaveBeenCalledWith('user-2');
    expect(workspaceMocks.setSearchChannelId).toHaveBeenCalledWith('channel-1');
    expect(apiMocks.sendMessage).toHaveBeenCalledWith('channel-1', 'hello', ['file-1'], 'reply-1', [
      'user-2',
    ]);
    expect(contextMocks.connection.send).toHaveBeenCalledWith('StartTypingChannel', 'channel-1');
    expect(apiMocks.getChannelPinnedMessages).toHaveBeenCalledWith('channel-1');
    expect(messageMocks.loadMore).toHaveBeenCalledTimes(1);
    expect(messageMocks.loadUntilMessage).toHaveBeenCalledWith('message-target');
    expect(messageMocks.startEditing).toHaveBeenCalledWith('message-1');
    expect(messageMocks.saveEdit).toHaveBeenCalledWith('message-1', 'updated');
    expect(messageMocks.cancelEditing).toHaveBeenCalledTimes(1);
    expect(messageMocks.removeMessage).toHaveBeenCalledWith('message-1');
    expect(messageMocks.removeAttachment).toHaveBeenCalledWith('message-1', 'file-1');
    expect(messageMocks.setMessagePinned).toHaveBeenCalledWith('message-1', true);
    expect(messageMocks.toggleReaction).toHaveBeenCalledWith('message-1', '👍');
    expect(messageMocks.dismissNewMessagesSeparator).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('dialog', { name: 'member popover' })).toHaveTextContent('Ada');
    fireEvent.click(screen.getByRole('button', { name: 'close popover' }));
    expect(screen.queryByRole('dialog', { name: 'member popover' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'avatar click' }));
    fireEvent.click(screen.getByRole('button', { name: 'removed' }));
    expect(screen.queryByRole('dialog', { name: 'member popover' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'avatar click' }));
    fireEvent.click(screen.getByRole('button', { name: 'banned' }));
    expect(screen.queryByRole('dialog', { name: 'member popover' })).not.toBeInTheDocument();

    await waitFor(() => expect(apiMocks.sendMessage).toHaveBeenCalledTimes(1));
  });

  it('does not fail typing notifications when the realtime connection is missing', () => {
    contextMocks.connection = null as never;

    render(<TextChannelView />);

    fireEvent.click(screen.getByRole('button', { name: 'typing start' }));

    expect(screen.getByRole('heading', { name: '# general' })).toBeInTheDocument();
  });

  it('loads missing search targets and clears stale navigation state when not found', async () => {
    searchMocks.activeSearchTarget = { messageId: 'missing-message', nonce: 'nonce-1' };
    messageMocks.loadUntilMessage.mockResolvedValueOnce(false);

    render(<TextChannelView />);

    await waitFor(() =>
      expect(messageMocks.loadUntilMessage).toHaveBeenCalledWith('missing-message')
    );
    expect(searchMocks.setHandledSearchTargetNonce).toHaveBeenCalledWith('nonce-1');
    expect(routerMocks.navigate).toHaveBeenCalledWith('/guilds/guild-1/channels/channel-1', {
      replace: true,
      state: null,
    });
  });

  it('does not seek when the target is already loaded or requests are already in flight', () => {
    searchMocks.activeSearchTarget = { messageId: 'message-loaded', nonce: 'nonce-2' };
    messageMocks.messages = [{ messageId: 'message-loaded' } as Message];

    const { rerender } = render(<TextChannelView />);

    expect(messageMocks.loadUntilMessage).not.toHaveBeenCalledWith('message-loaded');

    messageMocks.messages = [];
    messageMocks.loading = true;
    rerender(<TextChannelView />);

    expect(messageMocks.loadUntilMessage).not.toHaveBeenCalled();
  });

  it('resets the seeking flag when loading a missing search target fails', async () => {
    searchMocks.activeSearchTarget = { messageId: 'missing-message', nonce: 'nonce-3' };
    messageMocks.loadUntilMessage.mockRejectedValueOnce(new Error('offline'));

    render(<TextChannelView />);

    await waitFor(() => expect(searchMocks.seekingTargetRef.current).toBe(false));
    expect(searchMocks.setHandledSearchTargetNonce).not.toHaveBeenCalled();
  });
});
