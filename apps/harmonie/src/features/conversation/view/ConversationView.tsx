import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, IconButton } from '@harmonie/ui';
import { ArrowLeft, MessageSquare, Phone, PhoneOff, Users } from 'lucide-react';
import {
  getConversationParticipants,
  getConversationPinnedMessages,
  sendConversationMessage,
} from '@/api/conversations';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_CLIENT_METHODS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import { MessageThread, useMessageThreadRefs } from '@/shared/message/MessageThread';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import type { ConversationParticipant } from '@/types/conversation';
import { useConversation, useConversationMembersPanel } from '../ConversationContext';
import { sendStartConversationCall } from '../conversationCallRealtime';
import { getConversationLabel } from '../conversationUtils';
import { ConversationCallStage } from './ConversationCallStage';
import { useConversationMessages } from './useConversationMessages';
import {
  ConversationParticipantPopover,
  ConversationParticipantsPanel,
} from './ConversationParticipantsPanel';

interface SelectedParticipant {
  conversationId: string;
  participant: ConversationParticipant;
  rect: DOMRect;
}

interface AutocompleteParticipantState {
  conversationId: string;
  participants: ConversationParticipant[];
}

const EMPTY_CONVERSATION_PARTICIPANTS: ConversationParticipant[] = [];

interface ConversationCallPanelProps {
  conversationId: string;
  conversationTitle: string;
  voice: ReturnType<typeof useVoicePresence>;
  isActiveConversationCall: boolean;
  membersAction: ReactNode;
  onJoin: () => Promise<void>;
  onLeave: () => void;
  onShowChat: () => void;
}

