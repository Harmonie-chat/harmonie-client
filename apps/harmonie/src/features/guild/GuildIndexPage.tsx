import { Navigate } from 'react-router-dom';
import { useGuilds } from './GuildContext';
import { NoGuildPage } from './NoGuildPage';

export const GuildIndexPage = () => {
  const { guilds, isLoading } = useGuilds();

  if (isLoading) return null;

  if (guilds.length === 0) return <NoGuildPage />;

  return <Navigate to={`/guilds/${guilds[0].guildId}`} replace />;
};
