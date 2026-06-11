import { act, fireEvent, render, screen } from '@testing-library/react';
import type { GuildMessageSearchItem } from '@/types/guild';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildSearchPanel } from './GuildSearchPanel';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  params: { guildId: 'guild-1' } as { guildId?: string },
  searchGuildMessages: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'fr' }, t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
  useParams: () => mocks.params,
}));

vi.mock('@harmonie/ui', () => ({
  IconButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button type="button" aria-label="close search" onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/api/guilds', () => ({
  searchGuildMessages: (...args: unknown[]) => mocks.searchGuildMessages(...args),
}));

vi.mock('./GuildSearchResultItem', () => ({
  GuildSearchResultItem: ({
    item,
    language,
    onClick,
  }: {
    item: GuildMessageSearchItem;
    language: string;
    onClick: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      result:{item.messageId}:{language}
    </button>
  ),
}));

const item = (messageId = 'message-1'): GuildMessageSearchItem => ({
  messageId,
  channelId: 'channel-1',
  channelName: 'general',
  authorUserId: 'user-1',
  authorUsername: 'alice',
  authorDisplayName: 'Alice',
  authorAvatarFileId: null,
  authorAvatar: { icon: null, color: null, bg: null },
  content: 'hello',
  attachments: [],
  createdAtUtc: '2026-01-01T00:00:00.000Z',
  updatedAtUtc: null,
});

const advanceSearch = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(350);
  });
};

describe('GuildSearchPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mocks.params = { guildId: 'guild-1' };
    mocks.searchGuildMessages.mockResolvedValue({
      guildId: 'guild-1',
      items: [],
      nextCursor: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the hint without a query and closes from the header', () => {
    const onClose = vi.fn();

    render(<GuildSearchPanel query="   " authorId={null} channelId={null} onClose={onClose} />);

    expect(screen.getByText('guild.search.hint')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('close search'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mocks.searchGuildMessages).not.toHaveBeenCalled();
  });

  it('debounces searches, renders results, and navigates with a search target', async () => {
    const onClose = vi.fn();
    mocks.searchGuildMessages.mockResolvedValue({
      guildId: 'guild-1',
      items: [item('message-1')],
      nextCursor: null,
    });

    render(
      <GuildSearchPanel
        query=" hello "
        authorId="author-1"
        channelId="channel-1"
        onClose={onClose}
      />
    );

    expect(screen.getByText('guild.search.loading')).toBeInTheDocument();
    await advanceSearch();

    expect(mocks.searchGuildMessages).toHaveBeenCalledWith('guild-1', {
      q: 'hello',
      authorId: 'author-1',
      channelId: 'channel-1',
      limit: 30,
    });
    expect(screen.getByRole('button', { name: 'result:message-1:fr' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'result:message-1:fr' }));

    expect(mocks.navigate).toHaveBeenCalledWith('/guilds/guild-1/channels/channel-1', {
      state: { searchTarget: { messageId: 'message-1', nonce: 'message-1-1' } },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows empty and error states and skips navigation without a guild id', async () => {
    const { rerender } = render(
      <GuildSearchPanel query="hello" authorId={null} channelId={null} onClose={vi.fn()} />
    );

    await advanceSearch();
    expect(screen.getByText('guild.search.empty')).toBeInTheDocument();

    mocks.searchGuildMessages.mockRejectedValueOnce(new Error('nope'));
    rerender(<GuildSearchPanel query="error" authorId={null} channelId={null} onClose={vi.fn()} />);
    await advanceSearch();
    expect(screen.getByText('guild.search.error')).toBeInTheDocument();

    mocks.params = {};
    rerender(<GuildSearchPanel query="hello" authorId={null} channelId={null} onClose={vi.fn()} />);

    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
