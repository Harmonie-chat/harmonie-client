import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VoiceCameraTrack, VoiceScreenShare } from '@/types/voice';
import { ScreenShareTile } from './ScreenShareTile';
import { VoiceCallControls } from './VoiceCallControls';
import { VoiceParticipantTile } from './VoiceParticipantTile';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      values?.name ? `${key}:${values.name}` : key,
  }),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/features/user/audio/AudioInputPopover', () => ({
  AudioInputPopover: ({ onClose }: { onClose: () => void }) => (
    <aside aria-label="audio input popover">
      <button onClick={onClose} type="button">
        close audio popover
      </button>
    </aside>
  ),
}));

vi.mock('@/features/user/video/VideoInputPopover', () => ({
  VideoInputPopover: ({ onClose }: { onClose: () => void }) => (
    <aside aria-label="video input popover">
      <button onClick={onClose} type="button">
        close video popover
      </button>
    </aside>
  ),
}));

vi.mock('@harmonie/ui', () => ({
  Badge: ({ children, icon }: { children: ReactNode; icon?: ReactNode }) => (
    <span>
      {icon}
      {children}
    </span>
  ),
  Button: ({
    children,
    onClick,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string }) => {
    const buttonProps = { ...props };
    delete buttonProps.variant;

    return (
      <button onClick={onClick} type="button" {...buttonProps}>
        {children}
      </button>
    );
  },
  IconButton: ({
    children,
    title,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    selected?: boolean;
    size?: string;
    title?: string;
    variant?: string;
  }) => {
    const buttonProps = { ...props };
    delete buttonProps.selected;
    delete buttonProps.size;
    delete buttonProps.variant;

    return (
      <button
        aria-label={buttonProps['aria-label'] ?? title}
        onClick={buttonProps.onClick}
        title={title}
        type="button"
        {...buttonProps}
      >
        {children}
      </button>
    );
  },
  SplitIconButton: vi.fn(
    ({
      onPrimaryClick,
      onSecondaryClick,
      open,
      primaryLabel,
      secondaryLabel,
      selected,
    }: {
      onPrimaryClick: () => void;
      onSecondaryClick: () => void;
      open?: boolean;
      primaryLabel: string;
      secondaryLabel: string;
      selected?: boolean;
    }) => (
      <span data-open={String(open)} data-selected={String(selected)}>
        <button onClick={onPrimaryClick} type="button">
          {primaryLabel}
        </button>
        <button onClick={onSecondaryClick} type="button">
          {secondaryLabel}
        </button>
      </span>
    )
  ),
  Tooltip: ({ children, content }: { children: ReactNode; content: string }) => (
    <span data-tooltip={content}>{children}</span>
  ),
  VoiceParticipantCard: ({
    avatarLabel,
    avatarUrl,
    isSpeaking,
    style,
    title,
  }: {
    avatarLabel: string;
    avatarUrl?: string | null;
    isSpeaking?: boolean;
    style?: React.CSSProperties;
    title: string;
  }) => (
    <article
      aria-label={`participant card ${title}`}
      data-avatar-label={avatarLabel}
      data-avatar-url={avatarUrl ?? ''}
      data-speaking={String(isSpeaking)}
      style={style}
    >
      {title}
    </article>
  ),
}));

const makeTrack = () => ({
  attach: vi.fn(),
  detach: vi.fn(),
});

const makeCameraTrack = (isLocal = false): VoiceCameraTrack => ({
  isLocal,
  participantId: 'user-2',
  track: makeTrack() as unknown as VoiceCameraTrack['track'],
  trackSid: 'camera-1',
});

const makeScreenShare = (isLocal = false): VoiceScreenShare => ({
  isLocal,
  participantId: 'user-2',
  track: makeTrack() as unknown as VoiceScreenShare['track'],
  trackSid: 'screen-1',
});

