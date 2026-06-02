import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@harmonie/ui';
import { useChannels } from '@/features/channel/ChannelContext';
import { useCurrentGuild } from '@/features/guild/GuildContext';
import { useTheme } from '@/features/user/ThemeContext';
import { useUser } from '@/features/user/UserContext';
import { VoiceJoinPrompt } from './components/VoiceJoinPrompt';
import { useVoicePresence } from './context/VoicePresenceContext';
import { VoiceActiveStage } from './layout/VoiceActiveStage';
import {
  buildParticipantCards,
  getCardSizes,
  getParticipantRows,
  getPinTargetId,
  PIN_DISABLED,
} from './layout/voiceLayout';

export const VoiceChannelView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pinnedTargetId, setPinnedTargetId] = useState<string | null>(null);
  const { channelId, guildId } = useParams<{ channelId: string; guildId: string }>();
  const { channels } = useChannels();
  const { guild } = useCurrentGuild();
  const { theme } = useTheme();
  const { user } = useUser();
  const voice = useVoicePresence();

  const channel = channels?.find((c) => c.channelId === channelId);
  const isActive = voice.activeChannelId === channelId;
  const joinMetaRef = useRef({
    channel,
    guild,
    isActive,
    isJoining: voice.isJoining,
    joinChannel: voice.joinChannel,
  });

  joinMetaRef.current = {
    channel,
    guild,
    isActive,
    isJoining: voice.isJoining,
    joinChannel: voice.joinChannel,
  };

  useEffect(() => {
    if (!channelId || !guildId) return;
    const {
      channel: ch,
      guild: g,
      isActive: active,
      isJoining: joining,
      joinChannel: join,
    } = joinMetaRef.current;
    if (!active && !joining) {
      void join(channelId, ch?.name, guildId, g?.name);
    }
  }, [channelId, guildId]);

  useEffect(() => {
    if (isActive && channel?.name && guild?.name && !voice.activeChannelName) {
      voice.updateActiveChannelMeta(channel.name, guild.name);
    }
  }, [isActive, channel?.name, guild?.name, voice]);

  if (!channelId || !guildId) return <Navigate to="/" replace />;

  const participants = voice.getParticipants(channelId);
  const cards = buildParticipantCards(participants, isActive ? user : null, voice.mutedUserIds);
  const rows = getParticipantRows(cards);
  const cardSizes = getCardSizes(cards.length);
  const maxCols = Math.max(1, ...rows.map((r) => r.length));
  const cardWidth = `calc((100% - ${(maxCols - 1) * 1.5}rem) / ${maxCols})`;
  const labelsByUserId = new Map(cards.map((card) => [card.userId, card.label]));
  const cameraTracksByUserId = new Map(
    voice.cameraTracks.map((cameraTrack) => [cameraTrack.participantId, cameraTrack])
  );
  const isDarkTheme = theme.endsWith('obsidian');

  const availablePinTargetIds = new Set([
    ...cards.map((card) => getPinTargetId('participant', card.userId)),
    ...voice.screenShares.map((screenShare) => getPinTargetId('screenShare', screenShare.trackSid)),
  ]);
  const defaultPinnedTargetId = voice.screenShares[0]
    ? getPinTargetId('screenShare', voice.screenShares[0].trackSid)
    : null;
  const activePinnedTargetId =
    pinnedTargetId === PIN_DISABLED
      ? null
      : pinnedTargetId && availablePinTargetIds.has(pinnedTargetId)
        ? pinnedTargetId
        : defaultPinnedTargetId;
  const pinnedParticipant = activePinnedTargetId?.startsWith('participant:')
    ? cards.find((card) => getPinTargetId('participant', card.userId) === activePinnedTargetId)
    : undefined;
  const pinnedScreenShare = activePinnedTargetId?.startsWith('screenShare:')
    ? voice.screenShares.find(
        (screenShare) =>
          getPinTargetId('screenShare', screenShare.trackSid) === activePinnedTargetId
      )
    : undefined;

  const handleTogglePin = (targetId: string) => {
    setPinnedTargetId((current) => {
      const currentActiveTargetId =
        current === PIN_DISABLED
          ? null
          : current && availablePinTargetIds.has(current)
            ? current
            : defaultPinnedTargetId;

      return currentActiveTargetId === targetId ? PIN_DISABLED : targetId;
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-1 md:rounded-md">
      <header className="flex h-14 shrink-0 items-center justify-between bg-surface-2 px-4 md:rounded-t-md">
        <div className="flex items-center gap-2 min-w-0">
          <IconButton
            className="md:hidden"
            size="small"
            variant="ghost"
            aria-label={t('guild.channels.backToChannels')}
            title={t('guild.channels.backToChannels')}
            tooltipSide="bottom"
            onClick={() => navigate(`/guilds/${guildId}`)}
          >
            <ArrowLeft size={16} />
          </IconButton>
          <Volume2 size={16} className="shrink-0 text-text-3" />
          <span className="text-sm font-semibold text-text-1 truncate">
            {channel?.name ?? channelId}
          </span>
        </div>
      </header>

      <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-1">
        {isActive ? (
          <VoiceActiveStage
            cards={cards}
            rows={rows}
            cardSizes={cardSizes}
            cardWidth={cardWidth}
            isDarkTheme={isDarkTheme}
            speakingUserIds={voice.speakingUserIds}
            screenShares={voice.screenShares}
            cameraTracksByUserId={cameraTracksByUserId}
            labelsByUserId={labelsByUserId}
            activePinnedTargetId={activePinnedTargetId}
            pinnedParticipant={pinnedParticipant}
            pinnedScreenShare={pinnedScreenShare}
            hasPinnedItem={Boolean(pinnedParticipant || pinnedScreenShare)}
            currentUserId={user?.userId}
            isMuted={voice.isMuted}
            isCameraEnabled={voice.isCameraEnabled}
            isScreenSharing={voice.isScreenSharing}
            screenShareError={voice.screenShareError}
            cameraError={voice.cameraError}
            onTogglePin={handleTogglePin}
            getParticipantVolume={voice.getParticipantVolume}
            onParticipantVolumeChange={voice.setParticipantVolume}
            onToggleParticipantMute={voice.toggleParticipantMute}
            onToggleMute={voice.toggleMute}
            onToggleCamera={() => void voice.toggleCamera()}
            onToggleScreenShare={() => void voice.toggleScreenShare()}
            onLeave={voice.leaveChannel}
          />
        ) : (
          <VoiceJoinPrompt
            channelName={channel?.name ?? channelId}
            isJoining={voice.isJoining}
            joinError={voice.joinError}
            onJoin={() => void voice.joinChannel(channelId, channel?.name, guildId, guild?.name)}
          />
        )}
      </div>
    </div>
  );
};
