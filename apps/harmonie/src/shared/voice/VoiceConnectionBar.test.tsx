import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceConnectionBar } from './VoiceConnectionBar';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  presence: {
    activeTargetKind: 'channel',
    activeChannelId: null as string | null,
    activeChannelName: null as string | null,
    activeConversationId: null as string | null,
    activeConversationName: null as string | null,
    activeGuildId: null as string | null,
    activeGuildName: null as string | null,
    ping: null as number | null,
    leaveCall: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: { ms?: number }) =>
      values?.ms === undefined ? key : `${key}:${values.ms}`,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@harmonie/ui', () => ({
  IconButton: ({
    'aria-label': ariaLabel,
    children,
    onClick,
  }: {
    'aria-label': string;
    children: ReactNode;
    onClick: () => void;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  Separator: () => <hr />,
}));

vi.mock('./context/VoicePresenceContext', () => ({
  useVoicePresence: () => mocks.presence,
}));

describe('VoiceConnectionBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.presence = {
      activeTargetKind: 'channel',
      activeChannelId: null,
      activeChannelName: null,
      activeConversationId: null,
      activeConversationName: null,
      activeGuildId: null,
      activeGuildName: null,
      ping: null,
      leaveCall: vi.fn(),
    };
  });

  it('renders nothing without an active voice target', () => {
    const { container } = render(<VoiceConnectionBar />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders channel call details, navigates to voice channel, and leaves call', () => {
    mocks.presence.activeTargetKind = 'channel';
    mocks.presence.activeGuildId = 'guild-1';
    mocks.presence.activeGuildName = 'Guild';
    mocks.presence.activeChannelId = 'voice-1';
    mocks.presence.activeChannelName = 'Lounge';
    mocks.presence.ping = 42;

    render(<VoiceConnectionBar />);

    expect(screen.getByText('voice.ping:42')).toBeInTheDocument();
    expect(screen.getByText('voice.connected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Guild / Lounge' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/guilds/guild-1/voice/voice-1');

    fireEvent.click(screen.getByRole('button', { name: 'voice.leave' }));
    expect(mocks.presence.leaveCall).toHaveBeenCalledTimes(1);
  });

  it('renders conversation call details and fallback labels', () => {
    const { rerender } = render(<VoiceConnectionBar />);

    mocks.presence.activeTargetKind = 'conversation';
    mocks.presence.activeConversationId = 'conversation-1';
    mocks.presence.activeConversationName = 'Direct chat';
    rerender(<VoiceConnectionBar />);

    fireEvent.click(screen.getByRole('button', { name: 'Direct chat' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/conversations/conversation-1');

    mocks.presence.activeConversationName = null;
    rerender(<VoiceConnectionBar />);
    expect(screen.getByRole('button', { name: '…' })).toBeInTheDocument();

    mocks.presence.activeTargetKind = 'channel';
    mocks.presence.activeChannelId = 'voice-2';
    mocks.presence.activeChannelName = null;
    mocks.presence.activeGuildId = null;
    rerender(<VoiceConnectionBar />);
    expect(screen.getByRole('button', { name: '…' })).toBeInTheDocument();
  });
});
