import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import Quill from 'quill';
import {
  getEditorHtml,
  getPlainText,
  normalizeHtml,
  registerMentionBlot,
  registerQuillKeyboardBindings,
  toEditorHtml,
} from '../utils/editor.utils';
import { PICKER_HEIGHT, PICKER_OFFSET, PICKER_WIDTH } from '../utils/constants';
import { isDirectUrl } from '../utils/links.utils';
import type { ActiveFormats, QuillRange, RichTextMentionOption } from '../types';
import { resolveReplacement, type AutocompleteResult } from '../../EmojiTextarea/emojiReplacer';
import { useRichTextAutocomplete } from './useRichTextAutocomplete';
import { useRichTextLinks } from './useRichTextLinks';
import { useRichTextMentions } from './useRichTextMentions';

const INLINE_FORMATS_TO_CARRY = ['bold', 'italic', 'underline', 'strike', 'code'] as const;
const EMPTY_MENTION_OPTIONS: RichTextMentionOption[] = [];

interface EditorUiState {
  activeFormats: ActiveFormats;
  selectedRange: QuillRange;
  selectionToolbarDismissed: boolean;
}

type EditorUiAction =
  | { type: 'sync'; activeFormats: ActiveFormats; selectedRange: QuillRange }
  | { type: 'dismissSelectionToolbar' }
  | { type: 'setActiveFormats'; activeFormats: ActiveFormats }
  | { type: 'setSelectedRange'; selectedRange: QuillRange };

const editorUiReducer = (state: EditorUiState, action: EditorUiAction): EditorUiState => {
  switch (action.type) {
    case 'sync':
      return {
        activeFormats: action.activeFormats,
        selectedRange: action.selectedRange,
        selectionToolbarDismissed: false,
      };
    case 'dismissSelectionToolbar':
      return { ...state, selectionToolbarDismissed: true };
    case 'setActiveFormats':
      return { ...state, activeFormats: action.activeFormats };
    case 'setSelectedRange':
      return { ...state, selectedRange: action.selectedRange };
    default:
      return state;
  }
};

const isMobileInteractionDevice = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)').matches;

interface UseRichTextMessageInputParams {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  showFormattingTools: boolean;
  autoFocus?: boolean;
  autoFocusPlacement?: 'start' | 'end';
  onSubmit?: () => void;
  onEscape?: () => void;
  onArrowUpWhenEmpty?: () => void;
  onPasteFiles?: (files: File[]) => void;
  mentionOptions?: RichTextMentionOption[];
  onMentionSelected?: (mention: RichTextMentionOption) => void;
}

