import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2, Pin, PinOff, ScreenShare } from 'lucide-react';
import { IconButton } from '@harmonie/ui';
import type { VoiceScreenShare } from '@/types/voice';

interface WebkitFullscreenVideo extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
  webkitDisplayingFullscreen?: boolean;
}

interface ScreenShareTileProps {
  screenShare: VoiceScreenShare;
  label: string;
  isPinned: boolean;
  onTogglePin: () => void;
  className?: string;
}

export const ScreenShareTile = ({
  screenShare,
  label,
  isPinned,
  onTogglePin,
  className = '',
}: ScreenShareTileProps) => {
  const { t } = useTranslation();
  const tileRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    screenShare.track.attach(videoEl);

    return () => {
      screenShare.track.detach(videoEl);
    };
  }, [screenShare.track]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === tileRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = async () => {
    const tileEl = tileRef.current;
    const videoEl = videoRef.current as WebkitFullscreenVideo | null;
    if (!tileEl) return;

    if (document.fullscreenElement === tileEl) {
      await document.exitFullscreen();
      return;
    }

    if (tileEl.requestFullscreen) {
      await tileEl.requestFullscreen();
      return;
    }

    videoEl?.webkitEnterFullscreen?.();
  };

  return (
    <div
      ref={tileRef}
      className={[
        'group relative flex min-h-0 min-w-0 overflow-hidden rounded-md border border-border-2 bg-surface-3 fullscreen:rounded-none fullscreen:border-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={screenShare.isLocal}
        aria-label={t('voice.screenSharingLabel', { name: label })}
        className="h-full w-full bg-black object-contain"
      >
        <track kind="captions" label={t('voice.noCaptionsAvailable')} />
      </video>
      <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-4.5rem)] items-center gap-2 rounded-full bg-surface-1/90 px-3 py-1 text-xs font-medium text-text-1 shadow-sm">
        <ScreenShare size={14} className="shrink-0" />
        <span className="truncate">{t('voice.screenSharingLabel', { name: label })}</span>
      </div>
      <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <IconButton
          size="small"
          variant="filled"
          onClick={() => void handleToggleFullscreen()}
          aria-label={isFullscreen ? t('voice.exitFullscreen') : t('voice.enterFullscreen')}
          title={isFullscreen ? t('voice.exitFullscreen') : t('voice.enterFullscreen')}
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </IconButton>
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
    </div>
  );
};
