import { describe, expect, it } from 'vitest';
import {
  applyCurrentUserProfileUpdate,
  applyUserProfileUpdate,
  applyVoiceParticipantProfileUpdate,
} from './userProfileRealtime';
import type { UserProfile, UserProfileUpdatedEvent } from '@/types/user';
import type { VoiceParticipant } from '@/types/voice';

const event = (input: Partial<UserProfileUpdatedEvent> = {}): UserProfileUpdatedEvent => ({
  userId: 'user-1',
  username: 'ada-next',
  displayName: 'Ada Next',
  avatarFileId: 'avatar-1',
  avatarColor: '#111111',
  avatarIcon: 'User',
  avatarBg: '#ffffff',
  ...input,
});

describe('userProfileRealtime', () => {
  it('updates profile-backed users when ids match', () => {
    expect(
      applyUserProfileUpdate(
        {
          userId: 'user-1',
          username: 'ada',
          displayName: 'Ada',
          avatarFileId: null,
          avatar: null,
        },
        event()
      )
    ).toEqual({
      userId: 'user-1',
      username: 'ada-next',
      displayName: 'Ada Next',
      avatarFileId: 'avatar-1',
      avatar: { color: '#111111', icon: 'User', bg: '#ffffff' },
    });
  });

  it('returns non-matching users unchanged', () => {
    const user = { userId: 'user-2', username: 'grace' };

    expect(applyUserProfileUpdate(user, event())).toBe(user);
  });

  it('updates the current user profile', () => {
    const user: UserProfile = {
      userId: 'user-1',
      username: 'ada',
      displayName: 'Ada',
      avatarFileId: null,
      avatar: {},
      theme: 'default',
      language: 'fr',
    };

    expect(applyCurrentUserProfileUpdate(user, event({ avatarColor: null }))).toMatchObject({
      username: 'ada-next',
      avatar: { color: undefined, icon: 'User', bg: '#ffffff' },
      theme: 'default',
      language: 'fr',
    });
  });

  it('updates voice participants when ids match', () => {
    const participant: VoiceParticipant = {
      userId: 'user-1',
      username: 'ada',
      displayName: 'Ada',
      avatarFileId: null,
      avatarBg: null,
      avatarColor: null,
      avatarIcon: null,
    };

    expect(applyVoiceParticipantProfileUpdate(participant, event())).toEqual({
      userId: 'user-1',
      username: 'ada-next',
      displayName: 'Ada Next',
      avatarFileId: 'avatar-1',
      avatarBg: '#ffffff',
      avatarColor: '#111111',
      avatarIcon: 'User',
    });
  });
});
