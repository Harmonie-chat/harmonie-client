import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ConversationParticipant } from '@/types/conversation';
import type { UserProfile } from '@/types/user';
import { ConversationCallStage } from './ConversationCallStage';
import {
  ConversationParticipantPopover,
  ConversationParticipantsPanel,
} from './ConversationParticipantsPanel';

const voiceMocks = vi.hoisted(() => ({
  state: {
    activeConversationId: 'conversation-1' as string | null,
    cameraError: null as string | null,
    cameraTracks: [] as Array<{ participantId: string }>,
    getConversationParticipants: vi.fn(),
    getParticipantVolume: vi.fn(),
    isCameraEnabled: false,
    isMuted: false,
    isScreenSharing: false,
    leaveCall: vi.fn(),
    mutedUserIds: new Set<string>(),
    screenShareError: null as string | null,
    screenShares: [] as Array<{ participantId: string; trackSid: string }>,
    setParticipantVolume: vi.fn(),
    speakingUserIds: new Set<string>(),
    toggleCamera: vi.fn(),
    toggleMute: vi.fn(),
    toggleParticipantMute: vi.fn(),
    toggleScreenShare: vi.fn(),
  },
}));

const userMocks = vi.hoisted(() => ({
  user: null as UserProfile | null,
}));

const themeMocks = vi.hoisted(() => ({
  theme: 'harmonie-light',
}));

const directConversationMocks = vi.hoisted(() => ({
  openDirectConversation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string | number>) =>
      values?.name ? `${key}:${values.name}` : key,
  }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({ user: userMocks.user }),
}));

vi.mock('@/features/user/ThemeContext', () => ({
  useTheme: () => ({ theme: themeMocks.theme }),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/shared/voice/context/VoicePresenceContext', () => ({
  useVoicePresence: () => voiceMocks.state,
}));

vi.mock('../useOpenDirectConversation', () => ({
  useOpenDirectConversation: () => directConversationMocks.openDirectConversation,
}));

