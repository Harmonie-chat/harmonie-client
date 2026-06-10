import { useImperativeHandle, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { EmojiPickerBase } from '../EmojiPickerBase/EmojiPickerBase';
import { EmojiAutocomplete } from '../EmojiTextarea/EmojiAutocomplete';
import { IconButton } from '../IconButton/IconButton';
import { Paperclip, SendHorizonal, Smile } from 'lucide-react';
import type { EmojiClickData, PickerProps } from 'emoji-picker-react';
import { useRichTextMessageInput } from './hooks/useRichTextMessageInput';
import { PICKER_HEIGHT, PICKER_WIDTH } from './utils/constants';
import { DEFAULT_LABELS } from './utils/toolbar.utils';
import type { RichTextMentionOption, RichTextMessageInputLabels } from './types';
import { RichTextToolbar } from './components/RichTextToolbar';
import { RichTextLinkBubble } from './components/RichTextLinkBubble';
import { RichTextLinkDialog } from './components/RichTextLinkDialog';
import { RichTextMentionAutocomplete } from './components/RichTextMentionAutocomplete';

export interface RichTextMessageInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  pickerProps?: Omit<PickerProps, 'onEmojiClick' | 'categoryIcons'>;
  showFormattingTools?: boolean;
  onToggleFormattingTools?: () => void;
  autoFocus?: boolean;
  autoFocusPlacement?: 'start' | 'end';
  onSubmit?: () => void;
  onEscape?: () => void;
  submitDisabled?: boolean;
  showSubmitButton?: boolean;
  onArrowUpWhenEmpty?: () => void;
  onPasteFiles?: (files: File[]) => void;
  onAttachClick?: () => void;
  mentionOptions?: RichTextMentionOption[];
  onMentionSelected?: (mention: RichTextMentionOption) => void;
  labels?: Partial<RichTextMessageInputLabels>;
  ref?: Ref<RichTextMessageInputHandle>;
}

export interface RichTextMessageInputHandle {
  focus: (placement?: 'start' | 'end') => void;
}