describe('VoiceCallControls', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(),
      },
    });
  });

  it('toggles media, popovers, screen sharing and leave actions', async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();
    const onToggleCamera = vi.fn();
    const onToggleMute = vi.fn();
    const onToggleScreenShare = vi.fn();

    render(
      <VoiceCallControls
        cameraError="voice.cameraError"
        cameraState="off"
        microphoneState="muted"
        onLeave={onLeave}
        onToggleCamera={onToggleCamera}
        onToggleMute={onToggleMute}
        onToggleScreenShare={onToggleScreenShare}
        screenShareError="voice.screenError"
        screenShareState="idle"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('voice.cameraError');

    await user.click(screen.getByRole('button', { name: 'audio.input.select' }));
    expect(screen.getByLabelText('audio input popover')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'video.input.select' }));
    expect(screen.queryByLabelText('audio input popover')).not.toBeInTheDocument();
    expect(screen.getByLabelText('video input popover')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'voice.unmute' }));
    await user.click(screen.getByRole('button', { name: 'voice.startCamera' }));
    await user.click(screen.getByRole('button', { name: 'voice.startScreenShare' }));
    await user.click(screen.getByRole('button', { name: 'voice.leave' }));

    expect(onToggleMute).toHaveBeenCalledTimes(1);
    expect(onToggleCamera).toHaveBeenCalledTimes(1);
    expect(onToggleScreenShare).toHaveBeenCalledTimes(1);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it('disables screen share when the browser capability is missing', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {},
    });

    render(
      <VoiceCallControls
        cameraError={null}
        cameraState="on"
        microphoneState="unmuted"
        onLeave={vi.fn()}
        onToggleCamera={vi.fn()}
        onToggleMute={vi.fn()}
        onToggleScreenShare={vi.fn()}
        screenShareError={null}
        screenShareState="sharing"
      />
    );

    expect(screen.getByRole('button', { name: 'voice.screenShareUnavailable' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders active media states and closes input popovers from their panels', async () => {
    const user = userEvent.setup();
    const onToggleCamera = vi.fn();
    const onToggleMute = vi.fn();
    const onToggleScreenShare = vi.fn();

    render(
      <VoiceCallControls
        cameraError={null}
        cameraState="on"
        microphoneState="unmuted"
        onLeave={vi.fn()}
        onToggleCamera={onToggleCamera}
        onToggleMute={onToggleMute}
        onToggleScreenShare={onToggleScreenShare}
        screenShareError="voice.screenError"
        screenShareState="sharing"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('voice.screenError');

    await user.click(screen.getByRole('button', { name: 'audio.input.select' }));
    expect(screen.getByLabelText('audio input popover')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'close audio popover' }));
    expect(screen.queryByLabelText('audio input popover')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'video.input.select' }));
    expect(screen.getByLabelText('video input popover')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'close video popover' }));
    expect(screen.queryByLabelText('video input popover')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'voice.mute' }));
    await user.click(screen.getByRole('button', { name: 'voice.stopCamera' }));
    await user.click(screen.getByRole('button', { name: 'voice.stopScreenShare' }));

    expect(onToggleMute).toHaveBeenCalledTimes(1);
    expect(onToggleCamera).toHaveBeenCalledTimes(1);
    expect(onToggleScreenShare).toHaveBeenCalledTimes(1);
  });
});

