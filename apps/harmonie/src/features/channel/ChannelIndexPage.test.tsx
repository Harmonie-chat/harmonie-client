import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelIndexPage } from './ChannelIndexPage';
import type { Channel, Guild } from '@/types/guild';

const state = vi.hoisted(() => ({
  channels: null as Channel[] | null,
  guilds: [] as Guild[],
  guildsLoading: false,
}));

vi.mock('@/features/channel/ChannelContext', () => ({
  useChannels: () => ({ channels: state.channels }),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => ({ guilds: state.guilds, guildsLoading: state.guildsLoading }),
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

const channel = (input: Partial<Channel>): Channel => ({
  channelId: 'channel-1',
  name: 'general',
  type: 'Text',
  isDefault: false,
  position: 0,
  ...input,
});

const renderPage = (initialPath = '/guilds/guild-1') =>
  render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/guilds/:guildId" element={<ChannelIndexPage />} />
        <Route path="/guilds/:guildId/channels/:channelId" element={<div>Channel target</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('ChannelIndexPage', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('renders nothing while guilds or channels are not ready', () => {
    state.guildsLoading = true;
    state.channels = null;
    state.guilds = [];

    const { container } = renderPage();

    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to the default text channel on desktop', () => {
    state.guildsLoading = false;
    state.guilds = [guild('guild-1')];
    state.channels = [
      channel({ channelId: 'voice-1', type: 'Voice', position: 0 }),
      channel({ channelId: 'text-2', type: 'Text', isDefault: true, position: 2 }),
      channel({ channelId: 'text-1', type: 'Text', position: 1 }),
    ];

    renderPage();

    expect(screen.getByText('Channel target')).toBeInTheDocument();
  });

  it('renders nothing on mobile and redirects to the first text channel when no default exists', () => {
    state.guildsLoading = false;
    state.guilds = [guild('guild-1')];
    state.channels = [
      channel({ channelId: 'text-2', type: 'Text', position: 2 }),
      channel({ channelId: 'text-1', type: 'Text', position: 1 }),
    ];
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const mobileView = renderPage();

    expect(mobileView.container).toBeEmptyDOMElement();

    mobileView.unmount();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    renderPage();

    expect(screen.getByText('Channel target')).toBeInTheDocument();
  });

  it('unsubscribes from mobile viewport changes on unmount', () => {
    const media = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    window.matchMedia = vi.fn().mockReturnValue(media);
    state.guildsLoading = false;
    state.guilds = [guild('guild-1')];
    state.channels = [channel({ channelId: 'text-1', type: 'Text' })];

    const { unmount } = renderPage();

    expect(media.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('redirects home when the guild does not exist or no text channel exists', () => {
    state.guildsLoading = false;
    state.guilds = [guild('guild-2')];
    state.channels = [channel({ channelId: 'voice-1', type: 'Voice' })];

    renderPage();

    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
