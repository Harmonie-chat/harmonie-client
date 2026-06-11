import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Channel, Guild } from '@/types/guild';
import { ChannelSidebar } from './ChannelSidebar';

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: {
    guildId: 'guild-1' as string | undefined,
    channelId: 'text-2' as string | undefined,
  },
}));

const guildMocks = vi.hoisted(() => ({
  fetchGuilds: vi.fn(),
  guild: null as Guild | null,
  canManageChannels: true,
  canManageGuild: true,
}));

const channelMocks = vi.hoisted(() => ({
  addChannel: vi.fn(),
  channels: null as Channel[] | null,
  hasUnreadChannel: vi.fn(),
  removeChannel: vi.fn(),
  updateChannel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  Pencil: ({ size }: { size?: number }) => <span data-testid="pencil-icon">{size}</span>,
  Plus: ({ size }: { size?: number }) => <span data-testid="plus-icon">{size}</span>,
  Settings: ({ size }: { size?: number }) => <span data-testid="settings-icon">{size}</span>,
  Trash2: ({ size }: { size?: number }) => <span data-testid="trash-icon">{size}</span>,
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => routerMocks.navigate,
  useParams: () => routerMocks.params,
}));

vi.mock('@harmonie/ui', () => ({
  ContextMenu: ({
    items,
    onClose,
  }: {
    horizontalAnchor?: 'left' | 'right';
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
  IconButton: ({
    children,
    onClick,
    title,
  }: {
    children: ReactNode;
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    title?: string;
  }) => (
    <button type="button" onClick={onClick}>
      {title}
      {children}
    </button>
  ),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useCurrentGuild: () => ({ guild: guildMocks.guild }),
  useGuilds: () => ({ fetchGuilds: guildMocks.fetchGuilds }),
}));

vi.mock('@/features/guild/useGuildPermissions', () => ({
  useGuildPermissions: () => ({
    canManageChannels: guildMocks.canManageChannels,
    canManageGuild: guildMocks.canManageGuild,
  }),
}));

vi.mock('@/features/realtime/MessageActivityContext', () => ({
  useMessageActivity: () => ({
    hasUnreadChannel: channelMocks.hasUnreadChannel,
  }),
}));

vi.mock('./ChannelContext', () => ({
  useChannels: () => ({
    addChannel: channelMocks.addChannel,
    channels: channelMocks.channels,
    removeChannel: channelMocks.removeChannel,
    updateChannel: channelMocks.updateChannel,
  }),
}));

vi.mock('./ChannelSection', () => ({
  ChannelSection: ({
    canReorder,
    hasUnread,
    menuLabel,
    onContextMenu,
    onLongPress,
    onMenuClick,
    sectionChannels,
    type,
  }: {
    canReorder: boolean;
    hasUnread?: (channelId: string) => boolean;
    menuLabel?: string;
    onContextMenu?: (event: React.MouseEvent, channel: Channel) => void;
    onLongPress?: (position: { x: number; y: number }, channel: Channel) => void;
    onMenuClick?: (event: React.MouseEvent<HTMLButtonElement>, channel: Channel) => void;
    sectionChannels: Channel[];
    type: 'Text' | 'Voice';
  }) => (
    <div data-testid={`section-${type}`} data-can-reorder={canReorder ? 'true' : 'false'}>
      {sectionChannels.map((channel) => (
        <div
          key={channel.channelId}
          data-unread={hasUnread?.(channel.channelId) ? 'true' : 'false'}
        >
          <span>{channel.name}</span>
          <button
            type="button"
            onClick={(event) => onMenuClick?.(event, channel)}
            onContextMenu={(event) => onContextMenu?.(event, channel)}
          >
            {menuLabel} {channel.name}
          </button>
          <button type="button" onClick={() => onLongPress?.({ x: 10, y: 20 }, channel)}>
            long press {channel.name}
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('./create-edit/CreateChannelModal', () => ({
  CreateChannelModal: ({
    defaultType,
    nextPosition,
    onClose,
    onCreated,
  }: {
    defaultType: 'Text' | 'Voice';
    guildId: string;
    nextPosition: number;
    onClose: () => void;
    onCreated: (channel: Channel) => void;
  }) => (
    <div role="dialog" aria-label={`create ${defaultType}`} data-position={nextPosition}>
      <button
        type="button"
        onClick={() =>
          onCreated({
            channelId: `${defaultType.toLowerCase()}-new`,
            name: `${defaultType} new`,
            type: defaultType,
            isDefault: false,
            position: nextPosition,
          })
        }
      >
        created
      </button>
      <button type="button" onClick={onClose}>
        close create
      </button>
    </div>
  ),
}));

vi.mock('./create-edit/EditChannelModal', () => ({
  EditChannelModal: ({
    channel,
    initialSection,
    onClose,
    onDeleted,
    onUpdated,
  }: {
    channel: Channel;
    initialSection: string;
    onClose: () => void;
    onDeleted: (channelId: string) => void;
    onUpdated: (channel: Channel) => void;
  }) => (
    <div role="dialog" aria-label={`edit ${initialSection}`}>
      <span>{channel.name}</span>
      <button type="button" onClick={() => onUpdated({ ...channel, name: 'renamed' })}>
        updated
      </button>
      <button type="button" onClick={() => onDeleted(channel.channelId)}>
        deleted
      </button>
      <button type="button" onClick={onClose}>
        close edit
      </button>
    </div>
  ),
}));

vi.mock('@/features/guild/settings/GuildSettingsModal', () => ({
  GuildSettingsModal: ({
    guild,
    onClose,
    onDeleted,
    onLeave,
    onUpdated,
  }: {
    guild: Guild;
    onClose: () => void;
    onDeleted: () => void;
    onLeave: () => void;
    onUpdated: () => void;
  }) => (
    <div role="dialog" aria-label="guild settings">
      <span>{guild.name}</span>
      <button type="button" onClick={onUpdated}>
        guild updated
      </button>
      <button type="button" onClick={onDeleted}>
        guild deleted
      </button>
      <button type="button" onClick={onLeave}>
        guild left
      </button>
      <button type="button" onClick={onClose}>
        close guild settings
      </button>
    </div>
  ),
}));

const guild: Guild = {
  guildId: 'guild-1',
  name: 'Harmonie',
  ownerUserId: 'owner',
  role: 'Admin',
  joinedAtUtc: '2026-01-01T00:00:00Z',
  iconFileId: null,
  icon: null,
};

const channels: Channel[] = [
  { channelId: 'voice-1', name: 'Voice', type: 'Voice', isDefault: false, position: 3 },
  { channelId: 'text-2', name: 'Random', type: 'Text', isDefault: false, position: 2 },
  { channelId: 'text-1', name: 'General', type: 'Text', isDefault: true, position: 1 },
];

describe('ChannelSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.params = { guildId: 'guild-1', channelId: 'text-2' };
    guildMocks.canManageChannels = true;
    guildMocks.canManageGuild = true;
    guildMocks.guild = guild;
    channelMocks.channels = channels;
    channelMocks.hasUnreadChannel.mockImplementation((channelId: string) => channelId === 'text-2');
  });

  it('returns nothing without a guild id and renders loading state while channels load', () => {
    routerMocks.params = { guildId: undefined, channelId: undefined };
    const { container, rerender } = render(<ChannelSidebar />);

    expect(container).toBeEmptyDOMElement();

    routerMocks.params = { guildId: 'guild-1', channelId: undefined };
    channelMocks.channels = null;
    rerender(<ChannelSidebar />);

    expect(screen.getByRole('heading', { name: 'Harmonie' })).toBeInTheDocument();
    expect(screen.queryByTestId('section-Text')).not.toBeInTheDocument();
  });

  it('renders sorted sections, opens create modals, and adds new channels', () => {
    render(<ChannelSidebar />);

    expect(screen.getByTestId('section-Text')).toHaveAttribute('data-can-reorder', 'true');
    expect(screen.getByText('General').compareDocumentPosition(screen.getByText('Random'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.getByText('Random').parentElement).toHaveAttribute('data-unread', 'true');

    fireEvent.click(screen.getAllByTestId('plus-icon')[0].parentElement as HTMLButtonElement);

    expect(screen.getByRole('dialog', { name: 'create Text' })).toHaveAttribute(
      'data-position',
      '4'
    );
    fireEvent.click(screen.getByRole('button', { name: 'created' }));

    expect(channelMocks.addChannel).toHaveBeenCalledWith({
      channelId: 'text-new',
      name: 'Text new',
      type: 'Text',
      isDefault: false,
      position: 4,
    });
    expect(screen.queryByRole('dialog', { name: 'create Text' })).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByTestId('plus-icon')[1].parentElement as HTMLButtonElement);
    expect(screen.getByRole('dialog', { name: 'create Voice' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close create' }));
    expect(screen.queryByRole('dialog', { name: 'create Voice' })).not.toBeInTheDocument();
  });

  it('opens channel edit flows from menu, context menu, and long press', () => {
    render(<ChannelSidebar />);

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.title General' }));
    expect(screen.getByRole('dialog', { name: 'edit rename' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'updated' }));
    expect(channelMocks.updateChannel).toHaveBeenCalledWith({ ...channels[2], name: 'renamed' });

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.title General' }));
    fireEvent.click(screen.getByRole('button', { name: 'close edit' }));
    expect(screen.queryByRole('dialog', { name: 'edit rename' })).not.toBeInTheDocument();

    fireEvent.contextMenu(
      screen.getByRole('button', { name: 'guild.channels.edit.title General' })
    );
    expect(
      screen.getByRole('button', { name: 'guild.channels.contextMenu.rename' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'guild.channels.contextMenu.delete' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close menu' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole('button', { name: 'guild.channels.edit.title Random' }));
    expect(
      screen.getByRole('button', { name: 'guild.channels.contextMenu.rename' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'guild.channels.contextMenu.delete' })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.contextMenu.delete' }));
    expect(screen.getByRole('dialog', { name: 'edit danger' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'deleted' }));
    expect(channelMocks.removeChannel).toHaveBeenCalledWith('text-2');
    expect(routerMocks.navigate).toHaveBeenCalledWith('/guilds/guild-1');

    fireEvent.click(screen.getByRole('button', { name: 'long press Voice' }));
    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.contextMenu.rename' }));
    expect(screen.getByRole('dialog', { name: 'edit rename' })).toBeInTheDocument();
  });

  it('does not redirect when deleting an inactive channel', () => {
    routerMocks.params = { guildId: 'guild-1', channelId: 'text-1' };

    render(<ChannelSidebar />);

    fireEvent.click(screen.getByRole('button', { name: 'guild.channels.edit.title Random' }));
    fireEvent.click(screen.getByRole('button', { name: 'deleted' }));

    expect(channelMocks.removeChannel).toHaveBeenCalledWith('text-2');
    expect(routerMocks.navigate).not.toHaveBeenCalled();
  });

  it('opens guild settings and refreshes or redirects after guild actions', () => {
    render(<ChannelSidebar />);

    fireEvent.click(screen.getByRole('button', { name: /guild.contextMenu.edit/ }));
    expect(screen.getByRole('dialog', { name: 'guild settings' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close guild settings' }));
    expect(screen.queryByRole('dialog', { name: 'guild settings' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guild.contextMenu.edit/ }));
    fireEvent.click(screen.getByRole('button', { name: 'guild updated' }));
    expect(guildMocks.fetchGuilds).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'guild settings' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /guild.contextMenu.edit/ }));
    fireEvent.click(screen.getByRole('button', { name: 'guild deleted' }));

    expect(guildMocks.fetchGuilds).toHaveBeenCalledTimes(2);
    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations');

    fireEvent.click(screen.getByRole('button', { name: /guild.contextMenu.edit/ }));
    fireEvent.click(screen.getByRole('button', { name: 'guild left' }));

    expect(guildMocks.fetchGuilds).toHaveBeenCalledTimes(3);
    expect(routerMocks.navigate).toHaveBeenCalledWith('/conversations');
  });

  it('hides management controls when the user cannot manage the guild or channels', () => {
    guildMocks.canManageChannels = false;
    guildMocks.canManageGuild = false;

    render(<ChannelSidebar />);

    expect(
      screen.queryByRole('button', { name: /guild.contextMenu.edit/ })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('section-Text')).toHaveAttribute('data-can-reorder', 'false');
    expect(screen.queryAllByTestId('plus-icon')).toHaveLength(0);
  });
});
