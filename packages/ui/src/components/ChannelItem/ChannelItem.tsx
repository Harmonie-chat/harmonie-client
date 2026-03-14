import { Hash, Volume2 } from 'lucide-react';

export type ChannelType = 'text' | 'voice';

export interface ChannelItemProps {
  type: ChannelType;
  label: string;
  active?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ChannelItem = ({
  type,
  label,
  active = false,
  onClick,
  onContextMenu,
}: ChannelItemProps) => {
  const Icon = type === 'text' ? Hash : Volume2;

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={[
        'flex items-center gap-2 w-full px-2 py-1 rounded-sm text-sm font-body transition-colors text-left cursor-pointer',
        active
          ? 'bg-surface-2 text-text-1 font-medium'
          : 'text-text-2 hover:bg-surface-2 hover:text-text-1 hover:bg-opacity-70',
      ].join(' ')}
    >
      <Icon size={16} className="shrink-0 text-text-3" />
      <span className="truncate">{label}</span>
    </button>
  );
};
