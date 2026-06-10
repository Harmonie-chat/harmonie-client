import { useRef } from 'react';
import { Pencil, Pin, PinOff, Reply, SmilePlus, Trash2 } from 'lucide-react';
import { IconButton } from '@harmonie/ui';

interface MessageActionsProps {
  availability: {
    canEdit: boolean;
    canDelete: boolean;
    canPin: boolean;
    canReact: boolean;
    canReply: boolean;
  };
  state: {
    isPinned: boolean;
  };
  labels: {
    edit: string;
    delete: string;
    pin: string;
    unpin: string;
    react: string;
    reply: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  onPinToggle: () => void;
  onPickerOpen: (rect: DOMRect) => void;
  onReply: () => void;
}

export const MessageActions = ({
  availability,
  state,
  labels,
  onEdit,
  onDelete,
  onPinToggle,
  onPickerOpen,
  onReply,
}: MessageActionsProps) => {
  const reactButtonRef = useRef<HTMLDivElement>(null);
  const { canEdit, canDelete, canPin, canReact, canReply } = availability;

  if (!canEdit && !canDelete && !canPin && !canReact && !canReply) return null;

  const visibleActionCount = [canReply, canReact, canPin, canEdit, canDelete].filter(
    Boolean
  ).length;
  const singleActionTooltipSide = visibleActionCount === 1 ? 'left' : undefined;

  const handleReactClick = () => {
    const rect = reactButtonRef.current?.getBoundingClientRect();
    if (rect) onPickerOpen(rect);
  };

  return (
    <div className="absolute right-2 -top-3 hidden gap-0.5 rounded-full border border-border-2 bg-surface-1 p-0.5 opacity-0 shadow-sm transition-opacity z-10 group-hover:opacity-100 md:flex">
      {canReply && (
        <IconButton
          size="medium"
          title={labels.reply}
          tooltipSide={singleActionTooltipSide}
          onClick={onReply}
        >
          <Reply size={16} />
        </IconButton>
      )}
      {canReact && (
        <div ref={reactButtonRef}>
          <IconButton
            size="medium"
            title={labels.react}
            tooltipSide={singleActionTooltipSide}
            onClick={handleReactClick}
          >
            <SmilePlus size={16} />
          </IconButton>
        </div>
      )}
      {canPin && (
        <IconButton
          size="medium"
          title={state.isPinned ? labels.unpin : labels.pin}
          tooltipSide={singleActionTooltipSide}
          onClick={onPinToggle}
        >
          {state.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        </IconButton>
      )}
      {canEdit && (
        <IconButton
          size="medium"
          title={labels.edit}
          tooltipSide={singleActionTooltipSide}
          onClick={onEdit}
        >
          <Pencil size={16} />
        </IconButton>
      )}
      {canDelete && (
        <IconButton size="medium" title={labels.delete} onClick={onDelete}>
          <Trash2 size={16} />
        </IconButton>
      )}
    </div>
  );
};
