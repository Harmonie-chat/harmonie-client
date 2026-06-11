import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conversation } from '@/types/conversation';
import type { UserProfile } from '@/types/user';
import { ConversationSidebar } from './ConversationSidebar';

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: { conversationId: 'group-1' as string | undefined },
}));

const apiMocks = vi.hoisted(() => ({
  deleteConversation: vi.fn(),
  updateConversationName: vi.fn(),
}));

const contextMocks = vi.hoisted(() => ({
  conversations: null as Conversation[] | null,
  fetchConversations: vi.fn(),
  hasUnreadConversation: vi.fn(),
  removeConversation: vi.fn(),
  updateConversation: vi.fn(),
  user: null as UserProfile | null,
  activeConversationId: null as string | null,
  participantsByConversation: {} as Record<string, Array<{ userId: string }>>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  Pencil: ({ size }: { size?: number }) => <span data-testid="pencil-icon">{size}</span>,
  Plus: ({ size }: { size?: number }) => <span data-testid="plus-icon">{size}</span>,
  X: ({ size }: { size?: number }) => <span data-testid="x-icon">{size}</span>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => routerMocks.navigate,
  useParams: () => routerMocks.params,
}));

vi.mock('@harmonie/ui', () => ({
  ContextMenu: ({
    items,
    onClose,
  }: {
    items: Array<{ label: string; onClick: () => void }>;
    onClose: () => void;
    position: { x: number; y: number };
  }) => (
    <div role="menu">
      {items.map((item) => (
        <button key={item.label} type="button" onClick={item.onClick}>
          {item.label}
        </button>
      ))}
      <button type="button" onClick={onClose}>
        close menu
      </button>
    </div>
  ),
  ConversationItem: ({
    active,
    callActive,
    callLabel,
    deleteLabel,
    label,
    onClick,
    onContextMenu,
    onDeleteClick,
    onLongPress,
    unread,
  }: {
    active?: boolean;
    avatar?: ReactNode;
    callActive?: boolean;
    callLabel?: string;
    deleteLabel: string;
    label: string;
    onClick: () => void;
    onContextMenu: (event: React.MouseEvent) => void;
    onDeleteClick: () => void;
    onLongPress: (position: { x: number; y: number }) => void;
    unread?: boolean;
  }) => (
    <div
      data-active={active ? 'true' : 'false'}
      data-call-active={callActive ? 'true' : 'false'}
      data-call-label={callLabel}
      data-unread={unread ? 'true' : 'false'}
    >
      <button type="button" onClick={onClick} onContextMenu={onContextMenu}>
        {label}
      </button>
      <button type="button" onClick={() => onLongPress({ x: 15, y: 25 })}>
        long press {label}
      </button>
      <button type="button" onClick={onDeleteClick}>
        {deleteLabel} {label}
      </button>
    </div>
  ),
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

vi.mock('@/api/conversations', () => ({
  deleteConversation: apiMocks.deleteConversation,
  updateConversationName: apiMocks.updateConversationName,
}));

vi.mock('@/features/realtime/MessageActivityContext', () => ({
  useMessageActivity: () => ({
    hasUnreadConversation: contextMocks.hasUnreadConversation,
  }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: contextMocks.user }),
}));

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  useVoicePresence: () => ({
    activeConversationId: contextMocks.activeConversationId,
    getConversationParticipants: (conversationId: string) =>
      contextMocks.participantsByConversation[conversationId] ?? [],
  }),
}));

vi.mock('./ConversationContext', () => ({
  useConversations: () => ({
    conversations: contextMocks.conversations,
    fetchConversations: contextMocks.fetchConversations,
    removeConversation: contextMocks.removeConversation,
    updateConversation: contextMocks.updateConversation,
  }),
}));

vi.mock('./avatar/ConversationAvatar', () => ({
  ConversationAvatar: ({ label }: { label: string }) => (
    <span data-testid={`conversation-avatar-${label}`} />
  ),
}));

vi.mock('./create/NewConversationModal', () => ({
  NewConversationModal: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="new conversation">
      <button type="button" onClick={onClose}>
        close new conversation
      </button>
    </div>
  ),
}));

vi.mock('./LeaveConversationModal', () => ({
  LeaveConversationModal: ({
    error,
    isLeaving,
    onClose,
    onConfirm,
  }: {
    error: boolean;
    isLeaving: boolean;
    onClose: () => void;
    onConfirm: () => void;
  }) => (
    <div role="dialog" aria-label="leave conversation">
      <span data-error={error ? 'true' : 'false'} data-saving={isLeaving ? 'true' : 'false'} />
      <button type="button" onClick={onConfirm}>
        confirm leave
      </button>
      <button type="button" onClick={onClose}>
        close leave
      </button>
    </div>
  ),
}));

vi.mock('./RenameConversationModal', () => ({
  RenameConversationModal: ({
    error,
    isSaving,
    onChange,
    onClose,
    onSave,
  }: {
    conversation: Conversation;
    error: boolean;
    isSaving: boolean;
    onChange: () => void;
    onClose: () => void;
    onSave: (name: string | null) => void;
  }) => (
    <div role="dialog" aria-label="rename conversation">
      <span data-error={error ? 'true' : 'false'} data-saving={isSaving ? 'true' : 'false'} />
      <button type="button" onClick={() => onSave('Renamed')}>
        save renamed
      </button>
      <button type="button" onClick={() => onSave('Team')}>
        save same name
      </button>
      <button type="button" onClick={onChange}>
        change name
      </button>
      <button type="button" onClick={onClose}>
        close rename
      </button>
    </div>
  ),
}));

