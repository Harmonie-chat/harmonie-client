import { useEffect, useRef, useState } from 'react';
import type { Room } from 'livekit-client';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type {
  ConversationVoiceParticipantJoinedEvent,
  ConversationVoiceParticipantLeftEvent,
  VoiceParticipant,
  VoiceParticipantInit,
  VoiceParticipantJoinedEvent,
  VoiceParticipantLeftEvent,
} from '@/types/voice';
import type { UserProfileUpdatedEvent } from '@/types/user';
import { applyVoiceParticipantProfileUpdate } from '@/features/realtime/userProfileRealtime';

type VoiceRoomKind = 'channel' | 'conversation';

const getRoomKey = (kind: VoiceRoomKind, roomId: string) => `${kind}:${roomId}`;

const upsertParticipant = (
  kind: VoiceRoomKind,
  roomId: string,
  incoming: VoiceParticipant,
  prev: Map<string, VoiceParticipant[]>
) => {
  const next = new Map(prev);
  const roomKey = getRoomKey(kind, roomId);
  const current = next.get(roomKey) ?? [];
  const existingIndex = current.findIndex((p) => p.userId === incoming.userId);
  if (existingIndex === -1) {
    next.set(roomKey, [...current, incoming]);
  } else {
    const updated = [...current];
    updated[existingIndex] = incoming;
    next.set(roomKey, updated);
  }
  return next;
};

