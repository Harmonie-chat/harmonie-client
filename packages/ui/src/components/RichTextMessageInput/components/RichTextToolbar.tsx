import Quill from 'quill';
import { IconButton } from '../../IconButton/IconButton';
import { TOOLBAR_BUTTON_CLASS } from '../utils/constants';
import { createToolbarButtons, createToolbarItems } from '../utils/toolbar.utils';
import type {
  ActiveFormats,
  RichTextMessageInputLabels,
  QuillRange,
  ToolbarButtonConfig,
} from '../types';

interface RichTextToolbarProps {
  activeFormats: ActiveFormats;
  labels: RichTextMessageInputLabels;
  getQuill: () => Quill | null;
  onOpenLinkDialog: (quill: Quill) => void;
  setActiveFormats: (formats: ActiveFormats) => void;
  setSelectedRange: (range: QuillRange) => void;
  updateLinkBubble: (quill: Quill, range: QuillRange) => void;
}

export const RichTextToolbar = ({
  activeFormats,
  getQuill,
  labels,
  onOpenLinkDialog,
  setActiveFormats,
  setSelectedRange,
  updateLinkBubble,
}: RichTextToolbarProps) => {
  const toolbarButtons = createToolbarButtons(labels, onOpenLinkDialog);
  const toolbarItems = createToolbarItems(toolbarButtons);

  const runToolbarButton = (config: ToolbarButtonConfig) => {
    const quill = getQuill();
    if (!quill) return;
    quill.history.cutoff();
    config.run(quill, activeFormats);
    quill.history.cutoff();
    const nextRange = quill.getSelection(true);
    setSelectedRange(nextRange);
    setActiveFormats(nextRange ? quill.getFormat(nextRange) : {});
    updateLinkBubble(quill, nextRange);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {toolbarItems.map((item) =>
        item.type === 'separator' ? (
          <div key={item.key} className="mx-1 h-5 w-px bg-border-2" />
        ) : (
          (() => {
            const Icon = item.config.icon;
            return (
              <IconButton
                key={item.config.key}
                type="button"
                size="small"
                variant="ghost"
                selected={item.config.selected(activeFormats)}
                className={TOOLBAR_BUTTON_CLASS}
                aria-label={item.config.label}
                title={item.config.label}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => runToolbarButton(item.config)}
              >
                <Icon size={14} />
              </IconButton>
            );
          })()
        )
      )}
    </div>
  );
};