vi.mock('@harmonie/ui', () => {
  return {
    IconButton: ({
      children,
      title,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & { size?: string; title?: string }) => {
      const buttonProps = { ...props };
      delete buttonProps.size;

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
    Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
      <span data-tooltip={content}>{children}</span>
    ),
    UserListItem: ({
      label,
      onSelect,
      subtitle,
      trailing,
      user,
    }: {
      label: string;
      onSelect: (participant: ConversationParticipant, rect: DOMRect) => void;
      subtitle?: string;
      trailing?: React.ReactNode;
      user: ConversationParticipant;
    }) => (
      <button
        onClick={(event) => onSelect(user, event.currentTarget.getBoundingClientRect())}
        type="button"
      >
        <span>{label}</span>
        {subtitle && <span>{subtitle}</span>}
        {trailing}
      </button>
    ),
    UserPopover: ({
      actions,
      bio,
      label,
      onClose,
      side,
      username,
    }: {
      actions: Array<{ label: string; onClick: () => void }>;
      bio?: string | null;
      label: string;
      onClose: () => void;
      side?: string;
      username?: string;
    }) => (
      <aside aria-label="participant popover" data-side={side}>
        <span>{label}</span>
        {username && <span>@{username}</span>}
        {bio && <p>{bio}</p>}
        <button onClick={onClose} type="button">
          close popover
        </button>
        {actions.map((action) => (
          <button key={action.label} onClick={action.onClick} type="button">
            {action.label}
          </button>
        ))}
      </aside>
    ),
  };
});

vi.mock('@/shared/voice/layout/VoiceActiveStage', () => ({
  VoiceActiveStage: ({
    cardWidth,
    currentUserId,
    localMedia,
    onLeave,
    onToggleCamera,
    onToggleMute,
    onToggleParticipantMute,
    onTogglePin,
    onToggleScreenShare,
    onParticipantVolumeChange,
    pinning,
  }: {
    cardWidth: string;
    currentUserId?: string;
    localMedia: {
      isCameraEnabled: boolean;
      isMuted: boolean;
      isScreenSharing: boolean;
    };
    onLeave: () => void;
    onToggleCamera: () => void;
    onToggleMute: () => void;
    onToggleParticipantMute: (userId: string) => void;
    onTogglePin: (targetId: string) => void;
    onToggleScreenShare: () => void;
    onParticipantVolumeChange: (userId: string, volume: number) => void;
    pinning: {
      activePinnedTargetId: string | null;
      hasPinnedItem: boolean;
    };
  }) => (
    <section
      aria-label="voice active stage"
      data-card-width={cardWidth}
      data-camera={String(localMedia.isCameraEnabled)}
      data-current-user={currentUserId}
      data-muted={String(localMedia.isMuted)}
      data-pinned={pinning.activePinnedTargetId ?? 'none'}
      data-screen-sharing={String(localMedia.isScreenSharing)}
    >
      <span>{pinning.hasPinnedItem ? 'has pinned item' : 'no pinned item'}</span>
      <button onClick={() => onTogglePin('screenShare:screen-1')} type="button">
        toggle screen pin
      </button>
      <button onClick={() => onTogglePin('participant:user-2')} type="button">
        toggle participant pin
      </button>
      <button onClick={onToggleMute} type="button">
        toggle mute
      </button>
      <button onClick={onToggleCamera} type="button">
        toggle camera
      </button>
      <button onClick={onToggleScreenShare} type="button">
        toggle screen share
      </button>
      <button onClick={() => onToggleParticipantMute('user-2')} type="button">
        mute participant
      </button>
      <button onClick={() => onParticipantVolumeChange('user-2', 55)} type="button">
        set volume
      </button>
      <button onClick={onLeave} type="button">
        leave call
      </button>
    </section>
  ),
}));

const currentUser: UserProfile = {
  avatarFileId: 'avatar-1',
  displayName: 'Ada Lovelace',
  language: 'en',
  theme: 'harmonie-light',
  userId: 'user-1',
  username: 'ada',
};

const participants: ConversationParticipant[] = [
  {
    avatarFileId: 'avatar-1',
    bio: 'Analytical engine enjoyer',
    displayName: 'Ada Lovelace',
    userId: 'user-1',
    username: 'ada',
  },
  {
    avatarFileId: 'avatar-2',
    bio: 'Compiler builder',
    displayName: 'Grace Hopper',
    userId: 'user-2',
    username: 'grace',
  },
];

describe('ConversationParticipantsPanel', () => {
  beforeEach(() => {
    userMocks.user = currentUser;
    themeMocks.theme = 'harmonie-obsidian';
    voiceMocks.state.activeConversationId = 'conversation-1';
    voiceMocks.state.cameraTracks = [{ participantId: 'user-2' }];
    voiceMocks.state.getConversationParticipants.mockReturnValue([participants[1]]);
    voiceMocks.state.mutedUserIds = new Set(['user-2']);
    voiceMocks.state.screenShares = [{ participantId: 'user-2', trackSid: 'screen-1' }];
    directConversationMocks.openDirectConversation.mockResolvedValue(undefined);
  });

  it('shows participant voice presence, toggles popovers and opens direct conversations', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConversationParticipantsPanel
        conversationId="conversation-1"
        onClose={onClose}
        participants={participants}
      />
    );

    expect(screen.getByText('conversation.participantsTitle')).toBeInTheDocument();
    expect(screen.getAllByText('conversation.call.inCall').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('voice.participantMuted:Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('voice.participantCameraOn:Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('voice.screenSharingLabel:Grace Hopper')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Grace Hopper/u }));

    expect(screen.getByLabelText('participant popover')).toHaveAttribute('data-side', 'left');
    expect(screen.getByText('@grace')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Grace Hopper/u }));
    expect(screen.queryByLabelText('participant popover')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Grace Hopper/u }));

    await user.click(screen.getByRole('button', { name: 'conversation.sendDirectMessage' }));

    await waitFor(() =>
      expect(directConversationMocks.openDirectConversation).toHaveBeenCalledWith(participants[1])
    );
    await waitFor(() =>
      expect(screen.queryByLabelText('participant popover')).not.toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: /Ada Lovelace/u }));

    expect(screen.getByLabelText('participant popover')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'conversation.sendDirectMessage' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'icon button' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('falls back to usernames and hides voice status when no call is visible', () => {
    voiceMocks.state.activeConversationId = 'other-conversation';
    voiceMocks.state.getConversationParticipants.mockReturnValue([]);

    render(
      <ConversationParticipantsPanel
        conversationId="conversation-1"
        onClose={vi.fn()}
        participants={[{ userId: 'user-3', username: 'linus' }]}
      />
    );

    expect(screen.getByRole('button', { name: 'linus' })).toBeInTheDocument();
    expect(screen.queryByText('conversation.call.inCall')).not.toBeInTheDocument();
  });
});

