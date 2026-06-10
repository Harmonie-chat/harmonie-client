import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, MicOff, PhoneCall, ScreenShare, Video, X } from 'lucide-react';
import {
  IconButton,
  Tooltip,
  UserListItem,
  UserPopover,
  type UserPopoverAction,
} from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { ConversationParticipant } from '@/types/conversation';
import { useTheme } from '@/features/user/ThemeContext';
import { getUserGradient } from '@/shared/utils/user';
import { useUser } from '@/features/user/UserContext';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';
import { useOpenDirectConversation } from '../useOpenDirectConversation';

interface SelectedParticipant {
  participant: ConversationParticipant;
  rect: DOMRect;
}

const ConversationParticipantItem = ({
  participant,
  callState,
  onSelect,
}: {
  participant: ConversationParticipant;
  callState: {
    showPresence: boolean;
    isInCall: boolean;
    isMuted: boolean;
    isCameraEnabled: boolean;
    isScreenSharing: boolean;
  };
  onSelect: (participant: ConversationParticipant, rect: DOMRect) => void;
}) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(participant.avatarFileId ?? null);
  const label = participant.displayName ?? participant.username;
  const usernameSubtitle = participant.displayName ? `@${participant.username}` : undefined;
  const callSubtitle = callState.showPresence
    ? t(callState.isInCall ? 'conversation.call.inCall' : 'conversation.call.notInCall')
    : undefined;
  const subtitle = callSubtitle ?? usernameSubtitle;
  const hasVoiceStatus =
    callState.isInCall ||
    callState.isMuted ||
    callState.isCameraEnabled ||
    callState.isScreenSharing;

  return (
    <UserListItem
      user={participant}
      label={label}
      subtitle={subtitle}
      avatarUrl={avatarUrl}
      avatarIcon={participant.avatar?.icon ?? 'PawPrint'}
      avatarColor={participant.avatar?.color ?? 'var(--color-cat-1-fg)'}
      avatarBg={participant.avatar?.bg ?? 'var(--color-cat-1)'}
      onSelect={onSelect}
      trailing={
        hasVoiceStatus ? (
          <span className="flex shrink-0 items-center gap-1 text-text-3/80">
            {callState.isInCall && (
              <Tooltip content={t('conversation.call.inCall')} side="top">
                <span className="inline-flex size-4 items-center justify-center rounded-full text-primary">
                  <span className="sr-only">{t('conversation.call.inCall')}</span>
                  <PhoneCall size={12} aria-hidden="true" />
                </span>
              </Tooltip>
            )}
            {callState.isMuted && (
              <Tooltip content={t('voice.participantMuted', { name: label })} side="top">
                <span className="inline-flex size-4 items-center justify-center rounded-full">
                  <span className="sr-only">{t('voice.participantMuted', { name: label })}</span>
                  <MicOff size={12} aria-hidden="true" />
                </span>
              </Tooltip>
            )}
            {callState.isCameraEnabled && (
              <Tooltip content={t('voice.participantCameraOn', { name: label })} side="top">
                <span className="inline-flex size-4 items-center justify-center rounded-full">
                  <span className="sr-only">{t('voice.participantCameraOn', { name: label })}</span>
                  <Video size={12} aria-hidden="true" />
                </span>
              </Tooltip>
            )}
            {callState.isScreenSharing && (
              <Tooltip content={t('voice.screenSharingLabel', { name: label })} side="top">
                <span className="inline-flex size-4 items-center justify-center rounded-full">
                  <span className="sr-only">{t('voice.screenSharingLabel', { name: label })}</span>
                  <ScreenShare size={12} aria-hidden="true" />
                </span>
              </Tooltip>
            )}
          </span>
        ) : undefined
      }
    />
  );
};

