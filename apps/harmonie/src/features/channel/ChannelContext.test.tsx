import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelProvider, useChannels } from './ChannelContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type { Channel } from '@/types/guild';

type Handler = (event: Record<string, unknown>) => void;

const mocks = vi.hoisted(() => ({
  listChannels: vi.fn(),
  reorderChannels: vi.fn(),
  navigate: vi.fn(),
  params: { guildId: 'guild-1', channelId: 'channel-1' } as {
    guildId?: string;
    channelId?: string;
  },
  seedFromChannelList: vi.fn(),
  handlers: new Map<string, Handler>(),
  connection: {
    on: vi.fn((eventName: string, handler: Handler) => mocks.handlers.set(eventName, handler)),
    off: vi.fn((eventName: string, handler: Handler) => {
      if (mocks.handlers.get(eventName) === handler) mocks.handlers.delete(eventName);
    }),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => mocks.params,
  };
});

vi.mock('@/api/guilds', () => ({
  listChannels: mocks.listChannels,
  reorderChannels: mocks.reorderChannels,
}));

vi.mock('@/features/realtime/RealtimeContext', () => ({
  useRealtime: () => ({ connection: mocks.connection }),
}));

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  useVoicePresence: () => ({ seedFromChannelList: mocks.seedFromChannelList }),
}));

const channel = (input: Partial<Channel> = {}): Channel => ({
  channelId: 'channel-1',
  name: 'general',
  type: 'Text',
  isDefault: true,
  position: 0,
  ...input,
});

const Consumer = ({
  children,
}: {
  children?: (channels: ReturnType<typeof useChannels>) => ReactNode;
}) => {
  const channels = useChannels();

  return (
    <div>
      <span data-testid="channels">
        {channels.channels
          ?.map((item) => `${item.channelId}:${item.name}:${item.position}`)
          .join('|') ?? 'none'}
      </span>
      <button
        type="button"
        onClick={() =>
          channels.addChannel(channel({ channelId: 'channel-3', name: 'random', position: 3 }))
        }
      >
        Add
      </button>
      <button
        type="button"
        onClick={() =>
          channels.updateChannel(channel({ channelId: 'channel-1', name: 'renamed', position: 0 }))
        }
      >
        Update
      </button>
      <button type="button" onClick={() => channels.removeChannel('channel-1')}>
        Remove
      </button>
      <button
        type="button"
        onClick={() =>
          void channels.applyReorder('guild-1', [
            channel({ channelId: 'channel-2', name: 'voice', type: 'Voice', position: 0 }),
            channel({ channelId: 'channel-1', name: 'general', position: 1 }),
          ])
        }
      >
        Reorder
      </button>
      {children?.(channels)}
    </div>
  );
};

const renderProvider = () =>
  render(
    <ChannelProvider>
      <Consumer />
    </ChannelProvider>
  );

const renderConsumerOnly = () => render(<Consumer />);

