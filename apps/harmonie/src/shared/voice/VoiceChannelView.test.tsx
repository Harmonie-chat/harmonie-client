import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Channel, Guild } from '@/types/guild';
import type { UserProfile } from '@/types/user';
import type { VoiceParticipant } from '@/types/voice';
import { VoiceChannelView } from './VoiceChannelView';

type VoiceActiveStageProps = {
  cardWidth: string;
  cards: Array<{ userId: string; label: string; isMuted: boolean }>;
  currentUserId?: string;
  labelsByUserId: Map<string, string>;
  localMedia: {
    isCameraEnabled: boolean;
    isMuted: boolean;
    isScreenSharing: boolean;
  };
  onLeave: () => void;
  onParticipantVolumeChange: (participantId: string, volume: number) => void;
  onToggleCamera: () => void;
  onToggleMute: () => void;
  onToggleParticipantMute: (participantId: string) => void;
  onTogglePin: (targetId: string) => void;
  onToggleScreenShare: () => void;
  pinning: {
    activePinnedTargetId: string | null;
    hasPinnedItem: boolean;
    pinnedParticipant?: { userId: string } | undefined;
    pinnedScreenShare?: { trackSid: string } | undefined;
  };
  rows: Array<Array<{ userId: string }>>;
  screenShares: Array<{ participantId: string; trackSid: string }>;
  stageState: { isDarkTheme: boolean };
};

