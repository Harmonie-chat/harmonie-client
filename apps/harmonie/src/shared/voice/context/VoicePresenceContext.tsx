import { createContext, useContext, type ReactNode } from 'react';
import type {
  VoiceCameraTrack,
  VoiceParticipant,
  VoiceParticipantInit,
  VoiceScreenShare,
} from '@/types/voice';
import { useVoiceParticipants } from '../hooks/useVoiceParticipants';
import { useVoiceRoom } from '../hooks/useVoiceRoom';

interface VoicePresenceContextValue {
  getParticipants: (roomId: string) => VoiceParticipant[];
  seedFromChannelList: (
    channels: { channelId: string; participants: VoiceParticipantInit[] | null | undefined }[]
  ) => void;
  seedParticipants: (roomId: string, participants: VoiceParticipantInit[]) => void;
  activeTargetKind: 'channel' | 'conversation' | null;
  activeChannelId: string | null;
  activeChannelName: string | null;
  activeConversationId: string | null;
  activeConversationName: string | null;
  activeGuildId: string | null;
  activeGuildName: string | null;
  ping: number | null;
  updateActiveChannelMeta: (channelName: string, guildName: string) => void;
  updateActiveConversationMeta: (conversationName: string) => void;
  isMuted: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  isScreenSharing: boolean;
  screenShareError: string | null;
  cameraTracks: VoiceCameraTrack[];
  isCameraEnabled: boolean;
  cameraError: string | null;
  getParticipantVolume: (participantId: string) => number;
  setParticipantVolume: (participantId: string, volume: number) => void;
  joinChannel: (
    channelId: string,
    channelName?: string,
    guildId?: string,
    guildName?: string
  ) => Promise<void>;
  joinConversation: (conversationId: string, conversationName?: string) => Promise<void>;
  leaveChannel: () => void;
  leaveCall: () => void;
  toggleMute: () => void;
  toggleScreenShare: () => void;
  toggleCamera: () => void;
  isJoining: boolean;
  joinError: string | null;
}

const VoicePresenceContext = createContext<VoicePresenceContextValue>({
  getParticipants: () => [],
  seedFromChannelList: () => {},
  seedParticipants: () => {},
  activeTargetKind: null,
  activeChannelId: null,
  activeChannelName: null,
  activeConversationId: null,
  activeConversationName: null,
  activeGuildId: null,
  activeGuildName: null,
  ping: null,
  updateActiveChannelMeta: () => {},
  updateActiveConversationMeta: () => {},
  isMuted: false,
  speakingUserIds: new Set(),
  screenShares: [],
  isScreenSharing: false,
  screenShareError: null,
  cameraTracks: [],
  isCameraEnabled: false,
  cameraError: null,
  getParticipantVolume: () => 1,
  setParticipantVolume: () => {},
  joinChannel: async () => {},
  joinConversation: async () => {},
  leaveChannel: () => {},
  leaveCall: () => {},
  toggleMute: () => {},
  toggleScreenShare: () => {},
  toggleCamera: () => {},
  isJoining: false,
  joinError: null,
});

export const VoicePresenceProvider = ({ children }: { children: ReactNode }) => {
  const {
    getParticipants,
    seedParticipantsFromJoin,
    seedFromChannelList,
    syncParticipantsFromRoom,
  } = useVoiceParticipants();
  const {
    activeTargetKind,
    activeChannelId,
    activeChannelName,
    activeConversationId,
    activeConversationName,
    activeGuildId,
    activeGuildName,
    ping,
    updateActiveChannelMeta,
    updateActiveConversationMeta,
    isMuted,
    isJoining,
    joinError,
    speakingUserIds,
    screenShares,
    isScreenSharing,
    screenShareError,
    cameraTracks,
    isCameraEnabled,
    cameraError,
    getParticipantVolume,
    setParticipantVolume,
    joinChannel,
    joinConversation,
    leaveChannel,
    leaveCall,
    toggleMute,
    toggleScreenShare,
    toggleCamera,
  } = useVoiceRoom({ seedParticipantsFromJoin, syncParticipantsFromRoom });

  return (
    <VoicePresenceContext.Provider
      value={{
        getParticipants,
        seedFromChannelList,
        seedParticipants: seedParticipantsFromJoin,
        activeTargetKind,
        activeChannelId,
        activeChannelName,
        activeConversationId,
        activeConversationName,
        activeGuildId,
        activeGuildName,
        ping,
        updateActiveChannelMeta,
        updateActiveConversationMeta,
        isMuted,
        speakingUserIds,
        screenShares,
        isScreenSharing,
        screenShareError,
        cameraTracks,
        isCameraEnabled,
        cameraError,
        getParticipantVolume,
        setParticipantVolume,
        joinChannel,
        joinConversation,
        leaveChannel,
        leaveCall,
        toggleMute,
        toggleScreenShare,
        toggleCamera,
        isJoining,
        joinError,
      }}
    >
      {children}
    </VoicePresenceContext.Provider>
  );
};

export const useVoicePresence = () => useContext(VoicePresenceContext);
