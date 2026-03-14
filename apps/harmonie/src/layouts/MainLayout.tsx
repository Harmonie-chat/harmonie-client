import { Outlet } from 'react-router-dom';
import { GuildProvider, useGuilds } from '@/features/guild/GuildContext';
import { GuildSidebar } from '@/features/guild/GuildSidebar';
import { ChannelSidebar } from '@/features/channel/ChannelSidebar';
import { ChannelProvider } from '@/features/channel/ChannelContext';

const AppShell = () => {
  const { guilds } = useGuilds();
  const hasGuilds = guilds.length > 0;

  return (
    <ChannelProvider>
      <div className="flex h-screen bg-background p-2 gap-2 overflow-hidden">
        {hasGuilds && <GuildSidebar />}
        {hasGuilds && <ChannelSidebar />}
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </ChannelProvider>
  );
};

export const MainLayout = () => (
  <GuildProvider>
    <AppShell />
  </GuildProvider>
);
