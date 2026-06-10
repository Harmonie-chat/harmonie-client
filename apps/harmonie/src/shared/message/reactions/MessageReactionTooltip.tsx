import { createPortal } from 'react-dom';
import type { MessageReaction, MessageReactionUser } from '@/types/channel';

interface MessageReactionTooltipProps {
  id: string;
  reaction: MessageReaction;
  users: MessageReactionUser[];
  style: {
    left: number;
    top: number;
  };
  sentence: string;
  emptyLabel: string;
  canOpenDetails: boolean;
  onOpenDetails: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const MessageReactionTooltip = ({
  id,
  reaction,
  users,
  style,
  sentence,
  emptyLabel,
  canOpenDetails,
  onOpenDetails,
  onMouseEnter,
  onMouseLeave,
}: MessageReactionTooltipProps) =>
  createPortal(
    canOpenDetails ? (
      <button
        id={id}
        type="button"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onOpenDetails}
        className="fixed z-[9999] flex w-max min-w-40 max-w-64 -translate-x-1/2 -translate-y-full cursor-pointer items-center gap-2 rounded-md border border-border-2 bg-surface-1 px-3 py-2 text-left shadow-lg"
        style={style}
      >
        <span className="text-2xl leading-none">{reaction.emoji}</span>
        {users.length > 0 ? (
          <span className="text-xs text-text-2">{sentence}</span>
        ) : (
          <span className="mt-1 block text-xs text-text-3">{emptyLabel}</span>
        )}
      </button>
    ) : (
      <div
        id={id}
        role="tooltip"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="pointer-events-none fixed z-[9999] flex w-max min-w-40 max-w-64 -translate-x-1/2 -translate-y-full items-center gap-2 rounded-md border border-border-2 bg-surface-1 px-3 py-2 text-left shadow-lg"
        style={style}
      >
        <span className="text-2xl leading-none">{reaction.emoji}</span>
        {users.length > 0 ? (
          <span className="text-xs text-text-2">{sentence}</span>
        ) : (
          <span className="mt-1 block text-xs text-text-3">{emptyLabel}</span>
        )}
      </div>
    ),
    document.body
  );
