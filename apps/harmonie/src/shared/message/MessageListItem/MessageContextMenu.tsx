import { useState } from 'react';
import type { EmojiClickData } from 'emoji-picker-react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Download,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Reply,
  SmilePlus,
  Trash2,
} from 'lucide-react';
import { ContextMenu, EmojiPickerBase } from '@harmonie/ui';
import { useFileDownload } from '@/shared/hooks/useFileDownload';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export interface MessageMenuState {
  messageId: string;
  position: { x: number; y: number };
  horizontalAnchor?: 'left' | 'right';
  imageAttachment?: {
    fileId: string;
    fileName: string;
  };
  isPinned: boolean;
  canReply: boolean;
  canReact: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface MessageContextMenuProps {
  menu: MessageMenuState | null;
  onClose: () => void;
  onReply: (messageId: string) => void;
  onReact: (messageId: string, value: string | { x: number; y: number }) => void;
  onEdit: (messageId: string) => void;
  onDelete: (messageId: string) => void;
  onPinToggle: (messageId: string, isPinned: boolean) => void;
}

export const MessageContextMenu = ({
  menu,
  onClose,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPinToggle,
}: MessageContextMenuProps) => {
  const { t } = useTranslation();
  const { download } = useFileDownload();
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null);
  const showEmojiPicker = menu !== null && emojiPickerMessageId === menu.messageId;

  if (!menu) return null;

  const imageAttachment = menu.imageAttachment;

  const handleEmojiClick = (data: EmojiClickData) => {
    onReact(menu.messageId, data.emoji);
    onClose();
  };

  return (
    <ContextMenu
      position={menu.position}
      onClose={onClose}
      horizontalAnchor={menu.horizontalAnchor}
      touchExpanded={showEmojiPicker}
      touchHeader={
        menu.canReact ? (
          <div
            className={
              showEmojiPicker
                ? 'flex h-[calc(82dvh_-_env(safe-area-inset-bottom))] min-h-0 flex-col'
                : 'mb-2 border-b border-border-2 pb-3'
            }
          >
            {showEmojiPicker ? (
              <>
                <div className="mb-3 flex items-center gap-3">
                  <button
                    type="button"
                    className="flex size-10 items-center justify-center rounded-md bg-surface-2 text-text-2"
                    aria-label={t('common.close')}
                    onClick={() => setEmojiPickerMessageId(null)}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <span className="text-sm font-semibold text-text-1">
                    {t('channel.messages.react')}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-border-2">
                  <EmojiPickerBase
                    width="100%"
                    height="100%"
                    lazyLoadEmojis={false}
                    searchPlaceholder={t('channel.input.emojiSearchPlaceholder')}
                    onEmojiClick={handleEmojiClick}
                  />
                </div>
              </>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="flex h-11 items-center justify-center rounded-md bg-surface-2 text-2xl transition-colors active:bg-surface-3"
                    onClick={() => {
                      onReact(menu.messageId, emoji);
                      onClose();
                    }}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="flex h-11 items-center justify-center rounded-md bg-surface-2 text-text-2 transition-colors active:bg-surface-3"
                  aria-label={t('channel.messages.react')}
                  onClick={() => setEmojiPickerMessageId(menu.messageId)}
                >
                  <Plus size={20} />
                </button>
              </div>
            )}
          </div>
        ) : undefined
      }
      items={[
        ...(menu.canReply
          ? [
              {
                label: t('channel.messages.reply'),
                icon: <Reply size={14} />,
                onClick: () => onReply(menu.messageId),
              },
            ]
          : []),
        ...(menu.canReact
          ? [
              {
                label: t('channel.messages.react'),
                icon: <SmilePlus size={14} />,
                hideOnTouch: true,
                onClick: () => onReact(menu.messageId, menu.position),
              },
            ]
          : []),
        ...(imageAttachment
          ? [
              {
                label: t('channel.messages.downloadImage'),
                icon: <Download size={14} />,
                onClick: () => void download(imageAttachment.fileId, imageAttachment.fileName),
              },
            ]
          : []),
        ...(menu.canEdit
          ? [
              {
                label: t('channel.messages.edit'),
                icon: <Pencil size={14} />,
                onClick: () => onEdit(menu.messageId),
              },
            ]
          : []),
        {
          label: menu.isPinned ? t('channel.messages.unpin') : t('channel.messages.pin'),
          icon: menu.isPinned ? <PinOff size={14} /> : <Pin size={14} />,
          onClick: () => onPinToggle(menu.messageId, !menu.isPinned),
        },
        ...(menu.canDelete
          ? [
              {
                label: t('channel.messages.delete'),
                icon: <Trash2 size={14} />,
                onClick: () => onDelete(menu.messageId),
              },
            ]
          : []),
      ]}
    />
  );
};
