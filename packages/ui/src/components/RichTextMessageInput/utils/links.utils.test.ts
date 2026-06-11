import { describe, expect, it } from 'vitest';
import { getExpandedLinkRange, isDirectUrl, normalizeUrl } from './links.utils';

describe('links.utils', () => {
  it('detects direct URLs supported by the editor', () => {
    expect(isDirectUrl('https://example.com')).toBe(true);
    expect(isDirectUrl('http://example.com')).toBe(true);
    expect(isDirectUrl('mailto:hello@example.com')).toBe(true);
    expect(isDirectUrl('tel:+33123456789')).toBe(true);
  });

  it('rejects unsupported direct URL protocols', () => {
    expect(isDirectUrl('javascript:alert(1)')).toBe(false);
    expect(isDirectUrl('example.com')).toBe(false);
  });

  it('normalizes bare values to https links', () => {
    expect(normalizeUrl(' example.com ')).toBe('https://example.com');
    expect(normalizeUrl('mailto:hello@example.com')).toBe('mailto:hello@example.com');
    expect(normalizeUrl('')).toBe('');
  });

  it('expands a collapsed selection to the full link range', () => {
    const quill = {
      getLength: () => 10,
      getFormat: (index: number) => ({
        link: index >= 2 && index <= 5 ? 'https://example.com' : undefined,
      }),
    };

    expect(
      getExpandedLinkRange(quill as never, { index: 4, length: 0 }, 'https://example.com')
    ).toEqual({
      index: 2,
      length: 4,
    });
  });
});
