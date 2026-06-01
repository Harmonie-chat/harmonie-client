import { useEffect, useMemo, useState } from 'react';
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
import { useConversationMessages } from './hooks/useConversationMessages';
import {
  ConversationParticipantPopover,
  ConversationParticipantsPanel,
} from './ConversationParticipantsPanel';

interface SelectedParticipant {
  participant: ConversationParticipant;
  rect: DOMRect;
}

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
  const [autocompleteParticipants, setAutocompleteParticipants] = useState<
    ConversationParticipant[]
  >([]);
  const [callPanelConversationId, setCallPanelConversationId] = useState<string | null>(null);
  const [callPanelVisible, setCallPanelVisible] = useState(false);
  const threadRefs = useMessageThreadRefs();

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
  } = useConversationMessages({
    conversationId,
    connection,
    currentUserId: user?.userId,
  });

  const membersMap = useMemo(() => {
    const map = new Map<string, ConversationParticipant>();
    if (conversation?.participants) {
      for (const p of conversation.participants) {
        map.set(p.userId, p);
      }
    }
    for (const participant of autocompleteParticipants) {
      map.set(participant.userId, participant);
    }
    return map;
  }, [autocompleteParticipants, conversation]);

  const mentionOptions = useMemo(
    () =>
      autocompleteParticipants.map((participant) => ({
        userId: participant.userId,
        username: participant.username,
        displayName: participant.displayName ?? null,
      })),
    [autocompleteParticipants]
  );

  const conversationTitle = useMemo(() => {
    if (!conversation) return conversationId ?? '';
    return getConversationLabel(conversation, user?.userId);
  }, [conversation, conversationId, user?.userId]);

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
  const isCallPanelOpen = hasConversationCall && callPanelVisible;

  const handleAvatarClick = (participant: ConversationParticipant, rect: DOMRect) => {
    setSelectedParticipant((prev) =>
      prev?.participant.userId === participant.userId ? null : { participant, rect }
    );
  };

  useEffect(() => {
    setSelectedParticipant(null);
    setCallPanelConversationId(null);
    setAutocompleteParticipants([]);
    setCallPanelVisible(false);
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    getConversationParticipants(conversationId)
      .then((participants) => {
        if (!cancelled) setAutocompleteParticipants(participants);
      })
      .catch(() => {
        if (!cancelled) setAutocompleteParticipants(conversation?.participants ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [conversation?.participants, conversationId]);

  useEffect(() => {
    if (
      callPanelConversationId === conversationId &&
      !isActiveConversationCall &&
      !voice.isJoining &&
      !voice.joinError
    ) {
      setCallPanelConversationId(null);
    }
  }, [
    callPanelConversationId,
    conversationId,
    isActiveConversationCall,
    voice.isJoining,
    voice.joinError,
  ]);

  useEffect(() => {
    if (isActiveConversationCall) {
      setCallPanelVisible(true);
    }
  }, [isActiveConversationCall]);

  if (!conversationId) return null;

  const isGroup = conversation?.type === 'Group';

  const joinConversationCall = async () => {
    if (!conversationId) return;
    setCallPanelVisible(true);
    setCallPanelConversationId(conversationId);
    await voice.joinConversation(conversationId, conversationTitle);
    voice.updateActiveConversationMeta(conversationTitle);
  };

  const handleStartCall = async () => {
    void sendStartConversationCall(connection, conversationId);
    await joinConversationCall();
  };

  const handleLeaveConversationCall = () => {
    setCallPanelConversationId(null);
    setCallPanelVisible(false);
    voice.leaveCall();
  };

  const renderCallAction = () => {
    if (isCallPanelOpen) return null;
    if (isActiveConversationCall) {
      return (
        <Button size="small" variant="tertiary" onClick={() => setCallPanelVisible(true)}>
          <Phone size={14} />
          <span>{t('conversation.call.show')}</span>
        </Button>
      );
    }
    if (hasJoinableConversationCall) {
      return (
        <Button size="small" variant="primary" onClick={() => void joinConversationCall()}>
          <Phone size={14} />
          <span>{t('conversation.call.join')}</span>
        </Button>
      );
    }
    return null;
  };

  const renderMembersAction = () =>
    isGroup ? (
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

  const callPanel = isCallPanelOpen ? (
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
          <Button size="small" variant="tertiary" onClick={() => setCallPanelVisible(false)}>
            <MessageSquare size={14} />
            <span>{t('conversation.call.showChat')}</span>
          </Button>
          {renderMembersAction()}
        </div>
      </header>
      {isActiveConversationCall ? (
        <ConversationCallStage
          conversationId={conversationId}
          onLeave={handleLeaveConversationCall}
        />
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg">
              <Phone size={26} />
            </div>
            <span className="text-sm font-medium text-primary">
              {voice.isJoining ? t('voice.joining') : t('conversation.call.readyToJoin')}
            </span>
            {voice.joinError && <p className="text-sm text-error">{t(voice.joinError)}</p>}
            <div className="flex items-center gap-2">
              <Button
                variant="tertiary"
                onClick={() => {
                  setCallPanelConversationId(null);
                  setCallPanelVisible(false);
                }}
              >
                <PhoneOff size={16} />
                <span>{t('voice.leave')}</span>
              </Button>
              <Button
                variant="primary"
                isLoading={voice.isJoining}
                onClick={() => void joinConversationCall()}
              >
                <Phone size={16} />
                <span>{t('voice.join')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="flex h-full gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {callPanel}
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
                  {renderCallAction()}
                  {!hasConversationCall && (
                    <IconButton
                      size="small"
                      aria-label={t('conversation.call.start')}
                      title={t('conversation.call.start')}
                      tooltipSide="bottom"
                      onClick={() => void handleStartCall()}
                    >
                      <Phone size={16} />
                    </IconButton>
                  )}
                  {renderMembersAction()}
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
                sendFn: (content, fileIds, replyToMessageId, mentionedUserIds) =>
                  sendConversationMessage(
                    conversationId,
                    content,
                    fileIds,
                    replyToMessageId,
                    mentionedUserIds
                  ),
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

      {selectedParticipant && (
        <ConversationParticipantPopover
          participant={selectedParticipant.participant}
          anchorRect={selectedParticipant.rect}
          onClose={() => setSelectedParticipant(null)}
          side="right"
        />
      )}
    </>
  );
};
