import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { listGuilds } from '@/api/guilds';
import type { Guild } from '@/api/guilds';

interface GuildContextValue {
  guilds: Guild[];
  isLoading: boolean;
  refresh: () => void;
}

const GuildContext = createContext<GuildContextValue>({
  guilds: [],
  isLoading: false,
  refresh: () => {},
});

export const GuildProvider = ({ children }: { children: ReactNode }) => {
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    setIsLoading(true);
    listGuilds()
      .then((data) => setGuilds(data.guilds))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => refresh(), [refresh]);

  return (
    <GuildContext.Provider value={{ guilds, isLoading, refresh }}>{children}</GuildContext.Provider>
  );
};

export const useGuilds = () => useContext(GuildContext);
