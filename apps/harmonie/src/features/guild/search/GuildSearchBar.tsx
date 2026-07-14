import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Hash, Search, User } from 'lucide-react';
import { Badge, Combobox, FilterInput, IconButton } from '@harmonie/ui';
import { useChannels } from '@/features/channel/ChannelContext';
import { useGuildMembers } from '@/features/guild/GuildContext';
import { useCoarsePointer } from '@/shared/hooks/useCoarsePointer';
import type { Channel, GuildMember } from '@/types/guild';

interface GuildSearchBarProps {
  query: string;
  authorId: string | null;
  channelId: string | null;
  onQueryChange: (q: string) => void;
  onAuthorChange: (id: string | null) => void;
  onChannelChange: (id: string | null) => void;
}

type DropdownState = 'filters' | 'members' | 'channels' | null;

interface SearchControlProps {
  channelItems: { value: string; icon: React.ReactNode; label: string }[];
  dropdown: DropdownState;
  filterItems: readonly {
    value: 'members' | 'channels';
    icon: React.ReactNode;
    label: string;
    description: string;
  }[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  members: GuildMember[];
  memberItems: { value: string; icon: React.ReactNode; label: string }[];
  onAuthorChange: (id: string | null) => void;
  onChannelChange: (id: string | null) => void;
  onChannelSelect: (channel: Channel) => void;
  onFilterSelect: (filter: 'members' | 'channels') => void;
  onFocus: () => void;
  onMemberSelect: (member: GuildMember) => void;
  onQueryChange: (q: string) => void;
  pickerQuery: string;
  placement?: 'bottom' | 'top';
  query: string;
  selectedAuthor: GuildMember | null;
  selectedChannel: Channel | null;
  setDropdown: (dropdown: DropdownState) => void;
  setPickerQuery: (query: string) => void;
  textChannels: Channel[];
  t: (key: string) => string;
}

const SearchControl = ({
  channelItems,
  dropdown,
  filterItems,
  inputRef,
  members,
  memberItems,
  onAuthorChange,
  onChannelChange,
  onChannelSelect,
  onFilterSelect,
  onFocus,
  onMemberSelect,
  onQueryChange,
  pickerQuery,
  placement = 'bottom',
  query,
  selectedAuthor,
  selectedChannel,
  setDropdown,
  setPickerQuery,
  textChannels,
  t,
}: SearchControlProps) => (
  <>
    <FilterInput onClick={() => inputRef.current?.focus()} rightElement={<Search size={13} />}>
      {selectedAuthor && (
        <Badge variant="filter" icon={<User size={10} />} onRemove={() => onAuthorChange(null)}>
          {selectedAuthor.displayName ?? selectedAuthor.username}
        </Badge>
      )}
      {selectedChannel && (
        <Badge variant="filter" icon={<Hash size={10} />} onRemove={() => onChannelChange(null)}>
          {selectedChannel.name}
        </Badge>
      )}
      <input
        ref={inputRef}
        value={query}
        aria-label={t('guild.search.placeholder')}
        onChange={(e) => {
          onQueryChange(e.target.value);
          if (dropdown === null) setDropdown('filters');
        }}
        onFocus={onFocus}
        placeholder={selectedAuthor || selectedChannel ? '' : t('guild.search.placeholder')}
        className="flex-1 min-w-0 bg-transparent outline-none font-body text-sm text-text-1 placeholder:text-text-3"
      />
    </FilterInput>

    {dropdown === 'filters' && (
      <Combobox
        items={filterItems.map((item) => ({ ...item }))}
        header={t('guild.search.filters')}
        onSelect={(value) => onFilterSelect(value as 'members' | 'channels')}
        className="w-full sm:min-w-64"
        align="right"
        placement={placement}
      />
    )}

    {dropdown === 'members' && (
      <Combobox
        items={memberItems}
        onSelect={(value) => {
          const member = members.find((item) => item.userId === value);
          if (member) onMemberSelect(member);
        }}
        searchValue={pickerQuery}
        onSearchChange={setPickerQuery}
        searchPlaceholder={t('guild.search.memberPickerPlaceholder')}
        emptyMessage={t('guild.search.noResults')}
        className="w-full max-h-56 flex flex-col sm:min-w-64"
        align="right"
        placement={placement}
        autoFocusSearch
      />
    )}

    {dropdown === 'channels' && (
      <Combobox
        items={channelItems}
        onSelect={(value) => {
          const channel = textChannels.find((item) => item.channelId === value);
          if (channel) onChannelSelect(channel);
        }}
        searchValue={pickerQuery}
        onSearchChange={setPickerQuery}
        searchPlaceholder={t('guild.search.channelPickerPlaceholder')}
        emptyMessage={t('guild.search.noResults')}
        className="w-full max-h-56 flex flex-col sm:min-w-64"
        align="right"
        placement={placement}
        autoFocusSearch
      />
    )}
  </>
);

export const GuildSearchBar = ({
  query,
  authorId,
  channelId,
  onQueryChange,
  onAuthorChange,
  onChannelChange,
}: GuildSearchBarProps) => {
  const { t } = useTranslation();
  const { guildId } = useParams<{ guildId: string }>();
  const isCoarsePointer = useCoarsePointer();

  const members = useGuildMembers(guildId) ?? [];
  const { channels } = useChannels();
  const textChannels = (channels ?? []).filter((c) => c.type === 'Text');

  const [dropdown, setDropdown] = useState<DropdownState>(null);
  const [pickerQuery, setPickerQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdown(null);
        setPickerQuery('');
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen || isCoarsePointer) return;

    requestAnimationFrame(() => inputRef.current?.focus());
  }, [isCoarsePointer, mobileOpen]);

  const selectedAuthor = authorId ? (members.find((m) => m.userId === authorId) ?? null) : null;
  const selectedChannel = channelId
    ? (textChannels.find((c) => c.channelId === channelId) ?? null)
    : null;

  const handleFocus = () => {
    if (dropdown === null) setDropdown('filters');
  };

  const handleFilterSelect = (filter: 'members' | 'channels') => {
    setPickerQuery('');
    setDropdown(filter);
  };

  const handleMemberSelect = (member: GuildMember) => {
    onAuthorChange(member.userId);
    setDropdown(null);
    setPickerQuery('');
    if (!isCoarsePointer) inputRef.current?.focus();
  };

  const handleChannelSelect = (channel: Channel) => {
    onChannelChange(channel.channelId);
    setDropdown(null);
    setPickerQuery('');
    if (!isCoarsePointer) inputRef.current?.focus();
  };

  const filteredMembers = pickerQuery.trim()
    ? members.filter(
        (m) =>
          (m.displayName ?? m.username).toLowerCase().includes(pickerQuery.toLowerCase()) ||
          m.username.toLowerCase().includes(pickerQuery.toLowerCase())
      )
    : members;

  const filteredChannels = pickerQuery.trim()
    ? textChannels.filter((c) => c.name.toLowerCase().includes(pickerQuery.toLowerCase()))
    : textChannels;

  const filterItems = [
    {
      value: 'members',
      icon: <User size={16} />,
      label: t('guild.search.filterByAuthor'),
      description: t('guild.search.filterByAuthorHint'),
    },
    {
      value: 'channels',
      icon: <Hash size={16} />,
      label: t('guild.search.filterByChannel'),
      description: t('guild.search.filterByChannelHint'),
    },
  ] as const;

  const memberItems = filteredMembers.map((member) => ({
    value: member.userId,
    icon: <User size={14} />,
    label: member.displayName ?? member.username,
  }));

  const channelItems = filteredChannels.map((channel) => ({
    value: channel.channelId,
    icon: <Hash size={14} />,
    label: channel.name,
  }));

  const hasActiveSearch = query.trim() !== '' || Boolean(selectedAuthor || selectedChannel);

  const handleMobileToggle = () => {
    const nextOpen = !mobileOpen;
    setMobileOpen(nextOpen);
    setDropdown(nextOpen ? 'filters' : null);
  };

  const searchControlProps = {
    channelItems,
    dropdown,
    filterItems,
    inputRef,
    members,
    memberItems,
    onAuthorChange,
    onChannelChange,
    onChannelSelect: handleChannelSelect,
    onFilterSelect: handleFilterSelect,
    onFocus: handleFocus,
    onMemberSelect: handleMemberSelect,
    onQueryChange,
    pickerQuery,
    query,
    selectedAuthor,
    selectedChannel,
    setDropdown,
    setPickerQuery,
    textChannels,
    t,
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="hidden w-52 sm:block">
        <SearchControl {...searchControlProps} />
      </div>

      <div className="sm:hidden">
        <IconButton
          size="small"
          selected={mobileOpen || hasActiveSearch}
          aria-label={t('guild.search.title')}
          title={t('guild.search.title')}
          tooltipSide="bottom"
          onClick={handleMobileToggle}
        >
          <Search size={16} />
        </IconButton>

        {mobileOpen && (
          <div className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 rounded-sm border border-border-2 bg-surface-1 p-2 shadow-lg">
            <div className="relative">
              <SearchControl {...searchControlProps} placement="top" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
