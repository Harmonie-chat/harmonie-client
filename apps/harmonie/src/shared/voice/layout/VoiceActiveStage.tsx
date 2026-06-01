import { useTranslation } from 'react-i18next';
import { Volume2 } from 'lucide-react';
import type { VoiceCameraTrack, VoiceScreenShare } from '@/types/voice';
import { ScreenShareTile } from '../components/ScreenShareTile';
import { VoiceCallControls } from '../components/VoiceCallControls';
import { VoiceParticipantTile } from '../components/VoiceParticipantTile';
import { getPinTargetId, type VoiceCardSizes, type VoiceParticipantCardData } from './voiceLayout';

interface VoiceActiveStageProps {
  cards: VoiceParticipantCardData[];
  rows: VoiceParticipantCardData[][];
  cardSizes: VoiceCardSizes;
  cardWidth: string;
  isDarkTheme: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  cameraTracksByUserId: Map<string, VoiceCameraTrack>;
  labelsByUserId: Map<string, string>;
  activePinnedTargetId: string | null;
  pinnedParticipant?: VoiceParticipantCardData;
  pinnedScreenShare?: VoiceScreenShare;
  hasPinnedItem: boolean;
  currentUserId?: string;
  isMuted: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  screenShareError: string | null;
  cameraError: string | null;
  onTogglePin: (targetId: string) => void;
  getParticipantVolume: (participantId: string) => number;
  onParticipantVolumeChange: (participantId: string, volume: number) => void;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onLeave: () => void;
}

export const VoiceActiveStage = ({
  cards,
  rows,
  cardSizes,
  cardWidth,
  isDarkTheme,
  speakingUserIds,
  screenShares,
  cameraTracksByUserId,
  labelsByUserId,
  activePinnedTargetId,
  pinnedParticipant,
  pinnedScreenShare,
  hasPinnedItem,
  currentUserId,
  isMuted,
  isCameraEnabled,
  isScreenSharing,
  screenShareError,
  cameraError,
  onTogglePin,
  getParticipantVolume,
  onParticipantVolumeChange,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: VoiceActiveStageProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-1 overflow-hidden px-4 pb-28 pt-6 md:px-6 md:pb-28 md:pt-6">
        <div className="flex h-full w-full items-center justify-center">
          {cards.length === 0 ? (
            <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-md border border-border-2 bg-surface-2 px-8 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg">
                <Volume2 size={26} />
              </div>
              <span className="text-sm font-medium text-primary">{t('voice.connected')}</span>
              <p className="text-sm text-text-2">{t('voice.empty')}</p>
            </div>
          ) : hasPinnedItem ? (
            <PinnedVoiceStage
              cards={cards}
              isDarkTheme={isDarkTheme}
              speakingUserIds={speakingUserIds}
              screenShares={screenShares}
              cameraTracksByUserId={cameraTracksByUserId}
              labelsByUserId={labelsByUserId}
              pinnedParticipant={pinnedParticipant}
              pinnedScreenShare={pinnedScreenShare}
              currentUserId={currentUserId}
              getParticipantVolume={getParticipantVolume}
              onParticipantVolumeChange={onParticipantVolumeChange}
              onTogglePin={onTogglePin}
            />
          ) : (
            <VoiceGridStage
              rows={rows}
              cardSizes={cardSizes}
              cardWidth={cardWidth}
              isDarkTheme={isDarkTheme}
              speakingUserIds={speakingUserIds}
              screenShares={screenShares}
              cameraTracksByUserId={cameraTracksByUserId}
              labelsByUserId={labelsByUserId}
              activePinnedTargetId={activePinnedTargetId}
              currentUserId={currentUserId}
              getParticipantVolume={getParticipantVolume}
              onParticipantVolumeChange={onParticipantVolumeChange}
              onTogglePin={onTogglePin}
            />
          )}
        </div>
      </div>

      <VoiceCallControls
        isMuted={isMuted}
        isCameraEnabled={isCameraEnabled}
        isScreenSharing={isScreenSharing}
        screenShareError={screenShareError}
        cameraError={cameraError}
        onToggleMute={onToggleMute}
        onToggleCamera={onToggleCamera}
        onToggleScreenShare={onToggleScreenShare}
        onLeave={onLeave}
      />
    </>
  );
};

interface PinnedVoiceStageProps {
  cards: VoiceParticipantCardData[];
  isDarkTheme: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  cameraTracksByUserId: Map<string, VoiceCameraTrack>;
  labelsByUserId: Map<string, string>;
  pinnedParticipant?: VoiceParticipantCardData;
  pinnedScreenShare?: VoiceScreenShare;
  currentUserId?: string;
  getParticipantVolume: (participantId: string) => number;
  onParticipantVolumeChange: (participantId: string, volume: number) => void;
  onTogglePin: (targetId: string) => void;
}

