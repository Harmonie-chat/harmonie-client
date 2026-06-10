import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RichTextMessageInput,
  type RichTextMentionOption,
  type RichTextMessageInputHandle,
} from '@harmonie/ui';
import { deleteFile, uploadFile } from '@/api/files';
import type { Message, ReplyPreview } from '@/types/channel';
import type { ApiError } from '@/types/error';
import { useMessageDraft } from './hooks/useMessageDraft';
import { useMessageFormattingPreference } from './hooks/useMessageFormattingPreference';
import { getMessagePayloadContent, stripHtmlToText } from './utils/messageHtml';
import { filterMentionedUserIdsFromContent } from './utils/mentions';
import { getRichTextMessageInputLabels } from './utils/richTextMessageInputLabels';
import { isCoarsePointerDevice, useCoarsePointer } from '@/shared/hooks/useCoarsePointer';
import { AttachmentPreviewList } from './AttachmentPreviewList';
import { ReplyPreviewBanner } from './ReplyPreviewBanner';

const MAX_LENGTH = 4000;
const TYPING_THROTTLE_MS = 4000;
const EMPTY_MENTION_OPTIONS: RichTextMentionOption[] = [];
const ACCEPTED_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
];

interface PendingAttachment {
  localId: string;
  file: File;
  fileId?: string;
  status: 'uploading' | 'done' | 'error';
  previewUrl?: string;
}

interface MessageComposerProps {
  draftKey?: string;
  sendFn: (
    content: string,
    attachmentFileIds: string[],
    replyToMessageId?: string | null,
    mentionedUserIds?: string[]
  ) => Promise<unknown>;
  onTypingStart?: () => void;
  latestEditableMessage?: Message | null;
  onEditingRequested?: (messageId: string) => void;
  replyTo?: ReplyPreview | null;
  onCancelReply?: () => void;
  mentionOptions?: RichTextMentionOption[];
}

