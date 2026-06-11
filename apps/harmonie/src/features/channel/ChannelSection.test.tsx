import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Channel, GuildMember } from '@/types/guild';
import type { VoiceParticipant } from '@/types/voice';
import { ChannelSection } from './ChannelSection';

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: { guildId: 'guild-1', channelId: 'text-1' as string | undefined },
}));

const channelMocks = vi.hoisted(() => ({
  applyReorder: vi.fn(),
  channels: [] as Channel[] | null,
}));

const contextMocks = vi.hoisted(() => ({
  activeChannelId: 'voice-1' as string | null,
  cameraTracks: [] as Array<{ participantId: string }>,
  getParticipantVolume: vi.fn(),
  getParticipants: vi.fn(),
  members: [] as GuildMember[],
  mutedUserIds: new Set<string>(),
  screenShares: [] as Array<{ participantId: string }>,
  setParticipantVolume: vi.fn(),
  speakingUserIds: new Set<string>(),
  toggleParticipantMute: vi.fn(),
  user: null as {
    userId: string;
    username: string;
    displayName?: string | null;
    avatarFileId?: string | null;
    avatar?: { bg?: string; color?: string; icon?: string } | null;
  } | null,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}:${options.name}` : key,
  }),
}));

vi.mock('lucide-react', () => ({
  MicOff: ({ size }: { size?: number }) => <span data-testid="mic-off">{size}</span>,
  ScreenShare: ({ size }: { size?: number }) => <span data-testid="screen-share">{size}</span>,
  Video: ({ size }: { size?: number }) => <span data-testid="video-icon">{size}</span>,
  Volume2: ({ size }: { size?: number }) => (
    <span aria-hidden="true" data-testid="volume-on">
      {size}
    </span>
  ),
  VolumeX: ({ size }: { size?: number }) => (
    <span aria-hidden="true" data-testid="volume-off">
      {size}
    </span>
  ),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => routerMocks.navigate,
  useParams: () => routerMocks.params,
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode;
    onDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void;
  }) => (
    <div>
      {children}
      <button
        type="button"
        onClick={() => onDragEnd({ active: { id: 'text-2' }, over: { id: 'text-1' } })}
      >
        drag text-2 over text-1
      </button>
      <button type="button" onClick={() => onDragEnd({ active: { id: 'text-2' }, over: null })}>
        drag without target
      </button>
    </div>
  ),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
  useSensor: vi.fn(() => 'sensor'),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useSortable: () => ({
    attributes: { 'data-sortable-attribute': 'true' },
    isDragging: false,
    listeners: { onPointerDown: vi.fn() },
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
  }),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock('@dnd-kit/modifiers', () => ({
  restrictToParentElement: vi.fn(),
  restrictToVerticalAxis: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: {
      toString: () => '',
    },
  },
}));

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    alt,
    avatarUrl,
    bg,
    color,
    icon,
  }: {
    alt: string;
    avatarUrl?: string | null;
    bg?: string;
    color?: string;
    icon?: string;
    size?: number;
  }) => (
    <span
      data-testid={`avatar-${alt}`}
      data-avatar-url={avatarUrl ?? ''}
      data-bg={bg}
      data-color={color}
      data-icon={icon}
    />
  ),
  ChannelItem: ({
    active,
    label,
    menuLabel,
    onClick,
    onContextMenu,
    onLongPress,
    onMenuClick,
    type,
    unread,
    voiceActive,
  }: {
    active?: boolean;
    label: string;
    menuLabel?: string;
    onClick: () => void;
    onContextMenu?: (event: React.MouseEvent) => void;
    onLongPress?: (position: { x: number; y: number }) => void;
    onMenuClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    type: 'text' | 'voice';
    unread?: boolean;
    voiceActive?: boolean;
  }) => (
    <div
      data-active={active ? 'true' : 'false'}
      data-testid={`channel-${label}`}
      data-type={type}
      data-unread={unread ? 'true' : 'false'}
      data-voice-active={voiceActive ? 'true' : 'false'}
    >
      <button type="button" onClick={onClick} onContextMenu={onContextMenu}>
        open {label}
      </button>
      <button type="button" onClick={(event) => onMenuClick?.(event)}>
        {menuLabel} {label}
      </button>
      <button type="button" onClick={() => onLongPress?.({ x: 20, y: 30 })}>
        long press {label}
      </button>
    </div>
  ),
  ContextMenu: ({
    items,
    onClose,
  }: {
    horizontalAnchor?: 'left' | 'right';
    items: Array<{ content?: ReactNode; label: string }>;
    onClose: () => void;
    position: { x: number; y: number };
  }) => (
    <div role="menu">
      {items.map((item) => (
        <section key={item.label}>
          <span>{item.label}</span>
          {item.content}
        </section>
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
    onClick?: () => void;
    title?: string;
  }) => (
    <button type="button" onClick={onClick}>
      {title}
      {children}
    </button>
  ),
  Tooltip: ({ children }: { children: ReactNode; content: string; side?: string }) => (
    <>{children}</>
  ),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: contextMocks.user }),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuildMembers: (guildId?: string) => (guildId === 'guild-1' ? contextMocks.members : []),
}));

vi.mock('@/shared/members/MemberPopover', () => ({
  MemberPopover: ({
    member,
    onClose,
    side,
  }: {
    anchorRect: DOMRect;
    guildId: string;
    member: GuildMember;
    onClose: () => void;
    side: string;
  }) => (
    <div role="dialog" aria-label="member popover" data-side={side}>
      <span>{member.displayName ?? member.username}</span>
      <button type="button" onClick={onClose}>
        close popover
      </button>
    </div>
  ),
}));

vi.mock('./ChannelContext', () => ({
  useChannels: () => ({
    applyReorder: channelMocks.applyReorder,
    channels: channelMocks.channels,
  }),
}));

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  useVoicePresence: () => ({
    activeChannelId: contextMocks.activeChannelId,
    cameraTracks: contextMocks.cameraTracks,
    getParticipantVolume: contextMocks.getParticipantVolume,
    getParticipants: contextMocks.getParticipants,
    mutedUserIds: contextMocks.mutedUserIds,
    screenShares: contextMocks.screenShares,
    setParticipantVolume: contextMocks.setParticipantVolume,
    speakingUserIds: contextMocks.speakingUserIds,
    toggleParticipantMute: contextMocks.toggleParticipantMute,
  }),
}));

const textChannels: Channel[] = [
  { channelId: 'text-1', name: 'general', type: 'Text', isDefault: true, position: 1 },
  { channelId: 'text-2', name: 'random', type: 'Text', isDefault: false, position: 2 },
];

const voiceChannel: Channel = {
  channelId: 'voice-1',
  name: 'Lobby',
  type: 'Voice',
  isDefault: false,
  position: 3,
};

const remoteParticipant: VoiceParticipant = {
  userId: 'remote-user',
  username: 'remote',
  displayName: 'Remote',
  avatarFileId: 'avatar-remote',
  avatarBg: '#ffffff',
  avatarColor: '#111111',
  avatarIcon: 'Rocket',
};

const members: GuildMember[] = [
  {
    userId: 'remote-user',
    username: 'remote',
    displayName: 'Remote',
    avatarFileId: 'avatar-remote',
    avatar: { bg: '#ffffff', color: '#111111', icon: 'Rocket' },
    isActive: true,
    role: 'Member',
    joinedAtUtc: '2026-01-01T00:00:00Z',
  },
];

describe('ChannelSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.params = { guildId: 'guild-1', channelId: 'text-1' };
    channelMocks.channels = [...textChannels, voiceChannel];
    channelMocks.applyReorder.mockResolvedValue(undefined);
    contextMocks.activeChannelId = 'voice-1';
    contextMocks.cameraTracks = [{ participantId: 'remote-user' }];
    contextMocks.getParticipantVolume.mockReturnValue(0.65);
    contextMocks.getParticipants.mockReturnValue([remoteParticipant]);
    contextMocks.members = members;
    contextMocks.mutedUserIds = new Set(['remote-user']);
    contextMocks.screenShares = [{ participantId: 'remote-user' }];
    contextMocks.speakingUserIds = new Set(['remote-user']);
    contextMocks.user = {
      userId: 'current-user',
      username: 'me',
      displayName: 'Me',
      avatarFileId: 'avatar-current',
      avatar: { bg: '#eeeeee', color: '#222222', icon: 'User' },
    };
  });

  it('navigates text channels, forwards channel actions, and applies reorder', () => {
    const hasUnread = vi.fn((channelId: string) => channelId === 'text-2');
    const onContextMenu = vi.fn();
    const onLongPress = vi.fn();
    const onMenuClick = vi.fn();

    render(
      <ChannelSection
        sectionChannels={textChannels}
        type="Text"
        canReorder
        hasUnread={hasUnread}
        onContextMenu={onContextMenu}
        onLongPress={onLongPress}
        onMenuClick={onMenuClick}
        menuLabel="edit"
      />
    );

    expect(screen.getByTestId('channel-general')).toHaveAttribute('data-active', 'true');
    expect(screen.getByTestId('channel-random')).toHaveAttribute('data-unread', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'open random' }));
    fireEvent.contextMenu(screen.getByRole('button', { name: 'open general' }), {
      clientX: 7,
      clientY: 9,
    });
    fireEvent.click(screen.getByRole('button', { name: 'edit general' }));
    fireEvent.click(screen.getByRole('button', { name: 'long press random' }));
    fireEvent.click(screen.getByRole('button', { name: 'drag text-2 over text-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'drag without target' }));

    expect(routerMocks.navigate).toHaveBeenCalledWith('/guilds/guild-1/channels/text-2');
    expect(onContextMenu).toHaveBeenCalledWith(expect.anything(), textChannels[0]);
    expect(onMenuClick).toHaveBeenCalledWith(expect.anything(), textChannels[0]);
    expect(onLongPress).toHaveBeenCalledWith({ x: 20, y: 30 }, textChannels[1]);
    expect(channelMocks.applyReorder).toHaveBeenCalledWith('guild-1', [
      voiceChannel,
      { ...textChannels[1], position: 1 },
      { ...textChannels[0], position: 2 },
    ]);
  });

  it('renders active voice participants, opens popovers, and controls participant volume', () => {
    render(
      <ChannelSection
        sectionChannels={[voiceChannel]}
        type="Voice"
        canReorder={false}
        menuLabel="edit"
      />
    );

    expect(screen.getByTestId('channel-Lobby')).toHaveAttribute('data-voice-active', 'true');
    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();
    expect(screen.getByTestId('mic-off')).toBeInTheDocument();
    expect(screen.getByTestId('video-icon')).toBeInTheDocument();
    expect(screen.getByTestId('screen-share')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'open Lobby' }));
    expect(routerMocks.navigate).toHaveBeenCalledWith('/guilds/guild-1/voice/voice-1');

    fireEvent.click(screen.getByText('Remote').closest('button') as HTMLButtonElement);
    expect(screen.getByRole('dialog', { name: 'member popover' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close popover' }));

    fireEvent.contextMenu(screen.getByText('Remote').closest('button') as HTMLButtonElement, {
      clientX: 12,
      clientY: 20,
    });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider', { name: 'voice.participantVolume:Remote' }), {
      target: { value: '35' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'voice.muteParticipant:Remote' }));

    expect(contextMocks.setParticipantVolume).toHaveBeenCalledWith('remote-user', 0.35);
    expect(contextMocks.toggleParticipantMute).toHaveBeenCalledWith('remote-user');

    fireEvent.click(screen.getByRole('button', { name: 'close menu' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.keyDown(screen.getByText('Remote').closest('button') as HTMLButtonElement, {
      key: 'F10',
      shiftKey: true,
    });
    expect(screen.getByRole('menu')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByText('Me').closest('button') as HTMLButtonElement, {
      key: 'ContextMenu',
    });
    expect(screen.getAllByRole('menu')).toHaveLength(1);
  });

  it('does not add the local participant or volume controls for inactive voice channels', () => {
    contextMocks.activeChannelId = 'other-voice';
    contextMocks.getParticipants.mockReturnValue([remoteParticipant]);

    render(<ChannelSection sectionChannels={[voiceChannel]} type="Voice" canReorder={false} />);

    expect(screen.queryByText('Me')).not.toBeInTheDocument();
    expect(screen.getByText('Remote')).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByText('Remote').closest('button') as HTMLButtonElement);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('falls back to stable participant labels and exposes unmute volume controls from the keyboard', () => {
    contextMocks.getParticipantVolume.mockReturnValue(0);
    contextMocks.getParticipants.mockReturnValue([
      {
        ...remoteParticipant,
        displayName: '   ',
        userId: 'fallback-user',
        username: '   ',
      },
    ]);
    contextMocks.members = [];
    contextMocks.user = null;

    render(<ChannelSection sectionChannels={[voiceChannel]} type="Voice" canReorder={false} />);

    const participantButton = screen
      .getByText('fallback-user')
      .closest('button') as HTMLButtonElement;

    fireEvent.click(participantButton);
    expect(screen.queryByRole('dialog', { name: 'member popover' })).not.toBeInTheDocument();

    fireEvent.keyDown(participantButton, { key: 'ContextMenu' });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'voice.unmuteParticipant:fallback-user' }));

    expect(contextMocks.toggleParticipantMute).toHaveBeenCalledWith('fallback-user');
  });
});
