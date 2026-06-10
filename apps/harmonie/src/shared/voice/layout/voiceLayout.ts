import type { VoiceParticipant } from '@/types/voice';
import type { UserProfile } from '@/types/user';

export interface VoiceParticipantCardData {
  kind: 'participant';
  userId: string;
  label: string;
  avatarFileId: string | null;
  avatarIcon: string | null;
  avatarColor: string | null;
  avatarBg: string | null;
  isMuted: boolean;
}

export interface VoiceCardSizes {
  avatarSize: number;
  titleClassName: string;
}

export const PIN_DISABLED = 'none';

function getParticipantLabel(
  participant: Pick<VoiceParticipant, 'userId' | 'username' | 'displayName'>
): string {
  const trimmedDisplay = participant.displayName?.trim();
  if (trimmedDisplay) return trimmedDisplay;
  const trimmedUsername = participant.username?.trim();
  return trimmedUsername || participant.userId;
}

export function getCardSizes(totalCardCount: number): VoiceCardSizes {
  if (totalCardCount <= 2) return { avatarSize: 112, titleClassName: 'text-3xl' };
  if (totalCardCount <= 4) return { avatarSize: 96, titleClassName: 'text-2xl' };
  return { avatarSize: 80, titleClassName: 'text-xl' };
}

export function getParticipantRows<T>(participants: T[]): T[][] {
  const count = participants.length;
  if (count === 0) return [];

  const numRows = count <= 3 ? 1 : count <= 8 ? 2 : 3;
  const base = Math.floor(count / numRows);
  const extra = count % numRows;

  let startIndex = 0;
  return Array.from({ length: numRows }, (_, i) => {
    const rowSize = i < extra ? base + 1 : base;
    const row = participants.slice(startIndex, startIndex + rowSize);
    startIndex += rowSize;
    return row;
  });
}

export const getPinTargetId = (kind: 'participant' | 'screenShare', id: string) => `${kind}:${id}`;

export function buildParticipantCards(
  participants: VoiceParticipant[],
  currentUser: UserProfile | null,
  mutedUserIds: Set<string> = new Set()
): VoiceParticipantCardData[] {
  const visibleParticipants: VoiceParticipant[] = currentUser
    ? [
        {
          userId: currentUser.userId,
          username: currentUser.username,
          displayName: currentUser.displayName ?? null,
          avatarFileId: currentUser.avatarFileId ?? null,
          avatarBg: currentUser.avatar?.bg ?? null,
          avatarColor: currentUser.avatar?.color ?? null,
          avatarIcon: currentUser.avatar?.icon ?? null,
        },
        ...participants.filter((p) => p.userId !== currentUser.userId),
      ]
    : participants;

  return visibleParticipants.map((participant) => ({
    kind: 'participant' as const,
    userId: participant.userId,
    label: getParticipantLabel(participant),
    avatarFileId: participant.avatarFileId,
    avatarIcon: participant.avatarIcon,
    avatarColor: participant.avatarColor,
    avatarBg: participant.avatarBg,
    isMuted: mutedUserIds.has(participant.userId),
  }));
}
