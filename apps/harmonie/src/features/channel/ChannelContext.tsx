import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { listChannels } from '@/api/guilds';
import type { Channel } from '@/api/guilds';

// Internal state: channels are always tagged with the guildId they belong to.
// This prevents stale data from a previous guild leaking to a new one during
// the render cycle before the fetch effect has had a chance to reset.
interface ChannelState {
  guildId: string;
  channels: Channel[];
}

interface ChannelContextValue {
  // null while loading OR while the loaded data belongs to a different guild
  channels: Channel[] | null;
  addChannel: (channel: Channel) => void;
  updateChannel: (updated: Channel) => void;
  removeChannel: (channelId: string) => void;
}

const ChannelContext = createContext<ChannelContextValue>({
  channels: null,
  addChannel: () => {},
  updateChannel: () => {},
  removeChannel: () => {},
});

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const { guildId } = useParams<{ guildId: string }>();
  const [state, setState] = useState<ChannelState | null>(null);

  const fetch = useCallback(() => {
    if (!guildId) {
      setState(null);
      return;
    }
    setState(null);
    listChannels(guildId)
      .then((data) => setState({ guildId, channels: data.channels }))
      .catch(() => setState({ guildId, channels: [] }));
  }, [guildId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addChannel = (channel: Channel) =>
    setState((prev) => (prev ? { ...prev, channels: [...prev.channels, channel] } : null));

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

  // Expose null if the loaded data doesn't match the current guildId yet.
  // Because this comparison happens at render time (not in an effect), consumers
  // immediately see null on the very first render after a guild switch, before
  // the fetch effect has even fired — eliminating the stale-redirect race.
  // guildId must be defined AND match the loaded state to avoid accessing state.channels when null
  const channels = guildId && state?.guildId === guildId ? state.channels : null;

  return (
    <ChannelContext.Provider value={{ channels, addChannel, updateChannel, removeChannel }}>
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannels = () => useContext(ChannelContext);
