import { describe, expect, it } from 'vitest';
import { filterMentionedUserIdsFromContent } from './mentions';
import type { RichTextMentionOption } from '@harmonie/ui';

const mentionMap = new Map<string, RichTextMentionOption>([
  ['1', { userId: '1', username: 'ava', displayName: 'Ava Rose' }],
  ['2', { userId: '2', username: 'noah', displayName: null }],
]);

describe('filterMentionedUserIdsFromContent', () => {
  it('keeps selected ids still present in the content', () => {
    expect(
      filterMentionedUserIdsFromContent('<p>Hello @Ava Rose and @noah</p>', ['1', '2'], mentionMap)
    ).toEqual(['1', '2']);
  });

  it('deduplicates and limits selected ids', () => {
    const manyIds = Array.from({ length: 60 }, (_, index) => String(index));
    const manyMentions = new Map(
      manyIds.map((id) => [id, { userId: id, username: `user${id}`, displayName: null }])
    );
    const content = manyIds.map((id) => `@user${id}`).join(' ');

    expect(
      filterMentionedUserIdsFromContent(content, [...manyIds, '1'], manyMentions)
    ).toHaveLength(50);
  });
});
