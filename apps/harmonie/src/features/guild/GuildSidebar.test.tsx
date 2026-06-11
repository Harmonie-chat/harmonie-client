import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Guild } from '@/types/guild';
import { GuildSidebar } from './GuildSidebar';

const routerMocks = vi.hoisted(() => ({
  locationPathname: '/guilds/guild-admin',
  navigate: vi.fn(),
  params: { guildId: 'guild-admin' as string | undefined },
}));

const guildMocks = vi.hoisted(() => ({
  fetchGuilds: vi.fn(),
  guilds: [] as Guild[],
  hasAnyUnreadConversation: vi.fn(),
  hasUnreadGuild: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  DoorOpen: ({ size }: { size?: number }) => <span data-testid="door-icon">{size}</span>,
  House: ({ size }: { size?: number }) => <span data-testid="house-icon">{size}</span>,
  Mailbox: ({ size }: { size?: number }) => <span data-testid="mailbox-icon">{size}</span>,
  Pencil: ({ size }: { size?: number }) => <span data-testid="pencil-icon">{size}</span>,
  Plus: ({ size }: { size?: number }) => <span data-testid="plus-icon">{size}</span>,
  ShieldBan: ({ size }: { size?: number }) => <span data-testid="ban-icon">{size}</span>,
  Trash2: ({ size }: { size?: number }) => <span data-testid="trash-icon">{size}</span>,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: routerMocks.locationPathname }),
  useNavigate: () => routerMocks.navigate,
  useParams: () => routerMocks.params,
}));

vi.mock('@harmonie/ui', () => ({
  ContextMenu: ({
    items,
    onClose,
  }: {
    items: Array<{ label: string; onClick: () => void }>;
    onClose: () => void;
    position: { x: number; y: number };
  }) => (
    <div role="menu">
      {items.map((item) => (
        <button key={item.label} type="button" onClick={item.onClick}>
          {item.label}
        </button>
      ))}
      <button type="button" onClick={onClose}>
        close menu
      </button>
    </div>
  ),
  GuildAvatar: ({
    alt,
    bg,
    color,
    icon,
    iconUrl,
    size,
  }: {
    alt: string;
    bg?: string;
    color?: string;
    icon?: string;
    iconUrl?: string;
    size?: number;
  }) => (
    <span
      data-testid={`guild-avatar-${alt}`}
      data-bg={bg}
      data-color={color}
      data-icon={icon}
      data-icon-url={iconUrl}
      data-size={size}
    />
  ),
  Tooltip: ({ children }: { children: ReactNode; content: string; side?: string }) => (
    <>{children}</>
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : undefined),
}));

vi.mock('@/features/realtime/MessageActivityContext', () => ({
  useMessageActivity: () => ({
    hasAnyUnreadConversation: guildMocks.hasAnyUnreadConversation,
    hasUnreadGuild: guildMocks.hasUnreadGuild,
  }),
}));

vi.mock('./GuildContext', () => ({
  useGuilds: () => ({
    fetchGuilds: guildMocks.fetchGuilds,
    guilds: guildMocks.guilds,
  }),
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: (guild?: Guild | null) => {
    const isOwner = guild?.ownerUserId === 'user-current';
    const isAdmin = guild?.role === 'Admin';
    const canManageGuild = Boolean(guild && (isAdmin || isOwner));
    return {
      canAccessDangerZone: Boolean(guild && isOwner),
      canLeaveGuild: Boolean(guild && !isOwner),
      canManageGuild,
      canOpenGuildContextMenu: Boolean(guild),
    };
  },
}));

vi.mock('@/features/guild/join/GuildCreateOrJoinModal', () => ({
  GuildCreateOrJoinModal: ({ mode, onClose }: { mode: 'create' | 'join'; onClose: () => void }) => (
    <div role="dialog" aria-label={`guild modal ${mode}`}>
      <span>{mode}</span>
      <button type="button" onClick={onClose}>
        close guild modal
      </button>
    </div>
  ),
}));

vi.mock('@/features/guild/settings/GuildSettingsModal', () => ({
  GuildSettingsModal: ({
    guild,
    initialSection,
    onClose,
    onDeleted,
    onLeave,
    onUpdated,
  }: {
    guild: Guild;
    initialSection: string;
    onClose: () => void;
    onDeleted: () => void;
    onLeave: () => void;
    onUpdated: () => void;
  }) => (
    <div role="dialog" aria-label={`settings ${initialSection}`}>
      <span>{guild.name}</span>
      <button type="button" onClick={onUpdated}>
        updated
      </button>
      <button type="button" onClick={onDeleted}>
        deleted
      </button>
      <button type="button" onClick={onLeave}>
        left
      </button>
      <button type="button" onClick={onClose}>
        close settings
      </button>
    </div>
  ),
}));

