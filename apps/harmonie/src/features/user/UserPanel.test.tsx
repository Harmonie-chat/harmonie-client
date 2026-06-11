import { forwardRef, type ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/types/user';
import { UserPanel } from './UserPanel';

const mocks = vi.hoisted(() => ({
  audioInputMuted: false,
  audioOutputMuted: false,
  toggleAudioInputMute: vi.fn(),
  toggleAudioOutputMute: vi.fn(),
  user: {
    language: 'fr',
    theme: 'default',
    userId: 'user-1',
    username: 'alice',
    displayName: 'Alice',
    avatarFileId: 'avatar-1',
    avatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
  } as UserProfile | undefined,
}));

vi.mock('@harmonie/ui', () => {
  const SplitIconButton = forwardRef<
    HTMLButtonElement,
    {
      onPrimaryClick: () => void;
      onSecondaryClick: () => void;
      open: boolean;
      primaryLabel: string;
      secondaryLabel: string;
      selected: boolean;
    }
  >(function MockSplitIconButton(
    { onPrimaryClick, onSecondaryClick, open, primaryLabel, secondaryLabel, selected },
    ref
  ) {
    return (
      <div data-open={String(open)} data-selected={String(selected)}>
        <button ref={ref} type="button" onClick={onPrimaryClick}>
          {primaryLabel}
        </button>
        <button type="button" onClick={onSecondaryClick}>
          {secondaryLabel}
        </button>
      </div>
    );
  });

  return {
    Avatar: ({
      alt,
      avatarUrl,
      bg,
      color,
      icon,
    }: {
      alt: string;
      avatarUrl: string | null;
      bg: string;
      color: string;
      icon: string;
    }) => (
      <span
        data-alt={alt}
        data-avatar-url={avatarUrl ?? ''}
        data-bg={bg}
        data-color={color}
        data-icon={icon}
        data-testid="user-avatar"
      />
    ),
    IconButton: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
      <button type="button" onClick={onClick}>
        settings {children}
      </button>
    ),
    SplitIconButton,
  };
});

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('./UserContext', () => ({
  useUser: () => ({ user: mocks.user }),
}));

vi.mock('./audio/AudioInputContext', () => ({
  useAudioInput: () => ({
    muted: mocks.audioInputMuted,
    toggleMute: mocks.toggleAudioInputMute,
  }),
}));

vi.mock('./audio/AudioOutputContext', () => ({
  useAudioOutput: () => ({
    muted: mocks.audioOutputMuted,
    toggleMute: mocks.toggleAudioOutputMute,
  }),
}));

vi.mock('./audio/AudioInputPopover', () => ({
  AudioInputPopover: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="audio input popover">
      <button type="button" onClick={onClose}>
        close input popover
      </button>
    </div>
  ),
}));

vi.mock('./audio/AudioOutputPopover', () => ({
  AudioOutputPopover: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="audio output popover">
      <button type="button" onClick={onClose}>
        close output popover
      </button>
    </div>
  ),
}));

vi.mock('./settings/SettingsPanel', () => ({
  SettingsPanel: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="settings panel">
      <button type="button" onClick={onClose}>
        close settings panel
      </button>
    </div>
  ),
}));

describe('UserPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.audioInputMuted = false;
    mocks.audioOutputMuted = false;
    mocks.user = {
      language: 'fr',
      theme: 'default',
      userId: 'user-1',
      username: 'alice',
      displayName: 'Alice',
      avatarFileId: 'avatar-1',
      avatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
    };
  });

  it('renders user identity and toggles audio popovers and mutes', () => {
    render(<UserPanel />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-avatar-url', 'blob:avatar-1');
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-icon', 'Rocket');

    fireEvent.click(screen.getByRole('button', { name: 'Select audio input device' }));
    expect(screen.getByRole('dialog', { name: 'audio input popover' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select audio output device' }));
    expect(screen.queryByRole('dialog', { name: 'audio input popover' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'audio output popover' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mute audio input' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mute audio output' }));

    expect(mocks.toggleAudioInputMute).toHaveBeenCalledTimes(1);
    expect(mocks.toggleAudioOutputMute).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'audio output popover' })).not.toBeInTheDocument();
  });

  it('renders fallback user data and opens settings', () => {
    mocks.audioInputMuted = true;
    mocks.audioOutputMuted = true;
    mocks.user = {
      userId: 'user-1',
      username: 'fallback',
      displayName: null,
      avatarFileId: null,
      avatar: undefined,
      theme: 'default',
      language: 'fr',
    };

    render(<UserPanel />);

    expect(screen.getByText('fallback')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-avatar-url', '');
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.getByRole('button', { name: 'Unmute audio input' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unmute audio output' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /settings/ }));
    expect(screen.getByRole('dialog', { name: 'settings panel' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close settings panel' }));
    expect(screen.queryByRole('dialog', { name: 'settings panel' })).not.toBeInTheDocument();
  });

  it('closes audio popovers from their own close actions', () => {
    render(<UserPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Select audio input device' }));
    expect(screen.getByRole('dialog', { name: 'audio input popover' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close input popover' }));
    expect(screen.queryByRole('dialog', { name: 'audio input popover' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Select audio output device' }));
    expect(screen.getByRole('dialog', { name: 'audio output popover' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close output popover' }));
    expect(screen.queryByRole('dialog', { name: 'audio output popover' })).not.toBeInTheDocument();
  });

  it('renders empty user fallback when no profile is loaded', () => {
    mocks.user = undefined;

    render(<UserPanel />);

    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-alt', '');
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-avatar-url', '');
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });
});