const user: UserProfile = {
  userId: 'user-current',
  username: 'me',
  displayName: 'Me',
  avatarFileId: null,
  avatar: undefined,
  theme: 'default',
  language: 'fr',
};

const groupConversation: Conversation = {
  conversationId: 'group-1',
  type: 'Group',
  name: 'Team',
  participants: [
    { userId: 'user-current', username: 'me', displayName: 'Me' },
    { userId: 'user-2', username: 'ada', displayName: 'Ada' },
  ],
  createdAtUtc: '2026-01-01T00:00:00Z',
};

const directConversation: Conversation = {
  conversationId: 'direct-1',
  type: 'Direct',
  name: null,
  participants: [
    { userId: 'user-current', username: 'me', displayName: 'Me' },
    { userId: 'user-3', username: 'linus', displayName: 'Linus' },
  ],
  createdAtUtc: '2026-01-02T00:00:00Z',
};

describe('ConversationSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.params = { conversationId: 'group-1' };
    contextMocks.conversations = [groupConversation, directConversation];
    contextMocks.user = user;
    contextMocks.activeConversationId = 'direct-1';
    contextMocks.participantsByConversation = {
      'group-1': [{ userId: 'remote-voice' }],
      'direct-1': [{ userId: 'user-current' }],
    };
    contextMocks.hasUnreadConversation.mockImplementation(
      (conversationId: string) => conversationId === 'direct-1'
    );
  });

  it('renders loading and empty states while fetching conversations', () => {
    contextMocks.conversations = null;

    const { rerender } = render(<ConversationSidebar />);

    expect(screen.queryByText('conversation.selectPlaceholder')).not.toBeInTheDocument();
    expect(contextMocks.fetchConversations).toHaveBeenCalledTimes(1);

    contextMocks.conversations = [];
    contextMocks.user = user;
    rerender(<ConversationSidebar />);

    expect(screen.getByText('conversation.selectPlaceholder')).toBeInTheDocument();
  });

  it('renders conversations, navigates, and opens the new conversation modal', () => {
    render(<ConversationSidebar />);

    expect(screen.getByRole('heading', { name: 'conversation.home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Team' }).parentElement).toHaveAttribute(
      'data-active',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Team' }).parentElement).toHaveAttribute(
      'data-call-active',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Linus' }).parentElement).toHaveAttribute(
      'data-unread',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Linus' }));
    fireEvent.click(screen.getByRole('button', { name: /conversation.newConversation/ }));

    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations/direct-1');
    expect(screen.getByRole('dialog', { name: 'new conversation' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close new conversation' }));
    expect(screen.queryByRole('dialog', { name: 'new conversation' })).not.toBeInTheDocument();
  });

  it('renames group conversations and closes when the name is unchanged', async () => {
    render(<ConversationSidebar />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Team' }), {
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(screen.getByRole('button', { name: 'conversation.rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'save renamed' }));

    await waitFor(() =>
      expect(apiMocks.updateConversationName).toHaveBeenCalledWith('group-1', 'Renamed')
    );
    expect(contextMocks.updateConversation).toHaveBeenCalledWith({
      ...groupConversation,
      name: 'Renamed',
    });
    expect(screen.queryByRole('dialog', { name: 'rename conversation' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'long press Team' }));
    fireEvent.click(screen.getByRole('button', { name: 'conversation.rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'save same name' }));

    expect(apiMocks.updateConversationName).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'rename conversation' })).not.toBeInTheDocument();
  });

  it('keeps rename and leave modals open on API errors and clears errors on retry/change', async () => {
    apiMocks.updateConversationName.mockRejectedValueOnce(new Error('network'));
    apiMocks.deleteConversation.mockRejectedValueOnce(new Error('network'));

    render(<ConversationSidebar />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Team' }));
    fireEvent.click(screen.getByRole('button', { name: 'conversation.rename' }));
    fireEvent.click(screen.getByRole('button', { name: 'save renamed' }));

    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'rename conversation' }).querySelector('span')
      ).toHaveAttribute('data-error', 'true')
    );
    fireEvent.click(screen.getByRole('button', { name: 'change name' }));
    expect(
      screen.getByRole('dialog', { name: 'rename conversation' }).querySelector('span')
    ).toHaveAttribute('data-error', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'close rename' }));

    fireEvent.click(screen.getByRole('button', { name: 'conversation.delete Team' }));
    fireEvent.click(screen.getByRole('button', { name: 'confirm leave' }));

    await waitFor(() =>
      expect(
        screen.getByRole('dialog', { name: 'leave conversation' }).querySelector('span')
      ).toHaveAttribute('data-error', 'true')
    );
  });

  it('leaves conversations and redirects only when leaving the active conversation', async () => {
    apiMocks.deleteConversation.mockResolvedValue(undefined);

    render(<ConversationSidebar />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Linus' }));

    expect(screen.queryByRole('button', { name: 'conversation.rename' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'conversation.delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'confirm leave' }));

    await waitFor(() => expect(apiMocks.deleteConversation).toHaveBeenCalledWith('direct-1'));
    expect(contextMocks.removeConversation).toHaveBeenCalledWith('direct-1');
    expect(routerMocks.navigate).not.toHaveBeenCalledWith('/conversations');

    routerMocks.params = { conversationId: 'group-1' };
    fireEvent.click(screen.getByRole('button', { name: 'conversation.delete Team' }));
    fireEvent.click(screen.getByRole('button', { name: 'confirm leave' }));

    await waitFor(() => expect(apiMocks.deleteConversation).toHaveBeenCalledWith('group-1'));
    expect(contextMocks.removeConversation).toHaveBeenCalledWith('group-1');
    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations');
  });
});
