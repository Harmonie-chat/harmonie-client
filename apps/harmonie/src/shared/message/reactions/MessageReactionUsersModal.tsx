import { Button, Modal } from '@harmonie/ui';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import type { MessageReaction, MessageReactionUser } from '@/types/channel';
import { MessageReactionUserRow } from './MessageReactionUserRow';

interface MessageReactionUsersModalProps {
  reactions: MessageReaction[];
  selectedReaction: MessageReaction;
  users: MessageReactionUser[];
  reactionUserMap?: ReadonlyMap<string, MessageAuthor>;
  loading: boolean;
  error: boolean;
  nextCursor: string | null;
  labels: {
    title: string;
    close: string;
    empty: string;
    loading: string;
    error: string;
    loadMore: string;
  };
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onLoadMore: () => void;
}

export const MessageReactionUsersModal = ({
  reactions,
  selectedReaction,
  users,
  reactionUserMap,
  loading,
  error,
  nextCursor,
  labels,
  onClose,
  onSelectEmoji,
  onLoadMore,
}: MessageReactionUsersModalProps) => (
  <Modal title={labels.title} closeLabel={labels.close} onClose={onClose} maxWidth="max-w-xl">
    <div className="grid h-[28rem] grid-cols-[128px_1fr] gap-4 overflow-hidden">
      <div className="flex min-h-0 flex-col gap-1 overflow-y-auto border-r border-border-2 pr-4">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            onClick={() => onSelectEmoji(reaction.emoji)}
            className={[
              'flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors cursor-pointer',
              reaction.emoji === selectedReaction.emoji
                ? 'bg-primary/20 text-text-1'
                : 'text-text-2 hover:bg-surface-2 hover:text-text-1',
            ].join(' ')}
          >
            <span className="text-lg leading-none">{reaction.emoji}</span>
            <span className="font-semibold">{reaction.count}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-0 min-w-0 flex-col gap-3">
        {error && <p className="text-sm text-error-fg">{labels.error}</p>}

        {!error && users.length === 0 && !loading && (
          <p className="text-sm text-text-3">{labels.empty}</p>
        )}

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {users.map((user) => (
            <MessageReactionUserRow
              key={user.userId}
              user={user}
              mappedUser={reactionUserMap?.get(user.userId)}
            />
          ))}
        </div>

        {loading && <p className="text-sm text-text-3">{labels.loading}</p>}

        {nextCursor && !loading && (
          <Button variant="secondary" onClick={onLoadMore}>
            {labels.loadMore}
          </Button>
        )}
      </div>
    </div>
  </Modal>
);
