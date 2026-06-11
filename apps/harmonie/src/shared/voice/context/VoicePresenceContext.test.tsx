import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VoicePresenceProvider, useVoicePresence } from './VoicePresenceContext';
import type { VoiceParticipantInit } from '@/types/voice';

const mocks = vi.hoisted(() => ({
  getParticipants: vi.fn(() => [{ userId: 'user-1', username: 'ada' }]),
  getConversationParticipants: vi.fn(() => [{ userId: 'user-2', username: 'grace' }]),
  seedParticipantsFromJoin: vi.fn(),
  seedFromChannelList: vi.fn(),
  syncParticipantsFromRoom: vi.fn(),
  updateActiveChannelMeta: vi.fn(),
  updateActiveConversationMeta: vi.fn(),
  getParticipantVolume: vi.fn(() => 0.75),
  setParticipantVolume: vi.fn(),
  toggleParticipantMute: vi.fn(),
  joinChannel: vi.fn().mockResolvedValue(undefined),
  joinConversation: vi.fn().mockResolvedValue(undefined),
  leaveChannel: vi.fn(),
  leaveCall: vi.fn(),
  toggleMute: vi.fn(),
  toggleScreenShare: vi.fn(),
  toggleCamera: vi.fn(),
}));

vi.mock('../hooks/useVoiceParticipants', () => ({
  useVoiceParticipants: () => ({
    getParticipants: mocks.getParticipants,
    getConversationParticipants: mocks.getConversationParticipants,
    seedParticipantsFromJoin: mocks.seedParticipantsFromJoin,
    seedFromChannelList: mocks.seedFromChannelList,
    syncParticipantsFromRoom: mocks.syncParticipantsFromRoom,
  }),
}));

vi.mock('../hooks/useVoiceRoom', () => ({
  useVoiceRoom: () => ({
    activeTargetKind: 'channel',
    activeChannelId: 'channel-1',
    activeChannelName: 'General',
    activeConversationId: null,
    activeConversationName: null,
    activeGuildId: 'guild-1',
    activeGuildName: 'Guild',
    ping: 42,
    updateActiveChannelMeta: mocks.updateActiveChannelMeta,
    updateActiveConversationMeta: mocks.updateActiveConversationMeta,
    isMuted: false,
    mutedUserIds: new Set(['user-2']),
    isJoining: false,
    joinError: null,
    speakingUserIds: new Set(['user-1']),
    screenShares: [],
    isScreenSharing: false,
    screenShareError: null,
    cameraTracks: [],
    isCameraEnabled: true,
    cameraError: null,
    getParticipantVolume: mocks.getParticipantVolume,
    setParticipantVolume: mocks.setParticipantVolume,
    toggleParticipantMute: mocks.toggleParticipantMute,
    joinChannel: mocks.joinChannel,
    joinConversation: mocks.joinConversation,
    leaveChannel: mocks.leaveChannel,
    leaveCall: mocks.leaveCall,
    toggleMute: mocks.toggleMute,
    toggleScreenShare: mocks.toggleScreenShare,
    toggleCamera: mocks.toggleCamera,
  }),
}));

const participants: VoiceParticipantInit[] = [
  {
    userId: 'user-1',
    username: 'ada',
    displayName: null,
    avatarFileId: null,
    avatarBg: null,
    avatarColor: null,
    avatarIcon: null,
  },
];