export const RichTextMessageInput = ({
  value,
  onChange,
  placeholder = '',
  disabled = false,
  error,
  pickerProps,
  showFormattingTools = false,
  onToggleFormattingTools,
  autoFocus = false,
  autoFocusPlacement = 'start',
  onSubmit,
  onEscape,
  submitDisabled = false,
  showSubmitButton = true,
  onArrowUpWhenEmpty,
  onPasteFiles,
  onAttachClick,
  mentionOptions,
  onMentionSelected,
  labels,
  ref,
}: RichTextMessageInputProps) => {
  const mergedLabels = { ...DEFAULT_LABELS, ...(labels ?? {}) };
  const {
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
    handleSelectAutocomplete,
    handleSelectMention,
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
    removeCurrentLink,
    setActiveFormats,
    setEmojiAnchorRect,
    setLinkText,
    setLinkUrl,
    setSelectedRange,
    showFloatingToolbar,
    submitLinkDialog,
    updateLinkBubble,
    wrapperRef,
  } = useRichTextMessageInput({
    value,
    onChange,
    placeholder,
    disabled,
    showFormattingTools,
    autoFocus,
    autoFocusPlacement,
    onSubmit,
    onEscape,
    onArrowUpWhenEmpty,
    onPasteFiles,
    mentionOptions,
    onMentionSelected,
  });

  useImperativeHandle(
    ref,
    () => ({
      focus: (placement = 'end') => {
        const quill = quillRef.current;
        if (!quill) return;
        const index = placement === 'end' ? Math.max(quill.getLength() - 1, 0) : 0;
        quill.focus();
        quill.setSelection(index, 0, 'silent');
      },
    }),
    [quillRef]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative rounded-sm border border-border-2 bg-[var(--color-rich-text-input-background)] transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--color-primary)_16%,transparent)]">
        {showFormattingTools && (
          <div className="absolute bottom-full left-0 right-0 z-30 mb-2 px-2 sm:static sm:mb-0 sm:px-3 sm:pt-2">
            <div className="rounded-sm border border-border-2 bg-surface-1 p-1 shadow-lg sm:border-0 sm:bg-transparent sm:p-0 sm:pb-1 sm:shadow-none">
              <RichTextToolbar
                activeFormats={activeFormats}
                getQuill={() => quillRef.current}
                labels={mergedLabels}
                onOpenLinkDialog={openLinkDialog}
                setActiveFormats={setActiveFormats}
                setSelectedRange={setSelectedRange}
                updateLinkBubble={updateLinkBubble}
              />
            </div>
          </div>
        )}

        <div className="flex items-end sm:block">
          <div
            ref={wrapperRef}
            onKeyDownCapture={handleEditorKeyDown}
            onMouseUpCapture={handleEditorMouseUp}
            onPasteCapture={handleEditorPasteCapture}
            className={[
              'relative min-w-0 flex-1',
              '[&_.ql-container]:border-0 [&_.ql-container]:font-body',
              '[&_.ql-editor]:select-text [&_.ql-editor]:[-webkit-user-select:text] [&_.ql-editor_*]:select-text [&_.ql-editor_*]:[-webkit-user-select:text]',
              '[&_.ql-editor]:min-h-[44px] [&_.ql-editor]:w-full [&_.ql-editor]:max-h-[50vh] [&_.ql-editor]:overflow-y-auto [&_.ql-editor]:px-3 [&_.ql-editor]:pb-3 [&_.ql-editor]:text-sm [&_.ql-editor]:text-text-2 [&_.ql-editor]:caret-primary [&_.ql-editor]:outline-none sm:[&_.ql-editor]:px-4',
              showFormattingTools
                ? '[&_.ql-editor]:pt-3 sm:[&_.ql-editor]:pt-1'
                : '[&_.ql-editor]:pt-3',
              '[&_.ql-editor]:whitespace-pre-wrap [&_.ql-editor]:break-words',
              '[&_.ql-editor.ql-blank::before]:!text-text-3',
              '[&_.ql-editor_*::selection]:bg-[rgb(from_var(--color-primary)_r_g_b/0.28)] [&_.ql-editor::selection]:bg-[rgb(from_var(--color-primary)_r_g_b/0.28)]',
              '[&_.ql-mention]:inline-flex [&_.ql-mention]:max-w-full [&_.ql-mention]:items-center [&_.ql-mention]:rounded-sm [&_.ql-mention]:bg-primary/12 [&_.ql-mention]:px-1.5 [&_.ql-mention]:py-0.5 [&_.ql-mention]:text-xs [&_.ql-mention]:font-medium [&_.ql-mention]:text-primary',
              '[&_.ql-editor_h1]:text-lg [&_.ql-editor_h1]:font-semibold [&_.ql-editor_h1]:leading-snug',
              '[&_.ql-editor_h2]:text-base [&_.ql-editor_h2]:font-semibold [&_.ql-editor_h2]:leading-snug',
              '[&_.ql-editor_h3]:text-sm [&_.ql-editor_h3]:font-semibold [&_.ql-editor_h3]:leading-snug',
              '[&_.ql-editor_a]:text-primary [&_.ql-editor_a]:underline [&_.ql-editor_a]:underline-offset-2 [&_.ql-editor_a]:break-all',
              '[&_.ql-editor_blockquote]:border-l-2 [&_.ql-editor_blockquote]:border-border-2 [&_.ql-editor_blockquote]:pl-3 [&_.ql-editor_blockquote]:italic',
              '[&_.ql-editor_ol]:!pl-5 [&_.ql-editor_li]:!pl-0 [&_.ql-editor_li]:leading-normal [&_.ql-editor_li>.ql-ui]:!w-0',
              '[&_.ql-editor_li>.ql-ui::before]:!-ml-4 [&_.ql-editor_li>.ql-ui::before]:!mr-2 [&_.ql-editor_li>.ql-ui::before]:!w-2.5 [&_.ql-editor_li>.ql-ui::before]:text-center',
              "[&_.ql-editor_li[data-list='bullet']]:!list-disc [&_.ql-editor_li[data-list='bullet']>.ql-ui]:hidden",
              '[&_.ql-editor_pre]:overflow-x-auto [&_.ql-editor_pre]:rounded-md [&_.ql-editor_pre]:bg-surface-3 [&_.ql-editor_pre]:px-3 [&_.ql-editor_pre]:py-2 [&_.ql-editor_pre]:font-mono [&_.ql-editor_pre]:text-xs',
              '[&_.ql-editor_.ql-code-block-container]:overflow-x-auto [&_.ql-editor_.ql-code-block-container]:rounded-md [&_.ql-editor_.ql-code-block-container]:bg-surface-3 [&_.ql-editor_.ql-code-block-container]:px-3 [&_.ql-editor_.ql-code-block-container]:py-2 [&_.ql-editor_.ql-code-block-container]:font-mono [&_.ql-editor_.ql-code-block-container]:text-xs',
              '[&_.ql-editor_.ql-code-block]:whitespace-pre-wrap',
              '[&_.ql-editor_code]:rounded-sm [&_.ql-editor_code]:bg-surface-3 [&_.ql-editor_code]:px-1.5 [&_.ql-editor_code]:py-0.5 [&_.ql-editor_code]:font-mono',
              disabled
                ? 'opacity-50 [&_.ql-editor]:cursor-not-allowed'
                : '[&_.ql-editor]:cursor-text',
            ].join(' ')}
          >
            {showFloatingToolbar && (
              <div className="absolute -top-12 left-3 z-20 hidden opacity-100 translate-y-0 sm:block">
                <div className="rounded-full border border-border-2 bg-surface-1 p-0.5 shadow-lg">
                  <RichTextToolbar
                    activeFormats={activeFormats}
                    getQuill={() => quillRef.current}
                    labels={mergedLabels}
                    onOpenLinkDialog={openLinkDialog}
                    setActiveFormats={setActiveFormats}
                    setSelectedRange={setSelectedRange}
                    updateLinkBubble={updateLinkBubble}
                  />
                </div>
              </div>
            )}
            {!showFloatingToolbar && linkBubble && (
              <RichTextLinkBubble
                editLabel={mergedLabels.editLink}
                removeLabel={mergedLabels.removeLink}
                url={linkBubble.url}
                top={linkBubble.top}
                left={linkBubble.left}
                onEdit={() => {
                  const quill = quillRef.current;
                  if (!quill) return;
                  openLinkDialog(quill);
                }}
                onRemove={removeCurrentLink}
              />
            )}
            <div ref={editorHostRef} />
          </div>
          <div className="flex shrink-0 items-center gap-1 py-1.5 pr-2 text-text-3 sm:justify-between sm:gap-3 sm:border-t sm:border-border-2 sm:px-3 sm:py-1.5">
            <div className="flex items-center gap-1">
              <IconButton
                type="button"
                size="small"
                variant="ghost"
                selected={showFormattingTools}
                className="h-8 min-w-8 rounded-md px-2 text-[12px] font-semibold"
                onClick={onToggleFormattingTools}
                aria-label={mergedLabels.toggleFormatting}
                title={mergedLabels.toggleFormatting}
              >
                <span>Aa</span>
              </IconButton>
              {onAttachClick && (
                <IconButton
                  type="button"
                  onClick={onAttachClick}
                  disabled={disabled}
                  size="small"
                  variant="ghost"
                  aria-label={mergedLabels.attachFile}
                  title={mergedLabels.attachFile}
                >
                  <Paperclip size={16} />
                </IconButton>
              )}
              <span className="hidden sm:inline-flex">
                <IconButton
                  ref={emojiButtonRef}
                  type="button"
                  disabled={disabled}
                  size="small"
                  variant="ghost"
                  aria-label={mergedLabels.openEmoji}
                  title={mergedLabels.openEmoji}
                  onClick={() => {
                    const rect = emojiButtonRef.current?.getBoundingClientRect();
                    if (rect) setEmojiAnchorRect((current) => (current ? null : rect));
                  }}
                >
                  <Smile size={16} />
                </IconButton>
              </span>
            </div>
            {showSubmitButton && onSubmit && (
              <IconButton
                type="button"
                variant="primary"
                size="normal"
                onClick={onSubmit}
                disabled={disabled || submitDisabled}
                aria-label={mergedLabels.send}
                title={mergedLabels.send}
              >
                <SendHorizonal size={16} />
              </IconButton>
            )}
          </div>
        </div>
      </div>

      {error && <span className="font-body text-[11px] font-normal text-error-fg">{error}</span>}

      {emojiAnchorRect &&
        pickerStyle &&
        createPortal(
          <div ref={emojiPickerRef} className="fixed z-50 shadow-lg" style={pickerStyle}>
            <EmojiPickerBase
              onEmojiClick={(data: EmojiClickData) => handleInsertEmoji(data.emoji)}
              searchPlaceholder={mergedLabels.emojiSearchPlaceholder}
              width={PICKER_WIDTH}
              height={PICKER_HEIGHT}
              {...(pickerProps ?? {})}
            />
          </div>,
          document.body
        )}

      {linkDialogOpen && (
        <RichTextLinkDialog
          cancelLabel={mergedLabels.cancel}
          closeLabel={mergedLabels.cancel}
          linkText={linkText}
          linkTextLabel={mergedLabels.linkTextLabel}
          linkUrl={linkUrl}
          linkUrlLabel={mergedLabels.linkUrlLabel}
          onClose={closeLinkDialog}
          onRemove={removeCurrentLink}
          onSave={submitLinkDialog}
          removeLabel={mergedLabels.removeLink}
          saveLabel={mergedLabels.save}
          setLinkText={setLinkText}
          setLinkUrl={setLinkUrl}
          title={mergedLabels.linkDialogTitle}
        />
      )}

      {autocompleteResults.length > 0 && autocompletePos && (
        <EmojiAutocomplete
          results={autocompleteResults}
          selectedIndex={autocompleteSelectedIndex}
          pos={autocompletePos}
          onSelect={handleSelectAutocomplete}
          containerRef={autocompleteRef}
        />
      )}

      {mentionResults.length > 0 && mentionPos && (
        <RichTextMentionAutocomplete
          results={mentionResults}
          selectedIndex={mentionSelectedIndex}
          pos={mentionPos}
          onSelect={handleSelectMention}
          containerRef={mentionRef}
        />
      )}
    </div>
  );
};
