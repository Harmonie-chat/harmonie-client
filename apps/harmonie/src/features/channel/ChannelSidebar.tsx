import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChannelItem, ContextMenu, IconButton } from '@harmonie/ui';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { listChannels } from '@/api/guilds';
import type { Channel, ChannelList } from '@/api/guilds';
import { useGuilds } from '@/features/guild/GuildContext';
import { UserPanel } from '@/features/user/UserPanel';
import { CreateChannelModal } from './CreateChannelModal';
import { EditChannelModal, type EditChannelSection } from './EditChannelModal';

type CreateModalState = { type: 'Text' | 'Voice' } | null;
type ContextMenuState = {
  channel: Channel;
  position: { x: number; y: number };
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
  const { guilds } = useGuilds();
  const guild = guilds.find((g) => g.guildId === guildId) ?? null;
  const isAdmin = guild?.role === 'Admin';
  const [data, setData] = useState<ChannelList | null>(null);
  const [createModal, setCreateModal] = useState<CreateModalState>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [editModal, setEditModal] = useState<EditModalState>(null);

  const fetchChannels = useCallback(() => {
    if (!guildId) return;
    listChannels(guildId)
      .then(setData)
      .catch(() => {});
  }, [guildId]);

  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  const handleChannelCreated = (channel: Channel) => {
    setCreateModal(null);
    setData((prev) =>
      prev
        ? { ...prev, channels: [...prev.channels, channel] }
        : { guildId: guildId ?? '', channels: [channel] }
    );
  };

  const handleChannelUpdated = (updated: Channel) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            channels: prev.channels.map((c) => (c.channelId === updated.channelId ? updated : c)),
          }
        : prev
    );
    setEditModal(null);
  };

  const handleChannelDeleted = (channelId: string) => {
    setData((prev) =>
      prev ? { ...prev, channels: prev.channels.filter((c) => c.channelId !== channelId) } : prev
    );
    setEditModal(null);
    if (activeChannelId === channelId) {
      navigate(`/guilds/${guildId}`);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, channel: Channel) => {
    e.preventDefault();
    setContextMenu({ channel, position: { x: e.clientX, y: e.clientY } });
  };

  const openEdit = (channel: Channel, section: EditChannelSection) => {
    setContextMenu(null);
    setEditModal({ channel, section });
  };

  if (!guildId) return null;

  const allChannels = data?.channels ?? [];

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
      <aside className="flex flex-col w-60 bg-surface-1 rounded-sm shrink-0 border border-border-2">
        <header className="px-4 py-3 border-b border-border-2 bg-surface-2 rounded-t-sm">
          <h2 className="font-semibold text-text-1 truncate">{guild?.name ?? guildId}</h2>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-5">
          {/* Text channels section */}
          <section>
            <div className="flex justify-between text-text-3 mb-1 items-center">
              <p className="text-xs font-semibold uppercase tracking-wide px-2">
                {t('guild.channels.text')}
              </p>
              {isAdmin && (
                <IconButton
                  size="small"
                  variant="ghost"
                  onClick={() => setCreateModal({ type: 'Text' })}
                >
                  <Plus size={14} />
                </IconButton>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {textChannels.map((channel) => (
                <ChannelItem
                  key={channel.channelId}
                  type="text"
                  label={channel.name}
                  active={channel.channelId === activeChannelId}
                  onClick={() => navigate(`/guilds/${guildId}/channels/${channel.channelId}`)}
                  onContextMenu={isAdmin ? (e) => handleContextMenu(e, channel) : undefined}
                />
              ))}
            </div>
          </section>

          {/* Voice channels section */}
          <section>
            <div className="flex justify-between text-text-3 mb-1 items-center">
              <p className="text-xs font-semibold uppercase tracking-wide px-2">
                {t('guild.channels.voice')}
              </p>
              {isAdmin && (
                <IconButton
                  size="small"
                  variant="ghost"
                  onClick={() => setCreateModal({ type: 'Voice' })}
                >
                  <Plus size={14} />
                </IconButton>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              {voiceChannels.map((channel) => (
                <ChannelItem
                  key={channel.channelId}
                  type="voice"
                  label={channel.name}
                  active={channel.channelId === activeChannelId}
                  onClick={() => navigate(`/guilds/${guildId}/voice/${channel.channelId}`)}
                  onContextMenu={isAdmin ? (e) => handleContextMenu(e, channel) : undefined}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border-2 bg-surface-2 rounded-b-sm">
          <UserPanel />
        </div>
      </aside>

      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          items={buildContextMenuItems(contextMenu.channel)}
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
    </>
  );
};
