import { useEffect, useRef, useState } from 'react';
import type { HubConnection } from '@microsoft/signalr';

export interface UseTypingParams {
  entityId?: string;
  ready?: boolean;
  connection: HubConnection | null;
  currentUserId?: string;
  eventName: string;
  entityIdField: string;
}

export const useTyping = ({
  entityId,
  ready = true,
  connection,
  currentUserId,
  eventName,
  entityIdField,
}: UseTypingParams) => {
  const [typingState, setTypingState] = useState<{ entityId?: string; userIds: string[] }>({
    entityId: undefined,
    userIds: [],
  });
  const typingUserIds = typingState.entityId === entityId ? typingState.userIds : [];
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(null!);
  if (typingTimeoutsRef.current === null) {
    typingTimeoutsRef.current = new Map();
  }

  useEffect(() => {
    typingTimeoutsRef.current.forEach(clearTimeout);
    typingTimeoutsRef.current.clear();
  }, [entityId]);

  useEffect(() => {
    if (!connection || !entityId || !ready) return;

    const handleTyping = (event: Record<string, string>) => {
      if (event[entityIdField] !== entityId || event.userId === currentUserId) return;

      const { userId } = event;
      setTypingState((prev) => {
        const userIds = prev.entityId === entityId ? prev.userIds : [];
        return {
          entityId,
          userIds: userIds.includes(userId) ? userIds : [...userIds, userId],
        };
      });

      const existing = typingTimeoutsRef.current.get(userId);
      if (existing) clearTimeout(existing);

      const timeout = setTimeout(() => {
        setTypingState((prev) =>
          prev.entityId === entityId
            ? { entityId, userIds: prev.userIds.filter((id) => id !== userId) }
            : prev
        );
        typingTimeoutsRef.current.delete(userId);
      }, 6000);

      typingTimeoutsRef.current.set(userId, timeout);
    };

    connection.on(eventName, handleTyping);

    return () => {
      connection.off(eventName, handleTyping);
    };
  }, [entityId, ready, connection, currentUserId, eventName, entityIdField]);

  return { typingUserIds };
};
