import { useReducer } from 'react';
import { DoorOpen, House, Mailbox, Pencil, Plus, ShieldBan, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ContextMenu, GuildAvatar, Tooltip } from '@harmonie/ui';
import { useConversations } from '@/features/conversation/ConversationContext';
import { ConversationAvatar } from '@/features/conversation/avatar/ConversationAvatar';
import { getConversationLabel } from '@/features/conversation/conversationUtils';
import { useMessageActivity } from '@/features/realtime/MessageActivityContext';
import { useUser } from '@/features/user/UserContext';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { useGuilds } from './GuildContext';
import { GuildCreateOrJoinModal } from '@/features/guild/join/GuildCreateOrJoinModal';
import { useGuildPermissions } from '@/features/guild/useGuildPermissions';
import type { Conversation } from '@/types/conversation';
import type { Guild } from '@/types/guild';
import { GuildSettingsModal } from '@/features/guild/settings/GuildSettingsModal';
import { AdminSectionMenu } from '@/features/guild/settings/adminSection';

const UnreadConversationShortcut = ({
  conversation,
  currentUserId,
  onClick,
}: {
  conversation: Conversation;
  currentUserId?: string;
  onClick: () => void;
}) => {
  const label = getConversationLabel(conversation, currentUserId);

  return (
    <div className="relative">
      <Tooltip content={label} side="right">
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          className="size-10 rounded-xl flex items-center justify-center shrink-0 bg-surface-2 cursor-pointer transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-surface-3 hover:scale-[1.1] active:scale-[0.97]"
        >
          <ConversationAvatar
            conversation={conversation}
            label={label}
            currentUserId={currentUserId}
          />
        </button>
      </Tooltip>
      <span
        aria-hidden="true"
        className="absolute top-1 right-0 size-2.5 rounded-full bg-primary ring-2 ring-background"
      />
    </div>
  );
};

const GuildSidebarItem = ({
  guild,
  isActive,
  onClick,
  onOpenContextMenu,
  hasUnread,
}: {
  guild: Guild;
  isActive: boolean;
  onClick: () => void;
  onOpenContextMenu: (e: React.MouseEvent, guild: Guild) => void;
  hasUnread: boolean;
}) => {
  const iconUrl = useFileBlobUrl(guild.iconFileId);
  const { canOpenGuildContextMenu } = useGuildPermissions(guild);

  return (
    <div className="relative">
      <Tooltip content={guild.name} side="right">
        <button
          type="button"
          onClick={onClick}
          onContextMenu={canOpenGuildContextMenu ? (e) => onOpenContextMenu(e, guild) : undefined}
          aria-label={guild.name}
          className={[
            'size-10 rounded-xl flex items-center justify-center shrink-0 bg-transparent cursor-pointer first:mt-1 last:mb-1 transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.1] active:scale-[0.97]',
            isActive ? 'ring-2 ring-primary' : 'hover:opacity-90',
          ].join(' ')}
        >
          <GuildAvatar
            iconUrl={iconUrl}
            alt={guild.name}
            icon={guild.icon?.name ?? undefined}
            color={guild.icon?.color ?? undefined}
            bg={guild.icon?.bg ?? undefined}
            size={34}
          />
        </button>
      </Tooltip>
      {hasUnread && (
        <span className="absolute top-1 right-0 size-2.5 rounded-full bg-primary ring-2 ring-background" />
      )}
    </div>
  );
};

interface GuildSidebarState {
  addMenu: { x: number; y: number } | null;
  createOrJoinMode: 'create' | 'join' | null;
  contextMenu: {
    guild: Guild;
    position: { x: number; y: number };
  } | null;
  editSection: AdminSectionMenu;
  editGuild: Guild | null;
}

type GuildSidebarAction = { type: 'patch'; patch: Partial<GuildSidebarState> };

const guildSidebarInitialState: GuildSidebarState = {
  addMenu: null,
  createOrJoinMode: null,
  contextMenu: null,
  editSection: 'identity',
  editGuild: null,
};

const guildSidebarReducer = (
  state: GuildSidebarState,
  action: GuildSidebarAction
): GuildSidebarState => {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
  }
};

