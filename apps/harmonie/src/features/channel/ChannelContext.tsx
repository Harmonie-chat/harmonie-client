import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listChannels, reorderChannels } from '@/api/guilds';
import { useRealtime } from '@/features/realtime/RealtimeContext';
import { REALTIME_SERVER_EVENTS } from '@/features/realtime/constants';
import type {
  Channel,
  ChannelCreatedEvent,
  ChannelDeletedEvent,
  ChannelsReorderedEvent,
  ChannelUpdatedEvent,
} from '@/types/guild';
import { useVoicePresence } from '@/shared/voice/context/VoicePresenceContext';

interface ChannelState {
  guildId: string;
  channels: Channel[];
}

interface ChannelContextValue {
  channels: Channel[] | null;
  addChannel: (channel: Channel) => void;
  updateChannel: (updated: Channel) => void;
  removeChannel: (channelId: string) => void;
  applyReorder: (guildId: string, reordered: Channel[]) => Promise<void>;
}

const ChannelContext = createContext<ChannelContextValue>({
  channels: null,
  addChannel: () => {},
  updateChannel: () => {},
  removeChannel: () => {},
  applyReorder: async () => {},
});

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { guildId, channelId } = useParams<{ guildId: string; channelId: string }>();
  const [state, setState] = useState<ChannelState | null>(null);
  const { connection } = useRealtime();
  const { seedFromChannelList } = useVoicePresence();

  useEffect(() => {
    if (!guildId) return;
    listChannels(guildId)
      .then((data) => {
        setState({ guildId, channels: data.channels });
        const voiceChannels = [];
        for (const channel of data.channels) {
          if (channel.type !== 'Voice') continue;
          voiceChannels.push({
            channelId: channel.channelId,
            participants: channel.currentParticipants,
          });
        }
        seedFromChannelList(voiceChannels);
      })
      .catch(() => setState({ guildId, channels: [] }));
  }, [guildId, seedFromChannelList]);

  useEffect(() => {
    if (!connection || !guildId) return;

    const sortChannels = (channels: Channel[]) =>
      channels.slice().sort((a, b) => a.position - b.position);

    const normalizeChannelType = (type: string): Channel['type'] =>
      type.toLowerCase() === 'voice' ? 'Voice' : 'Text';

    const handleChannelCreated = (event: ChannelCreatedEvent) => {
      if (event.guildId !== guildId) return;
      setState((prev) => {
        if (!prev || prev.guildId !== event.guildId) return prev;
        if (prev.channels.some((channel) => channel.channelId === event.channelId)) return prev;
        return {
          ...prev,
          channels: sortChannels([
            ...prev.channels,
            {
              channelId: event.channelId,
              name: event.name,
              type: normalizeChannelType(event.type),
              isDefault: event.isDefault,
              position: event.position,
              currentParticipants: null,
            },
          ]),
        };
      });
    };

    connection.on(REALTIME_SERVER_EVENTS.channelCreated, handleChannelCreated);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.channelCreated, handleChannelCreated);
    };
  }, [connection, guildId]);

  useEffect(() => {
    if (!connection || !guildId) return;

    const sortChannels = (channels: Channel[]) =>
      channels.slice().sort((a, b) => a.position - b.position);

    const handleChannelUpdated = (event: ChannelUpdatedEvent) => {
      if (event.guildId !== guildId) return;
      setState((prev) =>
        prev && prev.guildId === event.guildId
          ? {
              ...prev,
              channels: sortChannels(
                prev.channels.map((channel) =>
                  channel.channelId === event.channelId
                    ? { ...channel, name: event.name, position: event.position }
                    : channel
                )
              ),
            }
          : prev
      );
    };

    const handleChannelsReordered = (event: ChannelsReorderedEvent) => {
      if (event.guildId !== guildId) return;
      const positions = new Map(
        event.channels.map((channel) => [channel.channelId, channel.position])
      );
      setState((prev) =>
        prev && prev.guildId === event.guildId
          ? {
              ...prev,
              channels: sortChannels(
                prev.channels.map((channel) => ({
                  ...channel,
                  position: positions.get(channel.channelId) ?? channel.position,
                }))
              ),
            }
          : prev
      );
    };

    connection.on(REALTIME_SERVER_EVENTS.channelUpdated, handleChannelUpdated);
    connection.on(REALTIME_SERVER_EVENTS.channelsReordered, handleChannelsReordered);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.channelUpdated, handleChannelUpdated);
      connection.off(REALTIME_SERVER_EVENTS.channelsReordered, handleChannelsReordered);
    };
  }, [connection, guildId]);

  useEffect(() => {
    if (!connection || !guildId) return;

    const handleChannelDeleted = (event: ChannelDeletedEvent) => {
      if (event.guildId !== guildId) return;
      setState((prev) =>
        prev && prev.guildId === event.guildId
          ? {
              ...prev,
              channels: prev.channels.filter((channel) => channel.channelId !== event.channelId),
            }
          : prev
      );
      if (event.channelId === channelId) navigate(`/guilds/${event.guildId}`, { replace: true });
    };

    connection.on(REALTIME_SERVER_EVENTS.channelDeleted, handleChannelDeleted);

    return () => {
      connection.off(REALTIME_SERVER_EVENTS.channelDeleted, handleChannelDeleted);
    };
  }, [channelId, connection, guildId, navigate]);

  const addChannel = (channel: Channel) =>
    setState((prev) => {
      if (!prev) return null;

      const channels = prev.channels.some((c) => c.channelId === channel.channelId)
        ? prev.channels.map((c) => (c.channelId === channel.channelId ? { ...c, ...channel } : c))
        : [...prev.channels, channel];

      return { ...prev, channels: channels.slice().sort((a, b) => a.position - b.position) };
    });

  const updateChannel = (updated: Channel) =>
    setState((prev) =>
      prev
        ? {
            ...prev,
            channels: prev.channels.map((c) => (c.channelId === updated.channelId ? updated : c)),
          }
        : null
    );

  const removeChannel = (channelId: string) =>
    setState((prev) =>
      prev ? { ...prev, channels: prev.channels.filter((c) => c.channelId !== channelId) } : null
    );

  const applyReorder = async (gId: string, reordered: Channel[]) => {
    const previous = state;
    setState((prev) => (prev ? { ...prev, channels: reordered } : null));
    try {
      const result = await reorderChannels(gId, {
        channels: reordered.map((c) => ({ channelId: c.channelId, position: c.position })),
      });
      setState((prev) => (prev ? { ...prev, channels: result.channels } : null));
    } catch {
      setState(previous);
    }
  };

  const channels = guildId && state?.guildId === guildId ? state.channels : null;

  return (
    <ChannelContext.Provider
      value={{ channels, addChannel, updateChannel, removeChannel, applyReorder }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannels = () => use(ChannelContext);