export const ConversationParticipantPopover = ({
  participant,
  anchorRect,
  onClose,
  side = 'left',
}: {
  participant: ConversationParticipant;
  anchorRect: DOMRect;
  onClose: () => void;
  side?: 'left' | 'right';
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { user } = useUser();
  const openDirectConversation = useOpenDirectConversation();
  const avatarUrl = useFileBlobUrl(participant.avatarFileId ?? null);
  const label = participant.displayName ?? participant.username;
  const actions: UserPopoverAction[] =
    user?.userId === participant.userId
      ? []
      : [
          {
            label: t('conversation.sendDirectMessage'),
            icon: <MessageCircle size={13} />,
            onClick: () => {
              void openDirectConversation(participant)
                .then(onClose)
                .catch(() => {});
            },
          },
        ];

  return (
    <UserPopover
      anchorRect={anchorRect}
      onClose={onClose}
      label={label}
      username={participant.displayName ? participant.username : undefined}
      avatarUrl={avatarUrl}
      avatarIcon={participant.avatar?.icon ?? 'PawPrint'}
      avatarColor={participant.avatar?.color ?? 'var(--color-cat-1-fg)'}
      avatarBg={participant.avatar?.bg ?? 'var(--color-cat-1)'}
      headerBackground={getUserGradient(participant.userId, theme.endsWith('obsidian'))}
      side={side}
      bioLabel={t('guild.members.popover.bioLabel')}
      bio={participant.bio}
      actions={actions}
    />
  );
};

interface ConversationParticipantsPanelProps {
  conversationId: string;
  participants: ConversationParticipant[];
  onClose: () => void;
}

export const ConversationParticipantsPanel = ({
  conversationId,
  participants,
  onClose,
}: ConversationParticipantsPanelProps) => {
  const { t } = useTranslation();
  const { user } = useUser();
  const voice = useVoicePresence();
  const [selected, setSelected] = useState<SelectedParticipant | null>(null);
  const remoteVoiceParticipantIds = voice
    .getConversationParticipants(conversationId)
    .map((participant) => participant.userId);
  const isCurrentConversationCall = voice.activeConversationId === conversationId;
  const showVoiceStatus = isCurrentConversationCall || remoteVoiceParticipantIds.length > 0;
  const cameraUserIds = showVoiceStatus
    ? new Set(voice.cameraTracks.map((cameraTrack) => cameraTrack.participantId))
    : new Set<string>();
  const screenSharingUserIds = showVoiceStatus
    ? new Set(voice.screenShares.map((screenShare) => screenShare.participantId))
    : new Set<string>();
  const voiceParticipantIds = showVoiceStatus
    ? new Set([
        ...remoteVoiceParticipantIds,
        ...(isCurrentConversationCall && user?.userId ? [user.userId] : []),
      ])
    : new Set<string>();

  const handleSelect = (participant: ConversationParticipant, rect: DOMRect) => {
    setSelected((prev) =>
      prev?.participant.userId === participant.userId ? null : { participant, rect }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface-1 lg:static lg:z-auto lg:w-52 lg:shrink-0 lg:rounded-md">
        <div className="flex h-14 shrink-0 items-center justify-between bg-surface-2 px-4 pt-[env(safe-area-inset-top)] lg:rounded-t-md lg:pt-0">
          <span className="text-sm font-semibold text-text-1">
            {t('conversation.participantsTitle')}
          </span>
          <IconButton size="small" onClick={onClose}>
            <X size={14} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {participants.map((participant) => (
            <ConversationParticipantItem
              key={participant.userId}
              participant={participant}
              callState={{
                showPresence: showVoiceStatus,
                isInCall: voiceParticipantIds.has(participant.userId),
                isMuted: showVoiceStatus && voice.mutedUserIds.has(participant.userId),
                isCameraEnabled: cameraUserIds.has(participant.userId),
                isScreenSharing: screenSharingUserIds.has(participant.userId),
              }}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {selected && (
        <ConversationParticipantPopover
          participant={selected.participant}
          anchorRect={selected.rect}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};
