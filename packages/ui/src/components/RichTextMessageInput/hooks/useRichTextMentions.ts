import { useRef, useState, type RefObject } from 'react';
import Quill from 'quill';
import type { QuillRange, RichTextMentionOption } from '../types';

const PARTIAL_MENTION_RE = /(?:^|\s)@([\p{L}\p{N}_.-]{0,32})$/u;

export const useRichTextMentions = (
  editorHostRef: RefObject<HTMLDivElement | null>,
  mentionOptions: RichTextMentionOption[],
  onMentionSelected?: (mention: RichTextMentionOption) => void
) => {
  const [mentionResults, setMentionResults] = useState<RichTextMentionOption[]>([]);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionPos, setMentionPos] = useState<{
    bottom: number;
    left: number;
    width: number;
  } | null>(null);
  const mentionRef = useRef<HTMLDivElement>(null);

  const clearMentions = () => {
    setMentionResults([]);
    setMentionPos(null);
  };

  const updateMentions = (quill: Quill, range: QuillRange) => {
    if (!range) {
      clearMentions();
      return;
    }

    const textBeforeCursor = quill.getText(0, range.index);
    const match = textBeforeCursor.match(PARTIAL_MENTION_RE);
    if (!match) {
      clearMentions();
      return;
    }

    const query = match[1].toLocaleLowerCase();
    const nextResults = mentionOptions
      .filter((mention) => {
        const label = mention.displayName ?? mention.username;
        return (
          label.toLocaleLowerCase().includes(query) ||
          mention.username.toLocaleLowerCase().includes(query)
        );
      })
      .slice(0, 8);

    if (nextResults.length === 0) {
      clearMentions();
      return;
    }

    const hostRect = editorHostRef.current?.getBoundingClientRect();
    const editorWrapperRect =
      editorHostRef.current?.parentElement?.getBoundingClientRect() ?? hostRect;

    setMentionResults(nextResults);
    setMentionSelectedIndex((current) => Math.min(current, nextResults.length - 1));
    setMentionPos({
      bottom: window.innerHeight - (editorWrapperRect?.top ?? 0) + 8,
      left: editorWrapperRect?.left ?? 0,
      width: Math.max(editorWrapperRect?.width ?? 0, 240),
    });
  };

  const handleSelectMention = (quill: Quill, mention: RichTextMentionOption) => {
    const range = quill.getSelection();
    if (!range) return;

    const textBeforeCursor = quill.getText(0, range.index);
    const match = textBeforeCursor.match(PARTIAL_MENTION_RE);
    if (!match) return;

    const matchLength = match[0].startsWith(' ') ? match[0].length - 1 : match[0].length;
    const start = range.index - matchLength;
    const label = mention.displayName ?? mention.username;

    quill.deleteText(start, matchLength, 'api');
    quill.insertText(start, `@${label}`, { mention: mention.userId }, 'api');
    quill.insertText(start + label.length + 1, ' ', { mention: false }, 'api');
    quill.setSelection(start + label.length + 2, 0, 'api');
    quill.format('mention', false, 'api');
    onMentionSelected?.(mention);
    clearMentions();
  };

  return {
    clearMentions,
    handleSelectMention,
    mentionPos,
    mentionRef,
    mentionResults,
    mentionSelectedIndex,
    setMentionSelectedIndex,
    updateMentions,
  };
};
