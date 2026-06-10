import { Hash, Settings, Volume2 } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';
import { useLongPress, type LongPressPoint } from '../../hooks/useLongPress';

export type ChannelType = 'text' | 'voice';

export interface ChannelItemProps {
  type: ChannelType;
  label: string;
  active?: boolean;
  unread?: boolean;
  voiceActive?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onLongPress?: (position: LongPressPoint) => void;
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuLabel?: string;
}

export const ChannelItem = ({
  type,
  label,
  active = false,
  unread = false,
  voiceActive = false,
  onClick,
  onContextMenu,
  onLongPress,
  onMenuClick,
  menuLabel,
}: ChannelItemProps) => {
  const Icon = type === 'text' ? Hash : Volume2;
  const longPress = useLongPress(onLongPress);
  const baseStateClasses = active
    ? 'bg-secondary text-secondary-fg font-medium'
    : 'text-text-2 hover:bg-surface-3 hover:text-text-1';

  return (
    <div
      className={[
        'group flex items-center gap-1 rounded-sm px-1.5 h-9',
        baseStateClasses,
        unread && 'font-extrabold',
      ].join(' ')}
    >
      <button
        type="button"
        onClick={(e) => {
          if (longPress.consumeTriggeredPress(e)) return;
          onClick();
        }}
        onContextMenu={onContextMenu}
        {...longPress.eventHandlers}
        className={[
          'flex min-w-0 flex-1 items-center gap-2 text-sm font-body transition-colors text-left cursor-pointer h-9',
          voiceActive && 'font-medium',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span
          className={[
            'shrink-0 flex h-5 w-5 items-center justify-center rounded-full',
            unread && !active
              ? 'bg-primary/15 shadow-[0_0_14px_var(--color-primary),0_0_4px_var(--color-primary)]'
              : '',
          ].join(' ')}
        >
          <Icon
            size={16}
            className={[
              'shrink-0',
              active
                ? 'text-secondary-fg'
                : voiceActive || unread
                  ? 'text-primary drop-shadow-[0_0_8px_var(--color-primary)]'
                  : 'text-text-2',
            ].join(' ')}
            fill={voiceActive ? 'currentColor' : 'none'}
          />
        </span>
        <span className="truncate">{label}</span>
      </button>

      {onMenuClick && (
        <IconButton
          size="small"
          variant="overlay"
          aria-label={menuLabel}
          title={menuLabel}
          tooltipSide="right"
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick(e);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className={[
            'shrink-0 basis-7 min-w-7 min-h-7 transition-all',
            'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto focus:opacity-100 focus:pointer-events-auto',
            active ? 'text-secondary-fg hover:bg-secondary' : 'text-text-2',
          ].join(' ')}
        >
          <Settings size={14} className="shrink-0" />
        </IconButton>
      )}
    </div>
  );
};
