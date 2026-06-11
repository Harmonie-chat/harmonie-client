import { describe, expect, it } from 'vitest';
import { formatReactionUserNames, getReactionPreviewUsers } from './messageReactionPreview';
import type { MessageReaction } from '@/types/channel';
import type { UserProfile } from '@/types/user';

const currentUser = {
  userId: 'me',
  username: 'laurine',
  displayName: 'Laurine',
} as UserProfile;

describe('formatReactionUserNames', () => {
  it('joins names with a dedicated last separator', () => {
    expect(formatReactionUserNames(['Ava', 'Noah', 'Mia'], 0, ', ', ' and ', '')).toBe(
      'Ava, Noah and Mia'
    );
  });

  it('includes the remaining label when more users reacted', () => {
    expect(formatReactionUserNames(['Ava'], 2, ', ', ' and ', '2 others')).toBe('Ava and 2 others');
  });
});

describe('getReactionPreviewUsers', () => {
  it('prepends the current user when they reacted but are missing from the preview', () => {
    const reaction = {
      reactedByMe: true,
      users: [
        { userId: '1', username: 'one', displayName: null },
        { userId: '2', username: 'two', displayName: null },
      ],
    } as MessageReaction;

    expect(getReactionPreviewUsers(reaction, currentUser)).toEqual([
      { userId: 'me', username: 'laurine', displayName: 'Laurine' },
      { userId: '1', username: 'one', displayName: null },
      { userId: '2', username: 'two', displayName: null },
    ]);
  });

  it('limits previews to five users', () => {
    const reaction = {
      reactedByMe: false,
      users: Array.from({ length: 6 }, (_, index) => ({
        userId: String(index),
        username: `user-${index}`,
        displayName: null,
      })),
    } as MessageReaction;

    expect(getReactionPreviewUsers(reaction)).toHaveLength(5);
  });
});
