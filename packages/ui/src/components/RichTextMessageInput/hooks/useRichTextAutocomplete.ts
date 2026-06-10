import { useRef, useState, type RefObject } from 'react';
import Quill from 'quill';
import {
  getAutocompleteResults,
  getPartialMatchLength,
  type AutocompleteResult,
} from '../../EmojiTextarea/emojiReplacer';
import type { QuillRange } from '../types';

export const useRichTextAutocomplete = (editorHostRef: RefObject<HTMLDivElement | null>) => {
  const [autocompleteResults, setAutocompleteResults] = useState<AutocompleteResult[]>([]);
  const [autocompleteSelectedIndex, setAutocompleteSelectedIndex] = useState(0);
  const [autocompletePos, setAutocompletePos] = useState<{
    bottom: number;
    left: number;
    width: number;
  } | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const clearAutocomplete = () => {
    setAutocompleteResults([]);
    setAutocompletePos(null);
  };

  const updateAutocomplete = (quill: Quill, range: QuillRange) => {
    if (!range) {
      clearAutocomplete();
      return;
    }

    const textBeforeCursor = quill.getText(0, range.index);
    const nextResults = getAutocompleteResults(textBeforeCursor);
    if (nextResults.length === 0) {
      clearAutocomplete();
      return;
    }

    const hostRect = editorHostRef.current?.getBoundingClientRect();
    const editorWrapperRect =
      editorHostRef.current?.parentElement?.getBoundingClientRect() ?? hostRect;

    setAutocompleteResults(nextResults);
    setAutocompleteSelectedIndex((current) => Math.min(current, nextResults.length - 1));
    setAutocompletePos({
      bottom: window.innerHeight - (editorWrapperRect?.top ?? 0) + 8,
      left: editorWrapperRect?.left ?? 0,
      width: Math.max(editorWrapperRect?.width ?? 0, 220),
    });
  };

  const handleSelectAutocomplete = (quill: Quill, result: AutocompleteResult) => {
    const range = quill.getSelection();
    if (!range) return;

    const textBeforeCursor = quill.getText(0, range.index);
    const matchLength = getPartialMatchLength(textBeforeCursor);
    if (matchLength <= 0) return;

    quill.deleteText(range.index - matchLength, matchLength, 'api');
    quill.insertText(range.index - matchLength, result.emoji, 'api');
    quill.setSelection(range.index - matchLength + result.emoji.length, 0, 'silent');
    clearAutocomplete();
  };

  return {
    autocompletePos,
    autocompleteRef,
    autocompleteResults,
    autocompleteSelectedIndex,
    clearAutocomplete,
    handleSelectAutocomplete,
    setAutocompleteSelectedIndex,
    updateAutocomplete,
  };
};