export const MessageComposer = ({
  draftKey,
  sendFn,
  onTypingStart,
  latestEditableMessage = null,
  onEditingRequested,
  replyTo = null,
  onCancelReply,
  mentionOptions = EMPTY_MENTION_OPTIONS,
}: MessageComposerProps) => {
  const { t } = useTranslation();
  const { clearDraft, content, setContent } = useMessageDraft(draftKey);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { formattingOpen, toggleFormattingOpen } = useMessageFormattingPreference();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<RichTextMessageInputHandle>(null);
  const lastTypingSentRef = useRef<number>(0);
  const activePreviewUrlsRef = useRef<Set<string>>(null!);
  const selectedMentionIdsRef = useRef<Set<string>>(null!);
  if (activePreviewUrlsRef.current === null) {
    activePreviewUrlsRef.current = new Set();
  }
  if (selectedMentionIdsRef.current === null) {
    selectedMentionIdsRef.current = new Set();
  }
  const inputLabels = getRichTextMessageInputLabels(t);
  const isCoarsePointer = useCoarsePointer();
  const mentionMap = new Map(mentionOptions.map((mention) => [mention.userId, mention]));

  const textContent = stripHtmlToText(content);
  const payloadContent = getMessagePayloadContent(content);
  const isOverLimit = payloadContent.length > MAX_LENGTH;
  const trimmedContent = textContent.trim();
  const isUploading = pendingAttachments.some((a) => a.status === 'uploading');
  const doneAttachments = pendingAttachments.filter((a) => a.status === 'done');
  const canSend =
    !sending && !isOverLimit && (!!trimmedContent || (doneAttachments.length > 0 && !isUploading));
  useEffect(() => {
    const activePreviewUrls = activePreviewUrlsRef.current;
    return () => {
      activePreviewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      activePreviewUrls.clear();
    };
  }, []);

  useEffect(() => {
    if (!replyTo || isCoarsePointer || isCoarsePointerDevice()) return;
    window.setTimeout(() => inputRef.current?.focus('end'), 0);
  }, [isCoarsePointer, replyTo]);

  const handleChange = (value: string) => {
    setContent(value);
    if (onTypingStart && stripHtmlToText(value)) {
      const now = Date.now();
      if (now - lastTypingSentRef.current > TYPING_THROTTLE_MS) {
        lastTypingSentRef.current = now;
        onTypingStart();
      }
    }
  };

  const handleMentionSelected = (mention: RichTextMentionOption) => {
    selectedMentionIdsRef.current = new Set(selectedMentionIdsRef.current).add(mention.userId);
  };

  const addFiles = (files: File[]) => {
    const accepted = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (!accepted.length) return;

    const newAttachments: PendingAttachment[] = accepted.map((file) => {
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      if (previewUrl) activePreviewUrlsRef.current.add(previewUrl);
      return {
        localId: `${Date.now()}-${Math.random()}`,
        file,
        status: 'uploading',
        previewUrl,
      };
    });

    setPendingAttachments((prev) => [...prev, ...newAttachments]);

    newAttachments.forEach((attachment) => {
      uploadFile(attachment.file)
        .then((uploaded) => {
          setPendingAttachments((prev) =>
            prev.map((a) =>
              a.localId === attachment.localId
                ? { ...a, fileId: uploaded.fileId, status: 'done' }
                : a
            )
          );
        })
        .catch(() => {
          setPendingAttachments((prev) =>
            prev.map((a) => (a.localId === attachment.localId ? { ...a, status: 'error' } : a))
          );
          setError(t('channel.input.uploadError'));
        });
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    addFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeAttachment = (localId: string) => {
    setPendingAttachments((prev) => {
      const attachment = prev.find((a) => a.localId === localId);
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
        activePreviewUrlsRef.current.delete(attachment.previewUrl);
      }
      if (attachment?.fileId) deleteFile(attachment.fileId).catch(() => {});
      return prev.filter((a) => a.localId !== localId);
    });
  };

  const submit = async () => {
    if (!canSend) return;

    setSending(true);
    setError(undefined);

    const attachmentFileIds = doneAttachments.map((a) => a.fileId!);
    const mentionedUserIds = filterMentionedUserIdsFromContent(
      content,
      selectedMentionIdsRef.current,
      mentionMap
    );

    try {
      await sendFn(payloadContent, attachmentFileIds, replyTo?.messageId ?? null, mentionedUserIds);
      clearDraft();
      selectedMentionIdsRef.current = new Set();
      onCancelReply?.();
      setPendingAttachments((prev) => {
        prev.forEach((a) => {
          if (a.previewUrl) {
            URL.revokeObjectURL(a.previewUrl);
            activePreviewUrlsRef.current.delete(a.previewUrl);
          }
        });
        return [];
      });
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === 'MESSAGE_MENTIONED_USER_NOT_FOUND') {
        setError(t('channel.input.mentionUserNotFound'));
      } else if (apiError.code === 'MESSAGE_MENTIONED_USER_NOT_MEMBER') {
        setError(t('channel.input.mentionUserNotMember'));
      } else {
        setError(t('channel.input.error'));
      }
    }
    setSending(false);
  };

  return (
    <div className="flex min-w-0 w-full pt-2 self-end">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        aria-label={t('channel.input.attachFile')}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className={`min-w-0 flex-1 rounded-md transition-colors ${isDragOver ? 'ring-2 ring-primary' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {replyTo && <ReplyPreviewBanner replyTo={replyTo} onCancelReply={onCancelReply} />}
        <AttachmentPreviewList
          attachments={pendingAttachments}
          onRemoveAttachment={removeAttachment}
        />
        <RichTextMessageInput
          ref={inputRef}
          value={content}
          onChange={handleChange}
          placeholder={t('channel.input.placeholder')}
          disabled={sending}
          error={
            isOverLimit
              ? t('channel.input.tooLong', { max: MAX_LENGTH, count: payloadContent.length })
              : error
          }
          onSubmit={() => void submit()}
          onArrowUpWhenEmpty={
            latestEditableMessage
              ? () => onEditingRequested?.(latestEditableMessage.messageId)
              : undefined
          }
          onPasteFiles={addFiles}
          onAttachClick={() => fileInputRef.current?.click()}
          mentionOptions={mentionOptions}
          onMentionSelected={handleMentionSelected}
          showFormattingTools={formattingOpen}
          onToggleFormattingTools={toggleFormattingOpen}
          autoFocus={!isCoarsePointer && !isCoarsePointerDevice()}
          autoFocusPlacement="end"
          submitDisabled={!canSend}
          labels={inputLabels}
        />
      </div>
    </div>
  );
};