export const GuildSidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { guildId: activeGuildId } = useParams<{ guildId: string }>();
  const location = useLocation();
  const isConversationsRoute = location.pathname.startsWith('/conversations');
  const { guilds, fetchGuilds } = useGuilds();
  const { conversations } = useConversations();
  const { user } = useUser();
  const { hasUnreadGuild, hasUnreadConversation, hasAnyUnreadConversation } = useMessageActivity();
  const unreadConversations =
    conversations?.filter((conversation) => hasUnreadConversation(conversation.conversationId)) ??
    [];
  const [state, dispatch] = useReducer(guildSidebarReducer, guildSidebarInitialState);
  const { addMenu, createOrJoinMode, contextMenu, editSection, editGuild } = state;

  const handleGuildContextMenu = (e: React.MouseEvent, guild: Guild) => {
    e.preventDefault();
    dispatch({
      type: 'patch',
      patch: { contextMenu: { guild, position: { x: e.clientX, y: e.clientY } } },
    });
  };

  const handleContextMenuClick = (editSection: AdminSectionMenu, guild: Guild) => {
    dispatch({ type: 'patch', patch: { editSection, editGuild: guild, contextMenu: null } });
  };

  const { canAccessDangerZone, canLeaveGuild, canManageGuild } = useGuildPermissions(
    contextMenu?.guild
  );

  const guildContextMenuItems = contextMenu
    ? [
        ...(canManageGuild
          ? [
              {
                label: t('guild.contextMenu.edit'),
                icon: <Pencil size={14} />,
                onClick: () => handleContextMenuClick('identity', contextMenu.guild),
              },
              {
                label: t('guild.contextMenu.invite'),
                icon: <Mailbox size={14} />,
                onClick: () => handleContextMenuClick('invites', contextMenu.guild),
              },
              {
                label: t('guild.contextMenu.ban'),
                icon: <ShieldBan size={14} />,
                onClick: () => handleContextMenuClick('bans', contextMenu.guild),
              },
            ]
          : []),
        ...(canAccessDangerZone
          ? [
              {
                label: t('guild.contextMenu.delete'),
                icon: <Trash2 size={14} />,
                onClick: () => handleContextMenuClick('danger', contextMenu.guild),
              },
            ]
          : []),
        ...(canLeaveGuild
          ? [
              {
                label: t('guild.contextMenu.leave'),
                icon: <DoorOpen size={14} />,
                onClick: () => handleContextMenuClick('leave', contextMenu.guild),
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <nav className="flex flex-col items-center gap-2 w-14 py-2 shrink-0">
        <div
          className="flex flex-col items-center gap-2 flex-1 overflow-y-auto w-full px-2 py-1 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none' }}
        >
          {/* Home button for conversations */}
          <div className="relative">
            <Tooltip content={t('conversation.home')} side="right">
              <button
                type="button"
                onClick={() => navigate('/conversations')}
                aria-label={t('conversation.home')}
                className={[
                  'size-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.1] active:scale-[0.97]',
                  isConversationsRoute
                    ? 'bg-primary text-primary-fg'
                    : 'bg-surface-2 text-text-2 hover:bg-surface-3',
                ].join(' ')}
              >
                <House size={18} />
              </button>
            </Tooltip>
            {hasAnyUnreadConversation() && !isConversationsRoute && (
              <span className="absolute top-1 right-0 size-2.5 rounded-full bg-primary ring-2 ring-background" />
            )}
          </div>
          {unreadConversations.map((conversation) => (
            <UnreadConversationShortcut
              key={conversation.conversationId}
              conversation={conversation}
              currentUserId={user?.userId}
              onClick={() => navigate(`/conversations/${conversation.conversationId}`)}
            />
          ))}
          <hr className="w-8 border-t border-border-2 my-0" />
          {/* List of guilds */}
          {guilds.map((guild) => {
            return (
              <GuildSidebarItem
                key={guild.guildId}
                guild={guild}
                isActive={guild.guildId === activeGuildId}
                hasUnread={hasUnreadGuild(guild.guildId)}
                onClick={() => navigate(`/guilds/${guild.guildId}`)}
                onOpenContextMenu={handleGuildContextMenu}
              />
            );
          })}
          {/* Button to add or join a guild */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              dispatch({ type: 'patch', patch: { addMenu: { x: e.clientX, y: e.clientY } } });
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              dispatch({ type: 'patch', patch: { addMenu: { x: e.clientX, y: e.clientY } } });
            }}
            aria-label={t('guild.createJoin.title')}
            className={[
              'size-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer bg-surface-2 text-text-2 hover:bg-surface-3 transform-gpu transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] active:scale-[0.97]',
              addMenu ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : '',
            ].join(' ')}
          >
            <Plus size={18} />
          </button>
        </div>
      </nav>
      {/* Context menu for adding or joining a guild */}
      {addMenu && (
        <ContextMenu
          position={addMenu}
          onClose={() => dispatch({ type: 'patch', patch: { addMenu: null } })}
          items={[
            {
              label: t('guild.createJoin.createTitle'),
              icon: <Plus size={14} />,
              onClick: () => {
                dispatch({
                  type: 'patch',
                  patch: { createOrJoinMode: 'create', addMenu: null },
                });
              },
            },
            {
              label: t('guild.createJoin.joinTitle'),
              icon: <Mailbox size={14} />,
              onClick: () => {
                dispatch({
                  type: 'patch',
                  patch: { createOrJoinMode: 'join', addMenu: null },
                });
              },
            },
          ]}
        />
      )}
      {/* Model to join or create a guild */}
      {createOrJoinMode && (
        <GuildCreateOrJoinModal
          mode={createOrJoinMode}
          onClose={() => dispatch({ type: 'patch', patch: { createOrJoinMode: null } })}
        />
      )}
      {/* Context menu for guild actions */}
      {contextMenu && (
        <ContextMenu
          position={contextMenu.position}
          onClose={() => dispatch({ type: 'patch', patch: { contextMenu: null } })}
          items={guildContextMenuItems}
        />
      )}
      {editGuild && (
        <GuildSettingsModal
          guild={editGuild}
          initialSection={editSection}
          onClose={() => dispatch({ type: 'patch', patch: { editGuild: null } })}
          onUpdated={() => {
            dispatch({ type: 'patch', patch: { editGuild: null } });
            fetchGuilds();
          }}
          onDeleted={() => {
            dispatch({ type: 'patch', patch: { editGuild: null } });
            fetchGuilds();
            navigate('/conversations');
          }}
          onLeave={() => {
            dispatch({ type: 'patch', patch: { editGuild: null } });
            fetchGuilds();
            navigate('/conversations');
          }}
        />
      )}
    </>
  );
};
