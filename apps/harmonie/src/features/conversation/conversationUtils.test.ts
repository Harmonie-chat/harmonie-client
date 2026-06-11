import { describe, expect, it } from 'vitest';
import { getConversationLabel, userToConversationParticipant } from './conversationUtils';
import type { Conversation, ConversationParticipant } from '@/types/conversation';

const participant = (
  userId: string,
  username: string,
  displayName: string | null = null
): ConversationParticipant => ({
  userId,
  username,
  displayName,
});

const conversation = (
  input: Partial<Conversation> & Pick<Conversation, 'type' | 'participants'>
): Conversation => ({
  conversationId: 'conversation-1',
  name: null,
  createdAtUtc: '2024-01-01T00:00:00.000Z',
  ...input,
});

describe('userToConversationParticipant', () => {
  it('maps missing optional user fields to null values', () => {
    expect(
      userToConversationParticipant({
        userId: 'user-1',
        username: 'ada',
      })
    ).toEqual({
      userId: 'user-1',
      username: 'ada',
      displayName: null,
      bio: null,
      avatarFileId: null,
      avatar: null,
    });
  });

  it('preserves provided profile fields', () => {
    expect(
      userToConversationParticipant({
        userId: 'user-1',
        username: 'ada',
        displayName: 'Ada',
        bio: 'Engineer',
        avatarFileId: 'file-1',
        avatar: { color: '#111111', bg: '#ffffff', icon: 'User' },
      })
    ).toMatchObject({
      displayName: 'Ada',
      bio: 'Engineer',
      avatarFileId: 'file-1',
      avatar: { icon: 'User' },
    });
  });
});

describe('getConversationLabel', () => {
  it('uses the explicit group name when present', () => {
    expect(
      getConversationLabel(
        conversation({
          type: 'Group',
          name: 'Design',
          participants: [participant('user-1', 'ada')],
        }),
        'user-1'
      )
    ).toBe('Design');
  });

  it('builds a group label from other participants', () => {
    expect(
      getConversationLabel(
        conversation({
          type: 'Group',
          participants: [
            participant('user-1', 'ada', 'Ada'),
            participant('user-2', 'grace', 'Grace'),
            participant('user-3', 'linus'),
          ],
        }),
        'user-1'
      )
    ).toBe('Grace, linus');
  });

  it('falls back to all participants when the current user is alone in a group', () => {
    expect(
      getConversationLabel(
        conversation({
          type: 'Group',
          participants: [participant('user-1', 'ada', 'Ada')],
        }),
        'user-1'
      )
    ).toBe('Ada');
  });

  it('uses the first group participants when no current user is known', () => {
    expect(
      getConversationLabel(
        conversation({
          type: 'Group',
          participants: [participant('user-1', 'ada'), participant('user-2', 'grace')],
        }),
        undefined
      )
    ).toBe('ada, grace');
  });

  it('uses the other participant label for direct conversations', () => {
    expect(
      getConversationLabel(
        conversation({
          type: 'Direct',
          participants: [participant('user-1', 'ada'), participant('user-2', 'grace', 'Grace')],
        }),
        'user-1'
      )
    ).toBe('Grace');
  });

  it('falls back to the conversation id when a direct conversation has no participant', () => {
    expect(
      getConversationLabel(
        conversation({
          conversationId: 'conversation-empty',
          type: 'Direct',
          participants: [],
        }),
        'user-1'
      )
    ).toBe('conversation-empty');
  });
});