const guilds: Guild[] = [
  {
    guildId: 'guild-admin',
    name: 'Admin Guild',
    ownerUserId: 'owner-user',
    role: 'Admin',
    joinedAtUtc: '2026-01-01T00:00:00Z',
    iconFileId: 'icon-admin',
    icon: { name: 'Castle', color: '#111111', bg: '#eeeeee' },
  },
  {
    guildId: 'guild-owner',
    name: 'Owner Guild',
    ownerUserId: 'user-current',
    role: 'Member',
    joinedAtUtc: '2026-01-02T00:00:00Z',
    iconFileId: null,
    icon: null,
  },
];

describe('GuildSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.locationPathname = '/guilds/guild-admin';
    routerMocks.params = { guildId: 'guild-admin' };
    guildMocks.guilds = guilds;
    guildMocks.hasAnyUnreadConversation.mockReturnValue(true);
    guildMocks.hasUnreadGuild.mockImplementation((guildId: string) => guildId === 'guild-owner');
  });

  it('renders guild shortcuts and navigates to conversations or a guild', () => {
    render(<GuildSidebar />);

    expect(screen.getByTestId('guild-avatar-Admin Guild')).toHaveAttribute(
      'data-icon-url',
      'blob:icon-admin'
    );

    fireEvent.click(screen.getByRole('button', { name: 'conversation.home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Owner Guild' }));

    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations');
    expect(routerMocks.navigate).toHaveBeenCalledWith('/guilds/guild-owner');
    expect(guildMocks.hasAnyUnreadConversation).toHaveBeenCalled();
    expect(guildMocks.hasUnreadGuild).toHaveBeenCalledWith('guild-owner');
  });

  it('opens the create and join modal from the add guild menu', () => {
    render(<GuildSidebar />);

    fireEvent.click(screen.getByRole('button', { name: 'guild.createJoin.title' }));
    fireEvent.click(screen.getByRole('button', { name: 'guild.createJoin.createTitle' }));

    expect(screen.getByRole('dialog', { name: 'guild modal create' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close guild modal' }));
    expect(screen.queryByRole('dialog', { name: 'guild modal create' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.createJoin.title' }));
    fireEvent.click(screen.getByRole('button', { name: 'close menu' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole('button', { name: 'guild.createJoin.title' }), {
      clientX: 12,
      clientY: 24,
    });
    fireEvent.click(screen.getByRole('button', { name: 'guild.createJoin.joinTitle' }));

    expect(screen.getByRole('dialog', { name: 'guild modal join' })).toBeInTheDocument();
  });

  it('opens admin context actions and refreshes guilds after updates', () => {
    render(<GuildSidebar />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Admin Guild' }), {
      clientX: 20,
      clientY: 30,
    });

    expect(screen.getByRole('button', { name: 'guild.contextMenu.edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'guild.contextMenu.invite' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'guild.contextMenu.ban' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'guild.contextMenu.leave' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'guild.contextMenu.delete' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.contextMenu.ban' }));
    expect(screen.getByRole('dialog', { name: 'settings bans' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close settings' }));
    expect(screen.queryByRole('dialog', { name: 'settings bans' })).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Admin Guild' }), {
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(screen.getByRole('button', { name: 'guild.contextMenu.invite' }));

    expect(screen.getByRole('dialog', { name: 'settings invites' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'updated' }));

    expect(guildMocks.fetchGuilds).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'settings invites' })).not.toBeInTheDocument();
  });

  it('handles owner danger actions and member leave actions', () => {
    render(<GuildSidebar />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Owner Guild' }), {
      clientX: 40,
      clientY: 50,
    });

    expect(screen.getByRole('button', { name: 'guild.contextMenu.delete' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'guild.contextMenu.leave' })
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.contextMenu.delete' }));
    expect(screen.getByRole('dialog', { name: 'settings danger' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'deleted' }));

    expect(guildMocks.fetchGuilds).toHaveBeenCalledTimes(1);
    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations');

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Admin Guild' }), {
      clientX: 60,
      clientY: 70,
    });
    fireEvent.click(screen.getByRole('button', { name: 'guild.contextMenu.leave' }));
    expect(screen.getByRole('dialog', { name: 'settings leave' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'left' }));

    expect(guildMocks.fetchGuilds).toHaveBeenCalledTimes(2);
    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations');
  });
});
