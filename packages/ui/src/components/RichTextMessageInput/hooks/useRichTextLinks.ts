import { useRef, useState } from 'react';
import Quill from 'quill';
import { getExpandedLinkRange, normalizeUrl } from '../utils/links.utils';
import type { QuillRange } from '../types';

export const useRichTextLinks = () => {
  const [linkBubble, setLinkBubble] = useState<{ url: string; top: number; left: number } | null>(
    null
  );
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const linkSelectionRef = useRef<QuillRange>(null);
  const linkBubbleRangeRef = useRef<QuillRange>(null);

  const clearLinkBubble = () => {
    linkBubbleRangeRef.current = null;
    setLinkBubble(null);
  };

  const showLinkBubble = (quill: Quill, range: QuillRange, selectLink = false) => {
    if (!range) {
      clearLinkBubble();
      return;
    }

    const formats = quill.getFormat(range.index, 1);
    const url = typeof formats.link === 'string' ? formats.link : '';
    if (!url) {
      clearLinkBubble();
      return;
    }

    const linkRange = getExpandedLinkRange(quill, { index: range.index, length: 0 }, url);
    const startBounds = quill.getBounds(linkRange.index) ?? {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
    };
    const endIndex = Math.max(linkRange.index + Math.max(linkRange.length - 1, 0), linkRange.index);
    const endBounds = quill.getBounds(endIndex) ?? startBounds;
    const centerLeft = startBounds.left + (endBounds.left + endBounds.width - startBounds.left) / 2;

    linkBubbleRangeRef.current = linkRange;
    if (selectLink) {
      quill.setSelection(linkRange.index, linkRange.length, 'silent');
    }
    setLinkBubble({
      url,
      top: startBounds.top - 32,
      left: centerLeft,
    });
  };

  const updateLinkBubble = (quill: Quill, range: QuillRange) => {
    if (!range || range.length > 0) {
      clearLinkBubble();
      return;
    }

    showLinkBubble(quill, range);
  };

  const closeLinkDialog = () => {
    setLinkDialogOpen(false);
    setLinkText('');
    setLinkUrl('');
    linkSelectionRef.current = null;
  };

  const openLinkDialog = (quill: Quill) => {
    const range = quill.getSelection(true);
    if (!range) return;

    const formats = quill.getFormat(range);
    const currentLink = typeof formats.link === 'string' ? formats.link : '';
    const nextRange = currentLink ? getExpandedLinkRange(quill, range, currentLink) : range;
    const selectedText =
      nextRange.length > 0
        ? quill.getText(nextRange.index, nextRange.length).replace(/\n$/, '')
        : '';

    linkSelectionRef.current = nextRange;
    setLinkText(selectedText || currentLink);
    setLinkUrl(currentLink);
    setLinkDialogOpen(true);
  };

  const submitLinkDialog = (quill: Quill | null) => {
    const range = linkSelectionRef.current;
    const normalizedUrl = normalizeUrl(linkUrl);
    const trimmedText = linkText.trim();
    if (!quill || !range || !normalizedUrl || !trimmedText) return;

    quill.focus();
    if (range.length > 0) {
      quill.deleteText(range.index, range.length, 'user');
    }
    quill.insertText(range.index, trimmedText, { link: normalizedUrl }, 'user');
    quill.setSelection(range.index + trimmedText.length, 0, 'silent');
    closeLinkDialog();
  };

  const removeCurrentLink = (quill: Quill | null) => {
    const range = linkSelectionRef.current ?? linkBubbleRangeRef.current;
    if (!quill || !range || range.length <= 0) return;

    quill.focus();
    quill.formatText(range.index, range.length, 'link', false, 'user');
    quill.setSelection(range.index + range.length, 0, 'silent');
    clearLinkBubble();
    closeLinkDialog();
  };

  return {
    clearLinkBubble,
    closeLinkDialog,
    linkBubble,
    linkDialogOpen,
    linkText,
    linkUrl,
    openLinkDialog,
    removeCurrentLink,
    setLinkText,
    setLinkUrl,
    showLinkBubble,
    submitLinkDialog,
    updateLinkBubble,
  };
};
