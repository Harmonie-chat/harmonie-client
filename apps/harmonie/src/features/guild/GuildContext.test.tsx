import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { Guild, GuildMember } from '@/types/guild';

type Handler = (event: Record<string, unknown>) => void;

const mocks = vi.hoisted(() => ({
  listGuilds: vi.fn(),
  listGuildMembers: vi.fn(),
  navigate: vi.fn(),
  params: { guildId: 'guild-1' } as { guildId?: string },
  location: { pathname: '/guilds/guild-1/channels/channel-1' },
  user: { userId: 'user-1', username: 'ada' } as { userId: string; username: string } | null,
  handlers: new Map<string, Set<Handler>>(),
  connection: {
    on: vi.fn((eventName: string, handler: Handler) => {
      const handlers = mocks.handlers.get(eventName) ?? new Set<Handler>();
      handlers.add(handler);
      mocks.handlers.set(eventName, handlers);
    }),
    off: vi.fn((eventName: string, handler: Handler) => {
      mocks.handlers.get(eventName)?.delete(handler);
    }),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => mocks.location,
    useNavigate: () => mocks.navigate,
    useParams: () => mocks.params,
  };
});

vi.mock('@/api/guilds', () => ({
  listGuilds: mocks.listGuilds,
  listGuildMembers: mocks.listGuildMembers,
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
}));

const guild = (input: Partial<Guild> = {}): Guild => ({
  guildId: 'guild-1',
  name: 'Guild',
  ownerUserId: 'user-1',
  role: 'Admin',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  iconFileId: null,
  icon: null,
  ...input,
});

const member = (input: Partial<GuildMember> = {}): GuildMember => ({
  userId: 'user-1',
  username: 'ada',
  displayName: 'Ada',
  avatarFileId: null,
  avatar: { icon: 'User', color: '#111111', bg: '#ffffff' },
  bio: '',
  isActive: true,
  role: 'Admin',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  ...input,
});

const emit = (eventName: string, event: Record<string, unknown>) => {
  mocks.handlers.get(eventName)?.forEach((handler) => handler(event));
};

const renderProvider = async () => {
  const { GuildProvider, useCurrentGuild, useGuildMembers, useGuilds } =
    await import('./GuildContext');

  const Consumer = ({ children }: { children?: ReactNode }) => {
    const guildsContext = useGuilds();
    const currentGuild = useCurrentGuild();
    const members = useGuildMembers('guild-1');

    return (
      <div>
        <span data-testid="guilds">
          {guildsContext.guilds
            .map((item) => `${item.guildId}:${item.name}:${item.role}`)
            .join('|')}
        </span>
        <span data-testid="loading">{String(guildsContext.guildsLoading)}</span>
        <span data-testid="current">{currentGuild.guild?.guildId ?? 'none'}</span>
        <span data-testid="members">
          {members
            ?.map((item) => `${item.userId}:${item.displayName}:${item.isActive}`)
            .join('|') ?? 'loading'}
        </span>
        <button type="button" onClick={() => guildsContext.fetchGuilds()}>
          Fetch guilds
        </button>
        <button type="button" onClick={() => guildsContext.fetchGuildMembers('guild-1', true)}>
          Force members
        </button>
        {children}
      </div>
    );
  };

  return render(
    <GuildProvider>
      <Consumer />
    </GuildProvider>
  );
};

const renderDefaultConsumer = async () => {
  const { useCurrentGuild, useGuildMembers, useGuilds } = await import('./GuildContext');

  const Consumer = () => {
    const guildsContext = useGuilds();
    const currentGuild = useCurrentGuild();
    const members = useGuildMembers(undefined);

    return (
      <div>
        <span data-testid="guilds">{guildsContext.guilds.length}</span>
        <span data-testid="loading">{String(guildsContext.guildsLoading)}</span>
        <span data-testid="current">{currentGuild.guild?.guildId ?? 'none'}</span>
        <span data-testid="members">{members?.length ?? 'none'}</span>
        <button
          type="button"
          onClick={() => {
            guildsContext.fetchGuilds();
            guildsContext.fetchGuildMembers('guild-1');
          }}
        >
          Defaults
        </button>
      </div>
    );
  };

  return render(<Consumer />);
};

describe('GuildProvider', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.listGuilds.mockReset();
    mocks.listGuildMembers.mockReset();
    mocks.listGuildMembers.mockResolvedValue({ guildId: 'guild-1', members: [] });
    mocks.navigate.mockReset();
    mocks.handlers.clear();
    mocks.connection.on.mockClear();
    mocks.connection.off.mockClear();
    mocks.params = { guildId: 'guild-1' };
    mocks.location = { pathname: '/guilds/guild-1/channels/channel-1' };
    mocks.user = { userId: 'user-1', username: 'ada' };
  });

  it('loads guilds and guild members, caches members, and supports forced reloads', async () => {
    mocks.listGuilds.mockResolvedValueOnce({
      guilds: [guild(), guild({ guildId: 'guild-2', name: 'Second', role: 'Member' })],
    });
    mocks.listGuildMembers
      .mockResolvedValueOnce({ guildId: 'guild-1', members: [member()] })
      .mockResolvedValueOnce({
        guildId: 'guild-1',
        members: [member({ displayName: 'Ada Lovelace' })],
      });

    await renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('guilds')).toHaveTextContent(
        'guild-1:Guild:Admin|guild-2:Second:Member'
      )
    );
    await waitFor(() => expect(screen.getByTestId('members')).toHaveTextContent('user-1:Ada:true'));
    expect(screen.getByTestId('current')).toHaveTextContent('guild-1');

    await userEvent.click(screen.getByRole('button', { name: 'Force members' }));

    await waitFor(() =>
      expect(screen.getByTestId('members')).toHaveTextContent('user-1:Ada Lovelace:true')
    );
    expect(mocks.listGuildMembers).toHaveBeenCalledTimes(2);
  });

  it('exposes safe default context values outside a provider', async () => {
    await renderDefaultConsumer();

    expect(screen.getByTestId('guilds')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('current')).toHaveTextContent('none');
    expect(screen.getByTestId('members')).toHaveTextContent('none');

    await userEvent.click(screen.getByRole('button', { name: 'Defaults' }));

    expect(mocks.listGuilds).not.toHaveBeenCalled();
    expect(mocks.listGuildMembers).not.toHaveBeenCalled();
  });

  it('updates guild and member state from realtime events', async () => {
    mocks.listGuilds.mockResolvedValueOnce({ guilds: [guild()] }).mockResolvedValueOnce({
      guilds: [guild({ role: 'Member' })],
    });
    mocks.listGuildMembers
      .mockResolvedValueOnce({
        guildId: 'guild-1',
        members: [member(), member({ userId: 'user-2', username: 'grace', displayName: 'Grace' })],
      })
      .mockResolvedValue({
        guildId: 'guild-1',
        members: [member({ displayName: 'Ada Reloaded' })],
      });

    await renderProvider();
    await screen.findByText(/guild-1:Guild:Admin/);
    await screen.findByText(/user-2:Grace:true/);

    act(() => {
      emit(REALTIME_SERVER_EVENTS.guildUpdated, {
        guildId: 'guild-1',
        name: 'Renamed',
        iconFileId: 'icon-1',
      });
      emit(REALTIME_SERVER_EVENTS.guildOwnershipTransferred, {
        guildId: 'guild-1',
        newOwnerUserId: 'user-2',
      });
      emit(REALTIME_SERVER_EVENTS.memberRoleUpdated, {
        guildId: 'guild-1',
        userId: 'user-1',
        newRole: 'Member',
      });
      emit(REALTIME_SERVER_EVENTS.userPresenceChanged, {
        userId: 'user-2',
        status: 'offline',
      });
      emit(REALTIME_SERVER_EVENTS.userProfileUpdated, {
        userId: 'user-2',
        username: 'grace',
        displayName: 'Grace Hopper',
        avatarFileId: 'avatar-2',
        avatarColor: '#111111',
        avatarIcon: 'User',
        avatarBg: '#ffffff',
      });
    });

    expect(screen.getByTestId('guilds')).toHaveTextContent('guild-1:Renamed:Member');
    expect(screen.getByTestId('members')).toHaveTextContent('user-2:Grace Hopper:false');

    act(() => {
      emit(REALTIME_SERVER_EVENTS.memberJoined, { guildId: 'guild-1', userId: 'user-1' });
    });

    await waitFor(() =>
      expect(screen.getByTestId('members')).toHaveTextContent('user-1:Ada Reloaded:true')
    );

    expect(mocks.listGuilds).toHaveBeenCalledTimes(2);
  });

  it('reuses an in-flight guild load across provider mounts', async () => {
    let resolveGuilds: (value: { guilds: Guild[] }) => void = () => {};
    mocks.listGuilds.mockImplementationOnce(
      () =>
        new Promise<{ guilds: Guild[] }>((resolve) => {
          resolveGuilds = resolve;
        })
    );

    const firstView = await renderProvider();
    const secondView = await renderProvider();

    expect(mocks.listGuilds).toHaveBeenCalledTimes(1);

    act(() => {
      resolveGuilds({ guilds: [guild()] });
    });

    await waitFor(() => expect(mocks.listGuilds).toHaveBeenCalledTimes(1));

    firstView.unmount();
    secondView.unmount();
  });

  it('ignores non-matching realtime member updates and removes inactive guilds without navigation', async () => {
    mocks.location = { pathname: '/conversations' };
    mocks.listGuilds.mockResolvedValueOnce({
      guilds: [guild(), guild({ guildId: 'guild-2', name: 'Second' })],
    });
    mocks.listGuildMembers.mockResolvedValueOnce({
      guildId: 'guild-1',
      members: [member()],
    });

    await renderProvider();
    await screen.findByText(/guild-1:Guild/);
    await screen.findByText(/user-1:Ada:true/);

    act(() => {
      emit(REALTIME_SERVER_EVENTS.userPresenceChanged, {
        userId: 'missing-user',
        status: 'offline',
      });
      emit(REALTIME_SERVER_EVENTS.userProfileUpdated, {
        userId: 'missing-user',
        username: 'missing',
        displayName: 'Missing',
        avatarFileId: null,
        avatarColor: null,
        avatarIcon: null,
        avatarBg: null,
      });
      emit(REALTIME_SERVER_EVENTS.guildOwnershipTransferred, {
        guildId: 'guild-1',
        newOwnerUserId: 'user-1',
      });
      emit(REALTIME_SERVER_EVENTS.youWereKicked, { guildId: 'guild-2' });
    });

    expect(screen.getByTestId('members')).toHaveTextContent('user-1:Ada:true');
    expect(screen.getByTestId('guilds')).toHaveTextContent('guild-1:Guild:Admin');
    expect(screen.getByTestId('guilds')).not.toHaveTextContent('guild-2:Second');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('removes guilds after deletion or removal events and navigates from the active guild', async () => {
    mocks.listGuilds.mockResolvedValueOnce({ guilds: [guild()] });
    mocks.listGuildMembers.mockResolvedValueOnce({ guildId: 'guild-1', members: [member()] });

    await renderProvider();
    await screen.findByText(/guild-1:Guild/);

    act(() => {
      emit(REALTIME_SERVER_EVENTS.guildDeleted, { guildId: 'guild-1' });
    });

    expect(screen.getByTestId('guilds')).toHaveTextContent('');
    expect(screen.getByTestId('members')).toHaveTextContent('loading');
    expect(mocks.navigate).toHaveBeenCalledWith('/conversations', { replace: true });
  });

  it('stops loading with an empty list when guild loading fails', async () => {
    mocks.listGuilds.mockRejectedValueOnce(new Error('network'));

    await renderProvider();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('guilds')).toHaveTextContent('');
  });
});
