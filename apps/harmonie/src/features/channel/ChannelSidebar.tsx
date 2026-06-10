import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContextMenu, IconButton } from '@harmonie/ui';
import { Plus, Pencil, Settings, Trash2 } from 'lucide-react';
import { GuildSettingsModal } from '@/features/guild/settings/GuildSettingsModal';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import type { Channel, Guild } from '@/types/guild';
import { useCurrentGuild, useGuilds } from '@/features/guild/GuildContext';
import { useMessageActivity } from '@/features/realtime/MessageActivityContext';
import { useChannels } from './ChannelContext';
import { CreateChannelModal } from './create-edit/CreateChannelModal';
import { EditChannelModal, type EditChannelSection } from './create-edit/EditChannelModal';
import { ChannelSection } from './ChannelSection';

type CreateModalState = { type: 'Text' | 'Voice' } | null;
type ContextMenuState = {
  channel: Channel;
  position: { x: number; y: number };
  horizontalAnchor?: 'left' | 'right';
} | null;
type EditModalState = {
  channel: Channel;
  section: EditChannelSection;
} | null;

export const ChannelSidebar = () => {
  const { t } = useTranslation();
  const { guildId, channelId: activeChannelId } = useParams<{
    guildId: string;
    channelId: string;
  }>();
  const navigate = useNavigate();
  const { guild } = useCurrentGuild();
  const { fetchGuilds } = useGuilds();
  const { canManageChannels, canManageGuild } = useGuildPermissions(guild);
  const canReorder = canManageChannels;
  const { channels, addChannel, updateChannel, removeChannel } = useChannels();
  const { hasUnreadChannel } = useMessageActivity();
  const [createModal, setCreateModal] = useState<CreateModalState>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [editModal, setEditModal] = useState<EditModalState>(null);
  const [settingsGuild, setSettingsGuild] = useState<Guild | null>(null);

  const handleChannelCreated = (channel: Channel) => {
    setCreateModal(null);
    addChannel(channel);
  };

  const handleChannelUpdated = (updated: Channel) => {
    updateChannel(updated);
    setEditModal(null);
  };

  const handleChannelDeleted = (channelId: string) => {
    removeChannel(channelId);
    setEditModal(null);
    if (activeChannelId === channelId) {
      navigate(`/guilds/${guildId}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, channel: Channel) => {
    e.preventDefault();
    setContextMenu({ channel, position: { x: e.clientX, y: e.clientY } });
  };

  const handleLongPress = (position: { x: number; y: number }, channel: Channel) => {
    setContextMenu({ channel, position });
  };

  const handleMenuButtonClick = (_e: React.MouseEvent<HTMLButtonElement>, channel: Channel) => {
    openEdit(channel, 'rename');
  };

  const openEdit = (channel: Channel, section: EditChannelSection) => {
    setContextMenu(null);
    setEditModal({ channel, section });
  };

  if (!guildId) return null;

  const isLoading = channels === null;
  const allChannels = channels ?? [];

  const textChannels = allChannels
    .filter((c) => c.type === 'Text')
    .sort((a, b) => a.position - b.position);

  const voiceChannels = allChannels
    .filter((c) => c.type === 'Voice')
    .sort((a, b) => a.position - b.position);

  const nextPosition = Math.max(...allChannels.map((c) => c.position), 0) + 1;

  const buildContextMenuItems = (channel: Channel) => {
    const items = [
      {
        label: t('guild.channels.contextMenu.rename'),
        icon: <Pencil size={14} />,
        onClick: () => openEdit(channel, 'rename'),
      },
    ];
    if (!channel.isDefault) {
      items.push({
        label: t('guild.channels.contextMenu.delete'),
        icon: <Trash2 size={14} />,
        onClick: () => openEdit(channel, 'danger'),
      });
    }
    return items;
  };

  return (
    <>
      <aside className="flex min-h-0 w-0 flex-1 flex-col overflow-hidden bg-surface-1 md:w-60 md:flex-none md:shrink-0 md:rounded-md">
        <header className="pl-4 pr-2 h-14 bg-surface-2 md:rounded-t-md flex items-center justify-between gap-2">
          <h2 className="font-semibold text-text-1 truncate">{guild?.name ?? guildId}</h2>
          {canManageGuild && guild && (
            <IconButton
              size="small"
              variant="ghost"
              onClick={() => setSettingsGuild(guild)}
              aria-label={t('guild.contextMenu.edit')}
              title={t('guild.contextMenu.edit')}
              tooltipSide="right"
            >
              <Settings size={14} />
            </IconButton>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-5">
          {isLoading ? (
            // Skeleton shown while channels are being fetched for the new guild
            <div className="flex flex-col gap-4 px-2 pt-1 animate-pulse">
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-24 rounded bg-border-2" />
                <div className="h-7 rounded bg-border-2" />
                <div className="h-7 rounded bg-border-2" />
                <div className="h-7 rounded bg-border-2" />
              </div>
              <div className="flex flex-col gap-2">
                <div className="h-2.5 w-20 rounded bg-border-2" />
                <div className="h-7 rounded bg-border-2" />
                <div className="h-7 rounded bg-border-2" />
              </div>
            </div>
          ) : (
            <>
              {/* Text channels section */}
              <section>
                <div className="flex justify-between text-text-2 mb-1 items-center h-7">
                  <p className="text-xs font-semibold uppercase tracking-wide px-2">
                    {t('guild.channels.text')}
                  </p>
                  {canManageChannels && (
                    <IconButton
                      size="small"
                      variant="ghost"
                      onClick={() => setCreateModal({ type: 'Text' })}
                    >
                      <Plus size={14} />
                    </IconButton>
                  )}
                </div>
                <ChannelSection
                  sectionChannels={textChannels}
                  type="Text"
                  canReorder={canReorder}
                  hasUnread={hasUnreadChannel}
                  onContextMenu={canManageChannels ? handleContextMenu : undefined}
                  onLongPress={canManageChannels ? handleLongPress : undefined}
                  onMenuClick={canManageChannels ? handleMenuButtonClick : undefined}
                  menuLabel={t('guild.channels.edit.title')}
                />
              </section>

              {/* Voice channels section */}
              <section>
                <div className="flex justify-between text-text-2 mb-1 items-center">
                  <p className="text-xs font-semibold uppercase tracking-wide px-2">
                    {t('guild.channels.voice')}
                  </p>
                  {canManageChannels && (
                    <IconButton
                      size="small"
                      variant="ghost"
                      onClick={() => setCreateModal({ type: 'Voice' })}
                    >
                      <Plus size={14} />
                    </IconButton>
                  )}
                </div>
                <ChannelSection
                  sectionChannels={voiceChannels}
                  type="Voice"
                  canReorder={canReorder}
                  onContextMenu={canManageChannels ? handleContextMenu : undefined}
                  onLongPress={canManageChannels ? handleLongPress : undefined}
                  onMenuClick={canManageChannels ? handleMenuButtonClick : undefined}
                  menuLabel={t('guild.channels.edit.title')}
                />
              </section>
            </>
          )}
        </div>
      </aside>

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          items={buildContextMenuItems(contextMenu.channel)}
          horizontalAnchor={contextMenu.horizontalAnchor}
        />
      )}

      {createModal && (
        <CreateChannelModal
          guildId={guildId}
          defaultType={createModal.type}
          nextPosition={nextPosition}
          onClose={() => setCreateModal(null)}
          onCreated={handleChannelCreated}
        />
      )}

      {editModal && (
        <EditChannelModal
          channel={editModal.channel}
          initialSection={editModal.section}
          onClose={() => setEditModal(null)}
          onUpdated={handleChannelUpdated}
          onDeleted={handleChannelDeleted}
        />
      )}

      {settingsGuild && (
        <GuildSettingsModal
          guild={settingsGuild}
          onClose={() => setSettingsGuild(null)}
          onUpdated={() => {
            setSettingsGuild(null);
            fetchGuilds();
          }}
          onDeleted={() => {
            setSettingsGuild(null);
            fetchGuilds();
            navigate('/conversations');
          }}
          onLeave={() => {
            setSettingsGuild(null);
            fetchGuilds();
            navigate('/conversations');
          }}
        />
      )}
    </>
  );
};
