import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { GuildAvatar } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useGuilds } from './GuildContext';
import { GuildCreateOrJoinModal } from './GuildCreateOrJoinModal';
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
        'w-10 h-10 rounded-sm flex items-center justify-center shrink-0 bg-transparent cursor-pointer first:mt-1 last:mb-1 transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.14] hover:-translate-y-0.5 active:scale-[1.02] active:translate-y-0',
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const { guilds } = useGuilds();
  const [isCreateOrJoinOpen, setIsCreateOrJoinOpen] = useState(false);

  return (
    <>
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
        <button
          onClick={() => setIsCreateOrJoinOpen(true)}
          title={t('guild.createJoin.title')}
          className={[
            'w-10 h-10 rounded-sm flex items-center justify-center shrink-0 cursor-pointer bg-surface-2 text-text-1 border border-dashed border-border-2 hover:bg-surface-hover transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:-translate-y-px active:scale-[1.01] active:translate-y-0',
            isCreateOrJoinOpen ? 'ring ring-primary' : '',
          ].join(' ')}
        >
          <Plus size={18} />
        </button>
      </nav>
      {isCreateOrJoinOpen && (
        <GuildCreateOrJoinModal onClose={() => setIsCreateOrJoinOpen(false)} />
      )}
    </>
  );
};