export const useVoiceParticipants = () => {
  const { connection } = useRealtime();
  const [participants, setParticipants] = useState<Map<string, VoiceParticipant[]>>(new Map());
  const handleJoinedRef = useRef<(event: VoiceParticipantJoinedEvent) => void>(() => undefined);
  const handleLeftRef = useRef<(event: VoiceParticipantLeftEvent) => void>(() => undefined);
  const handleConversationJoinedRef = useRef<
    (event: ConversationVoiceParticipantJoinedEvent) => void
  >(() => undefined);
  const handleConversationLeftRef = useRef<(event: ConversationVoiceParticipantLeftEvent) => void>(
    () => undefined
  );
  const handleUserProfileUpdatedRef = useRef<(event: UserProfileUpdatedEvent) => void>(
    () => undefined
  );

  // Seed from join response (full avatar data available)
  const seedParticipantsFromJoin = (
    kind: VoiceRoomKind,
    roomId: string,
    initial: VoiceParticipantInit[]
  ) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      next.set(
        getRoomKey(kind, roomId),
        initial.map((p) => ({ ...p }))
      );
      return next;
    });
  };

  // Seed from guild channel list (initial snapshot, skips channels already populated)
  const seedFromChannelList = (
    channels: { channelId: string; participants: VoiceParticipantInit[] | null | undefined }[]
  ) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      for (const { channelId, participants } of channels) {
        if (!participants || participants.length === 0) continue;
        const roomKey = getRoomKey('channel', channelId);
        if (next.has(roomKey)) continue;
        next.set(
          roomKey,
          participants.map((p) => ({ ...p }))
        );
      }
      return next;
    });
  };

  // Sync from LiveKit room state, preserving avatar data from SignalR/join
  const syncParticipantsFromRoom = (kind: VoiceRoomKind, roomId: string, room: Room) => {
    setParticipants((prev) => {
      const roomKey = getRoomKey(kind, roomId);
      const next = new Map(prev);
      const existingById = new Map((next.get(roomKey) ?? []).map((p) => [p.userId, p]));
      const remoteParticipants: VoiceParticipant[] = Array.from(
        room.remoteParticipants.values()
      ).map((participant) => {
        const existing = existingById.get(participant.identity);
        return {
          userId: participant.identity,
          username: existing?.username ?? participant.name?.trim() ?? participant.identity,
          displayName: existing?.displayName ?? null,
          avatarFileId: existing?.avatarFileId ?? null,
          avatarBg: existing?.avatarBg ?? null,
          avatarColor: existing?.avatarColor ?? null,
          avatarIcon: existing?.avatarIcon ?? null,
        };
      });
      next.set(roomKey, remoteParticipants);
      return next;
    });
  };

  const handleJoined = (event: VoiceParticipantJoinedEvent) => {
    setParticipants((prev) =>
      upsertParticipant(
        'channel',
        event.channelId,
        {
          userId: event.userId,
          username: event.username,
          displayName: event.displayName,
          avatarFileId: event.avatarFileId,
          avatarBg: event.avatarBg,
          avatarColor: event.avatarColor,
          avatarIcon: event.avatarIcon,
        },
        prev
      )
    );
  };

  const handleConversationJoined = (event: ConversationVoiceParticipantJoinedEvent) => {
    setParticipants((prev) =>
      upsertParticipant(
        'conversation',
        event.conversationId,
        {
          userId: event.userId,
          username: event.username,
          displayName: event.displayName,
          avatarFileId: event.avatarFileId,
          avatarBg: event.avatarBg ?? null,
          avatarColor: event.avatarColor,
          avatarIcon: event.avatarIcon,
        },
        prev
      )
    );
  };

  const removeParticipant = (kind: VoiceRoomKind, roomId: string, userId: string) => {
    setParticipants((prev) => {
      const next = new Map(prev);
      const roomKey = getRoomKey(kind, roomId);
      const current = next.get(roomKey) ?? [];
      next.set(
        roomKey,
        current.filter((p) => p.userId !== userId)
      );
      return next;
    });
  };

  const handleLeft = (event: VoiceParticipantLeftEvent) => {
    removeParticipant('channel', event.channelId, event.userId);
  };

  const handleConversationLeft = (event: ConversationVoiceParticipantLeftEvent) => {
    removeParticipant('conversation', event.conversationId, event.userId);
  };

  const handleUserProfileUpdated = (event: UserProfileUpdatedEvent) => {
    setParticipants((prev) => {
      let changed = false;
      const next = new Map<string, VoiceParticipant[]>();
      prev.forEach((participants, roomKey) => {
        next.set(
          roomKey,
          participants.map((participant) => {
            if (participant.userId !== event.userId) return participant;
            changed = true;
            return applyVoiceParticipantProfileUpdate(participant, event);
          })
        );
      });
      return changed ? next : prev;
    });
  };

  useEffect(() => {
    handleJoinedRef.current = handleJoined;
    handleLeftRef.current = handleLeft;
    handleConversationJoinedRef.current = handleConversationJoined;
    handleConversationLeftRef.current = handleConversationLeft;
    handleUserProfileUpdatedRef.current = handleUserProfileUpdated;
  });

  // Listen to SignalR presence events
  useEffect(() => {
    if (!connection) return;
    const handleJoinedEvent = (event: VoiceParticipantJoinedEvent) => {
      handleJoinedRef.current(event);
    };
    const handleLeftEvent = (event: VoiceParticipantLeftEvent) => {
      handleLeftRef.current(event);
    };
    const handleConversationJoinedEvent = (event: ConversationVoiceParticipantJoinedEvent) => {
      handleConversationJoinedRef.current(event);
    };
    const handleConversationLeftEvent = (event: ConversationVoiceParticipantLeftEvent) => {
      handleConversationLeftRef.current(event);
    };
    const handleUserProfileUpdatedEvent = (event: UserProfileUpdatedEvent) => {
      handleUserProfileUpdatedRef.current(event);
    };

    connection.on(REALTIME_SERVER_EVENTS.voiceParticipantJoined, handleJoinedEvent);
    connection.on(REALTIME_SERVER_EVENTS.voiceParticipantLeft, handleLeftEvent);
    connection.on(
      REALTIME_SERVER_EVENTS.conversationVoiceParticipantJoined,
      handleConversationJoinedEvent
    );
    connection.on(
      REALTIME_SERVER_EVENTS.conversationVoiceParticipantLeft,
      handleConversationLeftEvent
    );
    connection.on(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdatedEvent);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.voiceParticipantJoined, handleJoinedEvent);
      connection.off(REALTIME_SERVER_EVENTS.voiceParticipantLeft, handleLeftEvent);
      connection.off(
        REALTIME_SERVER_EVENTS.conversationVoiceParticipantJoined,
        handleConversationJoinedEvent
      );
      connection.off(
        REALTIME_SERVER_EVENTS.conversationVoiceParticipantLeft,
        handleConversationLeftEvent
      );
      connection.off(REALTIME_SERVER_EVENTS.userProfileUpdated, handleUserProfileUpdatedEvent);
    };
  }, [connection]);

  const getParticipants = (channelId: string): VoiceParticipant[] =>
    participants.get(getRoomKey('channel', channelId)) ?? [];

  const getConversationParticipants = (conversationId: string): VoiceParticipant[] =>
    participants.get(getRoomKey('conversation', conversationId)) ?? [];

  return {
    getParticipants,
    getConversationParticipants,
    seedParticipantsFromJoin,
    seedFromChannelList,
    syncParticipantsFromRoom,
  };
};
