import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVoiceRoom } from './useVoiceRoom';

const mocks = vi.hoisted(() => ({
  applySinkId: vi.fn(),
  inputMuted: false,
  joinConversationVoiceCall: vi.fn(),
  joinVoiceChannel: vi.fn(),
  noiseReductionLevel: 'off',
  outputMuted: false,
  playVoiceConnectSound: vi.fn(),
  playVoiceDisconnectSound: vi.fn(),
  publishScreenShareWithAudio: vi.fn(),
  rooms: [] as FakeRoom[],
  selectedInputDeviceId: 'default',
  selectedVideoInputDeviceId: 'default',
  setInputMuted: vi.fn(),
}));

interface FakeParticipant {
  identity: string;
  isLocal?: boolean;
  isMicrophoneEnabled: boolean;
}

interface FakeRoom {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  emit: (eventName: string, ...args: unknown[]) => void;
  engine: {
    pcManager: {
      publisher: {
        getStats: ReturnType<typeof vi.fn>;
      };
    };
  };
  handlers: Map<string, ((...args: unknown[]) => void)[]>;
  localParticipant: {
    getTrackPublication: ReturnType<typeof vi.fn>;
    identity: string;
    isCameraEnabled: boolean;
    isMicrophoneEnabled: boolean;
    isScreenShareEnabled: boolean;
    setCameraEnabled: ReturnType<typeof vi.fn>;
    setMicrophoneEnabled: ReturnType<typeof vi.fn>;
    setScreenShareEnabled: ReturnType<typeof vi.fn>;
  };
  on: ReturnType<typeof vi.fn>;
  remoteParticipants: Map<string, FakeParticipant>;
  switchActiveDevice: ReturnType<typeof vi.fn>;
}

const createFakeRoom = (): FakeRoom => {
  const handlers = new Map<string, ((...args: unknown[]) => void)[]>();
  const room: FakeRoom = {
    connect: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(() => Promise.resolve()),
    emit: (eventName, ...args) => {
      handlers.get(eventName)?.forEach((handler) => handler(...args));
    },
    engine: {
      pcManager: {
        publisher: {
          getStats: vi.fn(() =>
            Promise.resolve(
              new Map([
                [
                  'candidate',
                  {
                    currentRoundTripTime: 0.042,
                    state: 'succeeded',
                    type: 'candidate-pair',
                  },
                ],
              ])
            )
          ),
        },
      },
    },
    handlers,
    localParticipant: {
      getTrackPublication: vi.fn(() => null),
      identity: 'local-user',
      isCameraEnabled: false,
      isMicrophoneEnabled: true,
      isScreenShareEnabled: false,
      setCameraEnabled: vi.fn((enabled: boolean) => {
        room.localParticipant.isCameraEnabled = enabled;
        return Promise.resolve();
      }),
      setMicrophoneEnabled: vi.fn((enabled: boolean) => {
        room.localParticipant.isMicrophoneEnabled = enabled;
        return Promise.resolve();
      }),
      setScreenShareEnabled: vi.fn((enabled: boolean) => {
        room.localParticipant.isScreenShareEnabled = enabled;
        return Promise.resolve();
      }),
    },
    on: vi.fn((eventName: string, handler: (...args: unknown[]) => void) => {
      handlers.set(eventName, [...(handlers.get(eventName) ?? []), handler]);
      return room;
    }),
    remoteParticipants: new Map(),
    switchActiveDevice: vi.fn(() => Promise.resolve()),
  };
  return room;
};

vi.mock('livekit-client', () => ({
  Room: vi.fn(() => {
    const room = createFakeRoom();
    mocks.rooms.push(room);
    return room;
  }),
  RoomEvent: {
    ActiveSpeakersChanged: 'ActiveSpeakersChanged',
    Connected: 'Connected',
    Disconnected: 'Disconnected',
    LocalTrackPublished: 'LocalTrackPublished',
    LocalTrackUnpublished: 'LocalTrackUnpublished',
    MediaDevicesError: 'MediaDevicesError',
    ParticipantConnected: 'ParticipantConnected',
    ParticipantDisconnected: 'ParticipantDisconnected',
    Reconnected: 'Reconnected',
    Reconnecting: 'Reconnecting',
    SignalReconnecting: 'SignalReconnecting',
    TrackMuted: 'TrackMuted',
    TrackSubscribed: 'TrackSubscribed',
    TrackSubscriptionFailed: 'TrackSubscriptionFailed',
    TrackUnmuted: 'TrackUnmuted',
    TrackUnpublished: 'TrackUnpublished',
    TrackUnsubscribed: 'TrackUnsubscribed',
  },
  Track: {
    Kind: {
      Audio: 'audio',
      Video: 'video',
    },
    Source: {
      Camera: 'camera',
      Microphone: 'microphone',
      ScreenShare: 'screen_share',
      ScreenShareAudio: 'screen_share_audio',
    },
  },
}));

