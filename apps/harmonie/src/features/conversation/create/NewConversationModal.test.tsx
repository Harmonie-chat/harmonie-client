import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchUser } from '@/types/conversation';
import { NewConversationModal } from './NewConversationModal';

const mocks = vi.hoisted(() => ({
  addConversation: vi.fn(),
  createGroupConversation: vi.fn(),
  navigate: vi.fn(),
  openDirectConversation: vi.fn(),
  searchUsers: vi.fn(),
}));

const { addConversation, createGroupConversation, navigate, openDirectConversation, searchUsers } =
  mocks;

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { name?: string }) => (values?.name ? `${key} ${values.name}` : key),
  }),
}));

vi.mock('@harmonie/ui', () => ({
  Avatar: ({ alt }: { alt: string }) => <span data-testid="avatar">{alt}</span>,
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  EmojiInput: ({
    ariaLabel,
    maxLength,
    onChange,
    placeholder,
    value,
    ...props
  }: {
    'aria-label'?: string;
    ariaLabel?: string;
    emojiButtonLabel?: string;
    maxLength?: number;
    onChange: (value: string) => void;
    pickerPlacement?: string;
    placeholder: string;
    value: string;
  }) => (
    <input
      aria-label={ariaLabel ?? props['aria-label']}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  ),
  Modal: ({
    children,
    onClose,
    subtitle,
    title,
  }: {
    children: ReactNode;
    onClose: () => void;
    subtitle: string;
    title: string;
  }) => (
    <section role="dialog" aria-label={title}>
      <p>{subtitle}</p>
      <button type="button" onClick={onClose}>
        close modal
      </button>
      {children}
    </section>
  ),
}));

vi.mock('@/api/conversations', () => ({
  createGroupConversation: (...args: unknown[]) => createGroupConversation(...args),
  openDirectConversation: (...args: unknown[]) => openDirectConversation(...args),
  searchUsers: (...args: unknown[]) => searchUsers(...args),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: () => null,
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({
    user: {
      userId: 'me',
      username: 'current',
      displayName: 'Current User',
      avatarFileId: null,
      avatar: null,
    },
  }),
}));

vi.mock('../ConversationContext', () => ({
  useConversations: () => ({ addConversation }),
}));

const alice: SearchUser = {
  userId: 'u-alice',
  username: 'alice',
  displayName: 'Alice',
  avatarFileId: null,
  avatar: null,
};

const bob: SearchUser = {
  userId: 'u-bob',
  username: 'bob',
  displayName: null,
  avatarFileId: null,
  avatar: null,
};

const currentUserSearchResult: SearchUser = {
  userId: 'me',
  username: 'current',
  displayName: 'Current User',
  avatarFileId: null,
  avatar: null,
};

const searchFor = async (query: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'conversation.searchUsers' }), {
    target: { value: query },
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(300);
  });
};

describe('NewConversationModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    searchUsers.mockResolvedValue({ users: [alice, bob, currentUserSearchResult] });
    openDirectConversation.mockResolvedValue({
      conversationId: 'direct-1',
      type: 'direct',
      name: null,
      participantIds: ['me', 'u-alice'],
      createdAtUtc: '2026-01-01T00:00:00.000Z',
      created: true,
    });
    createGroupConversation.mockResolvedValue({
      conversationId: 'group-1',
      type: 'group',
      name: 'Project Team',
      participantIds: ['me', 'u-alice', 'u-bob'],
      createdAtUtc: '2026-01-02T00:00:00.000Z',
      created: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('searches users, filters the current user, and opens a direct conversation', async () => {
    const onClose = vi.fn();
    render(<NewConversationModal onClose={onClose} />);

    await searchFor('al');

    expect(screen.getByRole('button', { name: /Alice/ })).toBeInTheDocument();
    expect(screen.queryByText('Current User')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'conversation.createDm' }));
    });

    expect(openDirectConversation).toHaveBeenCalledWith('u-alice');
    expect(addConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'direct-1',
        type: 'Direct',
        participants: expect.arrayContaining([
          expect.objectContaining({ userId: 'u-alice' }),
          expect.objectContaining({ userId: 'me' }),
        ]),
      })
    );
    expect(navigate).toHaveBeenCalledWith('/conversations/direct-1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('creates a group conversation with a trimmed name', async () => {
    render(<NewConversationModal onClose={vi.fn()} />);

    await searchFor('bo');
    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));
    fireEvent.click(screen.getByRole('button', { name: /bob/ }));

    const groupName = screen.getByRole('textbox', { name: 'conversation.groupName' });
    expect(groupName).toHaveAttribute('placeholder', 'Alice, bob');

    fireEvent.change(groupName, { target: { value: ' Project Team ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'conversation.createGroup' }));
    });

    expect(createGroupConversation).toHaveBeenCalledWith('Project Team', [
      'u-alice',
      'u-bob',
      'me',
    ]);
    expect(addConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'group-1',
        name: 'Project Team',
        type: 'Group',
      })
    );
    expect(navigate).toHaveBeenCalledWith('/conversations/group-1');
  });

  it('removes selected users and shows an API error on submit failure', async () => {
    openDirectConversation.mockRejectedValueOnce(new Error('nope'));
    render(<NewConversationModal onClose={vi.fn()} />);

    await searchFor('al');
    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));

    fireEvent.click(screen.getByRole('button', { name: 'conversation.removeParticipant Alice' }));
    expect(screen.getByRole('button', { name: 'conversation.createDm' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Alice/ }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'conversation.createDm' }));
    });

    expect(screen.getByText('conversation.createError')).toBeInTheDocument();
    expect(addConversation).not.toHaveBeenCalled();
  });
});
