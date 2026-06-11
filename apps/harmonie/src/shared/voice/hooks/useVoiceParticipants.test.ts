import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { UserProfileUpdatedEvent } from '@/types/user';
import type {
  ConversationVoiceParticipantJoinedEvent,
  ConversationVoiceParticipantLeftEvent,
  VoiceParticipant,
  VoiceParticipantJoinedEvent,
  VoiceParticipantLeftEvent,
} from '@/types/voice';
import { useVoiceParticipants } from './useVoiceParticipants';

type Handler = (event: unknown) => void;

const mocks = vi.hoisted(() => ({
  connection: {
    off: vi.fn(),
    on: vi.fn(),
  } as { off: ReturnType<typeof vi.fn>; on: ReturnType<typeof vi.fn> } | null,
  handlers: new Map<string, Set<Handler>>(),
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

const participant = (input: Partial<VoiceParticipant> = {}): VoiceParticipant => ({
  avatarBg: null,
  avatarColor: null,
  avatarFileId: null,
  avatarIcon: null,
  displayName: 'Ada Lovelace',
  userId: 'user-1',
  username: 'ada',
  ...input,
});

const channelJoined = (
  input: Partial<VoiceParticipantJoinedEvent> = {}
): VoiceParticipantJoinedEvent => ({
  avatarBg: null,
  avatarColor: null,
  avatarFileId: null,
  avatarIcon: null,
  channelId: 'channel-1',
  displayName: 'Grace Hopper',
  guildId: 'guild-1',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  userId: 'user-2',
  username: 'grace',
  ...input,
});

const emit = (eventName: string, event: unknown) => {
  mocks.handlers.get(eventName)?.forEach((handler) => handler(event));
};

describe('useVoiceParticipants', () => {
  beforeEach(() => {
    mocks.handlers.clear();
    mocks.connection = {
      off: vi.fn(),
      on: vi.fn(),
    };
    mocks.connection.on.mockImplementation((eventName: string, handler: Handler) => {
      const handlers = mocks.handlers.get(eventName) ?? new Set<Handler>();
      handlers.add(handler);
      mocks.handlers.set(eventName, handlers);
    });
    mocks.connection.off.mockImplementation((eventName: string, handler: Handler) => {
      mocks.handlers.get(eventName)?.delete(handler);
    });
  });

  it('keeps empty state without a realtime connection', () => {
    mocks.connection = null;

    const { result } = renderHook(() => useVoiceParticipants());

    expect(result.current.getParticipants('channel-1')).toEqual([]);
    expect(result.current.getConversationParticipants('conversation-1')).toEqual([]);
  });

  it('seeds participants from channel lists and join responses', () => {
    const { result } = renderHook(() => useVoiceParticipants());

    act(() => {
      result.current.seedFromChannelList([
        { channelId: 'empty-channel', participants: [] },
        { channelId: 'missing-channel', participants: null },
        { channelId: 'channel-1', participants: [participant()] },
      ]);
    });

    expect(result.current.getParticipants('channel-1')).toEqual([participant()]);
    expect(result.current.getParticipants('empty-channel')).toEqual([]);

    act(() => {
      result.current.seedFromChannelList([
        {
          channelId: 'channel-1',
          participants: [participant({ userId: 'ignored', username: 'ignored' })],
        },
        {
          channelId: 'channel-2',
          participants: [participant({ userId: 'user-2', username: 'grace' })],
        },
      ]);
    });

    expect(result.current.getParticipants('channel-1')).toEqual([participant()]);
    expect(result.current.getParticipants('channel-2')).toEqual([
      participant({ userId: 'user-2', username: 'grace' }),
    ]);

    act(() => {
      result.current.seedParticipantsFromJoin('conversation', 'conversation-1', [
        participant({ userId: 'user-3', username: 'katherine' }),
      ]);
    });

    expect(result.current.getConversationParticipants('conversation-1')).toEqual([
      participant({ userId: 'user-3', username: 'katherine' }),
    ]);
  });

  it('updates channel and conversation presence from realtime events', () => {
    const { result, unmount } = renderHook(() => useVoiceParticipants());
    const connection = mocks.connection;

    if (!connection) throw new Error('Expected realtime connection mock');

    expect(connection.on).toHaveBeenCalledWith(
      REALTIME_SERVER_EVENTS.voiceParticipantJoined,
      expect.any(Function)
    );
    expect(connection.on).toHaveBeenCalledWith(
      REALTIME_SERVER_EVENTS.conversationVoiceParticipantJoined,
      expect.any(Function)
    );

    act(() => {
      emit(REALTIME_SERVER_EVENTS.voiceParticipantJoined, channelJoined());
    });
    expect(result.current.getParticipants('channel-1')).toEqual([
      participant({ displayName: 'Grace Hopper', userId: 'user-2', username: 'grace' }),
    ]);

    act(() => {
      emit(
        REALTIME_SERVER_EVENTS.voiceParticipantJoined,
        channelJoined({ displayName: 'Amazing Grace', username: 'hopper' })
      );
    });
    expect(result.current.getParticipants('channel-1')).toEqual([
      participant({ displayName: 'Amazing Grace', userId: 'user-2', username: 'hopper' }),
    ]);

    act(() => {
      emit(REALTIME_SERVER_EVENTS.conversationVoiceParticipantJoined, {
        avatarColor: '#fff',
        avatarFileId: 'avatar-3',
        avatarIcon: 'Sparkles',
        conversationId: 'conversation-1',
        displayName: null,
        joinedAtUtc: '2024-01-01T00:00:00.000Z',
        userId: 'user-3',
        username: 'katherine',
      } satisfies ConversationVoiceParticipantJoinedEvent);
    });
    expect(result.current.getConversationParticipants('conversation-1')).toEqual([
      participant({
        avatarColor: '#fff',
        avatarFileId: 'avatar-3',
        avatarIcon: 'Sparkles',
        displayName: null,
        userId: 'user-3',
        username: 'katherine',
      }),
    ]);

    act(() => {
      emit(REALTIME_SERVER_EVENTS.voiceParticipantLeft, {
        channelId: 'channel-1',
        guildId: 'guild-1',
        leftAtUtc: '2024-01-01T00:00:00.000Z',
        userId: 'user-2',
      } satisfies VoiceParticipantLeftEvent);
      emit(REALTIME_SERVER_EVENTS.conversationVoiceParticipantLeft, {
        conversationId: 'conversation-1',
        leftAtUtc: '2024-01-01T00:00:00.000Z',
        userId: 'user-3',
      } satisfies ConversationVoiceParticipantLeftEvent);
    });

    expect(result.current.getParticipants('channel-1')).toEqual([]);
    expect(result.current.getConversationParticipants('conversation-1')).toEqual([]);

    unmount();
    expect(connection.off).toHaveBeenCalledWith(
      REALTIME_SERVER_EVENTS.voiceParticipantJoined,
      expect.any(Function)
    );
    expect(connection.off).toHaveBeenCalledWith(
      REALTIME_SERVER_EVENTS.userProfileUpdated,
      expect.any(Function)
    );
  });

  it('applies profile updates across rooms and keeps state identity when no participant changes', () => {
    const { result } = renderHook(() => useVoiceParticipants());

    act(() => {
      result.current.seedParticipantsFromJoin('channel', 'channel-1', [participant()]);
      result.current.seedParticipantsFromJoin('conversation', 'conversation-1', [
        participant({ userId: 'user-2', username: 'grace' }),
      ]);
    });

    const beforeMiss = result.current.getParticipants('channel-1');
    act(() => {
      emit(REALTIME_SERVER_EVENTS.userProfileUpdated, {
        avatarBg: '#111',
        avatarColor: '#eee',
        avatarFileId: 'avatar-missing',
        avatarIcon: 'User',
        displayName: 'Missing',
        userId: 'missing',
        username: 'missing',
      } satisfies UserProfileUpdatedEvent);
    });
    expect(result.current.getParticipants('channel-1')).toBe(beforeMiss);

    act(() => {
      emit(REALTIME_SERVER_EVENTS.userProfileUpdated, {
        avatarBg: '#111',
        avatarColor: '#eee',
        avatarFileId: 'avatar-1',
        avatarIcon: 'Sparkles',
        displayName: 'Ada Updated',
        userId: 'user-1',
        username: 'ada-updated',
      } satisfies UserProfileUpdatedEvent);
    });

    expect(result.current.getParticipants('channel-1')).toEqual([
      participant({
        avatarBg: '#111',
        avatarColor: '#eee',
        avatarFileId: 'avatar-1',
        avatarIcon: 'Sparkles',
        displayName: 'Ada Updated',
        username: 'ada-updated',
      }),
    ]);
    expect(result.current.getConversationParticipants('conversation-1')).toEqual([
      participant({ userId: 'user-2', username: 'grace' }),
    ]);
  });

  it('syncs remote LiveKit room participants while preserving existing avatar data', () => {
    const { result } = renderHook(() => useVoiceParticipants());

    act(() => {
      result.current.seedParticipantsFromJoin('channel', 'channel-1', [
        participant({
          avatarBg: '#000',
          avatarColor: '#fff',
          avatarFileId: 'avatar-2',
          avatarIcon: 'User',
          displayName: 'Grace Hopper',
          userId: 'user-2',
          username: 'grace',
        }),
      ]);
    });

    const room = {
      remoteParticipants: new Map([
        ['user-2', { identity: 'user-2', name: 'Ignored LiveKit Name' }],
        ['user-4', { identity: 'user-4', name: '  Margaret  ' }],
        ['user-5', { identity: 'user-5', name: '   ' }],
        ['user-6', { identity: 'user-6' }],
      ]),
    };

    act(() => {
      result.current.syncParticipantsFromRoom('channel', 'channel-1', room as never);
    });

    expect(result.current.getParticipants('channel-1')).toEqual([
      participant({
        avatarBg: '#000',
        avatarColor: '#fff',
        avatarFileId: 'avatar-2',
        avatarIcon: 'User',
        displayName: 'Grace Hopper',
        userId: 'user-2',
        username: 'grace',
      }),
      participant({
        displayName: null,
        userId: 'user-4',
        username: 'Margaret',
      }),
      participant({
        displayName: null,
        userId: 'user-5',
        username: '',
      }),
      participant({
        displayName: null,
        userId: 'user-6',
        username: 'user-6',
      }),
    ]);
  });
});
