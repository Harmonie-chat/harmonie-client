import { describe, expect, it } from 'vitest';
import { splitTextWithUrls } from './url';

describe('splitTextWithUrls', () => {
  it('splits plain text around URLs', () => {
    expect(splitTextWithUrls('Read https://example.com now')).toEqual([
      { type: 'text', value: 'Read ' },
      { type: 'url', value: 'https://example.com' },
      { type: 'text', value: ' now' },
    ]);
  });

  it('keeps text unchanged when no URL is present', () => {
    expect(splitTextWithUrls('No links here')).toEqual([{ type: 'text', value: 'No links here' }]);
  });
});
