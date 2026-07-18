import { useState, type MouseEvent, type RefObject } from 'react';
import Quill from 'quill';
import type { QuillRange } from '../types';
import { isDirectUrl } from '../utils/links.utils';

interface RichTextContextMenuState {
  position: { x: number; y: number };
  range: Exclude<QuillRange, null>;
}

interface UseRichTextContextMenuParams {
  disabled: boolean;
  quillRef: RefObject<Quill | null>;
}

const getClipboard = () => (typeof navigator === 'undefined' ? undefined : navigator.clipboard);

export const useRichTextContextMenu = ({ disabled, quillRef }: UseRichTextContextMenuParams) => {
  const [contextMenu, setContextMenu] = useState<RichTextContextMenuState | null>(null);
  const clipboard = getClipboard();
  const canWriteToClipboard = typeof clipboard?.writeText === 'function';
  const canReadFromClipboard = typeof clipboard?.readText === 'function';
  const hasSelection = Boolean(contextMenu?.range.length);
  const hasContent = (quillRef.current?.getLength() ?? 1) > 1;

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const quill = quillRef.current;
    if (!quill) return;

    const range = quill.getSelection(true) ?? {
      index: Math.max(quill.getLength() - 1, 0),
      length: 0,
    };

    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      range,
    });
  };

  const copy = async () => {
    const quill = quillRef.current;
    const range = contextMenu?.range;
    if (!quill || !range || range.length === 0 || !canWriteToClipboard) return;

    try {
      await clipboard.writeText(quill.getText(range.index, range.length));
    } catch {
      // Clipboard access can be denied by the browser or the operating system.
    }
  };

  const cut = async () => {
    const quill = quillRef.current;
    const range = contextMenu?.range;
    if (disabled || !quill || !range || range.length === 0 || !canWriteToClipboard) return;

    const selectedText = quill.getText(range.index, range.length);
    try {
      await clipboard.writeText(selectedText);
    } catch {
      // Do not remove the selection when copying to the clipboard fails.
      return;
    }
    if (quillRef.current !== quill) return;

    quill.deleteText(range.index, range.length, 'user');
    quill.focus();
    quill.setSelection(range.index, 0, 'silent');
  };

  const paste = async () => {
    const quill = quillRef.current;
    const range = contextMenu?.range;
    if (disabled || !quill || !range || !canReadFromClipboard) return;

    let pastedText: string;
    try {
      pastedText = await clipboard.readText();
    } catch {
      // Clipboard access can be denied by the browser or the operating system.
      return;
    }
    if (!pastedText || quillRef.current !== quill) return;

    quill.focus();

    if (isDirectUrl(pastedText)) {
      const url = pastedText.trim();
      if (range.length > 0) {
        quill.formatText(range.index, range.length, 'link', url, 'user');
        quill.setSelection(range.index + range.length, 0, 'silent');
        return;
      }

      quill.insertText(range.index, url, { link: url }, 'user');
      quill.setSelection(range.index + url.length, 0, 'silent');
      return;
    }

    if (range.length > 0) {
      quill.deleteText(range.index, range.length, 'user');
    }
    quill.insertText(range.index, pastedText, 'user');
    quill.setSelection(range.index + pastedText.length, 0, 'silent');
  };

  const selectAll = () => {
    const quill = quillRef.current;
    if (!quill || !hasContent) return;

    quill.focus();
    quill.setSelection(0, quill.getLength() - 1, 'user');
  };

  return {
    canCopy: hasSelection && canWriteToClipboard,
    canCut: !disabled && hasSelection && canWriteToClipboard,
    canPaste: !disabled && canReadFromClipboard,
    canSelectAll: hasContent,
    closeContextMenu: () => setContextMenu(null),
    contextMenu,
    copy,
    cut,
    handleContextMenu,
    paste,
    selectAll,
  };
};