vi.mock('@/api/channels', () => ({
  joinVoiceChannel: mocks.joinVoiceChannel,
}));

vi.mock('@/api/conversations', () => ({
  joinConversationVoiceCall: mocks.joinConversationVoiceCall,
}));

vi.mock('@/features/user/audio/AudioInputContext', () => ({
  useAudioInput: () => ({
    muted: mocks.inputMuted,
    noiseReductionLevel: mocks.noiseReductionLevel,
    selectedDeviceId: mocks.selectedInputDeviceId,
    setMuted: mocks.setInputMuted,
  }),
}));

vi.mock('@/features/user/audio/AudioOutputContext', () => ({
  useAudioOutput: () => ({
    applySinkId: mocks.applySinkId,
    muted: mocks.outputMuted,
  }),
}));

vi.mock('@/features/user/video/VideoInputContext', () => ({
  VIDEO_DEFAULT_DEVICE_ID: 'default',
  useVideoInput: () => ({
    selectedDeviceId: mocks.selectedVideoInputDeviceId,
  }),
}));

vi.mock('../screenSharePublishing', () => ({
  publishScreenShareWithAudio: mocks.publishScreenShareWithAudio,
}));

vi.mock('../voiceConnectSound', () => ({
  playVoiceConnectSound: mocks.playVoiceConnectSound,
}));

vi.mock('../voiceDisconnectSound', () => ({
  playVoiceDisconnectSound: mocks.playVoiceDisconnectSound,
}));

const renderVoiceRoom = () =>
  renderHook(() =>
    useVoiceRoom({
      seedParticipantsFromJoin: vi.fn(),
      syncParticipantsFromRoom: vi.fn(),
    })
  );

describe('useVoiceRoom', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.applySinkId.mockReset();
    mocks.inputMuted = false;
    mocks.joinConversationVoiceCall.mockReset();
    mocks.joinVoiceChannel.mockReset();
    mocks.noiseReductionLevel = 'off';
    mocks.outputMuted = false;
    mocks.playVoiceConnectSound.mockReset();
    mocks.playVoiceDisconnectSound.mockReset();
    mocks.publishScreenShareWithAudio.mockReset();
    mocks.rooms = [];
    mocks.selectedInputDeviceId = 'default';
    mocks.selectedVideoInputDeviceId = 'default';
    mocks.setInputMuted.mockReset();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exposes initial state, no-op media controls without a room, and metadata setters', () => {
    const { result } = renderVoiceRoom();

    expect(result.current.activeTargetKind).toBeNull();
    expect(result.current.activeChannelId).toBeNull();
    expect(result.current.activeConversationId).toBeNull();
    expect(result.current.isMuted).toBe(false);
    expect(result.current.isJoining).toBe(false);
    expect(result.current.joinError).toBeNull();
    expect(result.current.participantVolumes).toEqual({});
    expect(result.current.getParticipantVolume('user-1')).toBe(0.5);

    act(() => {
      result.current.toggleMute();
      void result.current.toggleCamera();
      void result.current.toggleScreenShare();
      result.current.leaveCall();
      result.current.updateActiveChannelMeta('General', 'Harmonie');
      result.current.updateActiveConversationMeta('Ada');
    });

    expect(mocks.setInputMuted).not.toHaveBeenCalled();
    expect(mocks.publishScreenShareWithAudio).not.toHaveBeenCalled();
    expect(result.current.activeChannelName).toBe('General');
    expect(result.current.activeGuildName).toBe('Harmonie');
    expect(result.current.activeConversationName).toBe('Ada');
  });

  it('maps channel join failures before LiveKit room creation', async () => {
    const { result } = renderVoiceRoom();
    mocks.joinVoiceChannel.mockRejectedValueOnce(new Error('ICE failed'));

    await act(async () => {
      await result.current.joinChannel('channel-1', 'General', 'guild-1', 'Harmonie');
    });

    expect(mocks.joinVoiceChannel).toHaveBeenCalledWith('channel-1');
    expect(result.current.joinError).toBe('voice.joinErrorNetwork');
    expect(result.current.isJoining).toBe(false);
    expect(result.current.activeChannelId).toBeNull();
  });

  it('maps conversation join failures before LiveKit room creation', async () => {
    const { result } = renderVoiceRoom();
    mocks.joinConversationVoiceCall.mockRejectedValueOnce(new Error('NotAllowedError'));

    await act(async () => {
      await result.current.joinConversation('conversation-1', 'Ada');
    });

    expect(mocks.joinConversationVoiceCall).toHaveBeenCalledWith('conversation-1');
    expect(result.current.joinError).toBe('voice.joinErrorMic');
    expect(result.current.isJoining).toBe(false);
    expect(result.current.activeConversationId).toBeNull();
  });
});