const ConversationCallPanel = ({
  conversationId,
  conversationTitle,
  voice,
  isActiveConversationCall,
  membersAction,
  onJoin,
  onLeave,
  onShowChat,
}: ConversationCallPanelProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-1 md:rounded-md">
      <header className="flex h-14 shrink-0 items-center justify-between bg-surface-2 px-4 md:rounded-t-md">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            className="md:hidden"
            size="small"
            variant="ghost"
            aria-label={t('conversation.backToConversations')}
            title={t('conversation.backToConversations')}
            tooltipSide="bottom"
            onClick={() => navigate('/conversations')}
          >
            <ArrowLeft size={16} />
          </IconButton>
          <Phone size={16} className="shrink-0 text-text-3" />
          <span className="truncate text-sm font-semibold text-text-1">{conversationTitle}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="small" variant="tertiary" onClick={onShowChat}>
            <MessageSquare size={14} />
            <span>{t('conversation.call.showChat')}</span>
          </Button>
          {membersAction}
        </div>
      </header>
      {isActiveConversationCall ? (
        <ConversationCallStage conversationId={conversationId} onLeave={onLeave} />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-fg">
              <Phone size={26} />
            </div>
            <span className="text-sm font-medium text-primary">
              {voice.isJoining ? t('voice.joining') : t('conversation.call.readyToJoin')}
            </span>
            {voice.joinError && <p className="text-sm text-error">{t(voice.joinError)}</p>}
            <div className="flex items-center gap-2">
              <Button variant="tertiary" onClick={onLeave}>
                <PhoneOff size={16} />
                <span>{t('voice.leave')}</span>
              </Button>
              <Button variant="primary" isLoading={voice.isJoining} onClick={() => void onJoin()}>
                <Phone size={16} />
                <span>{t('voice.join')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ConversationView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useUser();
  const { connection } = useRealtime();
  const voice = useVoicePresence();
  const conversation = useConversation(conversationId);
  const { membersOpen, setMembersOpen, toggleMembersOpen } =
    useConversationMembersPanel(conversationId);

  const [selectedParticipant, setSelectedParticipant] = useState<SelectedParticipant | null>(null);
  const [autocompleteParticipantState, setAutocompleteParticipantState] =
    useState<AutocompleteParticipantState>({ conversationId: '', participants: [] });
  const [callPanelState, setCallPanelState] = useState<{
    conversationId: string | null;
    visible: boolean;
  }>({ conversationId: null, visible: false });

  const {
    messages,
    loading,
    error,
    loadingMore,
    editingMessageId,
    lastReadMessageId,
    latestOwnMessage,
    loadMore,
    loadUntilMessage,
    startEditing,
    cancelEditing,
    dismissNewMessagesSeparator,
    saveEdit,
    removeMessage,
    removeAttachment,
    setMessagePinned,
    toggleReaction,
    typingUserIds,
    addMessage,
  } = useConversationMessages({
    conversationId,
    connection,
    currentUserId: user?.userId,
  });
  const threadRefs = useMessageThreadRefs();
  const currentSelectedParticipant =
    selectedParticipant?.conversationId === conversationId ? selectedParticipant : null;
  const conversationParticipants = conversation?.participants ?? EMPTY_CONVERSATION_PARTICIPANTS;
  const autocompleteParticipants =
    autocompleteParticipantState.conversationId === conversationId
      ? autocompleteParticipantState.participants
      : conversationParticipants;
  const callPanelConversationId =
    callPanelState.conversationId === conversationId ? callPanelState.conversationId : null;

  const membersMap = new Map<string, ConversationParticipant>();
  for (const participant of conversationParticipants) {
    membersMap.set(participant.userId, participant);
  }
  for (const participant of autocompleteParticipants) {
    membersMap.set(participant.userId, participant);
  }

  const mentionOptions = autocompleteParticipants.map((participant) => ({
    userId: participant.userId,
    username: participant.username,
    displayName: participant.displayName ?? null,
  }));

  const conversationTitle = conversation
    ? getConversationLabel(conversation, user?.userId)
    : (conversationId ?? '');

  const isActiveConversationCall = voice.activeConversationId === conversationId;
  const voiceParticipants = conversationId ? voice.getConversationParticipants(conversationId) : [];
  const hasRemoteVoiceParticipant = voiceParticipants.some(
    (participant) => participant.userId !== user?.userId
  );
  const hasJoinableConversationCall = !isActiveConversationCall && hasRemoteVoiceParticipant;
  const hasConversationCall =
    isActiveConversationCall ||
    hasJoinableConversationCall ||
    callPanelConversationId === conversationId;
  const callPanelVisible =
    callPanelState.conversationId === conversationId
      ? callPanelState.visible
      : isActiveConversationCall;
  const isCallPanelOpen = hasConversationCall && callPanelVisible;

  const handleAvatarClick = (participant: ConversationParticipant, rect: DOMRect) => {
    if (!conversationId) return;
    setSelectedParticipant((prev) =>
      prev?.conversationId === conversationId && prev.participant.userId === participant.userId
        ? null
        : { conversationId, participant, rect }
    );
  };

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    getConversationParticipants(conversationId)
      .then((participants) => {
        if (!cancelled) setAutocompleteParticipantState({ conversationId, participants });
      })
      .catch(() => {
        if (!cancelled) {
          setAutocompleteParticipantState({
            conversationId,
            participants: conversation?.participants ?? [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversation?.participants, conversationId]);

  if (!conversationId) return null;

  const isGroup = conversation?.type === 'Group';

  const joinConversationCall = async () => {
    if (!conversationId) return;
    setCallPanelState({ conversationId, visible: true });
    await voice.joinConversation(conversationId, conversationTitle);
    voice.updateActiveConversationMeta(conversationTitle);
  };

  const handleStartCall = async () => {
    void sendStartConversationCall(connection, conversationId);
    await joinConversationCall();
  };

  const handleLeaveConversationCall = () => {
    setCallPanelState({ conversationId: null, visible: false });
    voice.leaveCall();
  };

  const callAction = isCallPanelOpen ? null : isActiveConversationCall ? (
    <Button
      size="small"
      variant="tertiary"
      onClick={() => setCallPanelState({ conversationId, visible: true })}
    >
      <Phone size={14} />
      <span>{t('conversation.call.show')}</span>
    </Button>
  ) : hasJoinableConversationCall ? (
    <Button size="small" variant="primary" onClick={() => void joinConversationCall()}>
      <Phone size={14} />
      <span>{t('conversation.call.join')}</span>
    </Button>
  ) : null;

  const membersAction = isGroup ? (
    <IconButton
      size="small"
      aria-label={t('conversation.participantsTitle')}
      title={t('conversation.participantsTitle')}
      tooltipSide="bottom"
      onClick={toggleMembersOpen}
    >
      <Users size={16} />
    </IconButton>
  ) : null;

  const startCallAction = !hasConversationCall ? (
    <IconButton
      size="small"
      aria-label={t('conversation.call.start')}
      title={t('conversation.call.start')}
      tooltipSide="bottom"
      onClick={() => void handleStartCall()}
    >
      <Phone size={16} />
    </IconButton>
  ) : null;

  return (
    <>
      <div className="flex h-full gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {isCallPanelOpen && (
            <ConversationCallPanel
              conversationId={conversationId}
              conversationTitle={conversationTitle}
              voice={voice}
              isActiveConversationCall={isActiveConversationCall}
              membersAction={membersAction}
              onJoin={joinConversationCall}
              onLeave={handleLeaveConversationCall}
              onShowChat={() => setCallPanelState({ conversationId, visible: false })}
            />
          )}
          <div className={['min-h-0 flex-1', isCallPanelOpen ? 'hidden' : 'block'].join(' ')}>
            <MessageThread
              resetKey={conversationId}
              title={conversationTitle}
              leadingActions={
                <IconButton
                  className="md:hidden"
                  size="small"
                  variant="ghost"
                  aria-label={t('conversation.backToConversations')}
                  title={t('conversation.backToConversations')}
                  tooltipSide="bottom"
                  onClick={() => navigate('/conversations')}
                >
                  <ArrowLeft size={16} />
                </IconButton>
              }
              afterPinActions={
                <>
                  {callAction}
                  {startCallAction}
                  {membersAction}
                </>
              }
              refs={threadRefs}
              messages={messages}
              loading={loading}
              error={error}
              loadingMore={loadingMore}
              editingMessageId={editingMessageId}
              lastReadMessageId={lastReadMessageId}
              latestOwnMessage={latestOwnMessage}
              typingUserIds={typingUserIds}
              labels={{
                loading: t('conversation.loading'),
                error: t('conversation.error'),
                empty: t('conversation.empty'),
              }}
              currentUser={user}
              authorMap={membersMap}
              reactionSource={{ type: 'conversation', entityId: conversationId }}
              composer={{
                draftKey: `conversation:${conversationId}`,
                sendFn: async (content, fileIds, replyToMessageId, mentionedUserIds) => {
                  const message = await sendConversationMessage(
                    conversationId,
                    content,
                    fileIds,
                    replyToMessageId,
                    mentionedUserIds
                  );
                  addMessage(message);
                },
                onTypingStart: () =>
                  connection
                    ?.send(REALTIME_CLIENT_METHODS.startTypingConversation, conversationId)
                    .catch(() => {}),
                mentionOptions,
              }}
              pinned={{
                entityId: conversationId,
                fetchPinnedMessages: getConversationPinnedMessages,
              }}
              loadMore={loadMore}
              loadUntilMessage={loadUntilMessage}
              startEditing={startEditing}
              cancelEditing={cancelEditing}
              dismissNewMessagesSeparator={dismissNewMessagesSeparator}
              saveEdit={saveEdit}
              removeMessage={removeMessage}
              removeAttachment={removeAttachment}
              setMessagePinned={(messageId, isPinned) => void setMessagePinned(messageId, isPinned)}
              toggleReaction={toggleReaction}
              onAvatarClick={handleAvatarClick}
            />
          </div>
        </div>

        {isGroup && membersOpen && conversation && (
          <ConversationParticipantsPanel
            conversationId={conversationId}
            participants={conversation.participants}
            onClose={() => setMembersOpen(false)}
          />
        )}
      </div>

      {currentSelectedParticipant && (
        <ConversationParticipantPopover
          participant={currentSelectedParticipant.participant}
          anchorRect={currentSelectedParticipant.rect}
          onClose={() => setSelectedParticipant(null)}
          side="right"
        />
      )}
    </>
  );
};
