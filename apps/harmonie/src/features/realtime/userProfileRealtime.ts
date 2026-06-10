import type { AvatarAppearance, UserProfile, UserProfileUpdatedEvent } from '@/types/user';
import type { VoiceParticipant } from '@/types/voice';

interface ProfileBackedUser {
  userId: string;
  username: string;
  displayName?: string | null;
  avatarFileId?: string | null;
  avatar?: AvatarAppearance | null;
}

const avatarFromProfileUpdate = (event: UserProfileUpdatedEvent): AvatarAppearance => ({
  color: event.avatarColor ?? undefined,
  icon: event.avatarIcon ?? undefined,
  bg: event.avatarBg ?? undefined,
});

export const applyUserProfileUpdate = <TUser extends ProfileBackedUser>(
  user: TUser,
  event: UserProfileUpdatedEvent
): TUser =>
  user.userId === event.userId
    ? {
        ...user,
        username: event.username,
        displayName: event.displayName,
        avatarFileId: event.avatarFileId,
        avatar: avatarFromProfileUpdate(event),
      }
    : user;

export const applyCurrentUserProfileUpdate = (
  user: UserProfile,
  event: UserProfileUpdatedEvent
): UserProfile => ({
  ...user,
  username: event.username,
  displayName: event.displayName,
  avatarFileId: event.avatarFileId,
  avatar: avatarFromProfileUpdate(event),
});

export const applyVoiceParticipantProfileUpdate = (
  participant: VoiceParticipant,
  event: UserProfileUpdatedEvent
): VoiceParticipant =>
  participant.userId === event.userId
    ? {
        ...participant,
        username: event.username,
        displayName: event.displayName,
        avatarFileId: event.avatarFileId,
        avatarBg: event.avatarBg,
        avatarColor: event.avatarColor,
        avatarIcon: event.avatarIcon,
      }
    : participant;
