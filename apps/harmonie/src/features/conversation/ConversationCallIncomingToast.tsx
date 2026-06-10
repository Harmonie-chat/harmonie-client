import { useEffect, useReducer, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from '@harmonie/ui';
import { Phone, PhoneIncoming, PhoneOff, X } from 'lucide-react';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { useAudioOutput } from '@/features/user/audio/AudioOutputContext';
import { useUser } from '@/features/user/UserContext';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import type { ConversationCallIncomingEvent } from '@/types/conversation';
import { useConversations } from './ConversationContext';
import {
  playConversationCallIncomingSound,
  stopConversationCallIncomingSound,
} from './conversationCallSound';
import {
  sendAcceptConversationCall,
  sendDeclineConversationCall,
  subscribeConversationCallEvents,
} from './conversationCallRealtime';
import { getConversationLabel } from './conversationUtils';

const getCallNotificationKey = (event: ConversationCallIncomingEvent) =>
  event.startedAtUtc ? `${event.conversationId}:${event.startedAtUtc}` : event.conversationId;

type IncomingCallAction =
  | { type: 'show'; call: ConversationCallIncomingEvent }
  | { type: 'clear' }
  | { type: 'clearConversation'; conversationId: string };

const incomingCallReducer = (
  current: ConversationCallIncomingEvent | null,
  action: IncomingCallAction
) => {
  switch (action.type) {
    case 'show':
      return action.call;
    case 'clear':
      return null;
    case 'clearConversation':
      return current?.conversationId === action.conversationId ? null : current;
    default:
      return current;
  }
};

export const ConversationCallIncomingToast = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { connection } = useRealtime();
  const { user } = useUser();
  const { applySinkId, muted: outputMuted } = useAudioOutput();
  const { conversations } = useConversations();
  const voice = useVoicePresence();
  const {
    activeConversationId,
    getConversationParticipants,
    joinConversation,
    updateActiveConversationMeta,
  } = voice;
  const [incomingCall, dispatchIncomingCall] = useReducer(incomingCallReducer, null);
  const notifiedCallKeysByConversationRef = useRef<Map<string, string>>(null!);
  const conversationsWithVoicePresenceRef = useRef<Set<string>>(null!);

  if (notifiedCallKeysByConversationRef.current === null) {
    notifiedCallKeysByConversationRef.current = new Map();
  }
  if (conversationsWithVoicePresenceRef.current === null) {
    conversationsWithVoicePresenceRef.current = new Set();
  }

  const conversation = incomingCall
    ? conversations?.find((item) => item.conversationId === incomingCall.conversationId)
    : null;
  const conversationTitle = !incomingCall
    ? ''
    : conversation
      ? getConversationLabel(conversation, user?.userId)
      : (incomingCall.conversationName ?? incomingCall.conversationId);

  useEffect(() => {
    if (!connection || !user?.userId) return;

    const handleIncomingCall = (event: ConversationCallIncomingEvent) => {
      if (event.callerUserId === user.userId) return;
      if (activeConversationId === event.conversationId) return;
      const callKey = getCallNotificationKey(event);
      if (notifiedCallKeysByConversationRef.current.get(event.conversationId) === callKey) return;

      notifiedCallKeysByConversationRef.current.set(event.conversationId, callKey);
      playConversationCallIncomingSound(applySinkId, outputMuted);
      dispatchIncomingCall({ type: 'show', call: event });
    };

    const handleCallDismissed = (event: { conversationId: string }) => {
      stopConversationCallIncomingSound();
      dispatchIncomingCall({ type: 'clearConversation', conversationId: event.conversationId });
    };

    const handleCallEnded = (event: { conversationId: string }) => {
      notifiedCallKeysByConversationRef.current.delete(event.conversationId);
      conversationsWithVoicePresenceRef.current.delete(event.conversationId);
      stopConversationCallIncomingSound();
      dispatchIncomingCall({ type: 'clearConversation', conversationId: event.conversationId });
    };

    const unsubscribe = subscribeConversationCallEvents(connection, {
      onIncoming: handleIncomingCall,
      onDismissed: handleCallDismissed,
      onEnded: handleCallEnded,
    });

    return () => {
      stopConversationCallIncomingSound();
      unsubscribe();
    };
  }, [activeConversationId, applySinkId, connection, outputMuted, user?.userId]);

  useEffect(() => {
    notifiedCallKeysByConversationRef.current.forEach((_callKey, conversationId) => {
      const hasVoicePresence =
        activeConversationId === conversationId ||
        getConversationParticipants(conversationId).length > 0;

      if (hasVoicePresence) {
        conversationsWithVoicePresenceRef.current.add(conversationId);
        return;
      }

      if (!conversationsWithVoicePresenceRef.current.has(conversationId)) return;

      notifiedCallKeysByConversationRef.current.delete(conversationId);
      conversationsWithVoicePresenceRef.current.delete(conversationId);
    });
  }, [activeConversationId, getConversationParticipants]);

  if (!incomingCall) return null;

  const handleAcceptCall = async () => {
    stopConversationCallIncomingSound();
    dispatchIncomingCall({ type: 'clear' });
    void sendAcceptConversationCall(connection, incomingCall.conversationId);
    navigate(`/conversations/${incomingCall.conversationId}`);
    await joinConversation(incomingCall.conversationId, conversationTitle);
    updateActiveConversationMeta(conversationTitle);
  };

  const handleDeclineCall = () => {
    stopConversationCallIncomingSound();
    dispatchIncomingCall({ type: 'clear' });
    void sendDeclineConversationCall(connection, incomingCall.conversationId);
  };

  const handleDismissCall = () => {
    stopConversationCallIncomingSound();
    dispatchIncomingCall({ type: 'clear' });
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 rounded-md border border-primary/40 bg-surface-2 p-4 shadow-[0_10px_32px_rgba(61,53,48,0.22)]">
      <IconButton
        size="small"
        className="absolute right-2 top-2 bg-surface-2/90"
        aria-label={t('common.close')}
        onClick={handleDismissCall}
      >
        <X size={14} />
      </IconButton>
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-fg">
          <PhoneIncoming size={19} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-1">
            {t('conversation.call.incomingTitle', {
              name: incomingCall.callerDisplayName ?? incomingCall.callerUsername,
            })}
          </p>
          <p className="truncate text-xs text-text-3">{conversationTitle}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="tertiary" onClick={handleDeclineCall}>
          <PhoneOff size={16} />
          <span>{t('conversation.call.decline')}</span>
        </Button>
        <Button variant="primary" onClick={() => void handleAcceptCall()}>
          <Phone size={16} />
          <span>{t('conversation.call.answer')}</span>
        </Button>
      </div>
    </div>
  );
};