describe('ChannelProvider', () => {
  beforeEach(() => {
    mocks.listChannels.mockReset();
    mocks.reorderChannels.mockReset();
    mocks.navigate.mockReset();
    mocks.seedFromChannelList.mockReset();
    mocks.handlers.clear();
    mocks.connection.on.mockClear();
    mocks.connection.off.mockClear();
    mocks.params = { guildId: 'guild-1', channelId: 'channel-1' };
  });

  it('loads channels for the current guild and seeds voice presence', async () => {
    mocks.listChannels.mockResolvedValueOnce({
      guildId: 'guild-1',
      channels: [
        channel({ channelId: 'channel-1', name: 'general', position: 0 }),
        channel({
          channelId: 'channel-2',
          name: 'voice',
          type: 'Voice',
          position: 1,
          currentParticipants: [
            {
              userId: 'user-1',
              username: 'ada',
              displayName: null,
              avatarFileId: null,
              avatarBg: null,
              avatarColor: null,
              avatarIcon: null,
            },
          ],
        }),
      ],
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('channels')).toHaveTextContent(
        'channel-1:general:0|channel-2:voice:1'
      )
    );
    expect(mocks.seedFromChannelList).toHaveBeenCalledWith([
      {
        channelId: 'channel-2',
        participants: [
          {
            userId: 'user-1',
            username: 'ada',
            displayName: null,
            avatarFileId: null,
            avatarBg: null,
            avatarColor: null,
            avatarIcon: null,
          },
        ],
      },
    ]);
  });

  it('exposes add, update, remove, and reorder actions', async () => {
    mocks.listChannels.mockResolvedValueOnce({
      guildId: 'guild-1',
      channels: [
        channel({ channelId: 'channel-1', name: 'general', position: 0 }),
        channel({ channelId: 'channel-2', name: 'voice', type: 'Voice', position: 1 }),
      ],
    });
    mocks.reorderChannels.mockResolvedValueOnce({
      guildId: 'guild-1',
      channels: [
        channel({ channelId: 'channel-2', name: 'voice', type: 'Voice', position: 0 }),
        channel({ channelId: 'channel-1', name: 'general', position: 1 }),
      ],
    });
    renderProvider();
    await screen.findByText(/channel-1:general/);

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(screen.getByTestId('channels')).toHaveTextContent('channel-3:random:3');

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    expect(screen.getByTestId('channels')).toHaveTextContent('channel-1:renamed:0');

    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(screen.getByTestId('channels')).not.toHaveTextContent('channel-1:');

    await userEvent.click(screen.getByRole('button', { name: 'Reorder' }));
    await waitFor(() =>
      expect(mocks.reorderChannels).toHaveBeenCalledWith('guild-1', {
        channels: [
          { channelId: 'channel-2', position: 0 },
          { channelId: 'channel-1', position: 1 },
        ],
      })
    );
  });

  it('falls back to the default context value outside a provider', async () => {
    renderConsumerOnly();

    expect(screen.getByTestId('channels')).toHaveTextContent('none');

    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reorder' }));

    expect(screen.getByTestId('channels')).toHaveTextContent('none');
    expect(mocks.reorderChannels).not.toHaveBeenCalled();
  });

  it('keeps the optimistic reorder when it succeeds and restores the previous state on failure', async () => {
    mocks.listChannels.mockResolvedValueOnce({
      guildId: 'guild-1',
      channels: [
        channel({ channelId: 'channel-1', name: 'general', position: 0 }),
        channel({ channelId: 'channel-2', name: 'voice', type: 'Voice', position: 1 }),
      ],
    });
    mocks.reorderChannels
      .mockResolvedValueOnce({
        guildId: 'guild-1',
        channels: [
          channel({ channelId: 'channel-2', name: 'voice', type: 'Voice', position: 0 }),
          channel({ channelId: 'channel-1', name: 'general', position: 1 }),
        ],
      })
      .mockRejectedValueOnce(new Error('network'));

    renderProvider();
    await screen.findByText(/channel-1:general/);

    await userEvent.click(screen.getByRole('button', { name: 'Reorder' }));
    await waitFor(() =>
      expect(screen.getByTestId('channels')).toHaveTextContent(
        'channel-2:voice:0|channel-1:general:1'
      )
    );

    await userEvent.click(screen.getByRole('button', { name: 'Reorder' }));
    await waitFor(() =>
      expect(screen.getByTestId('channels')).toHaveTextContent(
        'channel-2:voice:0|channel-1:general:1'
      )
    );
    expect(mocks.reorderChannels).toHaveBeenCalledTimes(2);
  });

  it('reacts to channel realtime events and navigates away from deleted active channels', async () => {
    mocks.listChannels.mockResolvedValueOnce({
      guildId: 'guild-1',
      channels: [channel({ channelId: 'channel-1', name: 'general', position: 1 })],
    });
    renderProvider();
    await screen.findByText('channel-1:general:1');

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelCreated)?.({
        guildId: 'guild-1',
        channelId: 'channel-2',
        name: 'voice',
        type: 'voice',
        isDefault: false,
        position: 0,
      });
    });
    expect(screen.getByTestId('channels')).toHaveTextContent(
      'channel-2:voice:0|channel-1:general:1'
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelUpdated)?.({
        guildId: 'guild-1',
        channelId: 'channel-1',
        name: 'welcome',
        position: 2,
      });
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelsReordered)?.({
        guildId: 'guild-1',
        channels: [
          { channelId: 'channel-1', position: 0 },
          { channelId: 'channel-2', position: 1 },
        ],
      });
    });
    expect(screen.getByTestId('channels')).toHaveTextContent(
      'channel-1:welcome:0|channel-2:voice:1'
    );

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelDeleted)?.({
        guildId: 'guild-1',
        channelId: 'channel-1',
      });
    });

    expect(screen.getByTestId('channels')).not.toHaveTextContent('channel-1:');
    expect(mocks.navigate).toHaveBeenCalledWith('/guilds/guild-1', { replace: true });
  });

  it('ignores realtime events for other guilds and duplicate channel creation', async () => {
    mocks.listChannels.mockResolvedValueOnce({
      guildId: 'guild-1',
      channels: [channel({ channelId: 'channel-1', name: 'general', position: 0 })],
    });
    renderProvider();
    await screen.findByText('channel-1:general:0');

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelCreated)?.({
        guildId: 'guild-2',
        channelId: 'channel-9',
        name: 'outside',
        type: 'text',
        isDefault: false,
        position: 9,
      });
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelCreated)?.({
        guildId: 'guild-1',
        channelId: 'channel-1',
        name: 'duplicate',
        type: 'text',
        isDefault: false,
        position: 9,
      });
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelUpdated)?.({
        guildId: 'guild-2',
        channelId: 'channel-1',
        name: 'outside update',
        position: 9,
      });
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelsReordered)?.({
        guildId: 'guild-2',
        channels: [{ channelId: 'channel-1', position: 9 }],
      });
      mocks.handlers.get(REALTIME_SERVER_EVENTS.channelDeleted)?.({
        guildId: 'guild-2',
        channelId: 'channel-1',
      });
    });

    expect(screen.getByTestId('channels')).toHaveTextContent('channel-1:general:0');
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('does not load channels or attach realtime handlers without a guild id', async () => {
    mocks.params = { guildId: undefined, channelId: undefined };

    renderProvider();

    expect(screen.getByTestId('channels')).toHaveTextContent('none');
    expect(mocks.listChannels).not.toHaveBeenCalled();
    expect(mocks.connection.on).not.toHaveBeenCalled();
  });

  it('exposes null channels while loading fails or the route guild does not match state', async () => {
    mocks.listChannels.mockRejectedValueOnce(new Error('network'));
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('channels')).toHaveTextContent(''));
  });
});
