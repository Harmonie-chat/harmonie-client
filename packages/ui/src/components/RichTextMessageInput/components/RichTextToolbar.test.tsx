import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RichTextToolbar } from './RichTextToolbar';
import { DEFAULT_LABELS } from '../utils/toolbar.utils';
import type { ActiveFormats, QuillRange } from '../types';

const createQuill = (formats: ActiveFormats = {}) => ({
  focus: vi.fn(),
  format: vi.fn(),
  formatLine: vi.fn(),
  getFormat: vi.fn(() => formats),
  getSelection: vi.fn(() => ({ index: 0, length: 2 })),
  history: { cutoff: vi.fn() },
});

describe('RichTextToolbar', () => {
  beforeEach(() => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it('runs toolbar actions and syncs active formats', () => {
    const quill = createQuill({ bold: true });
    const onOpenLinkDialog = vi.fn();
    const setActiveFormats = vi.fn();
    const setSelectedRange = vi.fn();
    const updateLinkBubble = vi.fn();

    render(
      <RichTextToolbar
        activeFormats={{ bold: true }}
        getQuill={() => quill as never}
        labels={DEFAULT_LABELS}
        onOpenLinkDialog={onOpenLinkDialog}
        setActiveFormats={setActiveFormats}
        setSelectedRange={setSelectedRange}
        updateLinkBubble={updateLinkBubble}
      />
    );

    for (const label of [
      'Heading 1',
      'Heading 2',
      'Heading 3',
      'Bold',
      'Italic',
      'Underline',
      'Strikethrough',
      'Bulleted list',
      'Numbered list',
      'Quote',
      'Code',
      'Code block',
      'Link',
    ]) {
      fireEvent.mouseDown(screen.getByRole('button', { name: label }));
      fireEvent.click(screen.getByRole('button', { name: label }));
    }

    expect(quill.history.cutoff).toHaveBeenCalled();
    expect(quill.format).toHaveBeenCalled();
    expect(quill.formatLine).toHaveBeenCalled();
    expect(onOpenLinkDialog).toHaveBeenCalledWith(quill);
    expect(setSelectedRange).toHaveBeenCalledWith({ index: 0, length: 2 });
    expect(setActiveFormats).toHaveBeenCalledWith({ bold: true });
    expect(updateLinkBubble).toHaveBeenCalledWith(quill, { index: 0, length: 2 });
  });

  it('ignores toolbar actions when no editor is available', () => {
    const setSelectedRange = vi.fn<(range: QuillRange) => void>();

    render(
      <RichTextToolbar
        activeFormats={{}}
        getQuill={() => null}
        labels={DEFAULT_LABELS}
        onOpenLinkDialog={vi.fn()}
        setActiveFormats={vi.fn()}
        setSelectedRange={setSelectedRange}
        updateLinkBubble={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));

    expect(setSelectedRange).not.toHaveBeenCalled();
  });

  it('clears active formats when the selection is missing after an action', () => {
    const quill = createQuill();
    quill.getSelection.mockReturnValueOnce(null as never);
    const setActiveFormats = vi.fn();
    const updateLinkBubble = vi.fn();

    render(
      <RichTextToolbar
        activeFormats={{}}
        getQuill={() => quill as never}
        labels={DEFAULT_LABELS}
        onOpenLinkDialog={vi.fn()}
        setActiveFormats={setActiveFormats}
        setSelectedRange={vi.fn()}
        updateLinkBubble={updateLinkBubble}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bold' }));

    expect(setActiveFormats).toHaveBeenCalledWith({});
    expect(updateLinkBubble).toHaveBeenCalledWith(quill, null);
  });
});
