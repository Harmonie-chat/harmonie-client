import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MainLayout } from './MainLayout';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div>Main outlet</div>,
  };
});

vi.mock('@/features/guild/GuildContext', () => ({
  GuildProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="GuildProvider">{children}</div>
  ),
}));

vi.mock('@/features/guild/workspace/GuildWorkspaceProvider', () => ({
  GuildWorkspaceProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="GuildWorkspaceProvider">{children}</div>
  ),
}));

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  VoicePresenceProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="VoicePresenceProvider">{children}</div>
  ),
}));

vi.mock('@/features/channel/ChannelContext', () => ({
  ChannelProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="ChannelProvider">{children}</div>
  ),
}));

vi.mock('@/features/realtime/MessageActivityContext', () => ({
  MessageActivityProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="MessageActivityProvider">{children}</div>
  ),
}));

vi.mock('@/features/conversation/ConversationContext', () => ({
  ConversationProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="ConversationProvider">{children}</div>
  ),
}));

vi.mock('@/features/conversation/ConversationCallIncomingToast', () => ({
  ConversationCallIncomingToast: () => <div>Incoming call toast</div>,
}));

vi.mock('@/features/user/UserProfileRealtimeSync', () => ({
  UserProfileRealtimeSync: () => <div>User realtime sync</div>,
}));

describe('MainLayout', () => {
  it('composes the application providers around the route outlet', () => {
    render(<MainLayout />);

    expect(screen.getByTestId('GuildProvider')).toBeInTheDocument();
    expect(screen.getByTestId('GuildWorkspaceProvider')).toBeInTheDocument();
    expect(screen.getByTestId('ConversationProvider')).toBeInTheDocument();
    expect(screen.getByTestId('VoicePresenceProvider')).toBeInTheDocument();
    expect(screen.getByTestId('ChannelProvider')).toBeInTheDocument();
    expect(screen.getByTestId('MessageActivityProvider')).toBeInTheDocument();
    expect(screen.getByText('Incoming call toast')).toBeInTheDocument();
    expect(screen.getByText('User realtime sync')).toBeInTheDocument();
    expect(screen.getByText('Main outlet')).toBeInTheDocument();
  });
});