describe('ConversationParticipantPopover', () => {
  beforeEach(() => {
    userMocks.user = currentUser;
    directConversationMocks.openDirectConversation.mockResolvedValue(undefined);
  });

  it('supports explicit side and closes after starting a direct conversation', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ConversationParticipantPopover
        anchorRect={new DOMRect(0, 0, 10, 10)}
        onClose={onClose}
        participant={participants[1]}
        side="right"
      />
    );

    expect(screen.getByLabelText('participant popover')).toHaveAttribute('data-side', 'right');

    await user.click(screen.getByRole('button', { name: 'conversation.sendDirectMessage' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('keeps the participant popover open when opening a direct conversation fails', async () => {
    const user = userEvent.setup();
    directConversationMocks.openDirectConversation.mockRejectedValueOnce(new Error('network'));

    render(
      <ConversationParticipantPopover
        anchorRect={new DOMRect(0, 0, 10, 10)}
        onClose={vi.fn()}
        participant={participants[1]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'conversation.sendDirectMessage' }));

    await waitFor(() =>
      expect(directConversationMocks.openDirectConversation).toHaveBeenCalledWith(participants[1])
    );
    expect(screen.getByLabelText('participant popover')).toBeInTheDocument();
  });
});

describe('ConversationCallStage', () => {
  beforeEach(() => {
    userMocks.user = currentUser;
    voiceMocks.state.getConversationParticipants.mockReturnValue([
      {
        avatarBg: null,
        avatarColor: null,
        avatarFileId: null,
        avatarIcon: null,
        displayName: 'Grace Hopper',
        userId: 'user-2',
        username: 'grace',
      },
    ]);
    voiceMocks.state.cameraTracks = [{ participantId: 'user-2' }];
    voiceMocks.state.isCameraEnabled = true;
    voiceMocks.state.isMuted = true;
    voiceMocks.state.isScreenSharing = true;
    voiceMocks.state.mutedUserIds = new Set(['user-2']);
    voiceMocks.state.screenShares = [{ participantId: 'user-2', trackSid: 'screen-1' }];
  });

  it('passes call state to the voice stage and toggles pin and media controls', async () => {
    const user = userEvent.setup();
    const onLeave = vi.fn();

    render(<ConversationCallStage conversationId="conversation-1" onLeave={onLeave} />);

    const stage = screen.getByLabelText('voice active stage');
    expect(stage).toHaveAttribute('data-current-user', 'user-1');
    expect(stage).toHaveAttribute('data-muted', 'true');
    expect(stage).toHaveAttribute('data-camera', 'true');
    expect(stage).toHaveAttribute('data-screen-sharing', 'true');
    expect(stage).toHaveAttribute('data-pinned', 'screenShare:screen-1');

    await user.click(screen.getByRole('button', { name: 'toggle screen pin' }));

    expect(screen.getByLabelText('voice active stage')).toHaveAttribute('data-pinned', 'none');

    await user.click(screen.getByRole('button', { name: 'toggle participant pin' }));

    expect(screen.getByLabelText('voice active stage')).toHaveAttribute(
      'data-pinned',
      'participant:user-2'
    );

    await user.click(screen.getByRole('button', { name: 'toggle mute' }));
    await user.click(screen.getByRole('button', { name: 'toggle camera' }));
    await user.click(screen.getByRole('button', { name: 'toggle screen share' }));
    await user.click(screen.getByRole('button', { name: 'mute participant' }));
    await user.click(screen.getByRole('button', { name: 'set volume' }));
    await user.click(screen.getByRole('button', { name: 'leave call' }));

    expect(voiceMocks.state.toggleMute).toHaveBeenCalledTimes(1);
    expect(voiceMocks.state.toggleCamera).toHaveBeenCalledTimes(1);
    expect(voiceMocks.state.toggleScreenShare).toHaveBeenCalledTimes(1);
    expect(voiceMocks.state.toggleParticipantMute).toHaveBeenCalledWith('user-2');
    expect(voiceMocks.state.setParticipantVolume).toHaveBeenCalledWith('user-2', 55);
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});
