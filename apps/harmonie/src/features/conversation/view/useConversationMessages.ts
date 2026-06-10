import {
  ackConversation,
  addConversationReaction,
  deleteConversationMessage,
  deleteConversationMessageAttachment,
  getConversationMessages,
  pinConversationMessage,
  removeConversationReaction,
  unpinConversationMessage,
  updateConversationMessage,
} from '@/api/conversations';
import { useMessages } from '@/shared/message/hooks/useMessages';
import { useTyping } from '@/shared/message/hooks/useTyping';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { HubConnection } from '@microsoft/signalr';

interface UseConversationMessagesParams {
  conversationId?: string;
  connection: HubConnection | null;
  currentUserId?: string;
}

export const useConversationMessages = ({
  conversationId,
  connection,
  currentUserId,
}: UseConversationMessagesParams) => {
  const { typingUserIds } = useTyping({
    entityId: conversationId,
    connection,
    currentUserId,
    eventName: REALTIME_SERVER_EVENTS.conversationUserTyping,
    entityIdField: 'conversationId',
  });

  return useMessages({
    entityId: conversationId,
    connection,
    currentUserId,
    api: {
      fetchMessages: getConversationMessages,
      ackMessage: ackConversation,
      updateMessage: updateConversationMessage,
      deleteMessage: deleteConversationMessage,
      deleteAttachment: deleteConversationMessageAttachment,
      pinMessage: pinConversationMessage,
      unpinMessage: unpinConversationMessage,
      addReaction: addConversationReaction,
      removeReaction: removeConversationReaction,
    },
    ws: {
      created: REALTIME_SERVER_EVENTS.conversationMessageCreated,
      updated: REALTIME_SERVER_EVENTS.conversationMessageUpdated,
      deleted: REALTIME_SERVER_EVENTS.conversationMessageDeleted,
      entityIdField: 'conversationId',
    },
    typingUserIds,
  });
};
