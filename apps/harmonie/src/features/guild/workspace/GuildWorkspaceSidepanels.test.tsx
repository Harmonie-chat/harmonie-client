import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GuildWorkspaceSidepanels } from './GuildWorkspaceSidepanels';

const mocks = vi.hoisted(() => ({
  workspace: {
    membersOpen: false,
    searchQuery: '',
    searchAuthorId: null as string | null,
    searchChannelId: null as string | null,
    hasSearch: false,
    clearSearch: vi.fn(),
    closeMembersPanel: vi.fn(),
  },
}));

vi.mock('./GuildWorkspaceProvider', () => ({
  useGuildWorkspace: () => mocks.workspace,
}));

vi.mock('@/features/guild/search/GuildSearchPanel', () => ({
  GuildSearchPanel: ({
    authorId,
    channelId,
    onClose,
    query,
  }: {
    authorId: string | null;
    channelId: string | null;
    onClose: () => void;
    query: string;
  }) => (
    <section>
      search:{query}:{authorId}:{channelId}
      <button type="button" onClick={onClose}>
        close search
      </button>
    </section>
  ),
}));

vi.mock('@/features/guild/members/panel/MembersPanel', () => ({
  MembersPanel: ({ onClose }: { onClose: () => void }) => (
    <section>
      members panel
      <button type="button" onClick={onClose}>
        close members
      </button>
    </section>
  ),
}));

describe('GuildWorkspaceSidepanels', () => {
  it('renders nothing without guilds', () => {
    mocks.workspace.hasSearch = true;
    mocks.workspace.membersOpen = true;

    const { container } = render(<GuildWorkspaceSidepanels hasGuilds={false} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders search and members panels from workspace state', () => {
    mocks.workspace.hasSearch = true;
    mocks.workspace.membersOpen = true;
    mocks.workspace.searchQuery = 'hello';
    mocks.workspace.searchAuthorId = 'user-1';
    mocks.workspace.searchChannelId = 'channel-1';

    render(<GuildWorkspaceSidepanels hasGuilds />);

    expect(screen.getByText('search:hello:user-1:channel-1')).toBeInTheDocument();
    expect(screen.getByText('members panel')).toBeInTheDocument();

    screen.getByRole('button', { name: 'close search' }).click();
    screen.getByRole('button', { name: 'close members' }).click();

    expect(mocks.workspace.clearSearch).toHaveBeenCalledTimes(1);
    expect(mocks.workspace.closeMembersPanel).toHaveBeenCalledTimes(1);
  });
});
