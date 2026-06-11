import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Conversation, ConversationCallIncomingEvent } from '@/types/conversation';
import type { UserProfile } from '@/types/user';
import { ConversationCallIncomingToast } from './ConversationCallIncomingToast';

type CallHandlers = {
  onIncoming: (event: ConversationCallIncomingEvent) => void;
  onDismissed: (event: { conversationId: string }) => void;
  onEnded: (event: { conversationId: string }) => void;
};

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}));

const realtimeMocks = vi.hoisted(() => ({
  connection: { send: vi.fn() },
  handlers: null as CallHandlers | null,
  unsubscribe: vi.fn(),
}));

const soundMocks = vi.hoisted(() => ({
  play: vi.fn(),
  stop: vi.fn(),
}));

const callApiMocks = vi.hoisted(() => ({
  accept: vi.fn(),
  decline: vi.fn(),
  subscribe: vi.fn(),
}));

const contextMocks = vi.hoisted(() => ({
  applySinkId: vi.fn(),
  conversations: [] as Conversation[] | null,
  getConversationParticipants: vi.fn(),
  joinConversation: vi.fn(),
  muted: false,
  updateActiveConversationMeta: vi.fn(),
  user: null as UserProfile | null,
  activeConversationId: null as string | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
  }),
}));

vi.mock('lucide-react', () => ({
  Phone: ({ size }: { size?: number }) => <span data-testid="phone-icon">{size}</span>,
  PhoneIncoming: ({ size }: { size?: number }) => (
    <span data-testid="phone-incoming-icon">{size}</span>
  ),
  PhoneOff: ({ size }: { size?: number }) => <span data-testid="phone-off-icon">{size}</span>,
  X: ({ size }: { size?: number }) => <span data-testid="x-icon">{size}</span>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => routerMocks.navigate,
}));

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: ReactNode;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  IconButton: ({
    children,
    onClick,
    'aria-label': ariaLabel,
  }: {
    children: ReactNode;
    onClick?: () => void;
    'aria-label'?: string;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: realtimeMocks.connection }),
}));

vi.mock('@/features/user/audio/AudioOutputContext', () => ({
  useAudioOutput: () => ({
    applySinkId: contextMocks.applySinkId,
    muted: contextMocks.muted,
  }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: contextMocks.user }),
}));

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  useVoicePresence: () => ({
    activeConversationId: contextMocks.activeConversationId,
    getConversationParticipants: contextMocks.getConversationParticipants,
    joinConversation: contextMocks.joinConversation,
    updateActiveConversationMeta: contextMocks.updateActiveConversationMeta,
  }),
}));

vi.mock('./ConversationContext', () => ({
  useConversations: () => ({ conversations: contextMocks.conversations }),
}));

vi.mock('./conversationCallSound', () => ({
  playConversationCallIncomingSound: soundMocks.play,
  stopConversationCallIncomingSound: soundMocks.stop,
}));

