import { useParams, Navigate } from 'react-router-dom';
import { useChannels } from '@/features/channel/ChannelContext';

// Redirects to the default text channel of a guild when landing on /guilds/:guildId
export const GuildRedirect = () => {
  const { guildId } = useParams<{ guildId: string }>();
  const { channels } = useChannels();

  // Still loading — wait before redirecting
  if (!guildId || channels === null) return null;

  const textChannels = channels
    .filter((c) => c.type === 'Text')
    .sort((a, b) => a.position - b.position);

  const target = textChannels.find((c) => c.isDefault) ?? textChannels[0];

  if (!target) return null;

  return <Navigate to={`/guilds/${guildId}/channels/${target.channelId}`} replace />;
};
