import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GuildWorkspaceProvider, useGuildWorkspace } from './GuildWorkspaceProvider';

const WorkspaceHarness = () => {
  const workspace = useGuildWorkspace();

  return (
    <div>
      <output aria-label="members">{String(workspace.membersOpen)}</output>
      <output aria-label="query" data-value={workspace.searchQuery}>
        {workspace.searchQuery}
      </output>
      <output aria-label="author">{workspace.searchAuthorId ?? ''}</output>
      <output aria-label="channel">{workspace.searchChannelId ?? ''}</output>
      <output aria-label="has-search">{String(workspace.hasSearch)}</output>
      <button type="button" onClick={workspace.toggleMembersPanel}>
        toggle members
      </button>
      <button type="button" onClick={workspace.closeMembersPanel}>
        close members
      </button>
      <button type="button" onClick={() => workspace.setSearchQuery(' hello ')}>
        query
      </button>
      <button type="button" onClick={() => workspace.setSearchQuery('   ')}>
        blank query
      </button>
      <button type="button" onClick={() => workspace.setSearchAuthorId('user-1')}>
        author
      </button>
      <button type="button" onClick={() => workspace.setSearchChannelId('channel-1')}>
        channel
      </button>
      <button type="button" onClick={workspace.clearSearch}>
        clear
      </button>
    </div>
  );
};

const renderProvider = (path = '/guilds/guild-1/channels/channel-1') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GuildWorkspaceProvider>
        <WorkspaceHarness />
      </GuildWorkspaceProvider>
    </MemoryRouter>
  );

describe('GuildWorkspaceProvider', () => {
  it('toggles members only on text channel routes and closes it when search starts', () => {
    renderProvider();

    expect(screen.getByLabelText('members')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'toggle members' }));
    expect(screen.getByLabelText('members')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'query' }));
    expect(screen.getByLabelText('query')).toHaveAttribute('data-value', ' hello ');
    expect(screen.getByLabelText('members')).toHaveTextContent('false');
    expect(screen.getByLabelText('has-search')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByLabelText('query')).toHaveAttribute('data-value', '');
    expect(screen.getByLabelText('has-search')).toHaveTextContent('false');
  });

  it('tracks author and channel search filters and hides members outside text channels', () => {
    renderProvider('/guilds/guild-1/settings');

    fireEvent.click(screen.getByRole('button', { name: 'toggle members' }));
    expect(screen.getByLabelText('members')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'author' }));
    expect(screen.getByLabelText('author')).toHaveTextContent('user-1');
    expect(screen.getByLabelText('has-search')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'channel' }));
    expect(screen.getByLabelText('channel')).toHaveTextContent('channel-1');

    fireEvent.click(screen.getByRole('button', { name: 'blank query' }));
    expect(screen.getByLabelText('query')).toHaveAttribute('data-value', '   ');

    fireEvent.click(screen.getByRole('button', { name: 'close members' }));
    expect(screen.getByLabelText('members')).toHaveTextContent('false');
  });

  it('throws when the hook is used outside the provider', () => {
    const ThrowingHarness = () => {
      useGuildWorkspace();
      return null;
    };

    expect(() => render(<ThrowingHarness />)).toThrow(
      'useGuildWorkspace must be used within a GuildWorkspaceProvider'
    );
  });
});
