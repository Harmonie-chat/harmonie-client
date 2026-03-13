import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hash, Volume2 } from 'lucide-react';
import { listChannels } from '@/api/guilds';
import type { Channel, ChannelList } from '@/api/guilds';
import { useGuilds } from '@/features/guild/GuildContext';
import { UserPanel } from '@/features/user/UserPanel';

const TextChannelItem = ({
  channel,
  guildId,
  isActive,
}: {
  channel: Channel;
  guildId: string;
  isActive: boolean;
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/guilds/${guildId}/channels/${channel.channelId}`)}
      className={[
        'flex items-center gap-2 w-full px-2 py-1 rounded-sm text-sm transition-colors text-left',
        isActive
          ? 'bg-surface-hover text-text-1 font-medium'
          : 'text-text-2 hover:bg-surface-hover hover:text-text-1',
      ].join(' ')}
    >
      <Hash size={16} className="shrink-0 text-text-3" />
      <span className="truncate">{channel.name}</span>
    </button>
  );
};

const VoiceChannelItem = ({
  channel,
  guildId,
  isActive,
}: {
  channel: Channel;
  guildId: string;
  isActive: boolean;
}) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/guilds/${guildId}/voice/${channel.channelId}`)}
      className={[
        'flex items-center gap-2 w-full px-2 py-1 rounded-[8px] text-sm transition-colors text-left',
        isActive
          ? 'bg-surface-hover text-text-1 font-medium'
          : 'text-text-2 hover:bg-surface-hover hover:text-text-1',
      ].join(' ')}
    >
      <Volume2 size={16} className="flex-shrink-0 text-text-3" />
      <span className="truncate">{channel.name}</span>
    </button>
  );
};

export const ChannelSidebar = () => {
  const { t } = useTranslation();
  const { guildId, channelId: activeChannelId } = useParams<{
    guildId: string;
    channelId: string;
  }>();
  const { guilds } = useGuilds();
  const guild = guilds.find((g) => g.guildId === guildId) ?? null;
  const [data, setData] = useState<ChannelList | null>(null);

  useEffect(() => {
    if (!guildId) return;
    listChannels(guildId)
      .then(setData)
      .catch(() => {});
  }, [guildId]);

  if (!guildId) return null;

  const textChannels = (data?.channels ?? [])
    .filter((c) => c.type === 'Text')
    .sort((a, b) => a.position - b.position);

  const voiceChannels = (data?.channels ?? [])
    .filter((c) => c.type === 'Voice')
    .sort((a, b) => a.position - b.position);

  return (
    <aside className="flex flex-col w-60 bg-surface-1 rounded-sm shrink-0 border border-border-2">
      <header className="px-4 py-3 border-b border-border-2 bg-surface-2 rounded-t-sm">
        <h2 className="font-semibold text-text-1 truncate">{guild?.name ?? guildId}</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-4">
        {textChannels.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wide px-2 mb-1">
              {t('guild.channels.text')}
            </p>
            <div className="flex flex-col gap-0.5">
              {textChannels.map((ch) => (
                <TextChannelItem
                  key={ch.channelId}
                  channel={ch}
                  guildId={guildId}
                  isActive={ch.channelId === activeChannelId}
                />
              ))}
            </div>
          </section>
        )}

        {voiceChannels.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-text-3 uppercase tracking-wide px-2 mb-1">
              {t('guild.channels.voice')}
            </p>
            <div className="flex flex-col gap-0.5">
              {voiceChannels.map((ch) => (
                <VoiceChannelItem
                  key={ch.channelId}
                  channel={ch}
                  guildId={guildId}
                  isActive={ch.channelId === activeChannelId}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="border-t border-border-2 bg-surface-2 rounded-b-sm">
        <UserPanel />
      </div>
    </aside>
  );
};
