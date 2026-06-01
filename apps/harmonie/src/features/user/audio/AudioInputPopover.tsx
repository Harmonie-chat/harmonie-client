import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Mic, MicVocal, SlidersHorizontal, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAudioInput, type AudioInputNoiseReductionLevel } from './AudioInputContext';
import { useCoarsePointer } from '@/shared/hooks/useCoarsePointer';

interface AudioInputPopoverProps {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

export const AudioInputPopover = ({ anchorRef, onClose }: AudioInputPopoverProps) => {
  const { t } = useTranslation();
  const {
    devices,
    selectedDeviceId,
    selectDevice,
    noiseReductionLevel,
    setNoiseReductionLevel,
    needsPermission,
    requestPermission,
  } = useAudioInput();
  const popoverRef = useRef<HTMLDivElement>(null);
  const isCoarsePointer = useCoarsePointer();
  const [style, setStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    left: -9999,
    top: -9999,
    visibility: 'hidden',
  });
  const [requesting, setRequesting] = useState(false);

  useLayoutEffect(() => {
    const gap = 8;
    const viewportPadding = 12;

    const updatePosition = () => {
      if (isCoarsePointer) {
        setStyle({
          position: 'fixed',
          inset: 0,
          maxHeight: '100dvh',
          overflowY: 'auto',
          visibility: 'visible',
          zIndex: 100,
        });
        return;
      }

      const anchor = anchorRef.current;
      const popover = popoverRef.current;
      if (!anchor || !popover) return;

      const anchorRect = anchor.getBoundingClientRect();
      const popoverRect = popover.getBoundingClientRect();

      let left = anchorRect.right - popoverRect.width;
      left = Math.min(left, window.innerWidth - popoverRect.width - viewportPadding);
      left = Math.max(left, viewportPadding);

      const spaceAbove = anchorRect.top - viewportPadding;
      const spaceBelow = window.innerHeight - anchorRect.bottom - viewportPadding;
      const placeAbove =
        popoverRect.height <= spaceAbove || (spaceAbove >= spaceBelow && spaceAbove >= 160);

      let top = placeAbove ? anchorRect.top - popoverRect.height - gap : anchorRect.bottom + gap;
      top = Math.max(
        viewportPadding,
        Math.min(top, window.innerHeight - popoverRect.height - viewportPadding)
      );

      setStyle({
        position: 'fixed',
        left,
        top,
        minWidth: 260,
        maxWidth: `calc(100vw - ${viewportPadding * 2}px)`,
        maxHeight: `calc(100dvh - ${viewportPadding * 2}px)`,
        overflowY: 'auto',
        visibility: 'visible',
        zIndex: 100,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, devices, isCoarsePointer, needsPermission]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current?.contains(e.target as Node) ||
        anchorRef.current?.contains(e.target as Node)
      )
        return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [anchorRef, onClose]);

  const getLabel = (device: { deviceId: string; label: string }) => {
    if (device.deviceId === 'default') return t('audio.input.default');
    return device.label || t('audio.input.unknown');
  };

  const noiseReductionOptions: AudioInputNoiseReductionLevel[] = ['off', 'standard', 'high'];

  return createPortal(
    <div
      ref={popoverRef}
      style={style}
      className={[
        'bg-surface-1 border border-border-2 shadow-lg py-1.5 px-1.5 flex flex-col gap-0.5',
        isCoarsePointer ? 'rounded-none pt-[env(safe-area-inset-top)]' : 'rounded-md',
      ].join(' ')}
    >
      <div className="flex items-center justify-between px-2 pt-0.5 pb-1.5">
        <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
          {t('audio.input.title')}
        </p>
        {isCoarsePointer && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-2"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {devices.length === 0 && (
        <p className="text-xs text-text-3 px-2 py-1">{t('audio.input.noDevices')}</p>
      )}

      {devices.map((device) => {
        const active = device.deviceId === selectedDeviceId;
        return (
          <button
            key={device.deviceId}
            type="button"
            onClick={() => {
              selectDevice(device.deviceId);
              onClose();
            }}
            className={[
              'flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-left',
              'text-sm font-body font-medium transition-colors cursor-pointer',
              active
                ? 'text-text-1 bg-surface-2'
                : 'text-text-2 hover:bg-surface-2 hover:text-text-1',
            ].join(' ')}
          >
            <MicVocal size={13} className="shrink-0 text-text-3" />
            <span className="flex-1 truncate">{getLabel(device)}</span>
            {active && <Check size={13} className="shrink-0 text-primary" />}
          </button>
        );
      })}

      {needsPermission && (
        <button
          type="button"
          disabled={requesting}
          onClick={async () => {
            setRequesting(true);
            await requestPermission();
            setRequesting(false);
          }}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-left text-xs font-body font-medium text-text-3 hover:bg-surface-2 hover:text-text-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          <Mic size={12} className="shrink-0" />
          <span>{requesting ? t('audio.input.requesting') : t('audio.input.grantAccess')}</span>
        </button>
      )}

      <div className="mt-1 border-t border-border-2 pt-1.5">
        <div className="flex items-center gap-2 px-2 pb-1">
          <SlidersHorizontal size={13} className="shrink-0 text-text-3" />
          <p className="text-xs font-semibold text-text-3 uppercase tracking-wider">
            {t('audio.input.noiseReduction.title')}
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label={t('audio.input.noiseReduction.title')}
          className="grid grid-cols-3 gap-1 rounded-sm bg-surface-2 p-1"
        >
          {noiseReductionOptions.map((level) => (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={noiseReductionLevel === level}
              onClick={() => setNoiseReductionLevel(level)}
              className={[
                'min-w-0 rounded-sm px-1.5 py-1 text-xs font-body font-medium transition-colors cursor-pointer',
                noiseReductionLevel === level
                  ? 'bg-surface-1 text-text-1 shadow-sm'
                  : 'text-text-3 hover:text-text-2',
              ].join(' ')}
            >
              {t(`audio.input.noiseReduction.levels.${level}`)}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
