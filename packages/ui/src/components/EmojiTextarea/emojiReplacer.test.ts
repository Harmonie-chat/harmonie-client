import { describe, expect, it } from 'vitest';
import { getAutocompleteResults, getPartialMatchLength, resolveReplacement } from './emojiReplacer';

describe('emojiReplacer', () => {
  it('resolves shortcode replacements', () => {
    expect(resolveReplacement('hello :smile:', 13)).toMatchObject({
      emoji: '😄',
      start: 6,
      length: 7,
    });
  });

  it('resolves emoticon replacements outside shortcodes', () => {
    expect(resolveReplacement('hello :)', 8)).toMatchObject({
      emoji: '😃',
      start: 6,
      length: 2,
    });
  });

  it('returns autocomplete results for partial shortcodes', () => {
    expect(getAutocompleteResults('hello :smi')).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'smile' })])
    );
    expect(getPartialMatchLength('hello :smi')).toBe(4);
  });

  it('ignores text without a replacement candidate', () => {
    expect(resolveReplacement('hello world', 11)).toBeNull();
    expect(getAutocompleteResults('hello :x')).toEqual([]);
  });
});
