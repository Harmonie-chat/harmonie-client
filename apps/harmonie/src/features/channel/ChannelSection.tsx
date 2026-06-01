import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';
import { MicOff, ScreenShare, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar, ChannelItem, Tooltip } from '@harmonie/ui';
import type { Channel, GuildMember } from '@/types/guild';
import type { VoiceParticipant } from '@/types/voice';
import { useUser } from '@/features/user/UserContext';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useGuildMembers } from '@/features/guild/GuildContext';
import { MemberPopover } from '@/shared/members/MemberPopover';
import { useChannels } from './ChannelContext';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';

function getParticipantLabel(
  participant: Pick<VoiceParticipant, 'userId' | 'username' | 'displayName'>
): string {
  const trimmedDisplay = participant.displayName?.trim();
  if (trimmedDisplay) return trimmedDisplay;
  const trimmedUsername = participant.username?.trim();
  return trimmedUsername || participant.userId;
}

const VoiceParticipantListItem = ({
  participant,
  isSpeaking,
  isMuted,
  isCameraEnabled,
  isScreenSharing,
  onClick,
}: {
  participant: VoiceParticipant;
  isSpeaking: boolean;
  isMuted: boolean;
  isCameraEnabled: boolean;
  isScreenSharing: boolean;
  onClick?: (userId: string, rect: DOMRect) => void;
}) => {
  const { t } = useTranslation();
  const avatarUrl = useFileBlobUrl(participant.avatarFileId);
  const label = getParticipantLabel(participant);

  const handleClick = (e: React.MouseEvent<HTMLLIElement>) => {
    const anchor = e.currentTarget.querySelector('[data-voice-participant-anchor]');
    onClick?.(participant.userId, (anchor ?? e.currentTarget).getBoundingClientRect());
  };

  return (
    <li
      className={[
        'flex items-center gap-2 px-1.5 rounded-sm transition-colors duration-100',
        onClick ? 'cursor-pointer hover:bg-surface-hover' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick ? handleClick : undefined}
    >
      <span data-voice-participant-anchor className="flex min-w-0 max-w-full items-center gap-2">
        <span
          className={[
            'shrink-0 rounded-full border-2 p-0.5 transition-all duration-150',
            isSpeaking ? 'border-primary' : 'border-transparent',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Avatar
            avatarUrl={avatarUrl}
            icon={participant.avatarIcon ?? undefined}
            color={participant.avatarColor ?? undefined}
            bg={participant.avatarBg ?? undefined}
            alt={label}
            size={22}
          />
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={[
              'min-w-0 truncate text-sm transition-colors duration-150',
              isSpeaking ? 'text-primary font-medium' : 'text-text-2',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {label}
          </span>
          {(isMuted || isCameraEnabled || isScreenSharing) && (
            <span className="flex shrink-0 items-center gap-1 text-text-3/80">
              {isMuted && (
                <Tooltip content={t('voice.participantMuted', { name: label })} side="top">
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                    aria-label={t('voice.participantMuted', { name: label })}
                    role="img"
                  >
                    <MicOff size={12} />
                  </span>
                </Tooltip>
              )}
              {isCameraEnabled && (
                <Tooltip content={t('voice.participantCameraOn', { name: label })} side="top">
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                    aria-label={t('voice.participantCameraOn', { name: label })}
                    role="img"
                  >
                    <Video size={12} />
                  </span>
                </Tooltip>
              )}
              {isScreenSharing && (
                <Tooltip content={t('voice.screenSharingLabel', { name: label })} side="top">
                  <span
                    className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                    aria-label={t('voice.screenSharingLabel', { name: label })}
                    role="img"
                  >
                    <ScreenShare size={12} />
                  </span>
                </Tooltip>
              )}
            </span>
          )}
        </span>
      </span>
    </li>
  );
};

interface SortableChannelItemProps {
  channel: Channel;
  active: boolean;
  unread: boolean;
  canReorder: boolean;
  voiceActive?: boolean;
  onNavigate: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onLongPress?: (position: { x: number; y: number }) => void;
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  menuLabel?: string;
  voiceParticipants?: VoiceParticipant[];
  speakingUserIds?: Set<string>;
  mutedUserIds?: Set<string>;
  cameraUserIds?: Set<string>;
  screenSharingUserIds?: Set<string>;
  onParticipantClick?: (userId: string, rect: DOMRect) => void;
}

const SortableChannelItem = ({
  channel,
  active,
  unread,
  canReorder,
  voiceActive,
  onNavigate,
  onContextMenu,
  onLongPress,
  onMenuClick,
  menuLabel,
  voiceParticipants,
  speakingUserIds,
  mutedUserIds,
  cameraUserIds,
  screenSharingUserIds,
  onParticipantClick,
}: SortableChannelItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: channel.channelId,
    disabled: !canReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={canReorder ? 'cursor-grab active:cursor-grabbing' : undefined}
      {...(canReorder ? { ...listeners, ...attributes } : {})}
    >
      <ChannelItem
        type={channel.type === 'Text' ? 'text' : 'voice'}
        label={channel.name}
        active={active}
        unread={unread}
        voiceActive={voiceActive}
        onClick={onNavigate}
        onContextMenu={onContextMenu}
        onLongPress={onLongPress}
        onMenuClick={onMenuClick}
        menuLabel={menuLabel}
      />
      {channel.type === 'Voice' && voiceParticipants && voiceParticipants.length > 0 && (
        <ul className="pl-7 flex flex-col gap-0.5 mt-0.5">
          {voiceParticipants.map((p) => (
            <VoiceParticipantListItem
              key={p.userId}
              participant={p}
              isSpeaking={speakingUserIds?.has(p.userId) ?? false}
              isMuted={mutedUserIds?.has(p.userId) ?? false}
              isCameraEnabled={cameraUserIds?.has(p.userId) ?? false}
              isScreenSharing={screenSharingUserIds?.has(p.userId) ?? false}
              onClick={onParticipantClick}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

interface ChannelSectionProps {
  sectionChannels: Channel[];
  type: 'Text' | 'Voice';
  canReorder: boolean;
  hasUnread?: (channelId: string) => boolean;
  onContextMenu?: (e: React.MouseEvent, channel: Channel) => void;
  onLongPress?: (position: { x: number; y: number }, channel: Channel) => void;
  onMenuClick?: (e: React.MouseEvent<HTMLButtonElement>, channel: Channel) => void;
  menuLabel?: string;
}

export const ChannelSection = ({
  sectionChannels,
  type,
  canReorder,
  hasUnread,
  onContextMenu,
  onLongPress,
  onMenuClick,
  menuLabel,
}: ChannelSectionProps) => {
  const { guildId, channelId: activeRouteChannelId } = useParams<{
    guildId: string;
    channelId: string;
  }>();
  const navigate = useNavigate();
  const { channels, applyReorder } = useChannels();
  const { user } = useUser();
  const {
    getParticipants,
    activeChannelId,
    cameraTracks,
    mutedUserIds,
    screenShares,
    speakingUserIds,
  } = useVoicePresence();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const members = useGuildMembers(guildId);
  const [popover, setPopover] = useState<{ member: GuildMember; rect: DOMRect } | null>(null);

  const handleParticipantClick = (userId: string, rect: DOMRect) => {
    const member = members?.find((m) => m.userId === userId);
    if (member) setPopover({ member, rect });
  };

  const ids = sectionChannels.map((c) => c.channelId);
  const isTextSection = type === 'Text';
  const cameraUserIds = new Set(cameraTracks.map((cameraTrack) => cameraTrack.participantId));
  const screenSharingUserIds = new Set(
    screenShares.map((screenShare) => screenShare.participantId)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !guildId) return;

    const oldIndex = sectionChannels.findIndex((c) => c.channelId === active.id);
    const newIndex = sectionChannels.findIndex((c) => c.channelId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedSection = [...sectionChannels];
    const [moved] = reorderedSection.splice(oldIndex, 1);
    reorderedSection.splice(newIndex, 0, moved);
    const reorderedWithPositions = reorderedSection.map((c, i) => ({ ...c, position: i + 1 }));

    const allChannels = channels ?? [];
    const otherChannels = allChannels.filter((c) => c.type !== sectionChannels[0].type);
    const merged = [...otherChannels, ...reorderedWithPositions];

    void applyReorder(guildId, merged);
  };

  const getVisibleVoiceParticipants = (voiceChannelId: string): VoiceParticipant[] => {
    const participants = getParticipants(voiceChannelId);

    if (!user || activeChannelId !== voiceChannelId) return participants;

    return [
      {
        userId: user.userId,
        username: user.username,
        displayName: user.displayName ?? null,
        avatarFileId: user.avatarFileId ?? null,
        avatarBg: user.avatar?.bg ?? null,
        avatarColor: user.avatar?.color ?? null,
        avatarIcon: user.avatar?.icon ?? null,
      },
      ...participants.filter((p) => p.userId !== user.userId),
    ];
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-0.5">
            {sectionChannels.map((channel) => (
              <SortableChannelItem
                key={channel.channelId}
                channel={channel}
                active={channel.channelId === activeRouteChannelId}
                unread={channel.type === 'Text' ? !!hasUnread?.(channel.channelId) : false}
                voiceActive={channel.type === 'Voice' && channel.channelId === activeChannelId}
                canReorder={canReorder}
                onNavigate={() =>
                  navigate(
                    isTextSection
                      ? `/guilds/${guildId}/channels/${channel.channelId}`
                      : `/guilds/${guildId}/voice/${channel.channelId}`
                  )
                }
                onContextMenu={onContextMenu ? (e) => onContextMenu(e, channel) : undefined}
                onLongPress={onLongPress ? (position) => onLongPress(position, channel) : undefined}
                onMenuClick={onMenuClick ? (e) => onMenuClick(e, channel) : undefined}
                menuLabel={menuLabel}
                voiceParticipants={
                  channel.type === 'Voice'
                    ? getVisibleVoiceParticipants(channel.channelId)
                    : undefined
                }
                speakingUserIds={channel.type === 'Voice' ? speakingUserIds : undefined}
                mutedUserIds={channel.type === 'Voice' ? mutedUserIds : undefined}
                cameraUserIds={
                  channel.type === 'Voice' && channel.channelId === activeChannelId
                    ? cameraUserIds
                    : undefined
                }
                screenSharingUserIds={
                  channel.type === 'Voice' && channel.channelId === activeChannelId
                    ? screenSharingUserIds
                    : undefined
                }
                onParticipantClick={handleParticipantClick}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {popover && guildId && (
        <MemberPopover
          member={popover.member}
          guildId={guildId}
          anchorRect={popover.rect}
          side="right"
          onClose={() => setPopover(null)}
        />
      )}
    </>
  );
};
