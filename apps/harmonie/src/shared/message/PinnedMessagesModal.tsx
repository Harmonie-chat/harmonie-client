import { useEffect, useState } from 'react';
import { Button, Modal } from '@harmonie/ui';
import type { PinnedMessage, PinnedMessageList } from '@/types/channel';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import { PinnedMessageRow } from './PinnedMessageRow';

interface PinnedMessagesModalProps {
  entityId: string;
  title: string;
  emptyLabel: string;
  errorLabel: string;
  loadingLabel: string;
  loadMoreLabel: string;
  closeLabel: string;
  fetchPinnedMessages: (entityId: string, cursor?: string | null) => Promise<PinnedMessageList>;
  authorMap?: ReadonlyMap<string, MessageAuthor>;
  onMessageSelected: (messageId: string) => Promise<void> | void;
  onMessageUnpinned: (messageId: string) => Promise<void> | void;
  onClose: () => void;
}

interface PinnedMessagesState {
  entityId: string;
  items: PinnedMessage[];
  nextCursor: string | null;
  error: boolean;
}

const EMPTY_PINNED_MESSAGES: PinnedMessage[] = [];

export const PinnedMessagesModal = ({
  entityId,
  title,
  emptyLabel,
  errorLabel,
  loadingLabel,
  loadMoreLabel,
  closeLabel,
  fetchPinnedMessages,
  authorMap,
  onMessageSelected,
  onMessageUnpinned,
  onClose,
}: PinnedMessagesModalProps) => {
  const [state, setState] = useState<PinnedMessagesState>({
    entityId: '',
    items: EMPTY_PINNED_MESSAGES,
    nextCursor: null,
    error: false,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const isCurrent = state.entityId === entityId;
  const items = isCurrent ? state.items : EMPTY_PINNED_MESSAGES;
  const nextCursor = isCurrent ? state.nextCursor : null;
  const error = isCurrent ? state.error : false;
  const loading = !isCurrent;

  const loadPage = async (cursor?: string | null) => {
    if (cursor) setLoadingMore(true);
    try {
      const data = await fetchPinnedMessages(entityId, cursor);
      setState((prev) => ({
        entityId,
        items: cursor && prev.entityId === entityId ? [...prev.items, ...data.items] : data.items,
        nextCursor: data.nextCursor,
        error: false,
      }));
    } catch {
      setState((prev) => ({
        entityId,
        items: cursor && prev.entityId === entityId ? prev.items : [],
        nextCursor: cursor && prev.entityId === entityId ? prev.nextCursor : null,
        error: true,
      }));
    }
    setLoadingMore(false);
  };

  useEffect(() => {
    let active = true;
    fetchPinnedMessages(entityId)
      .then((data) => {
        if (!active) return;
        setState({
          entityId,
          items: data.items,
          nextCursor: data.nextCursor,
          error: false,
        });
      })
      .catch(() => {
        if (!active) return;
        setState({ entityId, items: [], nextCursor: null, error: true });
      });
    return () => {
      active = false;
    };
  }, [entityId, fetchPinnedMessages]);

  const seen = new Set<string>();
  const dedupedItems = items.filter((item) => {
    if (seen.has(item.messageId)) return false;
    seen.add(item.messageId);
    return true;
  });

  const handleSelect = async (messageId: string) => {
    await onMessageSelected(messageId);
    onClose();
  };

  const handleUnpin = async (messageId: string) => {
    await onMessageUnpinned(messageId);
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.messageId !== messageId),
    }));
  };

  return (
    <Modal title={title} closeLabel={closeLabel} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-8 text-center text-sm text-text-3">{loadingLabel}</div>
      ) : error ? (
        <div className="py-8 text-center text-sm text-error-fg">{errorLabel}</div>
      ) : dedupedItems.length === 0 ? (
        <div className="py-8 text-center text-sm text-text-3">{emptyLabel}</div>
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
          {dedupedItems.map((message) => (
            <PinnedMessageRow
              key={message.messageId}
              message={message}
              member={authorMap?.get(message.authorUserId)}
              onSelect={handleSelect}
              onUnpin={(messageId) => void handleUnpin(messageId)}
            />
          ))}
          {nextCursor && (
            <Button
              variant="tertiary"
              isLoading={loadingMore}
              onClick={() => void loadPage(nextCursor)}
            >
              {loadMoreLabel}
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
};
