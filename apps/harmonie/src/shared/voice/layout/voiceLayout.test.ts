import { describe, expect, it } from 'vitest';
import {
  buildParticipantCards,
  getCardSizes,
  getParticipantRows,
  getPinTargetId,
  PIN_DISABLED,
} from './voiceLayout';
import type { UserProfile } from '@/types/user';
import type { VoiceParticipant } from '@/types/voice';

const participant = (input: Partial<VoiceParticipant> = {}): VoiceParticipant => ({
  userId: 'user-1',
  username: 'ada',
  displayName: null,
  avatarFileId: null,
  avatarBg: null,
  avatarColor: null,
  avatarIcon: null,
  ...input,
});

const currentUser = (input: Partial<UserProfile> = {}): UserProfile => ({
  userId: 'current-user',
  username: 'current',
  displayName: 'Current User',
  avatarFileId: 'avatar-1',
  avatar: { bg: '#ffffff', color: '#111111', icon: 'User' },
  theme: 'default',
  language: null,
  ...input,
});

describe('voiceLayout', () => {
  it('selects card sizes from participant count', () => {
    expect(getCardSizes(1)).toEqual({ avatarSize: 112, titleClassName: 'text-3xl' });
    expect(getCardSizes(4)).toEqual({ avatarSize: 96, titleClassName: 'text-2xl' });
    expect(getCardSizes(9)).toEqual({ avatarSize: 80, titleClassName: 'text-xl' });
  });

  it('splits participants into responsive rows', () => {
    expect(getParticipantRows([])).toEqual([]);
    expect(getParticipantRows([1, 2, 3])).toEqual([[1, 2, 3]]);
    expect(getParticipantRows([1, 2, 3, 4, 5])).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
    expect(getParticipantRows([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7],
      [8, 9, 10],
    ]);
  });

  it('builds stable pin target ids', () => {
    expect(PIN_DISABLED).toBe('none');
    expect(getPinTargetId('participant', 'user-1')).toBe('participant:user-1');
    expect(getPinTargetId('screenShare', 'track-1')).toBe('screenShare:track-1');
  });

  it('places the current user first and marks muted participants', () => {
    const cards = buildParticipantCards(
      [
        participant({ userId: 'user-2', username: 'grace', displayName: 'Grace' }),
        participant({ userId: 'current-user', username: 'current' }),
      ],
      currentUser(),
      new Set(['user-2'])
    );

    expect(cards).toEqual([
      expect.objectContaining({
        userId: 'current-user',
        label: 'Current User',
        avatarFileId: 'avatar-1',
        avatarIcon: 'User',
        isMuted: false,
      }),
      expect.objectContaining({
        userId: 'user-2',
        label: 'Grace',
        isMuted: true,
      }),
    ]);
  });

  it('falls back from blank labels to username and user id', () => {
    expect(
      buildParticipantCards([participant({ displayName: '   ', username: ' ada ' })], null)[0].label
    ).toBe('ada');
    expect(
      buildParticipantCards([participant({ displayName: '', username: '   ' })], null)[0].label
    ).toBe('user-1');
  });
});
