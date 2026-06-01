import { useState } from 'react';
import { useTheme } from '@/features/user/ThemeContext';
import { useUser } from '@/features/user/UserContext';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import { VoiceActiveStage } from '@/shared/voice/layout/VoiceActiveStage';
import {
  buildParticipantCards,
  getCardSizes,
  getParticipantRows,
  getPinTargetId,
  PIN_DISABLED,
} from '@/shared/voice/layout/voiceLayout';

interface ConversationCallStageProps {
  conversationId: string;
  onLeave?: () => void;
}

export const ConversationCallStage = ({ conversationId, onLeave }: ConversationCallStageProps) => {
  const [pinnedTargetId, setPinnedTargetId] = useState<string | null>(null);
  const { theme } = useTheme();
  const { user } = useUser();
  const voice = useVoicePresence();

  const participants = voice.getConversationParticipants(conversationId);
  const cards = buildParticipantCards(participants, user, voice.mutedUserIds);
  const rows = getParticipantRows(cards);
  const cardSizes = getCardSizes(cards.length);
  const maxCols = Math.max(1, ...rows.map((r) => r.length));
  const cardWidth = `calc((100% - ${(maxCols - 1) * 1.5}rem) / ${maxCols})`;
  const labelsByUserId = new Map(cards.map((card) => [card.userId, card.label]));
  const cameraTracksByUserId = new Map(
    voice.cameraTracks.map((cameraTrack) => [cameraTrack.participantId, cameraTrack])
  );
  const isDarkTheme = theme.endsWith('obsidian');

  const availablePinTargetIds = new Set([
    ...cards.map((card) => getPinTargetId('participant', card.userId)),
    ...voice.screenShares.map((screenShare) => getPinTargetId('screenShare', screenShare.trackSid)),
  ]);
  const defaultPinnedTargetId = voice.screenShares[0]
    ? getPinTargetId('screenShare', voice.screenShares[0].trackSid)
    : null;
  const activePinnedTargetId =
    pinnedTargetId === PIN_DISABLED
      ? null
      : pinnedTargetId && availablePinTargetIds.has(pinnedTargetId)
        ? pinnedTargetId
        : defaultPinnedTargetId;
  const pinnedParticipant = activePinnedTargetId?.startsWith('participant:')
    ? cards.find((card) => getPinTargetId('participant', card.userId) === activePinnedTargetId)
    : undefined;
  const pinnedScreenShare = activePinnedTargetId?.startsWith('screenShare:')
    ? voice.screenShares.find(
        (screenShare) =>
          getPinTargetId('screenShare', screenShare.trackSid) === activePinnedTargetId
      )
    : undefined;

  const handleTogglePin = (targetId: string) => {
    setPinnedTargetId((current) => {
      const currentActiveTargetId =
        current === PIN_DISABLED
          ? null
          : current && availablePinTargetIds.has(current)
            ? current
            : defaultPinnedTargetId;

      return currentActiveTargetId === targetId ? PIN_DISABLED : targetId;
    });
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-1">
      <VoiceActiveStage
        cards={cards}
        rows={rows}
        cardSizes={cardSizes}
        cardWidth={cardWidth}
        isDarkTheme={isDarkTheme}
        speakingUserIds={voice.speakingUserIds}
        screenShares={voice.screenShares}
        cameraTracksByUserId={cameraTracksByUserId}
        labelsByUserId={labelsByUserId}
        activePinnedTargetId={activePinnedTargetId}
        pinnedParticipant={pinnedParticipant}
        pinnedScreenShare={pinnedScreenShare}
        hasPinnedItem={Boolean(pinnedParticipant || pinnedScreenShare)}
        currentUserId={user?.userId}
        isMuted={voice.isMuted}
        isCameraEnabled={voice.isCameraEnabled}
        isScreenSharing={voice.isScreenSharing}
        screenShareError={voice.screenShareError}
        cameraError={voice.cameraError}
        onTogglePin={handleTogglePin}
        getParticipantVolume={voice.getParticipantVolume}
        onParticipantVolumeChange={voice.setParticipantVolume}
        onToggleMute={voice.toggleMute}
        onToggleCamera={() => void voice.toggleCamera()}
        onToggleScreenShare={() => void voice.toggleScreenShare()}
        onLeave={onLeave ?? voice.leaveCall}
      />
    </div>
  );
};