const PinnedVoiceStage = ({
  cards,
  isDarkTheme,
  speakingUserIds,
  screenShares,
  cameraTracksByUserId,
  labelsByUserId,
  pinnedParticipant,
  pinnedScreenShare,
  currentUserId,
  getParticipantVolume,
  onParticipantVolumeChange,
  onTogglePin,
}: PinnedVoiceStageProps) => (
  <div className="flex h-full w-full flex-col gap-4">
    <div className="min-h-0 flex-1">
      {pinnedScreenShare ? (
        <ScreenShareTile
          screenShare={pinnedScreenShare}
          label={
            labelsByUserId.get(pinnedScreenShare.participantId) ?? pinnedScreenShare.participantId
          }
          isPinned
          onTogglePin={() => onTogglePin(getPinTargetId('screenShare', pinnedScreenShare.trackSid))}
          className="h-full w-full"
        />
      ) : pinnedParticipant ? (
        <VoiceParticipantTile
          card={pinnedParticipant}
          cardSizes={{ avatarSize: 128, titleClassName: 'text-4xl' }}
          isDarkTheme={isDarkTheme}
          cardWidth="100%"
          isSpeaking={speakingUserIds.has(pinnedParticipant.userId)}
          cameraTrack={cameraTracksByUserId.get(pinnedParticipant.userId)}
          isPinned
          canAdjustVolume={pinnedParticipant.userId !== currentUserId}
          participantVolume={getParticipantVolume(pinnedParticipant.userId)}
          onTogglePin={() => onTogglePin(getPinTargetId('participant', pinnedParticipant.userId))}
          onParticipantVolumeChange={(volume) =>
            onParticipantVolumeChange(pinnedParticipant.userId, volume)
          }
        />
      ) : null}
    </div>

    <div className="shrink-0 overflow-x-auto pb-1">
      <div className="flex min-w-full justify-center gap-3">
        {screenShares
          .filter((screenShare) => screenShare.trackSid !== pinnedScreenShare?.trackSid)
          .map((screenShare) => (
            <ScreenShareTile
              key={screenShare.trackSid}
              screenShare={screenShare}
              label={labelsByUserId.get(screenShare.participantId) ?? screenShare.participantId}
              isPinned={false}
              onTogglePin={() => onTogglePin(getPinTargetId('screenShare', screenShare.trackSid))}
              className="h-36 w-72 shrink-0"
            />
          ))}
        {cards
          .filter((card) => card.userId !== pinnedParticipant?.userId)
          .map((card) => (
            <VoiceParticipantTile
              key={card.userId}
              card={card}
              cardSizes={{ avatarSize: 48, titleClassName: 'text-sm' }}
              isDarkTheme={isDarkTheme}
              cardWidth="10rem"
              isSpeaking={speakingUserIds.has(card.userId)}
              cameraTrack={cameraTracksByUserId.get(card.userId)}
              isPinned={false}
              canAdjustVolume={card.userId !== currentUserId}
              participantVolume={getParticipantVolume(card.userId)}
              onTogglePin={() => onTogglePin(getPinTargetId('participant', card.userId))}
              onParticipantVolumeChange={(volume) => onParticipantVolumeChange(card.userId, volume)}
            />
          ))}
      </div>
    </div>
  </div>
);

interface VoiceGridStageProps {
  rows: VoiceParticipantCardData[][];
  cardSizes: VoiceCardSizes;
  cardWidth: string;
  isDarkTheme: boolean;
  speakingUserIds: Set<string>;
  screenShares: VoiceScreenShare[];
  cameraTracksByUserId: Map<string, VoiceCameraTrack>;
  labelsByUserId: Map<string, string>;
  activePinnedTargetId: string | null;
  currentUserId?: string;
  getParticipantVolume: (participantId: string) => number;
  onParticipantVolumeChange: (participantId: string, volume: number) => void;
  onTogglePin: (targetId: string) => void;
}

const VoiceGridStage = ({
  rows,
  cardSizes,
  cardWidth,
  isDarkTheme,
  speakingUserIds,
  screenShares,
  cameraTracksByUserId,
  labelsByUserId,
  activePinnedTargetId,
  currentUserId,
  getParticipantVolume,
  onParticipantVolumeChange,
  onTogglePin,
}: VoiceGridStageProps) => (
  <div className="flex h-full w-full justify-center">
    <div className="flex h-full w-full flex-col gap-6">
      {screenShares.length > 0 && (
        <div className="grid min-h-[20rem] flex-[2.5] grid-cols-1 gap-6 lg:grid-cols-2">
          {screenShares.map((screenShare) => (
            <ScreenShareTile
              key={screenShare.trackSid}
              screenShare={screenShare}
              label={labelsByUserId.get(screenShare.participantId) ?? screenShare.participantId}
              isPinned={
                activePinnedTargetId === getPinTargetId('screenShare', screenShare.trackSid)
              }
              onTogglePin={() => onTogglePin(getPinTargetId('screenShare', screenShare.trackSid))}
              className="min-h-[20rem]"
            />
          ))}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex flex-1 w-full justify-center gap-6">
            {row.map((card) => (
              <VoiceParticipantTile
                key={card.userId}
                card={card}
                cardSizes={cardSizes}
                isDarkTheme={isDarkTheme}
                cardWidth={cardWidth}
                isSpeaking={speakingUserIds.has(card.userId)}
                cameraTrack={cameraTracksByUserId.get(card.userId)}
                isPinned={activePinnedTargetId === getPinTargetId('participant', card.userId)}
                canAdjustVolume={card.userId !== currentUserId}
                participantVolume={getParticipantVolume(card.userId)}
                onTogglePin={() => onTogglePin(getPinTargetId('participant', card.userId))}
                onParticipantVolumeChange={(volume) =>
                  onParticipantVolumeChange(card.userId, volume)
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
