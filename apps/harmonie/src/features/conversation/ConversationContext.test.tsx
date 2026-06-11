import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ConversationProvider,
  useConversation,
  useConversationMembersPanel,
  useConversations,
} from './ConversationContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { Conversation, ConversationParticipant } from '@/types/conversation';

type Handler = (event: Record<string, unknown>) => void;

const mocks = vi.hoisted(() => ({
  getConversations: vi.fn(),
  navigate: vi.fn(),
  params: { conversationId: 'conversation-1' } as { conversationId?: string },
  user: { userId: 'user-1', username: 'ada' } as { userId: string; username: string } | null,
  handlers: new Map<string, Set<Handler>>(),
  connection: {
    on: vi.fn((eventName: string, handler: Handler) => {
      const handlers = mocks.handlers.get(eventName) ?? new Set<Handler>();
      handlers.add(handler);
      mocks.handlers.set(eventName, handlers);
    }),
    off: vi.fn((eventName: string, handler: Handler) => {
      mocks.handlers.get(eventName)?.delete(handler);
    }),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => mocks.params,
  };
});

vi.mock('@/api/conversations', () => ({
  getConversations: mocks.getConversations,
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
}));

const participant = (input: Partial<ConversationParticipant> = {}): ConversationParticipant => ({
  userId: 'user-1',
  username: 'ada',
  displayName: 'Ada',
  bio: null,
  avatarFileId: null,
  avatar: null,
  ...input,
});

const conversation = (input: Partial<Conversation> = {}): Conversation => ({
  conversationId: 'conversation-1',
  type: 'Direct',
  name: null,
  participants: [
    participant(),
    participant({ userId: 'user-2', username: 'grace', displayName: 'Grace' }),
  ],
  createdAtUtc: '2024-01-01T00:00:00.000Z',
  ...input,
});

const emit = (eventName: string, event: Record<string, unknown>) => {
  mocks.handlers.get(eventName)?.forEach((handler) => handler(event));
};

const Consumer = () => {
  const conversations = useConversations();
  const activeConversation = useConversation('conversation-1');
  const missingConversation = useConversation(undefined);
  const membersPanel = useConversationMembersPanel('conversation-1');
  const inertMembersPanel = useConversationMembersPanel(undefined);

  return (
    <div>
      <span data-testid="conversations">
        {conversations.conversations
          ?.map(
            (item) =>
              `${item.conversationId}:${item.type}:${item.name ?? 'none'}:${item.participants
                .map((participant) => participant.displayName ?? participant.username)
                .join(',')}`
          )
          .join('|') ?? 'loading'}
      </span>
      <span data-testid="active">{activeConversation?.conversationId ?? 'none'}</span>
      <span data-testid="missing">{missingConversation?.conversationId ?? 'none'}</span>
      <span data-testid="panel">{String(membersPanel.membersOpen)}</span>
      <button
        type="button"
        onClick={() =>
          conversations.addConversation(
            conversation({ conversationId: 'conversation-3', name: 'New' })
          )
        }
      >
        Add
      </button>
      <button
        type="button"
        onClick={() =>
          conversations.updateConversation(
            conversation({ conversationId: 'conversation-1', name: 'Updated' })
          )
        }
      >
        Update
      </button>
      <button type="button" onClick={() => conversations.removeConversation('conversation-1')}>
        Remove
      </button>
      <button type="button" onClick={() => membersPanel.toggleMembersOpen()}>
        Toggle panel
      </button>
      <button type="button" onClick={() => membersPanel.setMembersOpen(true)}>
        Open panel
      </button>
      <button type="button" onClick={() => membersPanel.setMembersOpen(false)}>
        Close panel
      </button>
      <button type="button" onClick={() => inertMembersPanel.toggleMembersOpen()}>
        Toggle inert panel
      </button>
      <button type="button" onClick={() => inertMembersPanel.setMembersOpen(true)}>
        Open inert panel
      </button>
      <button type="button" onClick={() => conversations.fetchConversations()}>
        Fetch
      </button>
    </div>
  );
};

const renderProvider = () =>
  render(
    <ConversationProvider>
      <Consumer />
    </ConversationProvider>
  );

const renderConsumerOnly = () => render(<Consumer />);

describe('ConversationProvider', () => {
  beforeEach(() => {
    mocks.getConversations.mockReset();
    mocks.navigate.mockReset();
    mocks.handlers.clear();
    mocks.connection.on.mockClear();
    mocks.connection.off.mockClear();
    mocks.params = { conversationId: 'conversation-1' };
    mocks.user = { userId: 'user-1', username: 'ada' };
  });

  it('loads conversations and normalizes conversation types', async () => {
    mocks.getConversations.mockResolvedValueOnce({
      conversations: [
        conversation({ conversationId: 'conversation-1', type: 'direct' as Conversation['type'] }),
        conversation({
          conversationId: 'conversation-2',
          type: 'group' as Conversation['type'],
          name: 'Team',
        }),
      ],
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent(
        'conversation-1:Direct:none:Ada,Grace|conversation-2:Group:Team:Ada,Grace'
      )
    );
    expect(screen.getByTestId('active')).toHaveTextContent('conversation-1');
    expect(screen.getByTestId('missing')).toHaveTextContent('none');
  });

  it('exposes add, update, remove, fetch, and members panel actions', async () => {
    mocks.getConversations
      .mockResolvedValueOnce({ conversations: [conversation()] })
      .mockResolvedValueOnce({
        conversations: [conversation({ conversationId: 'conversation-4', name: 'Fetched' })],
      });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-1')
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-3:Direct:New');

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-1:Direct:Updated');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
    expect(screen.getByTestId('panel')).toHaveTextContent('true');

    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    expect(screen.getByTestId('panel')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    expect(screen.getByTestId('panel')).toHaveTextContent('true');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle inert panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open inert panel' }));
    expect(screen.getByTestId('panel')).toHaveTextContent('true');

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByTestId('conversations')).not.toHaveTextContent('conversation-1');
    expect(screen.getByTestId('panel')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'Fetch' }));
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-4:Direct:Fetched')
    );
  });

  it('falls back to the default context value outside a provider', async () => {
    renderConsumerOnly();

    expect(screen.getByTestId('conversations')).toHaveTextContent('loading');
    expect(screen.getByTestId('active')).toHaveTextContent('none');
    expect(screen.getByTestId('missing')).toHaveTextContent('none');
    expect(screen.getByTestId('panel')).toHaveTextContent('false');

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Open panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close panel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fetch' }));

    expect(screen.getByTestId('conversations')).toHaveTextContent('loading');
    expect(mocks.getConversations).not.toHaveBeenCalled();
  });

  it('responds to realtime conversation updates and participant events', async () => {
    mocks.getConversations
      .mockResolvedValueOnce({ conversations: [conversation()] })
      .mockResolvedValueOnce({
        conversations: [conversation(), conversation({ conversationId: 'conversation-2' })],
      })
      .mockResolvedValueOnce({
        conversations: [conversation(), conversation({ conversationId: 'conversation-9' })],
      });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-1')
    );

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationCreated, {});
    });
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-2')
    );

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationMessageCreated, {
        conversationId: 'conversation-9',
      });
    });
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-9')
    );

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationUpdated, {
        conversationId: 'conversation-1',
        name: 'Renamed',
      });
      emit(REALTIME_SERVER_EVENTS.userProfileUpdated, {
        userId: 'user-2',
        username: 'grace',
        displayName: 'Grace Hopper',
        avatarFileId: 'avatar-2',
        avatarColor: '#111111',
        avatarIcon: 'User',
        avatarBg: '#ffffff',
      });
      emit(REALTIME_SERVER_EVENTS.conversationParticipantLeft, {
        conversationId: 'conversation-1',
        userId: 'user-2',
      });
    });

    expect(screen.getByTestId('conversations')).toHaveTextContent(
      'conversation-1:Direct:Renamed:Ada'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));
    expect(screen.getByTestId('panel')).toHaveTextContent('true');

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationParticipantLeft, {
        conversationId: 'conversation-1',
        userId: 'user-1',
      });
    });

    expect(screen.getByTestId('conversations')).not.toHaveTextContent('conversation-1');
    expect(screen.getByTestId('panel')).toHaveTextContent('false');
    expect(mocks.navigate).toHaveBeenCalledWith('/conversations', { replace: true });
  });

  it('ignores realtime events that should not mutate the current conversation list', async () => {
    mocks.getConversations.mockResolvedValueOnce({ conversations: [conversation()] });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-1')
    );

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationMessageCreated, {
        conversationId: 'conversation-1',
      });
      emit(REALTIME_SERVER_EVENTS.conversationUpdated, {
        conversationId: 'conversation-missing',
        name: 'Ignored',
      });
      emit(REALTIME_SERVER_EVENTS.conversationParticipantLeft, {
        conversationId: 'conversation-1',
        userId: 'user-other',
      });
    });

    expect(screen.getByTestId('conversations')).toHaveTextContent(
      'conversation-1:Direct:none:Ada,Grace'
    );
    expect(mocks.getConversations).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('removes the signed-in participant without navigating when another conversation is active', async () => {
    mocks.params = { conversationId: 'conversation-2' };
    mocks.getConversations.mockResolvedValueOnce({ conversations: [conversation()] });
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('conversations')).toHaveTextContent('conversation-1')
    );

    await userEvent.click(screen.getByRole('button', { name: 'Toggle panel' }));

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationParticipantLeft, {
        conversationId: 'conversation-1',
        userId: 'user-1',
      });
    });

    expect(screen.getByTestId('conversations')).not.toHaveTextContent('conversation-1');
    expect(screen.getByTestId('panel')).toHaveTextContent('false');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('stores an empty conversation list when loading fails', async () => {
    mocks.getConversations.mockRejectedValueOnce(new Error('network'));

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('conversations')).toHaveTextContent(''));
  });
});
