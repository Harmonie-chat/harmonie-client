import { useNavigate, useParams } from 'react-router-dom';
import { GuildAvatar } from '@harmonie/ui';
import { useGuilds } from './GuildContext';

export const GuildSidebar = () => {
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const { guilds } = useGuilds();

  return (
    <nav className="flex flex-col items-center gap-2 w-16 py-2 bg-surface-1 border border-border-2 shrink-0 rounded-sm">
      <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full px-2 py-1">
        {guilds.map((guild) => {
          const iconName = guild.icon?.name;
          const iconColor = guild.icon?.color;
          const iconBg = guild.icon?.bg;
          const iconUrl = guild.iconUrl || undefined;

          return (
            <button
              key={guild.guildId}
              onClick={() => navigate(`/guilds/${guild.guildId}`)}
              title={guild.name}
              className={[
                'w-10 h-10 rounded-sm flex items-center justify-center transition-all shrink-0 bg-transparent',
                guild.guildId === activeGuildId ? 'ring ring-primary' : 'hover:bg-surface-2',
              ].join(' ')}
            >
              <GuildAvatar
                iconUrl={iconUrl}
                alt={guild.name}
                icon={iconName}
                color={iconColor}
                bg={iconBg}
                size={32}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};
