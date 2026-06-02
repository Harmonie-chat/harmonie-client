import { useEffect, useRef, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { MicOff, Pin, PinOff, Volume2, VolumeX } from 'lucide-react';
import { IconButton, Tooltip, VoiceParticipantCard } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { getUserGradient } from '@/shared/utils/user';
import type { VoiceCameraTrack } from '@/types/voice';
import type { VoiceCardSizes, VoiceParticipantCardData } from '../layout/voiceLayout';

interface VoiceParticipantTileProps {
  card: VoiceParticipantCardData;
  cardSizes: VoiceCardSizes;
  isDarkTheme: boolean;
  cardWidth?: string;
  className?: string;
  cameraFit?: 'cover' | 'contain';
  isSpeaking: boolean;
  cameraTrack?: VoiceCameraTrack;
  isPinned: boolean;
  canAdjustVolume?: boolean;
  participantVolume?: number;
  onTogglePin: () => void;
  onParticipantVolumeChange?: (volume: number) => void;
  onToggleParticipantMute?: () => void;
}

export const VoiceParticipantTile = ({
  card,
  cardSizes,
  isDarkTheme,
  cardWidth,
  className = '',
  cameraFit = 'cover',
  isSpeaking,
  cameraTrack,
  isPinned,
  canAdjustVolume = false,
  participantVolume = 1,
  onTogglePin,
  onParticipantVolumeChange,
  onToggleParticipantMute,
}: VoiceParticipantTileProps) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(card.avatarFileId);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isCompactTile = cardSizes.avatarSize <= 48;
  const participantVolumePercent = Math.round(participantVolume * 100);
  const volumeToggleLabel = t(
    participantVolume === 0 ? 'voice.unmuteParticipant' : 'voice.muteParticipant',
    { name: card.label }
  );

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !cameraTrack) return;

    cameraTrack.track.attach(videoEl);
    return () => {
      cameraTrack.track.detach(videoEl);
    };
  }, [cameraTrack]);

  return (
    <div
      className={['group relative min-w-0 flex-none', className].filter(Boolean).join(' ')}
      style={{ width: cardWidth }}
    >
      {cameraTrack ? (
        <div
          className={[
            'relative h-full min-h-[11rem] w-full overflow-hidden rounded-md border bg-surface-3 transition-all duration-150 hover:scale-[1.01]',
            isSpeaking
              ? 'border-primary shadow-[inset_0_0_0_2px_var(--color-primary)]'
              : 'border-border-2',
          ].join(' ')}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={cameraTrack.isLocal}
            className={[
              'absolute inset-0 h-full w-full',
              cameraFit === 'contain' ? 'bg-black object-contain' : 'object-cover',
            ].join(' ')}
          />
          <div
            className={[
              'pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent',
              isCompactTile ? 'px-3 pb-3 pt-8' : 'px-4 pb-4 pt-10',
            ].join(' ')}
          >
            <p
              className={[
                'max-w-full truncate font-medium text-white',
                cardSizes.titleClassName,
              ].join(' ')}
            >
              {card.label}
            </p>
          </div>
        </div>
      ) : (
        <VoiceParticipantCard
          className="h-full min-h-[11rem] w-full"
          avatarSize={cardSizes.avatarSize}
          titleClassName={cardSizes.titleClassName}
          avatarUrl={avatarUrl}
          avatarIcon={card.avatarIcon ?? undefined}
          avatarColor={card.avatarColor ?? undefined}
          avatarBg={card.avatarBg ?? undefined}
          avatarLabel={card.label[0]?.toUpperCase() ?? '?'}
          title={card.label}
          isSpeaking={isSpeaking}
          style={{
            background: getUserGradient(card.userId, isDarkTheme),
          }}
        />
      )}
      {card.isMuted && (
        <div className="absolute left-2 top-2">
          <Tooltip content={t('voice.participantMuted', { name: card.label })} side="bottom">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border-2/50 bg-surface-1/70 text-text-2/80 shadow-sm backdrop-blur-sm"
              aria-label={t('voice.participantMuted', { name: card.label })}
              role="img"
            >
              <MicOff size={15} />
            </div>
          </Tooltip>
        </div>
      )}
      <div className="absolute right-3 top-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <IconButton
          size="small"
          variant="filled"
          selected={isPinned}
          onClick={onTogglePin}
          aria-label={isPinned ? t('voice.unpinParticipant') : t('voice.pinParticipant')}
          title={isPinned ? t('voice.unpinParticipant') : t('voice.pinParticipant')}
        >
          {isPinned ? <PinOff size={15} /> : <Pin size={15} />}
        </IconButton>
      </div>
      {canAdjustVolume && onParticipantVolumeChange && (
        <div className="absolute inset-x-3 bottom-6 flex items-center gap-2 rounded-full border border-border-2 bg-surface-1/95 px-3 py-2 shadow-[0_4px_16px_rgba(61,53,48,0.14)] opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <IconButton
            size="small"
            variant="ghost"
            className="h-6 min-h-6 w-6 min-w-6 shrink-0"
            onClick={onToggleParticipantMute}
            aria-label={volumeToggleLabel}
            title={volumeToggleLabel}
          >
            {participantVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </IconButton>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={participantVolumePercent}
            onChange={(event) => onParticipantVolumeChange(Number(event.target.value) / 100)}
            className="h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-transparent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary/35 [&::-moz-range-progress]:h-1 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-none [&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-border-1/25 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-3px] [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-none"
            style={
              {
                background: `linear-gradient(to right, var(--color-primary) 0 ${participantVolumePercent}%, rgb(from var(--color-border-1) r g b / 0.24) ${participantVolumePercent}% 100%)`,
              } as CSSProperties
            }
            aria-label={t('voice.participantVolume', { name: card.label })}
            title={t('voice.participantVolume', { name: card.label })}
          />
          <span className="w-9 text-right text-xs tabular-nums text-text-2">
            {participantVolumePercent}%
          </span>
        </div>
      )}
    </div>
  );
};
