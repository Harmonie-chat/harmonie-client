import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
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
  onToggleParticipantMute: (participantId: string) => void;
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
  onToggleParticipantMute,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeave,
}: VoiceActiveStageProps) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-1 overflow-hidden px-3 pb-28 pt-4 md:px-6 md:pb-28 md:pt-6">
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
              onToggleParticipantMute={onToggleParticipantMute}
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
              onToggleParticipantMute={onToggleParticipantMute}
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
  onToggleParticipantMute: (participantId: string) => void;
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
  onToggleParticipantMute,
  onTogglePin,
}: PinnedVoiceStageProps) => {
  const { t } = useTranslation();
  const thumbnailsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const thumbnailScreenShares = screenShares.filter(
    (screenShare) => screenShare.trackSid !== pinnedScreenShare?.trackSid
  );
  const thumbnailCards = cards.filter((card) => card.userId !== pinnedParticipant?.userId);
  const updateThumbnailScrollState = () => {
    const thumbnailsEl = thumbnailsRef.current;
    if (!thumbnailsEl) return;

    setCanScrollLeft(thumbnailsEl.scrollLeft > 1);
    setCanScrollRight(
      thumbnailsEl.scrollLeft + thumbnailsEl.clientWidth < thumbnailsEl.scrollWidth - 1
    );
  };
  const handleScrollThumbnails = (direction: 'left' | 'right') => {
    thumbnailsRef.current?.scrollBy({
      left: Math.round(thumbnailsRef.current.clientWidth * 0.75) * (direction === 'left' ? -1 : 1),
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    updateThumbnailScrollState();
    window.addEventListener('resize', updateThumbnailScrollState);

    return () => {
      window.removeEventListener('resize', updateThumbnailScrollState);
    };
  }, [thumbnailScreenShares.length, thumbnailCards.length]);

  return (
    <div className="flex h-full w-full flex-col gap-3 md:gap-4">
      <div className="min-h-0 flex-1">
        {pinnedScreenShare ? (
          <ScreenShareTile
            screenShare={pinnedScreenShare}
            label={
              labelsByUserId.get(pinnedScreenShare.participantId) ?? pinnedScreenShare.participantId
            }
            isPinned
            onTogglePin={() =>
              onTogglePin(getPinTargetId('screenShare', pinnedScreenShare.trackSid))
            }
            className="h-full w-full"
          />
        ) : pinnedParticipant ? (
          <VoiceParticipantTile
            card={pinnedParticipant}
            cardSizes={{ avatarSize: 128, titleClassName: 'text-4xl' }}
            isDarkTheme={isDarkTheme}
            cardWidth="100%"
            className="h-full w-full"
            cameraFit="contain"
            isSpeaking={speakingUserIds.has(pinnedParticipant.userId)}
            cameraTrack={cameraTracksByUserId.get(pinnedParticipant.userId)}
            isPinned
            canAdjustVolume={pinnedParticipant.userId !== currentUserId}
            participantVolume={getParticipantVolume(pinnedParticipant.userId)}
            onTogglePin={() => onTogglePin(getPinTargetId('participant', pinnedParticipant.userId))}
            onParticipantVolumeChange={(volume) =>
              onParticipantVolumeChange(pinnedParticipant.userId, volume)
            }
            onToggleParticipantMute={() => onToggleParticipantMute(pinnedParticipant.userId)}
          />
        ) : null}
      </div>

      <div className="relative shrink-0">
        <div
          ref={thumbnailsRef}
          className="max-w-full overflow-x-auto overscroll-x-contain pb-1"
          onScroll={updateThumbnailScrollState}
        >
          <div className="flex w-max min-w-full items-center justify-start gap-3 px-1 md:justify-center">
            {thumbnailScreenShares.map((screenShare) => (
              <ScreenShareTile
                key={screenShare.trackSid}
                screenShare={screenShare}
                label={labelsByUserId.get(screenShare.participantId) ?? screenShare.participantId}
                isPinned={false}
                onTogglePin={() => onTogglePin(getPinTargetId('screenShare', screenShare.trackSid))}
                className="h-36 w-72 shrink-0"
              />
            ))}
            {thumbnailCards.map((card) => (
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
                onParticipantVolumeChange={(volume) =>
                  onParticipantVolumeChange(card.userId, volume)
                }
                onToggleParticipantMute={() => onToggleParticipantMute(card.userId)}
              />
            ))}
          </div>
        </div>
        {canScrollLeft && (
          <button
            type="button"
            className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center justify-center md:hidden"
            aria-label={t('voice.scrollThumbnailsBack')}
            onClick={() => handleScrollThumbnails('left')}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border-2 bg-surface-2/80 text-text-2 shadow-[0_4px_16px_rgba(61,53,48,0.12)] backdrop-blur-sm">
              <ChevronLeft size={16} />
            </span>
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center md:hidden"
            aria-label={t('voice.scrollThumbnails')}
            onClick={() => handleScrollThumbnails('right')}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border-2 bg-surface-2/80 text-text-2 shadow-[0_4px_16px_rgba(61,53,48,0.12)] backdrop-blur-sm">
              <ChevronRight size={16} />
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

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
  onToggleParticipantMute: (participantId: string) => void;
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
  onToggleParticipantMute,
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
                onToggleParticipantMute={() => onToggleParticipantMute(card.userId)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
