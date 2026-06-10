import { createContext, use, useState, type ReactNode } from 'react';
import { matchPath, useLocation } from 'react-router-dom';

interface GuildWorkspaceContextValue {
  membersOpen: boolean;
  searchQuery: string;
  searchAuthorId: string | null;
  searchChannelId: string | null;
  hasSearch: boolean;
  toggleMembersPanel: () => void;
  closeMembersPanel: () => void;
  setSearchQuery: (q: string) => void;
  setSearchAuthorId: (id: string | null) => void;
  setSearchChannelId: (id: string | null) => void;
  clearSearch: () => void;
}

const GuildWorkspaceContext = createContext<GuildWorkspaceContextValue | null>(null);

interface GuildWorkspaceProviderProps {
  children: ReactNode;
}

export const GuildWorkspaceProvider = ({ children }: GuildWorkspaceProviderProps) => {
  const location = useLocation();
  const [membersOpen, setMembersOpen] = useState(false);
  const [searchQuery, setSearchQueryState] = useState('');
  const [searchAuthorId, setSearchAuthorIdState] = useState<string | null>(null);
  const [searchChannelId, setSearchChannelIdState] = useState<string | null>(null);

  const hasSearch =
    searchQuery.trim() !== '' || searchAuthorId !== null || searchChannelId !== null;

  const clearSearch = () => {
    setSearchQueryState('');
    setSearchAuthorIdState(null);
    setSearchChannelIdState(null);
  };

  const toggleMembersPanel = () => {
    clearSearch();
    setMembersOpen((open) => !open);
  };

  const closeMembersPanel = () => {
    setMembersOpen(false);
  };

  const setSearchQuery = (q: string) => {
    setSearchQueryState(q);
    if (q.trim()) setMembersOpen(false);
  };

  const setSearchAuthorId = (id: string | null) => {
    setSearchAuthorIdState(id);
    setMembersOpen(false);
  };

  const setSearchChannelId = (id: string | null) => {
    setSearchChannelIdState(id);
    setMembersOpen(false);
  };

  const isTextChannelRoute =
    matchPath('/guilds/:guildId/channels/:channelId', location.pathname) !== null;
  const visibleMembersOpen = isTextChannelRoute && membersOpen;

  const value: GuildWorkspaceContextValue = {
    membersOpen: visibleMembersOpen,
    searchQuery,
    searchAuthorId,
    searchChannelId,
    hasSearch,
    toggleMembersPanel,
    closeMembersPanel,
    setSearchQuery,
    setSearchAuthorId,
    setSearchChannelId,
    clearSearch,
  };

  return <GuildWorkspaceContext.Provider value={value}>{children}</GuildWorkspaceContext.Provider>;
};

export const useGuildWorkspace = () => {
  const context = use(GuildWorkspaceContext);

  if (!context) {
    throw new Error('useGuildWorkspace must be used within a GuildWorkspaceProvider');
  }

  return context;
};
