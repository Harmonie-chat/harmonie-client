import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayoutShell } from './MainLayoutShell';
import type { Guild } from '@/types/guild';

const state = vi.hoisted(() => ({
  guilds: [] as Guild[],
  params: {} as { channelId?: string; conversationId?: string },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div>Route outlet</div>,
    useParams: () => state.params,
  };
});

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => ({ guilds: state.guilds }),
}));

vi.mock('@/features/guild/GuildSidebar', () => ({
  GuildSidebar: () => <nav>Guild sidebar</nav>,
}));

vi.mock('@/features/guild/workspace/GuildWorkspaceSidepanels', () => ({
  GuildWorkspaceSidepanels: ({ hasGuilds }: { hasGuilds: boolean }) => (
    <aside>Sidepanels {String(hasGuilds)}</aside>
  ),
}));

vi.mock('@/features/user/UserPanel', () => ({
  UserPanel: () => <div>User panel</div>,
}));

vi.mock('@/shared/voice/VoiceConnectionBar', () => ({
  VoiceConnectionBar: () => <div>Voice bar</div>,
}));

vi.mock('./LayoutSync', () => ({
  LayoutSync: () => <div>Layout sync</div>,
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

describe('MainLayoutShell', () => {
  it('renders shell chrome, route outlet, and sidepanels when guilds exist', () => {
    state.guilds = [guild('guild-1')];
    state.params = { channelId: 'channel-1' };

    render(<MainLayoutShell sidebar={<aside>Workspace sidebar</aside>} />);

    expect(screen.getByText('Layout sync')).toBeInTheDocument();
    expect(screen.getByText('Guild sidebar')).toBeInTheDocument();
    expect(screen.getByText('Workspace sidebar')).toBeInTheDocument();
    expect(screen.getByText('Voice bar')).toBeInTheDocument();
    expect(screen.getByText('User panel')).toBeInTheDocument();
    expect(screen.getByText('Route outlet')).toBeInTheDocument();
    expect(screen.getByText('Sidepanels true')).toBeInTheDocument();
  });

  it('can hide workspace sidepanels', () => {
    state.guilds = [];
    state.params = {};

    render(<MainLayoutShell sidebar={null} showSidepanels={false} />);

    expect(screen.queryByText(/Sidepanels/)).not.toBeInTheDocument();
  });
});
