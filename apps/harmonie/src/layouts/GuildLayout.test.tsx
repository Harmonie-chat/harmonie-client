import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GuildLayout } from './GuildLayout';
import type { Guild } from '@/types/guild';

const state = vi.hoisted(() => ({
  guildsState: {
    guilds: [] as Guild[],
    guildsLoading: false,
  },
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => state.guildsState,
}));

vi.mock('@/features/channel/ChannelSidebar', () => ({
  ChannelSidebar: () => <aside>Channel sidebar</aside>,
}));

vi.mock('./MainLayoutShell', () => ({
  MainLayoutShell: ({ sidebar }: { sidebar: ReactNode }) => (
    <div>
      <span>Main shell</span>
      {sidebar}
    </div>
  ),
}));

const guild = (guildId: string): Guild => ({
  guildId,
  name: 'Guild',
  ownerUserId: 'owner-1',
  role: 'Member',
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  iconFileId: null,
  icon: null,
});

const renderLayout = (initialPath: string) =>
  render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/guilds/:guildId" element={<GuildLayout />} />
        <Route path="/conversations" element={<div>Conversations</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('GuildLayout', () => {
  it('renders the channel sidebar when the selected guild exists', () => {
    state.guildsState = { guilds: [guild('guild-1')], guildsLoading: false };

    renderLayout('/guilds/guild-1');

    expect(screen.getByText('Main shell')).toBeInTheDocument();
    expect(screen.getByText('Channel sidebar')).toBeInTheDocument();
  });

  it('redirects to conversations when the selected guild no longer exists', () => {
    state.guildsState = { guilds: [guild('guild-2')], guildsLoading: false };

    renderLayout('/guilds/guild-1');

    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('keeps the layout visible while guilds are loading', () => {
    state.guildsState = { guilds: [], guildsLoading: true };

    renderLayout('/guilds/guild-1');

    expect(screen.getByText('Main shell')).toBeInTheDocument();
    expect(screen.queryByText('Channel sidebar')).not.toBeInTheDocument();
  });
});
