import { describe, expect, it } from 'vitest';
import {
  getMessagePayloadContent,
  isHtmlMessage,
  sanitizeMessageHtml,
  stripHtmlToText,
} from './messageHtml';

describe('messageHtml', () => {
  it('detects HTML content', () => {
    expect(isHtmlMessage('<p>Hello</p>')).toBe(true);
    expect(isHtmlMessage('Hello <3')).toBe(false);
  });

  it('strips tags, keeps readable line breaks, and decodes entities', () => {
    expect(stripHtmlToText('<p>Hello&nbsp;world</p><blockquote>Quote<br>line</blockquote>')).toBe(
      'Hello world\nQuote\nline'
    );
  });

  it('keeps formatted rich text as HTML payload content', () => {
    expect(getMessagePayloadContent('<p><strong>Hello</strong></p>')).toBe(
      '<p><strong>Hello</strong></p>'
    );
  });

  it('converts unformatted rich text payload content to plain text', () => {
    expect(getMessagePayloadContent('<p>Hello</p><p>world</p>')).toBe('Hello\nworld');
  });

  it('sanitizes unsupported tags and trims trailing empty blocks', () => {
    expect(sanitizeMessageHtml('<p>Hello</p><script>alert(1)</script><p><br></p>')).toBe(
      '<p>Hello</p>'
    );
  });
});
