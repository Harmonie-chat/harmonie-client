import { describe, expect, it, vi } from 'vitest';
import {
  getEditorHtml,
  getPlainText,
  normalizeHtml,
  registerQuillKeyboardBindings,
  toEditorHtml,
} from './editor.utils';

describe('editor.utils', () => {
  it('converts plain text to editor HTML and escapes unsafe characters', () => {
    expect(toEditorHtml('Hello\nTom & "Jerry"')).toBe(
      '<p>Hello<br>Tom &amp; &quot;Jerry&quot;</p>'
    );
    expect(toEditorHtml('')).toBe('<p><br></p>');
    expect(toEditorHtml('<p>Already HTML</p>')).toBe('<p>Already HTML</p>');
  });

  it('returns empty editor HTML when the editor is blank', () => {
    expect(
      getEditorHtml({
        getText: () => '   \n',
        getSemanticHTML: () => '<p>ignored</p>',
      } as never)
    ).toBe('');
  });

  it('returns trimmed editor HTML and plain text', () => {
    const quill = {
      getText: () => ' Hello \n',
      getSemanticHTML: () => ' <p>Hello</p> ',
    };

    expect(getEditorHtml(quill as never)).toBe('<p>Hello</p>');
    expect(getPlainText(quill as never)).toBe('Hello');
  });

  it('normalizes whitespace in HTML strings', () => {
    expect(normalizeHtml(' <p>Hello</p>   <p>world</p> ')).toBe('<p>Hello</p> <p>world</p>');
  });

  it('registers keyboard bindings for inline formatting', () => {
    const cutoff = vi.fn();
    const format = vi.fn();
    const addBinding = vi.fn();
    const quill = {
      history: { cutoff },
      format,
      keyboard: { addBinding },
    };

    registerQuillKeyboardBindings(quill as never);
    const boldHandler = addBinding.mock.calls[0][2] as (
      range: unknown,
      context: { format: Record<string, unknown> }
    ) => boolean;

    expect(addBinding).toHaveBeenCalledTimes(3);
    expect(boldHandler(null, { format: { bold: true } })).toBe(false);
    expect(cutoff).toHaveBeenCalledTimes(2);
    expect(format).toHaveBeenCalledWith('bold', false, 'user');
  });
});
