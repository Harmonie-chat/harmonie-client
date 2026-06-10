import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PhoneOff, Rss } from 'lucide-react';
import { IconButton, Separator } from '@harmonie/ui';
import { useVoicePresence } from './context/VoicePresenceContext';

export const VoiceConnectionBar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    activeTargetKind,
    activeChannelId,
    activeChannelName,
    activeConversationId,
    activeConversationName,
    activeGuildId,
    activeGuildName,
    ping,
    leaveCall,
  } = useVoicePresence();

  if (!activeChannelId && !activeConversationId) return null;

  const handleGoToCall = () => {
    if (activeTargetKind === 'channel' && activeGuildId && activeChannelId) {
      navigate(`/guilds/${activeGuildId}/voice/${activeChannelId}`);
    }
    if (activeTargetKind === 'conversation' && activeConversationId) {
      navigate(`/conversations/${activeConversationId}`);
    }
  };

  const label =
    activeTargetKind === 'channel'
      ? activeGuildName && activeChannelName
        ? `${activeGuildName} / ${activeChannelName}`
        : (activeChannelName ?? '…')
      : (activeConversationName ?? '…');

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="flex flex-1 min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <Rss size={13} className="shrink-0 text-status-online" />
            {ping != null && (
              <span className="text-xs font-medium text-status-online">
                {t('voice.ping', { ms: ping })}
              </span>
            )}
            <span className="text-xs font-medium text-status-online">{t('voice.connected')}</span>
          </div>
          <button
            type="button"
            className="truncate text-left text-xs text-text-2 hover:text-text-1 hover:underline transition-colors duration-100 cursor-pointer"
            onClick={handleGoToCall}
          >
            {label}
          </button>
        </div>

        <IconButton
          size="small"
          variant="danger"
          aria-label={t('voice.leave')}
          title={t('voice.leave')}
          onClick={leaveCall}
        >
          <PhoneOff size={14} />
        </IconButton>
      </div>
      <Separator />
    </>
  );
};
