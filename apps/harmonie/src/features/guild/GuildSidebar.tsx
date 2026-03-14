import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ContextMenu, GuildAvatar } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useGuilds } from './GuildContext';
import { GuildCreateOrJoinModal } from './GuildCreateOrJoinModal';
import type { Guild } from '@/api/guilds';
import { EditGuildModal } from './EditGuildModal';

const GuildSidebarItem = ({
  guild,
  isActive,
  onClick,
  onContextMenu,
}: {
  guild: Guild;
  isActive: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}) => {
  const iconUrl = useFileBlobUrl(guild.iconFileId);

  return (
    <button
      onClick={onClick}
      onContextMenu={onContextMenu}
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
  const { guilds, refresh } = useGuilds();
  const [isCreateOrJoinOpen, setIsCreateOrJoinOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    guild: Guild;
    position: { x: number; y: number };
  } | null>(null);
  const [editSection, setEditSection] = useState<'identity' | 'danger'>('identity');
  const [editGuild, setEditGuild] = useState<Guild | null>(null);

  const handleGuildContextMenu = (e: React.MouseEvent, guild: Guild) => {
    e.preventDefault();
    setContextMenu({ guild, position: { x: e.clientX, y: e.clientY } });
  };

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
                onContextMenu={
                  guild.role === 'Admin' ? (e) => handleGuildContextMenu(e, guild) : undefined
                }
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
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: t('guild.contextMenu.edit'),
              icon: <Pencil size={14} />,
              onClick: () => {
                setEditSection('identity');
                setEditGuild(contextMenu.guild);
                setContextMenu(null);
              },
            },
            {
              label: t('guild.contextMenu.delete'),
              icon: <Trash2 size={14} />,
              onClick: () => {
                setEditSection('danger');
                setEditGuild(contextMenu.guild);
                setContextMenu(null);
              },
            },
          ]}
        />
      )}
      {editGuild && (
        <EditGuildModal
          guild={editGuild}
          initialSection={editSection}
          onClose={() => setEditGuild(null)}
          onUpdated={() => {
            setEditGuild(null);
            refresh();
          }}
          onDeleted={() => {
            setEditGuild(null);
            refresh();
            navigate('/');
          }}
        />
      )}
    </>
  );
};
