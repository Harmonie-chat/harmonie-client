import { Outlet } from 'react-router-dom';
import { GuildProvider, useGuilds } from '@/features/guild/GuildContext';
import { GuildSidebar } from '@/features/guild/GuildSidebar';
import { ChannelSidebar } from '@/features/channel/ChannelSidebar';

const AppShell = () => {
  const { guilds } = useGuilds();
  const hasGuilds = guilds.length > 0;

  return (
    <div className="flex h-screen bg-background p-2 gap-2 overflow-hidden">
      {hasGuilds && <GuildSidebar />}
      {hasGuilds && <ChannelSidebar />}
      <main className="flex-1 overflow-hidden bg-surface-1">
        <Outlet />
      </main>
    </div>
  );
};

export const MainLayout = () => (
  <GuildProvider>
    <AppShell />
  </GuildProvider>
);