const mocks = vi.hoisted(() => ({
  channels: null as Channel[] | null,
  guild: null as Guild | null,
  lastStageProps: null as VoiceActiveStageProps | null,
  navigate: vi.fn(),
  params: { channelId: 'voice-1', guildId: 'guild-1' } as {
    channelId?: string;
    guildId?: string;
  },
  theme: 'harmonie-light',
  user: null as UserProfile | null,
  voice: {
    activeChannelId: null as string | null,
    activeChannelName: null as string | null,
    cameraError: null as string | null,
    cameraTracks: [] as Array<{ participantId: string; trackSid: string }>,
    getParticipantVolume: vi.fn(),
    getParticipants: vi.fn(),
    isCameraEnabled: false,
    isJoining: false,
    isMuted: false,
    isScreenSharing: false,
    joinChannel: vi.fn(),
    joinError: null as string | null,
    leaveChannel: vi.fn(),
    mutedUserIds: new Set<string>(),
    screenShareError: null as string | null,
    screenShares: [] as Array<{ participantId: string; trackSid: string }>,
    setParticipantVolume: vi.fn(),
    speakingUserIds: new Set<string>(),
    toggleCamera: vi.fn(),
    toggleMute: vi.fn(),
    toggleParticipantMute: vi.fn(),
    toggleScreenShare: vi.fn(),
    updateActiveChannelMeta: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    Navigate: ({ replace, to }: { replace?: boolean; to: string }) => (
      <span data-replace={String(Boolean(replace))} data-testid="navigate" data-to={to} />
    ),
    useNavigate: () => mocks.navigate,
    useParams: () => mocks.params,
  };
});

vi.mock('@harmonie/ui', () => {
  return {
    IconButton: ({
      children,
      title,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & {
      size?: string;
      title?: string;
      tooltipSide?: string;
      variant?: string;
    }) => {
      const buttonProps = { ...props };
      delete buttonProps.className;
      delete buttonProps.size;
      delete buttonProps.tooltipSide;
      delete buttonProps.variant;

      return (
        <button
          aria-label={buttonProps['aria-label'] ?? title ?? 'icon button'}
          type="button"
          {...buttonProps}
        >
          {children}
        </button>
      );
    },
  };
});

vi.mock('@/features/channel/ChannelContext', () => ({
  useChannels: () => ({ channels: mocks.channels }),
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useCurrentGuild: () => ({ guild: mocks.guild }),
}));

vi.mock('@/features/user/ThemeContext', () => ({
  useTheme: () => ({ theme: mocks.theme }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
}));

vi.mock('./context/VoicePresenceContext', () => ({
  useVoicePresence: () => mocks.voice,
}));

vi.mock('./components/VoiceJoinPrompt', () => ({
  VoiceJoinPrompt: ({
    channelName,
    isJoining,
    joinError,
    onJoin,
  }: {
    channelName: string;
    isJoining: boolean;
    joinError: string | null;
    onJoin: () => void;
  }) => (
    <section aria-label="voice join prompt" data-joining={String(isJoining)}>
      <span>{channelName}</span>
      {joinError && <span>{joinError}</span>}
      <button onClick={onJoin} type="button">
        join prompt
      </button>
    </section>
  ),
}));

vi.mock('./layout/VoiceActiveStage', () => ({
  VoiceActiveStage: (props: VoiceActiveStageProps) => {
    mocks.lastStageProps = props;

    return (
      <section
        aria-label="voice active stage"
        data-card-width={props.cardWidth}
        data-current-user={props.currentUserId ?? 'none'}
        data-dark={String(props.stageState.isDarkTheme)}
        data-pinned={props.pinning.activePinnedTargetId ?? 'none'}
      >
        <span data-testid="card-count">{props.cards.length}</span>
        <span data-testid="row-count">{props.rows.length}</span>
        <span data-testid="screen-share-count">{props.screenShares.length}</span>
        <span data-testid="label-user-2">{props.labelsByUserId.get('user-2') ?? 'missing'}</span>
        <span data-testid="local-muted">{String(props.localMedia.isMuted)}</span>
        <span data-testid="has-pinned">{String(props.pinning.hasPinnedItem)}</span>
        <button onClick={() => props.onTogglePin('screenShare:screen-1')} type="button">
          toggle screen pin
        </button>
        <button onClick={() => props.onTogglePin('participant:user-2')} type="button">
          toggle participant pin
        </button>
        <button onClick={props.onToggleMute} type="button">
          toggle mute
        </button>
        <button onClick={props.onToggleCamera} type="button">
          toggle camera
        </button>
        <button onClick={props.onToggleScreenShare} type="button">
          toggle screen share
        </button>
        <button onClick={() => props.onToggleParticipantMute('user-2')} type="button">
          mute participant
        </button>
        <button onClick={() => props.onParticipantVolumeChange('user-2', 0.4)} type="button">
          set volume
        </button>
        <button onClick={props.onLeave} type="button">
          leave channel
        </button>
      </section>
    );
  },
}));

const channel = (input: Partial<Channel> = {}): Channel => ({
  channelId: 'voice-1',
  isDefault: false,
  name: 'Voice Lounge',
  position: 1,
  type: 'Voice',
  ...input,
});

const guild = (input: Partial<Guild> = {}): Guild => ({
  guildId: 'guild-1',
  icon: null,
  iconFileId: null,
  joinedAtUtc: '2024-01-01T00:00:00.000Z',
  name: 'Harmonie',
  ownerUserId: 'user-1',
  role: 'Owner',
  ...input,
});

const participant = (input: Partial<VoiceParticipant> = {}): VoiceParticipant => ({
  avatarBg: null,
  avatarColor: null,
  avatarFileId: null,
  avatarIcon: null,
  displayName: 'Grace Hopper',
  userId: 'user-2',
  username: 'grace',
  ...input,
});

const currentUser: UserProfile = {
  avatar: { bg: '#111', color: '#fff', icon: 'User' },
  avatarFileId: 'avatar-1',
  displayName: 'Ada Lovelace',
  language: 'en',
  theme: 'harmonie-light',
  userId: 'user-1',
  username: 'ada',
};

describe('VoiceChannelView', () => {
  beforeEach(() => {
    mocks.channels = [channel()];
    mocks.guild = guild();
    mocks.lastStageProps = null;
    mocks.navigate.mockReset();
    mocks.params = { channelId: 'voice-1', guildId: 'guild-1' };
    mocks.theme = 'harmonie-light';
    mocks.user = currentUser;
    mocks.voice.activeChannelId = null;
    mocks.voice.activeChannelName = null;
    mocks.voice.cameraError = null;
    mocks.voice.cameraTracks = [];
    mocks.voice.getParticipantVolume.mockReturnValue(1);
    mocks.voice.getParticipants.mockReturnValue([]);
    mocks.voice.isCameraEnabled = false;
    mocks.voice.isJoining = false;
    mocks.voice.isMuted = false;
    mocks.voice.isScreenSharing = false;
    mocks.voice.joinChannel.mockResolvedValue(undefined);
    mocks.voice.joinError = null;
    mocks.voice.leaveChannel.mockReset();
    mocks.voice.mutedUserIds = new Set();
    mocks.voice.screenShareError = null;
    mocks.voice.screenShares = [];
    mocks.voice.setParticipantVolume.mockReset();
    mocks.voice.speakingUserIds = new Set();
    mocks.voice.toggleCamera.mockResolvedValue(undefined);
    mocks.voice.toggleMute.mockReset();
    mocks.voice.toggleParticipantMute.mockReset();
    mocks.voice.toggleScreenShare.mockResolvedValue(undefined);
    mocks.voice.updateActiveChannelMeta.mockReset();
  });

  it('redirects when route params are missing', () => {
    mocks.params = {};

    render(<VoiceChannelView />);

    expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/');
    expect(screen.getByTestId('navigate')).toHaveAttribute('data-replace', 'true');
  });

  it('renders the join prompt, navigates back, and auto-joins inactive channels once', async () => {
    const user = userEvent.setup();
    render(<VoiceChannelView />);

    expect(screen.getByRole('region', { name: 'voice join prompt' })).toHaveTextContent(
      'Voice Lounge'
    );
    await waitFor(() =>
      expect(mocks.voice.joinChannel).toHaveBeenCalledWith(
        'voice-1',
        'Voice Lounge',
        'guild-1',
        'Harmonie'
      )
    );

    await user.click(screen.getByRole('button', { name: 'guild.channels.backToChannels' }));
    expect(mocks.navigate).toHaveBeenCalledWith('/guilds/guild-1');

    await user.click(screen.getByRole('button', { name: 'join prompt' }));
    expect(mocks.voice.joinChannel).toHaveBeenCalledWith(
      'voice-1',
      'Voice Lounge',
      'guild-1',
      'Harmonie'
    );
  });

  it('does not auto-join while joining and falls back to ids when entities are missing', () => {
    mocks.channels = [];
    mocks.guild = null;
    mocks.voice.isJoining = true;
    mocks.voice.joinError = 'voice.joinError';

    render(<VoiceChannelView />);

    expect(screen.getByRole('region', { name: 'voice join prompt' })).toHaveTextContent('voice-1');
    expect(screen.getByRole('region', { name: 'voice join prompt' })).toHaveTextContent(
      'voice.joinError'
    );
    expect(mocks.voice.joinChannel).not.toHaveBeenCalled();
  });

  it('renders the active stage, updates metadata, and forwards media actions', async () => {
    const user = userEvent.setup();
    mocks.theme = 'harmonie-obsidian';
    mocks.voice.activeChannelId = 'voice-1';
    mocks.voice.activeChannelName = null;
    mocks.voice.cameraTracks = [{ participantId: 'user-2', trackSid: 'camera-1' }];
    mocks.voice.getParticipants.mockReturnValue([
      participant(),
      participant({ displayName: null, userId: 'user-3', username: 'katherine' }),
    ]);
    mocks.voice.isCameraEnabled = true;
    mocks.voice.isMuted = true;
    mocks.voice.isScreenSharing = true;
    mocks.voice.mutedUserIds = new Set(['user-2']);
    mocks.voice.screenShares = [{ participantId: 'user-2', trackSid: 'screen-1' }];
    mocks.voice.speakingUserIds = new Set(['user-2']);

    render(<VoiceChannelView />);

    expect(screen.getByRole('region', { name: 'voice active stage' })).toHaveAttribute(
      'data-dark',
      'true'
    );
    expect(screen.getByRole('region', { name: 'voice active stage' })).toHaveAttribute(
      'data-current-user',
      'user-1'
    );
    expect(screen.getByRole('region', { name: 'voice active stage' })).toHaveAttribute(
      'data-pinned',
      'screenShare:screen-1'
    );
    expect(screen.getByTestId('card-count')).toHaveTextContent('3');
    expect(screen.getByTestId('row-count')).toHaveTextContent('1');
    expect(screen.getByTestId('screen-share-count')).toHaveTextContent('1');
    expect(screen.getByTestId('label-user-2')).toHaveTextContent('Grace Hopper');
    expect(screen.getByTestId('local-muted')).toHaveTextContent('true');
    expect(screen.getByTestId('has-pinned')).toHaveTextContent('true');
    expect(mocks.voice.updateActiveChannelMeta).toHaveBeenCalledWith('Voice Lounge', 'Harmonie');

    await user.click(screen.getByRole('button', { name: 'toggle mute' }));
    await user.click(screen.getByRole('button', { name: 'toggle camera' }));
    await user.click(screen.getByRole('button', { name: 'toggle screen share' }));
    await user.click(screen.getByRole('button', { name: 'mute participant' }));
    await user.click(screen.getByRole('button', { name: 'set volume' }));
    await user.click(screen.getByRole('button', { name: 'leave channel' }));

    expect(mocks.voice.toggleMute).toHaveBeenCalledTimes(1);
    expect(mocks.voice.toggleCamera).toHaveBeenCalledTimes(1);
    expect(mocks.voice.toggleScreenShare).toHaveBeenCalledTimes(1);
    expect(mocks.voice.toggleParticipantMute).toHaveBeenCalledWith('user-2');
    expect(mocks.voice.setParticipantVolume).toHaveBeenCalledWith('user-2', 0.4);
    expect(mocks.voice.leaveChannel).toHaveBeenCalledTimes(1);
  });

  it('toggles between default screen share pinning, disabled pinning, and participant pinning', async () => {
    const user = userEvent.setup();
    mocks.voice.activeChannelId = 'voice-1';
    mocks.voice.activeChannelName = 'Voice Lounge';
    mocks.voice.getParticipants.mockReturnValue([participant()]);
    mocks.voice.screenShares = [{ participantId: 'user-2', trackSid: 'screen-1' }];

    render(<VoiceChannelView />);

    expect(screen.getByRole('region', { name: 'voice active stage' })).toHaveAttribute(
      'data-pinned',
      'screenShare:screen-1'
    );

    await user.click(screen.getByRole('button', { name: 'toggle screen pin' }));
    expect(screen.getByRole('region', { name: 'voice active stage' })).toHaveAttribute(
      'data-pinned',
      'none'
    );

    await user.click(screen.getByRole('button', { name: 'toggle participant pin' }));
    expect(screen.getByRole('region', { name: 'voice active stage' })).toHaveAttribute(
      'data-pinned',
      'participant:user-2'
    );
  });
});