describe('VoiceParticipantTile', () => {
  it('renders avatar tiles with mute/pin/volume controls', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onToggleMute = vi.fn();
    const onTogglePin = vi.fn();

    render(
      <VoiceParticipantTile
        card={{
          avatarBg: null,
          avatarColor: null,
          avatarFileId: 'avatar-1',
          avatarIcon: null,
          isMuted: true,
          kind: 'participant',
          label: 'Grace Hopper',
          userId: 'user-2',
        }}
        cardSizes={{ avatarSize: 80, titleClassName: 'text-xl' }}
        cardWidth="50%"
        onTogglePin={onTogglePin}
        presentation={{ isDarkTheme: true, isPinned: false, isSpeaking: true }}
        volumeControls={{
          enabled: true,
          onChange,
          onToggleMute,
          volume: 0.25,
        }}
      />
    );

    expect(screen.getByLabelText('participant card Grace Hopper')).toHaveAttribute(
      'data-avatar-url',
      'blob:avatar-1'
    );
    expect(screen.getByText('voice.participantMuted:Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'voice.pinParticipant' }));
    await user.click(screen.getByRole('button', { name: 'voice.muteParticipant:Grace Hopper' }));
    fireEvent.change(screen.getByRole('slider', { name: 'voice.participantVolume:Grace Hopper' }), {
      target: { value: '80' },
    });

    expect(onTogglePin).toHaveBeenCalledTimes(1);
    expect(onToggleMute).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(0.8);
  });

  it('attaches camera tracks and detaches them on unmount', () => {
    const cameraTrack = makeCameraTrack(true);
    const { unmount } = render(
      <VoiceParticipantTile
        cameraTrack={cameraTrack}
        card={{
          avatarBg: null,
          avatarColor: null,
          avatarFileId: null,
          avatarIcon: null,
          isMuted: false,
          kind: 'participant',
          label: 'Ada Lovelace',
          userId: 'user-1',
        }}
        cardSizes={{ avatarSize: 48, titleClassName: 'text-sm' }}
        onTogglePin={vi.fn()}
        presentation={{
          cameraFit: 'contain',
          isDarkTheme: false,
          isPinned: true,
          isSpeaking: false,
        }}
      />
    );

    expect(cameraTrack.track.attach).toHaveBeenCalledWith(
      screen.getByLabelText('voice.participantCameraOn:Ada Lovelace')
    );
    expect(screen.getByLabelText('voice.unpinParticipant')).toBeInTheDocument();

    unmount();

    expect(cameraTrack.track.detach).toHaveBeenCalledWith(
      expect.objectContaining({ tagName: 'VIDEO' })
    );
  });

  it('renders zero-volume avatar controls with icon fallback', async () => {
    const user = userEvent.setup();
    const onToggleMute = vi.fn();

    render(
      <VoiceParticipantTile
        className="custom-tile"
        card={{
          avatarBg: '#111111',
          avatarColor: '#ffffff',
          avatarFileId: null,
          avatarIcon: 'User',
          isMuted: false,
          kind: 'participant',
          label: 'Lin Chen',
          userId: 'user-3',
        }}
        cardSizes={{ avatarSize: 40, titleClassName: 'text-xs' }}
        onTogglePin={vi.fn()}
        presentation={{ isDarkTheme: false, isPinned: true, isSpeaking: false }}
        volumeControls={{
          enabled: true,
          onChange: vi.fn(),
          onToggleMute,
          volume: 0,
        }}
      />
    );

    expect(screen.getByLabelText('participant card Lin Chen')).toHaveAttribute(
      'data-avatar-url',
      ''
    );
    expect(screen.getByText('0%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'voice.unmuteParticipant:Lin Chen' }));

    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('renders remote camera tracks with default cover fit', () => {
    const cameraTrack = makeCameraTrack(false);

    render(
      <VoiceParticipantTile
        cameraTrack={cameraTrack}
        card={{
          avatarBg: null,
          avatarColor: null,
          avatarFileId: null,
          avatarIcon: null,
          isMuted: true,
          kind: 'participant',
          label: 'Katherine Johnson',
          userId: 'user-4',
        }}
        cardSizes={{ avatarSize: 80, titleClassName: 'text-lg' }}
        onTogglePin={vi.fn()}
        presentation={{ isDarkTheme: false, isPinned: false, isSpeaking: true }}
        volumeControls={{
          enabled: false,
          onChange: vi.fn(),
          onToggleMute: vi.fn(),
          volume: 1,
        }}
      />
    );

    const video = screen.getByLabelText('voice.participantCameraOn:Katherine Johnson');

    expect(video).toHaveClass('object-cover');
    expect(video).not.toHaveAttribute('muted');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.getByText('voice.participantMuted:Katherine Johnson')).toBeInTheDocument();
  });
});

describe('ScreenShareTile', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    document.exitFullscreen = vi.fn().mockResolvedValue(undefined);
    HTMLElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
  });

  it('attaches screen share tracks and supports fullscreen and pin controls', async () => {
    const user = userEvent.setup();
    const screenShare = makeScreenShare(false);
    const onTogglePin = vi.fn();
    const { unmount } = render(
      <ScreenShareTile
        isPinned={false}
        label="Grace Hopper"
        onTogglePin={onTogglePin}
        screenShare={screenShare}
      />
    );

    const video = screen.getByLabelText('voice.screenSharingLabel:Grace Hopper');
    expect(screenShare.track.attach).toHaveBeenCalledWith(video);

    await user.click(screen.getByRole('button', { name: 'voice.enterFullscreen' }));
    await user.click(screen.getByRole('button', { name: 'voice.pinParticipant' }));

    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(onTogglePin).toHaveBeenCalledTimes(1);

    unmount();

    expect(screenShare.track.detach).toHaveBeenCalledWith(
      expect.objectContaining({ tagName: 'VIDEO' })
    );
  });

  it('exits fullscreen when the tile is already fullscreen', async () => {
    const user = userEvent.setup();
    const screenShare = makeScreenShare(true);
    const tile = document.createElement('div');
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: tile,
    });

    render(
      <ScreenShareTile
        className="custom"
        isPinned
        label="Ada Lovelace"
        onTogglePin={vi.fn()}
        screenShare={screenShare}
      />
    );

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: screen.getByLabelText('voice.screenSharingLabel:Ada Lovelace').parentElement,
    });

    await user.click(screen.getByRole('button', { name: 'voice.enterFullscreen' }));

    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('updates the fullscreen control from document events', async () => {
    const user = userEvent.setup();
    const screenShare = makeScreenShare(false);

    render(
      <ScreenShareTile
        isPinned={false}
        label="Katherine Johnson"
        onTogglePin={vi.fn()}
        screenShare={screenShare}
      />
    );

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: screen.getByLabelText('voice.screenSharingLabel:Katherine Johnson').parentElement,
    });
    fireEvent(document, new Event('fullscreenchange'));

    await user.click(screen.getByRole('button', { name: 'voice.exitFullscreen' }));

    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it('falls back to the webkit video fullscreen API when element fullscreen is unavailable', async () => {
    const user = userEvent.setup();
    const screenShare = makeScreenShare(false);
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: undefined,
    });

    render(
      <ScreenShareTile
        isPinned={false}
        label="Grace Hopper"
        onTogglePin={vi.fn()}
        screenShare={screenShare}
      />
    );

    const enterFullscreen = vi.fn();
    Object.defineProperty(
      screen.getByLabelText('voice.screenSharingLabel:Grace Hopper'),
      'webkitEnterFullscreen',
      {
        configurable: true,
        value: enterFullscreen,
      }
    );

    await user.click(screen.getByRole('button', { name: 'voice.enterFullscreen' }));

    expect(enterFullscreen).toHaveBeenCalledTimes(1);
  });
});
