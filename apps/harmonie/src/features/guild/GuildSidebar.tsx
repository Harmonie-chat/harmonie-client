import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const { guilds } = useGuilds();

  return (
    <nav className="flex flex-col items-center gap-2 w-16 py-3 bg-surface-1 border-r border-border-2 flex-shrink-0">
      <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full px-2">
        {guilds.map((guild, i) => {
          const isActive = guild.guildId === activeGuildId;
          return (
            <button
              key={guild.guildId}
              onClick={() => navigate(`/guilds/${guild.guildId}`)}
              title={guild.name}
              className={[
                'w-10 h-10 rounded-[14px] flex items-center justify-center text-sm font-semibold transition-all flex-shrink-0',
                isActive
                  ? 'bg-primary text-primary-fg rounded-[8px]'
                  : `${guildColor(i)} text-text-1 hover:rounded-[8px]`,
              ].join(' ')}
            >
              {getInitials(guild.name)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center px-2 w-full">
        <div className="w-8 h-px bg-border-2 mb-2" />
        <button
          onClick={() => navigate('/')}
          title={t('guild.createTitle')}
          className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-surface-2 text-primary hover:bg-primary hover:text-primary-fg hover:rounded-[8px] transition-all"
        >
          <Plus size={20} />
        </button>
      </div>
    </nav>
  );
};
