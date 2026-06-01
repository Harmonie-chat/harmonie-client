import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContextMenu, ConversationItem, IconButton } from '@harmonie/ui';
import { Pencil, Plus, X } from 'lucide-react';
import { deleteConversation, updateConversationName } from '@/api/conversations';
import { useMessageActivity } from '@/features/realtime/MessageActivityContext';
import { useUser } from '@/features/user/UserContext';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import type { Conversation } from '@/types/conversation';
import { useConversations } from './ConversationContext';
import { ConversationAvatar } from './avatar/ConversationAvatar';
import { NewConversationModal } from './create/NewConversationModal';
import { LeaveConversationModal } from './LeaveConversationModal';
import { RenameConversationModal } from './RenameConversationModal';
import { getConversationLabel } from './conversationUtils';

type ContextMenuState = {
  conversation: Conversation;
  position: { x: number; y: number };
} | null;

export const ConversationSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { conversationId: activeConversationId } = useParams<{ conversationId: string }>();
  const { conversations, fetchConversations, removeConversation, updateConversation } =
    useConversations();
  const { hasUnreadConversation } = useMessageActivity();
  const { user } = useUser();
  const voice = useVoicePresence();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [renamingConversation, setRenamingConversation] = useState<Conversation | null>(null);
  const [leavingConversation, setLeavingConversation] = useState<Conversation | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleLeaveRequest = (conversation: Conversation) => {
    setContextMenu(null);
    setLeavingConversation(conversation);
    setLeaveError(false);
  };

  const handleConfirmLeave = () => {
    if (!leavingConversation) return;

    const conversationId = leavingConversation.conversationId;
    setIsLeaving(true);
    setLeaveError(false);
    deleteConversation(conversationId)
      .then(() => {
        removeConversation(conversationId);
        setLeavingConversation(null);
        if (activeConversationId === conversationId) {
          navigate('/conversations');
        }
      })
      .catch(() => setLeaveError(true))
      .finally(() => setIsLeaving(false));
  };

  const handleContextMenu = (e: React.MouseEvent, conversation: Conversation) => {
    e.preventDefault();
    setContextMenu({ conversation, position: { x: e.clientX, y: e.clientY } });
  };

  const handleLongPress = (position: { x: number; y: number }, conversation: Conversation) => {
    setContextMenu({ conversation, position });
  };

  const openRename = (conversation: Conversation) => {
    setContextMenu(null);
    setRenamingConversation(conversation);
    setNameError(false);
  };

  const handleSaveName = async (nextName: string | null) => {
    if (!renamingConversation) return;

    if (nextName !== null && nextName === renamingConversation.name) {
      setRenamingConversation(null);
      return;
    }

    setIsSavingName(true);
    setNameError(false);
    try {
      await updateConversationName(renamingConversation.conversationId, nextName);
      updateConversation({ ...renamingConversation, name: nextName });
      setRenamingConversation(null);
    } catch {
      setNameError(true);
    } finally {
      setIsSavingName(false);
    }
  };

  const buildContextMenuItems = (conversation: Conversation) => [
    ...(conversation.type === 'Group'
      ? [
          {
            label: t('conversation.rename'),
            icon: <Pencil size={14} />,
            onClick: () => openRename(conversation),
          },
        ]
      : []),
    {
      label: t('conversation.delete'),
      icon: <X size={14} />,
      onClick: () => handleLeaveRequest(conversation),
    },
  ];

  const isLoading = conversations === null || user === null;

  return (
    <>
      <aside className="flex min-h-0 w-0 flex-1 flex-col overflow-hidden bg-surface-1 md:w-60 md:flex-none md:shrink-0 md:rounded-md">
        <header className="pl-4 pr-2 h-14 bg-surface-2 md:rounded-t-md flex items-center justify-between gap-2">
          <h2 className="font-semibold text-text-1 truncate">{t('conversation.home')}</h2>
          <IconButton
            size="small"
            variant="ghost"
            onClick={() => setShowNewConversation(true)}
            aria-label={t('conversation.newConversation')}
            title={t('conversation.newConversation')}
            tooltipSide="right"
          >
            <Plus size={14} />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-0.5">
          {isLoading ? (
            <div className="flex flex-col gap-2 px-2 pt-1 animate-pulse">
              <div className="h-8 rounded bg-border-2" />
              <div className="h-8 rounded bg-border-2" />
              <div className="h-8 rounded bg-border-2" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-text-3 px-2 py-2">{t('conversation.selectPlaceholder')}</p>
          ) : (
            conversations.map((conv) => {
              const label = getConversationLabel(conv, user.userId);
              const voiceParticipants = voice.getConversationParticipants(conv.conversationId);
              const hasRemoteVoiceParticipant = voiceParticipants.some(
                (participant) => participant.userId !== user.userId
              );
              const hasActiveCall =
                conv.conversationId === voice.activeConversationId || hasRemoteVoiceParticipant;

              return (
                <ConversationItem
                  key={conv.conversationId}
                  avatar={
                    <ConversationAvatar
                      conversation={conv}
                      label={label}
                      currentUserId={user.userId}
                    />
                  }
                  label={label}
                  active={conv.conversationId === activeConversationId}
                  unread={hasUnreadConversation(conv.conversationId)}
                  callActive={hasActiveCall}
                  callLabel={t('conversation.call.active')}
                  onClick={() => navigate(`/conversations/${conv.conversationId}`)}
                  onContextMenu={(e) => handleContextMenu(e, conv)}
                  onLongPress={(position) => handleLongPress(position, conv)}
                  onDeleteClick={() => handleLeaveRequest(conv)}
                  deleteLabel={t('conversation.delete')}
                />
              );
            })
          )}
        </div>
      </aside>

      {showNewConversation && (
        <NewConversationModal onClose={() => setShowNewConversation(false)} />
      )}

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          items={buildContextMenuItems(contextMenu.conversation)}
        />
      )}

      {renamingConversation && (
        <RenameConversationModal
          conversation={renamingConversation}
          isSaving={isSavingName}
          error={nameError}
          onClose={() => setRenamingConversation(null)}
          onSave={handleSaveName}
          onChange={() => setNameError(false)}
        />
      )}

      {leavingConversation && (
        <LeaveConversationModal
          isLeaving={isLeaving}
          error={leaveError}
          onClose={() => setLeavingConversation(null)}
          onConfirm={handleConfirmLeave}
        />
      )}
    </>
  );
};
