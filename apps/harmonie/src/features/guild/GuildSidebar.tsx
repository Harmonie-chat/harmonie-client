import { useNavigate, useParams } from 'react-router-dom';
import { useGuilds } from './GuildContext';

const GUILD_COLORS = [
  'bg-[--color-cat-1]',
  'bg-[--color-cat-2]',
  'bg-[--color-cat-3]',
  'bg-[--color-cat-4]',
  'bg-[--color-cat-5]',
];

const guildColor = (index: number) => GUILD_COLORS[index % GUILD_COLORS.length];

const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const GuildSidebar = () => {
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const { guilds } = useGuilds();

  return (
    <nav className="flex flex-col items-center gap-2 w-16 py-3 bg-surface-1 border border-border-2 shrink-0 rounded-sm">
      <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full px-2">
        {guilds.map((guild, i) => {
          const isActive = guild.guildId === activeGuildId;
          return (
            <button
              key={guild.guildId}
              onClick={() => navigate(`/guilds/${guild.guildId}`)}
              title={guild.name}
              className={[
                'w-10 h-10 rounded-md flex items-center justify-center text-sm font-semibold transition-all shrink-0',
                isActive
                  ? 'bg-primary text-primary-fg rounded-sm'
                  : `${guildColor(i)} text-text-1 hover:rounded-sm`,
              ].join(' ')}
            >
              {getInitials(guild.name)}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