const Consumer = () => {
  const voice = useVoicePresence();

  return (
    <div>
      <span data-testid="active">
        {voice.activeTargetKind}:{voice.activeChannelName}:{voice.activeGuildName}:{voice.ping}
      </span>
      <span data-testid="volume">{voice.getParticipantVolume('user-1')}</span>
      <button type="button" onClick={() => voice.seedParticipants('channel-1', participants)}>
        Seed
      </button>
      <button
        type="button"
        onClick={() => voice.seedFromChannelList([{ channelId: 'channel-1', participants }])}
      >
        Seed list
      </button>
      <button
        type="button"
        onClick={() => void voice.joinChannel('channel-1', 'General', 'guild-1', 'Guild')}
      >
        Join channel
      </button>
      <button type="button" onClick={() => void voice.joinConversation('conversation-1', 'Direct')}>
        Join conversation
      </button>
      <button type="button" onClick={() => voice.leaveChannel()}>
        Leave channel
      </button>
      <button type="button" onClick={() => voice.leaveCall()}>
        Leave call
      </button>
      <button type="button" onClick={() => voice.toggleMute()}>
        Mute
      </button>
      <button type="button" onClick={() => voice.toggleScreenShare()}>
        Screen
      </button>
      <button type="button" onClick={() => voice.toggleCamera()}>
        Camera
      </button>
      <button type="button" onClick={() => voice.setParticipantVolume('user-1', 0.25)}>
        Volume
      </button>
      <button type="button" onClick={() => voice.toggleParticipantMute('user-1')}>
        Participant mute
      </button>
    </div>
  );
};

describe('VoicePresenceProvider', () => {
  it('exposes safe default no-op values outside the provider', async () => {
    const DefaultConsumer = () => {
      const voice = useVoicePresence();

      return (
        <button
          type="button"
          onClick={() => {
            voice.getParticipants('room-1');
            voice.getConversationParticipants('conversation-1');
            voice.seedFromChannelList([]);
            voice.seedParticipants('room-1', []);
            voice.updateActiveChannelMeta('General', 'Guild');
            voice.updateActiveConversationMeta('Direct');
            voice.setParticipantVolume('user-1', 0.5);
            voice.toggleParticipantMute('user-1');
            void voice.joinChannel('channel-1');
            void voice.joinConversation('conversation-1');
            voice.leaveChannel();
            voice.leaveCall();
            voice.toggleMute();
            voice.toggleScreenShare();
            voice.toggleCamera();
          }}
        >
          Defaults {voice.getParticipantVolume('user-1')} {String(voice.isMuted)}
        </button>
      );
    };

    render(<DefaultConsumer />);

    expect(screen.getByRole('button', { name: 'Defaults 1 false' })).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Defaults 1 false' }).click();
    });
  });

  it('exposes voice participant and room state/actions through context', async () => {
    render(
      <VoicePresenceProvider>
        <Consumer />
      </VoicePresenceProvider>
    );

    expect(screen.getByTestId('active')).toHaveTextContent('channel:General:Guild:42');
    expect(screen.getByTestId('volume')).toHaveTextContent('0.75');

    await act(async () => {
      screen.getByRole('button', { name: 'Seed' }).click();
      screen.getByRole('button', { name: 'Seed list' }).click();
      screen.getByRole('button', { name: 'Join channel' }).click();
      screen.getByRole('button', { name: 'Join conversation' }).click();
      screen.getByRole('button', { name: 'Leave channel' }).click();
      screen.getByRole('button', { name: 'Leave call' }).click();
      screen.getByRole('button', { name: 'Mute' }).click();
      screen.getByRole('button', { name: 'Screen' }).click();
      screen.getByRole('button', { name: 'Camera' }).click();
      screen.getByRole('button', { name: 'Volume' }).click();
      screen.getByRole('button', { name: 'Participant mute' }).click();
    });

    expect(mocks.seedParticipantsFromJoin).toHaveBeenCalledWith(
      'channel',
      'channel-1',
      participants
    );
    expect(mocks.seedFromChannelList).toHaveBeenCalledWith([
      { channelId: 'channel-1', participants },
    ]);
    expect(mocks.joinChannel).toHaveBeenCalledWith('channel-1', 'General', 'guild-1', 'Guild');
    expect(mocks.joinConversation).toHaveBeenCalledWith('conversation-1', 'Direct');
    expect(mocks.leaveChannel).toHaveBeenCalledOnce();
    expect(mocks.leaveCall).toHaveBeenCalledOnce();
    expect(mocks.toggleMute).toHaveBeenCalledOnce();
    expect(mocks.toggleScreenShare).toHaveBeenCalledOnce();
    expect(mocks.toggleCamera).toHaveBeenCalledOnce();
    expect(mocks.setParticipantVolume).toHaveBeenCalledWith('user-1', 0.25);
    expect(mocks.toggleParticipantMute).toHaveBeenCalledWith('user-1');
  });
});
