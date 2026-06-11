import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { VoiceCameraTrack, VoiceScreenShare } from '@/types/voice';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VoiceActiveStage } from './VoiceActiveStage';
import type { VoiceParticipantCardData } from './voiceLayout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../components/VoiceCallControls', () => ({
  VoiceCallControls: ({
    cameraState,
    microphoneState,
    onLeave,
    onToggleCamera,
    onToggleMute,
    onToggleScreenShare,
    screenShareState,
  }: {
    cameraState: string;
    microphoneState: string;
    onLeave: () => void;
    onToggleCamera: () => void;
    onToggleMute: () => void;
    onToggleScreenShare: () => void;
    screenShareState: string;
  }) => (
    <section
      aria-label="call controls"
      data-camera={cameraState}
      data-mic={microphoneState}
      data-screen={screenShareState}
    >
      <button onClick={onToggleMute} type="button">
        toggle mute
      </button>
      <button onClick={onToggleCamera} type="button">
        toggle camera
      </button>
      <button onClick={onToggleScreenShare} type="button">
        toggle screen
      </button>
      <button onClick={onLeave} type="button">
        leave
      </button>
    </section>
  ),
}));

vi.mock('../components/VoiceParticipantTile', () => ({
  VoiceParticipantTile: ({
    card,
    cardWidth,
    cameraTrack,
    onTogglePin,
    presentation,
    volumeControls,
  }: {
    card: VoiceParticipantCardData;
    cardWidth?: string;
    cameraTrack?: VoiceCameraTrack;
    onTogglePin: () => void;
    presentation: {
      isPinned: boolean;
      isSpeaking: boolean;
      cameraFit?: string;
    };
    volumeControls?: {
      enabled: boolean;
      onChange: (volume: number) => void;
      onToggleMute: () => void;
      volume: number;
    };
  }) => (
    <article
      aria-label={`participant ${card.userId}`}
      data-camera={cameraTrack?.trackSid ?? ''}
      data-fit={presentation.cameraFit ?? 'cover'}
      data-pinned={String(presentation.isPinned)}
      data-speaking={String(presentation.isSpeaking)}
      data-volume-enabled={String(volumeControls?.enabled)}
      data-width={cardWidth}
    >
      {card.label}
      <button onClick={onTogglePin} type="button">
        pin participant {card.userId}
      </button>
      {volumeControls?.enabled && (
        <>
          <button onClick={volumeControls.onToggleMute} type="button">
            mute participant {card.userId}
          </button>
          <button onClick={() => volumeControls.onChange(0.6)} type="button">
            volume participant {card.userId}
          </button>
          <span>volume {volumeControls.volume}</span>
        </>
      )}
    </article>
  ),
}));

vi.mock('../components/ScreenShareTile', () => ({
  ScreenShareTile: ({
    className,
    isPinned,
    label,
    onTogglePin,
    screenShare,
  }: {
    className?: string;
    isPinned: boolean;
    label: string;
    onTogglePin: () => void;
    screenShare: VoiceScreenShare;
  }) => (
    <article
      aria-label={`screen ${screenShare.trackSid}`}
      data-class={className ?? ''}
      data-label={label}
      data-pinned={String(isPinned)}
    >
      <button onClick={onTogglePin} type="button">
        pin screen {screenShare.trackSid}
      </button>
    </article>
  ),
}));

const makeCard = (userId: string, label: string): VoiceParticipantCardData => ({
  avatarBg: null,
  avatarColor: null,
  avatarFileId: null,
  avatarIcon: null,
  isMuted: false,
  kind: 'participant',
  label,
  userId,
});

const makeScreenShare = (trackSid: string, participantId: string): VoiceScreenShare => ({
  isLocal: false,
  participantId,
  track: {} as VoiceScreenShare['track'],
  trackSid,
});

const makeCameraTrack = (participantId: string): VoiceCameraTrack => ({
  isLocal: false,
  participantId,
  track: {} as VoiceCameraTrack['track'],
  trackSid: `camera-${participantId}`,
});

const cards = [makeCard('user-1', 'Ada'), makeCard('user-2', 'Grace')];
const screenShares = [makeScreenShare('screen-1', 'user-2'), makeScreenShare('screen-2', 'user-3')];
const labelsByUserId = new Map([
  ['user-2', 'Grace'],
  ['user-3', 'Margaret'],
]);

