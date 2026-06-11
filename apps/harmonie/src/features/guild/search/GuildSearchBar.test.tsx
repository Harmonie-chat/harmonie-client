import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Channel, GuildMember } from '@/types/guild';
import { GuildSearchBar } from './GuildSearchBar';

const routeMocks = vi.hoisted(() => ({
  guildId: 'guild-1',
}));

const dataMocks = vi.hoisted(() => ({
  channels: [] as Channel[],
  isCoarsePointer: false,
  members: [] as GuildMember[],
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  Hash: ({ size }: { size?: number }) => <span data-testid="hash-icon">{size}</span>,
  Search: ({ size }: { size?: number }) => <span data-testid="search-icon">{size}</span>,
  User: ({ size }: { size?: number }) => <span data-testid="user-icon">{size}</span>,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ guildId: routeMocks.guildId }),
}));

vi.mock('@harmonie/ui', () => ({
  Badge: ({
    children,
    onRemove,
  }: {
    children: ReactNode;
    icon?: ReactNode;
    onRemove?: () => void;
    variant?: string;
  }) => (
    <span>
      {children}
      <button type="button" onClick={onRemove} aria-label={`remove ${children}`}>
        remove
      </button>
    </span>
  ),
  Combobox: ({
    emptyMessage,
    header,
    items,
    onSearchChange,
    onSelect,
    searchPlaceholder,
    searchValue,
  }: {
    emptyMessage?: string;
    header?: string;
    items: Array<{ label: string; value: string }>;
    onSearchChange?: (value: string) => void;
    onSelect: (value: string) => void;
    searchPlaceholder?: string;
    searchValue?: string;
  }) => (
    <div role="listbox" aria-label={header ?? searchPlaceholder ?? 'combobox'}>
      {onSearchChange && (
        <input
          aria-label={searchPlaceholder}
          value={searchValue ?? ''}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      )}
      {items.length > 0 ? (
        items.map((item) => (
          <button key={item.value} type="button" onClick={() => onSelect(item.value)}>
            {item.label}
          </button>
        ))
      ) : (
        <span>{emptyMessage}</span>
      )}
    </div>
  ),
  FilterInput: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <label>
      <span>filter input</span>
      <div onClick={onClick}>{children}</div>
    </label>
  ),
  IconButton: ({
    children,
    onClick,
    selected,
    title,
  }: {
    children: ReactNode;
    onClick?: () => void;
    selected?: boolean;
    title?: string;
  }) => (
    <button type="button" data-selected={selected ? 'true' : 'false'} onClick={onClick}>
      {title}
      {children}
    </button>
  ),
}));

vi.mock('@/features/channel/ChannelContext', () => ({
  useChannels: () => ({ channels: dataMocks.channels }),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuildMembers: (guildId?: string) => (guildId === routeMocks.guildId ? dataMocks.members : []),
}));

vi.mock('@/shared/hooks/useCoarsePointer', () => ({
  useCoarsePointer: () => dataMocks.isCoarsePointer,
}));

const members: GuildMember[] = [
  {
    userId: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    isActive: true,
    role: 'Member',
    joinedAtUtc: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'user-2',
    username: 'ada',
    displayName: 'Ada Lovelace',
    isActive: true,
    role: 'Admin',
    joinedAtUtc: '2026-01-02T00:00:00Z',
  },
];

const channels: Channel[] = [
  {
    channelId: 'channel-1',
    name: 'general',
    type: 'Text',
    isDefault: true,
    position: 0,
  },
  {
    channelId: 'channel-2',
    name: 'voice',
    type: 'Voice',
    isDefault: false,
    position: 1,
  },
];

const renderSearchBar = (props: Partial<Parameters<typeof GuildSearchBar>[0]> = {}) => {
  const onAuthorChange = vi.fn();
  const onChannelChange = vi.fn();
  const onQueryChange = vi.fn();

  const view = render(
    <GuildSearchBar
      query=""
      authorId={null}
      channelId={null}
      onQueryChange={onQueryChange}
      onAuthorChange={onAuthorChange}
      onChannelChange={onChannelChange}
      {...props}
    />
  );

  return { ...view, onAuthorChange, onChannelChange, onQueryChange };
};

describe('GuildSearchBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataMocks.channels = channels;
    dataMocks.isCoarsePointer = false;
    dataMocks.members = members;
    routeMocks.guildId = 'guild-1';
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  it('filters by member and channel from the desktop control', () => {
    const { onAuthorChange, onChannelChange, onQueryChange, rerender } = renderSearchBar();
    const input = screen.getByRole('textbox', { name: 'guild.search.placeholder' });

    fireEvent.focus(input);
    expect(screen.getByRole('listbox', { name: 'guild.search.filters' })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'hello' } });
    expect(onQueryChange).toHaveBeenCalledWith('hello');

    fireEvent.click(screen.getByRole('button', { name: 'guild.search.filterByAuthor' }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'guild.search.memberPickerPlaceholder' }),
      { target: { value: 'ada' } }
    );

    expect(screen.queryByRole('button', { name: 'Alice' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ada Lovelace' }));
    expect(onAuthorChange).toHaveBeenCalledWith('user-2');

    rerender(
      <GuildSearchBar
        query="hello"
        authorId="user-2"
        channelId="channel-1"
        onQueryChange={onQueryChange}
        onAuthorChange={onAuthorChange}
        onChannelChange={onChannelChange}
      />
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('general')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'remove Ada Lovelace' }));
    fireEvent.click(screen.getByRole('button', { name: 'remove general' }));

    expect(onAuthorChange).toHaveBeenCalledWith(null);
    expect(onChannelChange).toHaveBeenCalledWith(null);

    fireEvent.focus(screen.getByRole('textbox', { name: 'guild.search.placeholder' }));
    fireEvent.click(screen.getByRole('button', { name: 'guild.search.filterByChannel' }));
    fireEvent.click(screen.getByRole('button', { name: 'general' }));

    expect(onChannelChange).toHaveBeenCalledWith('channel-1');
  });

  it('opens the mobile search control and closes it on outside clicks', () => {
    const { container } = renderSearchBar({ query: 'active' });
    const mobileButton = screen.getByRole('button', { name: /guild.search.title/ });

    expect(mobileButton).toHaveAttribute('data-selected', 'true');

    fireEvent.click(mobileButton);
    expect(screen.getAllByRole('listbox', { name: 'guild.search.filters' })).toHaveLength(2);

    fireEvent.mouseDown(document.body);

    expect(container.querySelector('[role="listbox"]')).not.toBeInTheDocument();
  });
});