vi.mock('./conversationCallRealtime', () => ({
  sendAcceptConversationCall: callApiMocks.accept,
  sendDeclineConversationCall: callApiMocks.decline,
  subscribeConversationCallEvents: callApiMocks.subscribe,
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

const conversation: Conversation = {
  conversationId: 'conversation-1',
  type: 'Group',
  name: 'Planning',
  participants: [
    { userId: 'user-current', username: 'me', displayName: 'Me' },
    { userId: 'caller-1', username: 'ada', displayName: 'Ada' },
  ],
  createdAtUtc: '2026-01-01T00:00:00Z',
};

const incomingEvent: ConversationCallIncomingEvent = {
  conversationId: 'conversation-1',
  callerUserId: 'caller-1',
  callerUsername: 'ada',
  callerDisplayName: 'Ada',
  conversationName: 'Planning',
  conversationType: 'Group',
  startedAtUtc: '2026-01-01T10:00:00Z',
};

const emitIncoming = (event: ConversationCallIncomingEvent = incomingEvent) => {
  act(() => {
    realtimeMocks.handlers?.onIncoming(event);
  });
};

describe('ConversationCallIncomingToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    realtimeMocks.handlers = null;
    realtimeMocks.unsubscribe = vi.fn();
    callApiMocks.subscribe.mockImplementation((_connection: unknown, handlers: CallHandlers) => {
      realtimeMocks.handlers = handlers;
      return realtimeMocks.unsubscribe;
    });
    callApiMocks.accept.mockResolvedValue(undefined);
    callApiMocks.decline.mockResolvedValue(undefined);
    contextMocks.activeConversationId = null;
    contextMocks.conversations = [conversation];
    contextMocks.getConversationParticipants.mockReturnValue([]);
    contextMocks.joinConversation.mockResolvedValue(undefined);
    contextMocks.muted = false;
    contextMocks.user = user;
  });

  it('subscribes to call events and ignores self and duplicate incoming calls', () => {
    render(<ConversationCallIncomingToast />);

    expect(callApiMocks.subscribe).toHaveBeenCalledWith(
      realtimeMocks.connection,
      expect.objectContaining({
        onIncoming: expect.any(Function),
        onDismissed: expect.any(Function),
        onEnded: expect.any(Function),
      })
    );

    emitIncoming({ ...incomingEvent, callerUserId: 'user-current' });

    expect(screen.queryByText('conversation.call.incomingTitle:Ada')).not.toBeInTheDocument();

    emitIncoming();
    emitIncoming();

    expect(screen.getByText('conversation.call.incomingTitle:Ada')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(soundMocks.play).toHaveBeenCalledTimes(1);
    expect(soundMocks.play).toHaveBeenCalledWith(contextMocks.applySinkId, false);
  });

  it('ignores calls for the active conversation', () => {
    contextMocks.activeConversationId = incomingEvent.conversationId;
    render(<ConversationCallIncomingToast />);

    emitIncoming();

    expect(screen.queryByText('conversation.call.incomingTitle:Ada')).not.toBeInTheDocument();
    expect(soundMocks.play).not.toHaveBeenCalled();
  });

  it('accepts an incoming call and joins with a fallback title when the conversation is unknown', async () => {
    contextMocks.conversations = [];
    render(<ConversationCallIncomingToast />);

    emitIncoming({ ...incomingEvent, conversationName: null });
    fireEvent.click(screen.getByRole('button', { name: /conversation.call.answer/ }));

    expect(soundMocks.stop).toHaveBeenCalled();
    expect(callApiMocks.accept).toHaveBeenCalledWith(
      realtimeMocks.connection,
      incomingEvent.conversationId
    );
    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations/conversation-1');
    await waitFor(() =>
      expect(contextMocks.joinConversation).toHaveBeenCalledWith('conversation-1', 'conversation-1')
    );
    expect(contextMocks.updateActiveConversationMeta).toHaveBeenCalledWith('conversation-1');
    expect(screen.queryByText('conversation.call.incomingTitle:Ada')).not.toBeInTheDocument();
  });

  it('declines, dismisses, and clears incoming calls from realtime events', () => {
    const { unmount } = render(<ConversationCallIncomingToast />);

    emitIncoming();
    fireEvent.click(screen.getByRole('button', { name: /conversation.call.decline/ }));

    expect(soundMocks.stop).toHaveBeenCalled();
    expect(callApiMocks.decline).toHaveBeenCalledWith(
      realtimeMocks.connection,
      incomingEvent.conversationId
    );
    expect(screen.queryByText('conversation.call.incomingTitle:Ada')).not.toBeInTheDocument();

    emitIncoming({ ...incomingEvent, startedAtUtc: '2026-01-01T10:01:00Z' });
    act(() => {
      realtimeMocks.handlers?.onDismissed({ conversationId: 'other-conversation' });
    });
    expect(screen.getByText('conversation.call.incomingTitle:Ada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    expect(screen.queryByText('conversation.call.incomingTitle:Ada')).not.toBeInTheDocument();

    emitIncoming({ ...incomingEvent, startedAtUtc: '2026-01-01T10:02:00Z' });
    act(() => {
      realtimeMocks.handlers?.onEnded({ conversationId: incomingEvent.conversationId });
    });
    expect(screen.queryByText('conversation.call.incomingTitle:Ada')).not.toBeInTheDocument();

    unmount();
    expect(realtimeMocks.unsubscribe).toHaveBeenCalledTimes(1);
  });
});