const baseProps = {
  cameraTracksByUserId: new Map([['user-2', makeCameraTrack('user-2')]]),
  cardSizes: { avatarSize: 80, titleClassName: 'text-xl' },
  cardWidth: '50%',
  cards,
  currentUserId: 'user-1',
  getParticipantVolume: vi.fn((participantId: string) => (participantId === 'user-2' ? 0.4 : 1)),
  labelsByUserId,
  localMedia: {
    cameraError: null,
    isCameraEnabled: true,
    isMuted: false,
    isScreenSharing: false,
    screenShareError: null,
  },
  onLeave: vi.fn(),
  onParticipantVolumeChange: vi.fn(),
  onToggleCamera: vi.fn(),
  onToggleMute: vi.fn(),
  onToggleParticipantMute: vi.fn(),
  onTogglePin: vi.fn(),
  onToggleScreenShare: vi.fn(),
  pinning: {
    activePinnedTargetId: null,
    hasPinnedItem: false,
    pinnedParticipant: undefined,
    pinnedScreenShare: undefined,
  },
  rows: [cards],
  screenShares: [] as VoiceScreenShare[],
  speakingUserIds: new Set(['user-2']),
  stageState: { isDarkTheme: true },
};

describe('VoiceActiveStage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the empty connected state and passes local media to controls', async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      cards: [],
      localMedia: {
        cameraError: null,
        isCameraEnabled: false,
        isMuted: true,
        isScreenSharing: true,
        screenShareError: null,
      },
      rows: [],
    };

    render(<VoiceActiveStage {...props} />);

    expect(screen.getByText('voice.connected')).toBeInTheDocument();
    expect(screen.getByText('voice.empty')).toBeInTheDocument();
    expect(screen.getByLabelText('call controls')).toHaveAttribute('data-mic', 'muted');
    expect(screen.getByLabelText('call controls')).toHaveAttribute('data-camera', 'off');
    expect(screen.getByLabelText('call controls')).toHaveAttribute('data-screen', 'sharing');

    await user.click(screen.getByRole('button', { name: 'toggle mute' }));
    await user.click(screen.getByRole('button', { name: 'toggle camera' }));
    await user.click(screen.getByRole('button', { name: 'toggle screen' }));
    await user.click(screen.getByRole('button', { name: 'leave' }));

    expect(props.onToggleMute).toHaveBeenCalledTimes(1);
    expect(props.onToggleCamera).toHaveBeenCalledTimes(1);
    expect(props.onToggleScreenShare).toHaveBeenCalledTimes(1);
    expect(props.onLeave).toHaveBeenCalledTimes(1);
  });

  it('renders the grid stage with screen shares, participants, pinning and volume controls', async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      pinning: {
        activePinnedTargetId: 'participant:user-1',
        hasPinnedItem: false,
        pinnedParticipant: undefined,
        pinnedScreenShare: undefined,
      },
      screenShares: [screenShares[0]],
    };

    render(<VoiceActiveStage {...props} />);

    expect(screen.getByLabelText('screen screen-1')).toHaveAttribute('data-label', 'Grace');
    expect(screen.getByLabelText('participant user-1')).toHaveAttribute('data-pinned', 'true');
    expect(screen.getByLabelText('participant user-1')).toHaveAttribute(
      'data-volume-enabled',
      'false'
    );
    expect(screen.getByLabelText('participant user-2')).toHaveAttribute('data-speaking', 'true');
    expect(screen.getByLabelText('participant user-2')).toHaveAttribute(
      'data-camera',
      'camera-user-2'
    );

    await user.click(screen.getByRole('button', { name: 'pin screen screen-1' }));
    await user.click(screen.getByRole('button', { name: 'pin participant user-2' }));
    await user.click(screen.getByRole('button', { name: 'mute participant user-2' }));
    await user.click(screen.getByRole('button', { name: 'volume participant user-2' }));

    expect(props.onTogglePin).toHaveBeenCalledWith('screenShare:screen-1');
    expect(props.onTogglePin).toHaveBeenCalledWith('participant:user-2');
    expect(props.onToggleParticipantMute).toHaveBeenCalledWith('user-2');
    expect(props.onParticipantVolumeChange).toHaveBeenCalledWith('user-2', 0.6);
  });

  it('renders a pinned screen share with thumbnail carousel controls', async () => {
    const user = userEvent.setup();
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const props = {
      ...baseProps,
      pinning: {
        activePinnedTargetId: 'screenShare:screen-1',
        hasPinnedItem: true,
        pinnedParticipant: undefined,
        pinnedScreenShare: screenShares[0],
      },
      screenShares,
    };
    const { container, unmount } = render(<VoiceActiveStage {...props} />);

    expect(screen.getByLabelText('screen screen-1')).toHaveAttribute('data-pinned', 'true');
    expect(screen.getByLabelText('screen screen-2')).toHaveAttribute('data-pinned', 'false');
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));

    await user.click(screen.getByRole('button', { name: 'pin screen screen-1' }));
    await user.click(screen.getByRole('button', { name: 'pin screen screen-2' }));
    await user.click(screen.getByRole('button', { name: 'pin participant user-1' }));
    await user.click(screen.getByRole('button', { name: 'pin participant user-2' }));
    await user.click(screen.getByRole('button', { name: 'mute participant user-2' }));
    await user.click(screen.getByRole('button', { name: 'volume participant user-2' }));

    expect(props.onTogglePin).toHaveBeenCalledWith('screenShare:screen-1');
    expect(props.onTogglePin).toHaveBeenCalledWith('screenShare:screen-2');
    expect(props.onTogglePin).toHaveBeenCalledWith('participant:user-1');
    expect(props.onTogglePin).toHaveBeenCalledWith('participant:user-2');
    expect(props.onToggleParticipantMute).toHaveBeenCalledWith('user-2');
    expect(props.onParticipantVolumeChange).toHaveBeenCalledWith('user-2', 0.6);

    const thumbnails = container.querySelector('.overflow-x-auto')!;
    Object.defineProperties(thumbnails, {
      clientWidth: { configurable: true, value: 100 },
      scrollBy: { configurable: true, value: vi.fn() },
      scrollLeft: { configurable: true, value: 0, writable: true },
      scrollWidth: { configurable: true, value: 260 },
    });

    fireEvent.scroll(thumbnails);

    await user.click(screen.getByRole('button', { name: 'voice.scrollThumbnails' }));

    expect(thumbnails.scrollBy).toHaveBeenCalledWith({ behavior: 'smooth', left: 75 });

    Object.defineProperty(thumbnails, 'scrollLeft', {
      configurable: true,
      value: 120,
      writable: true,
    });
    fireEvent.scroll(thumbnails);

    await user.click(screen.getByRole('button', { name: 'voice.scrollThumbnailsBack' }));

    expect(thumbnails.scrollBy).toHaveBeenCalledWith({ behavior: 'smooth', left: -75 });

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('renders a pinned participant with contained camera and disabled self volume controls', async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      pinning: {
        activePinnedTargetId: 'participant:user-1',
        hasPinnedItem: true,
        pinnedParticipant: cards[0],
        pinnedScreenShare: undefined,
      },
    };

    render(<VoiceActiveStage {...props} />);

    expect(screen.getByLabelText('participant user-1')).toHaveAttribute('data-fit', 'contain');
    expect(screen.getByLabelText('participant user-1')).toHaveAttribute('data-pinned', 'true');
    expect(screen.getByLabelText('participant user-1')).toHaveAttribute(
      'data-volume-enabled',
      'false'
    );

    await user.click(screen.getByRole('button', { name: 'pin participant user-1' }));

    expect(props.onTogglePin).toHaveBeenCalledWith('participant:user-1');
  });

  it('enables volume controls for a pinned remote participant', async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      pinning: {
        activePinnedTargetId: 'participant:user-2',
        hasPinnedItem: true,
        pinnedParticipant: cards[1],
        pinnedScreenShare: undefined,
      },
    };

    render(<VoiceActiveStage {...props} />);

    expect(screen.getByLabelText('participant user-2')).toHaveAttribute(
      'data-volume-enabled',
      'true'
    );
    expect(screen.getByLabelText('participant user-2')).toHaveAttribute('data-fit', 'contain');

    await user.click(screen.getByRole('button', { name: 'pin participant user-2' }));
    await user.click(screen.getByRole('button', { name: 'mute participant user-2' }));
    await user.click(screen.getByRole('button', { name: 'volume participant user-2' }));

    expect(props.onTogglePin).toHaveBeenCalledWith('participant:user-2');
    expect(props.onToggleParticipantMute).toHaveBeenCalledWith('user-2');
    expect(props.onParticipantVolumeChange).toHaveBeenCalledWith('user-2', 0.6);
  });

  it('uses participant ids as screen-share labels and enables all volume controls without a current user', async () => {
    const user = userEvent.setup();
    const props = {
      ...baseProps,
      currentUserId: undefined,
      labelsByUserId: new Map<string, string>(),
      screenShares: [screenShares[1]],
    };

    render(<VoiceActiveStage {...props} />);

    expect(screen.getByLabelText('screen screen-2')).toHaveAttribute('data-label', 'user-3');
    expect(screen.getByLabelText('participant user-1')).toHaveAttribute(
      'data-volume-enabled',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'volume participant user-1' }));

    expect(props.onParticipantVolumeChange).toHaveBeenCalledWith('user-1', 0.6);
  });
});