export const useRichTextMessageInput = ({
  value,
  onChange,
  placeholder,
  disabled,
  showFormattingTools,
  autoFocus = false,
  autoFocusPlacement = 'start',
  onSubmit,
  onEscape,
  onArrowUpWhenEmpty,
  onPasteFiles,
  mentionOptions = EMPTY_MENTION_OPTIONS,
  onMentionSelected,
}: UseRichTextMessageInputParams) => {
  const [emojiAnchorRect, setEmojiAnchorRect] = useState<DOMRect | null>(null);
  const [editorUiState, dispatchEditorUiState] = useReducer(editorUiReducer, {
    activeFormats: {},
    selectedRange: null,
    selectionToolbarDismissed: false,
  });
  const { activeFormats, selectedRange, selectionToolbarDismissed } = editorUiState;
  const setActiveFormats = (formats: ActiveFormats) =>
    dispatchEditorUiState({ type: 'setActiveFormats', activeFormats: formats });
  const setSelectedRange = (range: QuillRange) =>
    dispatchEditorUiState({ type: 'setSelectedRange', selectedRange: range });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const editorHostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const initialValueRef = useRef(value);
  const initialPlaceholderRef = useRef(placeholder);
  const initialDisabledRef = useRef(disabled);
  const initialAutoFocusRef = useRef(autoFocus);
  const initialAutoFocusPlacementRef = useRef(autoFocusPlacement);
  const lastKnownValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onEscapeRef = useRef(onEscape);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const {
    autocompletePos,
    autocompleteRef,
    autocompleteResults,
    autocompleteSelectedIndex,
    clearAutocomplete,
    handleSelectAutocomplete,
    setAutocompleteSelectedIndex,
    updateAutocomplete,
  } = useRichTextAutocomplete(editorHostRef);

  const {
    clearMentions,
    handleSelectMention,
    mentionPos,
    mentionRef,
    mentionResults,
    mentionSelectedIndex,
    setMentionSelectedIndex,
    updateMentions,
  } = useRichTextMentions(editorHostRef, mentionOptions, onMentionSelected);

  const {
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
  } = useRichTextLinks();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  const syncFromEditor = (quill: Quill) => {
    const nextValue = getEditorHtml(quill);
    lastKnownValueRef.current = nextValue;
    onChangeRef.current(nextValue);
  };

  useEffect(() => {
    if (!editorHostRef.current || quillRef.current) return;

    registerMentionBlot();

    const quill = new Quill(editorHostRef.current, {
      placeholder: initialPlaceholderRef.current,
      readOnly: initialDisabledRef.current,
      modules: {
        toolbar: false,
        history: {
          userOnly: true,
        },
      },
      formats: [
        'bold',
        'italic',
        'underline',
        'strike',
        'header',
        'blockquote',
        'code',
        'code-block',
        'list',
        'link',
        'mention',
      ],
    });

    registerQuillKeyboardBindings(quill);
    quillRef.current = quill;
    quill.clipboard.dangerouslyPasteHTML(toEditorHtml(initialValueRef.current), 'silent');
    const shouldAutoFocus = initialAutoFocusRef.current && !isMobileInteractionDevice();
    if (shouldAutoFocus) {
      const index =
        initialAutoFocusPlacementRef.current === 'end' ? Math.max(quill.getLength() - 1, 0) : 0;
      window.setTimeout(() => {
        quill.focus();
        quill.setSelection(index, 0, 'silent');
      }, 0);
    } else {
      window.setTimeout(() => {
        quill.blur();
        if (document.activeElement === quill.root) {
          quill.root.blur();
        }
      }, 0);
    }

    const syncEditorUiState = (range: QuillRange) => {
      dispatchEditorUiState({
        type: 'sync',
        selectedRange: range,
        activeFormats: range ? quill.getFormat(range) : {},
      });
      updateAutocomplete(quill, range);
      updateMentions(quill, range);
      clearLinkBubble();
    };

    const syncInitialEditorValue = () => {
      const nextValue = getEditorHtml(quill);
      lastKnownValueRef.current = nextValue;
      onChangeRef.current(nextValue);
    };

    const handleTextChange = (_delta: unknown, _oldDelta: unknown, source: string) => {
      const currentRange = quill.getSelection();
      if (source === 'user' && currentRange) {
        const textBeforeCursor = quill.getText(0, currentRange.index);
        const replacement = resolveReplacement(textBeforeCursor, currentRange.index);
        if (replacement) {
          quill.deleteText(replacement.start, replacement.length, 'api');
          quill.insertText(replacement.start, replacement.emoji, 'api');
          quill.setSelection(replacement.start + replacement.emoji.length, 0, 'silent');
        }
      }

      const nextRange = quill.getSelection();
      syncEditorUiState(nextRange);
      syncInitialEditorValue();
    };

    const handleSelectionChange = (range: QuillRange) => {
      syncEditorUiState(range);
    };

    quill.on('text-change', handleTextChange);
    quill.on('selection-change', handleSelectionChange);

    return () => {
      quill.off('text-change', handleTextChange);
      quill.off('selection-change', handleSelectionChange);
      quillRef.current = null;
    };
  }, [clearLinkBubble, updateAutocomplete, updateMentions]);

  useLayoutEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.enable(!disabled);
  }, [disabled]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.root.dataset.placeholder = placeholder;
  }, [placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const incomingValue = normalizeHtml(value);
    const knownValue = normalizeHtml(lastKnownValueRef.current);
    const currentEditorValue = normalizeHtml(getEditorHtml(quill));

    if (incomingValue === knownValue || incomingValue === currentEditorValue) {
      lastKnownValueRef.current = value;
      return;
    }

    const selection = quill.getSelection();
    quill.setText('', 'silent');
    quill.clipboard.dangerouslyPasteHTML(toEditorHtml(value), 'silent');
    if (selection) {
      const nextIndex = Math.min(selection.index, quill.getLength() - 1);
      quill.setSelection(Math.max(nextIndex, 0), selection.length, 'silent');
    }
    lastKnownValueRef.current = value;
    clearLinkBubble();
  }, [value, clearLinkBubble]);

  useEffect(() => {
    if (!emojiAnchorRect && autocompleteResults.length === 0 && mentionResults.length === 0) return;

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (emojiButtonRef.current?.contains(target)) return;
      const isInsideEmojiPicker = emojiPickerRef.current?.contains(target);
      const isInsideAutocomplete = autocompleteRef.current?.contains(target);
      const isInsideMentionAutocomplete = mentionRef.current?.contains(target);
      const isInsideWrapper = wrapperRef.current?.contains(target);

      if (emojiAnchorRect && !isInsideEmojiPicker) {
        setEmojiAnchorRect(null);
      }

      if (!isInsideAutocomplete && !isInsideMentionAutocomplete && !isInsideWrapper) {
        clearAutocomplete();
        clearMentions();
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setEmojiAnchorRect(null);
        clearAutocomplete();
        clearMentions();
        clearLinkBubble();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
    }, 0);

    document.addEventListener('keydown', handleEscape);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [
    autocompleteRef,
    autocompleteResults.length,
    clearAutocomplete,
    clearMentions,
    clearLinkBubble,
    emojiAnchorRect,
    mentionRef,
    mentionResults.length,
  ]);

  const handleInsertEmoji = (emoji: string) => {
    const quill = quillRef.current;
    const range = quill?.getSelection(true);
    if (!quill || !range) return;

    quill.insertText(range.index, emoji, 'user');
    quill.setSelection(range.index + emoji.length, 0, 'silent');
    setEmojiAnchorRect(null);
  };

  const handleEditorKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const quill = quillRef.current;
    if (!quill) return;

    if (event.key === 'Escape' && onEscapeRef.current) {
      event.preventDefault();
      onEscapeRef.current();
      return;
    }

    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && onSubmit) {
      event.preventDefault();
      onSubmit();
      return;
    }

    if (mentionResults.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMentionSelectedIndex((current) => (current + 1) % mentionResults.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setMentionSelectedIndex(
          (current) => (current - 1 + mentionResults.length) % mentionResults.length
        );
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const result = mentionResults[mentionSelectedIndex];
        if (result) handleSelectMention(quill, result);
        syncFromEditor(quill);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        clearMentions();
        return;
      }
    }

    if (autocompleteResults.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setAutocompleteSelectedIndex((current) => (current + 1) % autocompleteResults.length);
        return;
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setAutocompleteSelectedIndex(
          (current) => (current - 1 + autocompleteResults.length) % autocompleteResults.length
        );
        return;
      }

      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        const result = autocompleteResults[autocompleteSelectedIndex];
        if (result) handleSelectAutocomplete(quill, result);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        clearAutocomplete();
        return;
      }
    }

    const currentRange = quill.getSelection();
    if (event.key === 'Escape' && currentRange && currentRange.length > 0) {
      event.preventDefault();
      dispatchEditorUiState({ type: 'dismissSelectionToolbar' });
      return;
    }

    if (event.key === 'Escape' && linkBubble) {
      event.preventDefault();
      clearLinkBubble();
      return;
    }

    if (event.key === 'ArrowUp' && onArrowUpWhenEmpty && !getPlainText(quill)) {
      event.preventDefault();
      onArrowUpWhenEmpty();
      return;
    }

    if (event.key !== 'Enter') return;

    if (!event.shiftKey && onSubmit && !showFormattingTools && !isMobileInteractionDevice()) {
      event.preventDefault();
      onSubmit();
      return;
    }

    const inlineFormatsToCarry = INLINE_FORMATS_TO_CARRY.filter(
      (format) => !!currentRange && !!quill.getFormat(currentRange)[format]
    );
    if (inlineFormatsToCarry.length === 0) return;

    window.setTimeout(() => {
      const nextRange = quill.getSelection();
      if (!nextRange || nextRange.length > 0) return;

      inlineFormatsToCarry.forEach((format) => quill.format(format, true, 'user'));
      const nextFormats = quill.getFormat(nextRange);
      setActiveFormats(nextFormats);
      setSelectedRange(nextRange);
    }, 0);
  };

  const handleEditorPasteCapture = (event: ClipboardEvent<HTMLDivElement>) => {
    const files = Array.from(event.clipboardData.files ?? []);
    if (files.length) {
      if (!onPasteFiles) return;
      event.preventDefault();
      onPasteFiles(files);
      return;
    }

    const pastedText = event.clipboardData.getData('text/plain');
    if (!isDirectUrl(pastedText)) return;

    const quill = quillRef.current;
    const range = quill?.getSelection(true);
    if (!quill || !range) return;

    event.preventDefault();
    const url = pastedText.trim();

    if (range.length > 0) {
      quill.formatText(range.index, range.length, 'link', url, 'user');
      quill.setSelection(range.index + range.length, 0, 'silent');
      return;
    }

    quill.insertText(range.index, url, { link: url }, 'user');
    quill.setSelection(range.index + url.length, 0, 'silent');
  };

  const handleEditorMouseUp = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    const quill = quillRef.current;
    const range = quill?.getSelection();
    if (!quill || !range || range.length > 0) return;

    const formats = quill.getFormat(range.index, 1);
    if (typeof formats.link !== 'string') return;

    dispatchEditorUiState({ type: 'dismissSelectionToolbar' });
    showLinkBubble(quill, range, true);

    const nextRange = quill.getSelection();
    setSelectedRange(nextRange);
    setActiveFormats(nextRange ? quill.getFormat(nextRange) : {});
    clearAutocomplete();
    clearMentions();
  };

  const pickerStyle = (() => {
    if (!emojiAnchorRect) return undefined;
    let top = emojiAnchorRect.top - PICKER_HEIGHT - PICKER_OFFSET;
    if (top < PICKER_OFFSET) top = emojiAnchorRect.bottom + PICKER_OFFSET;
    const left = Math.max(
      PICKER_OFFSET,
      Math.min(
        window.innerWidth - PICKER_WIDTH - PICKER_OFFSET,
        emojiAnchorRect.right - PICKER_WIDTH
      )
    );
    return { top, left };
  })();

  return {
    activeFormats,
    autocompletePos,
    autocompleteRef,
    autocompleteResults,
    autocompleteSelectedIndex,
    closeLinkDialog,
    editorHostRef,
    emojiAnchorRect,
    emojiButtonRef,
    emojiPickerRef,
    handleEditorKeyDown,
    handleEditorMouseUp,
    handleEditorPasteCapture,
    handleInsertEmoji,
    handleSelectAutocomplete: (result: AutocompleteResult) => {
      const quill = quillRef.current;
      if (!quill) return;
      handleSelectAutocomplete(quill, result);
    },
    handleSelectMention: (result: RichTextMentionOption) => {
      const quill = quillRef.current;
      if (!quill) return;
      handleSelectMention(quill, result);
      syncFromEditor(quill);
    },
    linkBubble,
    linkDialogOpen,
    linkText,
    linkUrl,
    mentionPos,
    mentionRef,
    mentionResults,
    mentionSelectedIndex,
    openLinkDialog,
    pickerStyle,
    quillRef,
    removeCurrentLink: () => removeCurrentLink(quillRef.current),
    setActiveFormats,
    setEmojiAnchorRect,
    setLinkText,
    setLinkUrl,
    setSelectedRange,
    showFloatingToolbar:
      !showFormattingTools &&
      !selectionToolbarDismissed &&
      !!selectedRange &&
      selectedRange.length > 0,
    submitLinkDialog: () => submitLinkDialog(quillRef.current),
    updateLinkBubble,
    wrapperRef,
  };
};
