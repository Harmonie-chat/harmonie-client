import { useNavigate } from 'react-router-dom';
import { openDirectConversation } from '@/api/conversations';
import type { Conversation, ConversationParticipant } from '@/types/conversation';
import { useUser } from '@/features/user/UserContext';
import { useConversations } from './ConversationContext';
import { userToConversationParticipant } from './conversationUtils';

type DirectConversationUser = Pick<ConversationParticipant, 'userId' | 'username'> &
  Partial<Pick<ConversationParticipant, 'displayName' | 'bio' | 'avatarFileId' | 'avatar'>>;

export const useOpenDirectConversation = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { addConversation } = useConversations();

  return async (targetUser: DirectConversationUser) => {
    const response = await openDirectConversation(targetUser.userId);
    const currentUserParticipant = user ? userToConversationParticipant(user) : null;
    const targetParticipant = userToConversationParticipant(targetUser);
    const participants = [
      targetParticipant,
      ...(currentUserParticipant ? [currentUserParticipant] : []),
    ];

    const conversation: Conversation = {
      conversationId: response.conversationId,
      type: 'Direct',
      name: response.name ?? null,
      participants,
      createdAtUtc: response.createdAtUtc,
    };

    addConversation(conversation);
    navigate(`/conversations/${conversation.conversationId}`);
  };
};
