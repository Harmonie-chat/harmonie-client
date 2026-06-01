import type { HubConnection } from '@microsoft/signalr';
import type { ConversationCallIncomingEvent } from '@/types/conversation';

const START_CALL_METHODS = ['StartConversationCall', 'StartConversationVoiceCall'] as const;
const ACCEPT_CALL_METHODS = ['AcceptConversationCall', 'AcceptConversationVoiceCall'] as const;
const DECLINE_CALL_METHODS = ['DeclineConversationCall', 'DeclineConversationVoiceCall'] as const;

const INCOMING_CALL_EVENTS = [
  'ConversationCallIncoming',
  'ConversationVoiceCallIncoming',
  'ConversationVoiceParticipantJoined',
  'IncomingConversationCall',
  'VoiceCallIncoming',
] as const;
const DISMISSED_CALL_EVENTS = [
  'ConversationCallAccepted',
  'ConversationVoiceCallAccepted',
  'ConversationCallDeclined',
  'ConversationVoiceCallDeclined',
] as const;
const ENDED_CALL_EVENTS = ['ConversationCallEnded', 'ConversationVoiceCallEnded'] as const;

type RealtimePayload = Record<string, unknown>;

const getString = (payload: RealtimePayload, ...keys: string[]) => {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string') return value;
  }
  return null;
};

export const normalizeConversationCallIncoming = (
  payload: unknown
): ConversationCallIncomingEvent | null => {
  if (!payload || typeof payload !== 'object') return null;
  const event = payload as RealtimePayload;
  const conversationId = getString(event, 'conversationId', 'ConversationId');

  if (!conversationId) return null;

  return {
    conversationId,
    callerUserId:
      getString(
        event,
        'callerUserId',
        'CallerUserId',
        'callerId',
        'CallerId',
        'userId',
        'UserId'
      ) ?? '',
    callerUsername:
      getString(event, 'callerUsername', 'CallerUsername', 'username', 'Username') ?? '',
    callerDisplayName: getString(
      event,
      'callerDisplayName',
      'CallerDisplayName',
      'displayName',
      'DisplayName'
    ),
    conversationName: getString(event, 'conversationName', 'ConversationName'),
    conversationType: getString(event, 'conversationType', 'ConversationType') ?? '',
    startedAtUtc: getString(event, 'startedAtUtc', 'StartedAtUtc') ?? '',
  };
};

export const normalizeConversationCallClosed = (
  payload: unknown
): { conversationId: string } | null => {
  if (!payload || typeof payload !== 'object') return null;
  const conversationId = getString(payload as RealtimePayload, 'conversationId', 'ConversationId');
  return conversationId ? { conversationId } : null;
};

const sendFirstAvailable = async (
  connection: HubConnection | null,
  methods: readonly string[],
  conversationId: string
) => {
  if (!connection) return;

  let lastError: unknown = null;
  for (const method of methods) {
    try {
      await connection.send(method, conversationId);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  console.warn('[ConversationCall] No SignalR call method succeeded.', {
    conversationId,
    methods,
    error: lastError,
  });
};

export const sendStartConversationCall = (
  connection: HubConnection | null,
  conversationId: string
) => sendFirstAvailable(connection, START_CALL_METHODS, conversationId);

export const sendAcceptConversationCall = (
  connection: HubConnection | null,
  conversationId: string
) => sendFirstAvailable(connection, ACCEPT_CALL_METHODS, conversationId);

export const sendDeclineConversationCall = (
  connection: HubConnection | null,
  conversationId: string
) => sendFirstAvailable(connection, DECLINE_CALL_METHODS, conversationId);

export const subscribeConversationCallEvents = (
  connection: HubConnection,
  handlers: {
    onIncoming: (event: ConversationCallIncomingEvent) => void;
    onDismissed: (event: { conversationId: string }) => void;
    onEnded: (event: { conversationId: string }) => void;
  }
) => {
  const handleIncoming = (payload: unknown) => {
    const event = normalizeConversationCallIncoming(payload);
    if (event) handlers.onIncoming(event);
  };
  const handleDismissed = (payload: unknown) => {
    const event = normalizeConversationCallClosed(payload);
    if (event) handlers.onDismissed(event);
  };
  const handleEnded = (payload: unknown) => {
    const event = normalizeConversationCallClosed(payload);
    if (event) handlers.onEnded(event);
  };

  INCOMING_CALL_EVENTS.forEach((eventName) => connection.on(eventName, handleIncoming));
  DISMISSED_CALL_EVENTS.forEach((eventName) => connection.on(eventName, handleDismissed));
  ENDED_CALL_EVENTS.forEach((eventName) => connection.on(eventName, handleEnded));

  return () => {
    INCOMING_CALL_EVENTS.forEach((eventName) => connection.off(eventName, handleIncoming));
    DISMISSED_CALL_EVENTS.forEach((eventName) => connection.off(eventName, handleDismissed));
    ENDED_CALL_EVENTS.forEach((eventName) => connection.off(eventName, handleEnded));
  };
};
