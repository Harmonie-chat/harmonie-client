import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConversations } from '@/api/conversations';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import { useUser } from '@/features/user/UserContext';
import type {
  Conversation,
  ConversationMessageCreatedEvent,
  ConversationParticipantLeftEvent,
  ConversationUpdatedEvent,
} from '@/types/conversation';
import type { UserProfileUpdatedEvent } from '@/types/user';
import { applyUserProfileUpdate } from '@/features/realtime/userProfileRealtime';

interface ConversationContextValue {
  conversations: Conversation[] | null;
  membersPanelOpenByConversationId: Record<string, boolean>;
  fetchConversations: () => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversation: Conversation) => void;
  removeConversation: (conversationId: string) => void;
  setConversationMembersPanelOpen: (conversationId: string, open: boolean) => void;
}

const ConversationContext = createContext<ConversationContextValue>({
  conversations: null,
  membersPanelOpenByConversationId: {},
  fetchConversations: () => {},
  addConversation: () => {},
  updateConversation: () => {},
  removeConversation: () => {},
  setConversationMembersPanelOpen: () => {},
});

export const ConversationProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { conversationId: activeConversationId } = useParams<{ conversationId: string }>();
  const { connection } = useRealtime();
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const conversationsRef = useRef<Conversation[] | null>(null);
  const [membersPanelOpenByConversationId, setMembersPanelOpenByConversationId] = useState<
    Record<string, boolean>
  >({});
  const fetchConversationsRef = useRef<() => void>(() => {});

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const fetchConversations = () => {
    getConversations()
      .then((data) =>
        setConversations(
          data.conversations.map((c) => ({
            ...c,
            type: (c.type.charAt(0).toUpperCase() +
              c.type.slice(1).toLowerCase()) as Conversation['type'],
          }))
        )
      )
      .catch(() => setConversations([]));
  };

  useEffect(() => {
    fetchConversationsRef.current = fetchConversations;
  });

  useEffect(() => {
    fetchConversationsRef.current();
  }, []);

  useEffect(() => {
    if (!connection) return;

    const handleConversationCreated = () => {
      fetchConversationsRef.current();
    };

    const handleConversationMessageCreated = (event: ConversationMessageCreatedEvent) => {
      if (
        conversationsRef.current?.some(
          (conversation) => conversation.conversationId === event.conversationId
        )
      ) {
        return;
      }

      fetchConversationsRef.current();
    };

    connection.on(REALTIME_SERVER_EVENTS.conversationCreated, handleConversationCreated);
    connection.on(
      REALTIME_SERVER_EVENTS.conversationMessageCreated,
      handleConversationMessageCreated
    );

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.conversationCreated, handleConversationCreated);
      connection.off(
        REALTIME_SERVER_EVENTS.conversationMessageCreated,
        handleConversationMessageCreated
      );
    };
  }, [connection]);

  useEffect(() => {
    if (!connection) return;

    const handleConversationUpdated = (event: ConversationUpdatedEvent) => {
      setConversations((prev) =>
        prev
          ? prev.map((conversation) =>
              conversation.conversationId === event.conversationId
                ? { ...conversation, name: event.name }
                : conversation
            )
          : prev
      );
    };

    const handleUserProfileUpdated = (event: UserProfileUpdatedEvent) => {
      setConversations((prev) =>
        prev
          ? prev.map((conversation) => ({
              ...conversation,
              participants: conversation.participants.map((participant) =>
                participant.userId === event.userId
                  ? applyUserProfileUpdate(participant, event)
                  : participant
              ),
            }))
          : prev
      );
    };

    connection.on(REALTIME_SERVER_EVENTS.conversationUpdated, handleConversationUpdated);
    connection.on(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdated);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.conversationUpdated, handleConversationUpdated);
      connection.off(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdated);
    };
  }, [connection]);

  useEffect(() => {
    if (!connection) return;

    const handleConversationParticipantLeft = (event: ConversationParticipantLeftEvent) => {
      if (event.userId !== user?.userId) return;
      setConversations((prev) =>
        prev
          ? prev.filter((conversation) => conversation.conversationId !== event.conversationId)
          : prev
      );
      setMembersPanelOpenByConversationId((prev) => {
        const next = { ...prev };
        delete next[event.conversationId];
        return next;
      });
      if (event.conversationId === activeConversationId) {
        navigate('/conversations', { replace: true });
      }
    };

    connection.on(
      REALTIME_SERVER_EVENTS.conversationParticipantLeft,
      handleConversationParticipantLeft
    );

    return () => {
      connection.off(
        REALTIME_SERVER_EVENTS.conversationParticipantLeft,
        handleConversationParticipantLeft
      );
    };
  }, [activeConversationId, connection, navigate, user?.userId]);

  useEffect(() => {
    if (!connection) return;

    const handleConversationParticipantLeft = (event: ConversationParticipantLeftEvent) => {
      if (event.userId === user?.userId) return;
      setConversations((prev) =>
        prev
          ? prev.map((conversation) =>
              conversation.conversationId === event.conversationId
                ? {
                    ...conversation,
                    participants: conversation.participants.filter(
                      (participant) => participant.userId !== event.userId
                    ),
                  }
                : conversation
            )
          : prev
      );
    };

    connection.on(
      REALTIME_SERVER_EVENTS.conversationParticipantLeft,
      handleConversationParticipantLeft
    );

    return () => {
      connection.off(
        REALTIME_SERVER_EVENTS.conversationParticipantLeft,
        handleConversationParticipantLeft
      );
    };
  }, [connection, user?.userId]);

  const addConversation = (conversation: Conversation) =>
    setConversations((prev) =>
      prev
        ? prev.some((c) => c.conversationId === conversation.conversationId)
          ? prev
          : [conversation, ...prev]
        : [conversation]
    );

  const updateConversation = (conversation: Conversation) =>
    setConversations((prev) =>
      prev
        ? prev.map((c) => (c.conversationId === conversation.conversationId ? conversation : c))
        : null
    );

  const removeConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev ? prev.filter((c) => c.conversationId !== conversationId) : null
    );
    setMembersPanelOpenByConversationId((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  };

  const setConversationMembersPanelOpen = (conversationId: string, open: boolean) => {
    setMembersPanelOpenByConversationId((prev) => ({ ...prev, [conversationId]: open }));
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        membersPanelOpenByConversationId,
        fetchConversations,
        addConversation,
        updateConversation,
        removeConversation,
        setConversationMembersPanelOpen,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversations = () => use(ConversationContext);

export const useConversation = (conversationId: string | undefined) => {
  const { conversations } = use(ConversationContext);
  return conversations?.find((c) => c.conversationId === conversationId) ?? null;
};

export const useConversationMembersPanel = (conversationId: string | undefined) => {
  const { membersPanelOpenByConversationId, setConversationMembersPanelOpen } =
    use(ConversationContext);

  const membersOpen = conversationId
    ? membersPanelOpenByConversationId[conversationId] === true
    : false;

  const setMembersOpen = (open: boolean) => {
    if (!conversationId) return;
    setConversationMembersPanelOpen(conversationId, open);
  };

  const toggleMembersOpen = () => {
    if (!conversationId) return;
    setConversationMembersPanelOpen(conversationId, !membersOpen);
  };

  return { membersOpen, setMembersOpen, toggleMembersOpen };
};
