import { describe, expect, it, vi } from 'vitest';
import { createToolbarButtons, createToolbarItems, DEFAULT_LABELS } from './toolbar.utils';

const createQuill = (
  range: { index: number; length: number } | null = { index: 2, length: 0 }
) => ({
  focus: vi.fn(),
  format: vi.fn(),
  formatLine: vi.fn(),
  getSelection: vi.fn(() => range),
});

describe('toolbar.utils', () => {
  it('creates all toolbar buttons and item groups', () => {
    const buttons = createToolbarButtons(DEFAULT_LABELS, vi.fn());
    const items = createToolbarItems(buttons);

    expect(buttons.map((button) => button.key)).toContain('bold');
    expect(items.filter((item) => item.type === 'separator')).toHaveLength(3);
    expect(items.filter((item) => item.type === 'button')).toHaveLength(13);
  });

  it('toggles inline formats', () => {
    const quill = createQuill();
    const bold = createToolbarButtons(DEFAULT_LABELS, vi.fn()).find(
      (button) => button.key === 'bold'
    )!;

    expect(bold.selected({ bold: true })).toBe(true);
    bold.run(quill as never, { bold: true });

    expect(quill.focus).toHaveBeenCalledOnce();
    expect(quill.format).toHaveBeenCalledWith('bold', false, 'user');
  });

  it('toggles line formats with a minimum length of one', () => {
    const quill = createQuill();
    const header = createToolbarButtons(DEFAULT_LABELS, vi.fn()).find(
      (button) => button.key === 'header-1'
    )!;

    expect(header.selected({ header: 1 })).toBe(true);
    header.run(quill as never, { header: 1 });

    expect(quill.formatLine).toHaveBeenCalledWith(2, 1, 'header', false, 'user');
  });

  it('skips line formatting without a selection', () => {
    const quill = createQuill(null);
    const codeBlock = createToolbarButtons(DEFAULT_LABELS, vi.fn()).find(
      (button) => button.key === 'code-block'
    )!;

    codeBlock.run(quill as never, {});

    expect(quill.formatLine).not.toHaveBeenCalled();
  });

  it('opens the link dialog with the active editor', () => {
    const quill = createQuill();
    const openLinkDialog = vi.fn();
    const link = createToolbarButtons(DEFAULT_LABELS, openLinkDialog).find(
      (button) => button.key === 'link'
    )!;

    expect(link.selected({ link: 'https://example.com' })).toBe(true);
    link.run(quill as never, {});

    expect(quill.focus).toHaveBeenCalledOnce();
    expect(openLinkDialog).toHaveBeenCalledWith(quill);
  });
});
