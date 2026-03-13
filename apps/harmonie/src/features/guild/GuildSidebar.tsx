import { useNavigate, useParams } from 'react-router-dom';
import { GuildAvatar } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useGuilds } from './GuildContext';
import type { Guild } from '@/api/guilds';

const GuildSidebarItem = ({
  guild,
  isActive,
  onClick,
}: {
  guild: Guild;
  isActive: boolean;
  onClick: () => void;
}) => {
  const iconUrl = useFileBlobUrl(guild.iconFileId);

  return (
    <button
      onClick={onClick}
      title={guild.name}
      className={[
        'w-10 h-10 rounded-sm flex items-center justify-center transition-all shrink-0 bg-transparent',
        isActive ? 'ring ring-primary' : 'hover:bg-surface-2',
      ].join(' ')}
    >
      <GuildAvatar
        iconUrl={iconUrl}
        alt={guild.name}
        icon={guild.icon?.name ?? undefined}
        color={guild.icon?.color ?? undefined}
        bg={guild.icon?.bg ?? undefined}
        size={32}
      />
    </button>
  );
};

export const GuildSidebar = () => {
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const { guilds } = useGuilds();

  return (
    <nav className="flex flex-col items-center gap-2 w-16 py-2 bg-surface-1 border border-border-2 shrink-0 rounded-sm">
      <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full px-2 py-1">
        {guilds.map((guild) => {
          return (
            <GuildSidebarItem
              key={guild.guildId}
              guild={guild}
              isActive={guild.guildId === activeGuildId}
              onClick={() => navigate(`/guilds/${guild.guildId}`)}
            />
          );
        })}
      </div>
    </nav>
  );
};
