import { useRef, useState } from 'react';
import { ChevronUp, HeadphoneOff, Headphones, Mic, MicOff, Settings } from 'lucide-react';
import { useUser } from './UserContext';
import { Avatar, IconButton, SplitIconButton } from '@harmonie/ui';
import { SettingsPanel } from './settings/SettingsPanel';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import { AudioInputPopover } from './audio/AudioInputPopover';
import { useAudioInput } from './audio/AudioInputContext';
import { AudioOutputPopover } from './audio/AudioOutputPopover';
import { useAudioOutput } from './audio/AudioOutputContext';
import { AppUpdateButton } from '@/shared/desktop/AppUpdateButton';

export const UserPanel = () => {
  const { user } = useUser();
  const { muted: inputMuted, toggleMute: toggleInputMute } = useAudioInput();
  const { muted, toggleMute } = useAudioOutput();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioInputPopoverOpen, setAudioInputPopoverOpen] = useState(false);
  const [audioPopoverOpen, setAudioPopoverOpen] = useState(false);
  const inputChevronRef = useRef<HTMLButtonElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const avatarUrl = useFileBlobUrl(user?.avatarFileId);

  const label = user ? (user.displayName ?? user.username) : '';
  const handleAudioInputMuteToggle = () => {
    setAudioInputPopoverOpen(false);
    toggleInputMute();
  };
  const handleAudioMuteToggle = () => {
    setAudioPopoverOpen(false);
    toggleMute();
  };
  const handleAudioInputPopoverToggle = () => {
    setAudioPopoverOpen(false);
    setAudioInputPopoverOpen((open) => !open);
  };
  const handleAudioOutputPopoverToggle = () => {
    setAudioInputPopoverOpen(false);
    setAudioPopoverOpen((open) => !open);
  };

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar
          alt={label}
          avatarUrl={avatarUrl}
          icon={user?.avatar?.icon ?? 'PawPrint'}
          color={user?.avatar?.color ?? 'var(--color-cat-1-fg)'}
          bg={user?.avatar?.bg ?? 'var(--color-cat-1)'}
        />

        <span className="flex-1 text-sm font-medium text-text-1 truncate">{label}</span>

        <div className="flex items-center gap-2">
          <SplitIconButton
            ref={inputChevronRef}
            size="small"
            selected={inputMuted}
            selectedVariant="danger"
            open={audioInputPopoverOpen}
            primaryLabel={inputMuted ? 'Unmute audio input' : 'Mute audio input'}
            secondaryLabel="Select audio input device"
            primaryIcon={inputMuted ? <MicOff size={16} /> : <Mic size={16} />}
            secondaryIcon={
              <ChevronUp
                size={10}
                className={
                  audioInputPopoverOpen
                    ? 'transition-transform duration-150'
                    : 'rotate-180 transition-transform duration-150'
                }
              />
            }
            onPrimaryClick={handleAudioInputMuteToggle}
            onSecondaryClick={handleAudioInputPopoverToggle}
          />

          <SplitIconButton
            ref={chevronRef}
            size="small"
            selected={muted}
            selectedVariant="danger"
            open={audioPopoverOpen}
            primaryLabel={muted ? 'Unmute audio output' : 'Mute audio output'}
            secondaryLabel="Select audio output device"
            primaryIcon={muted ? <HeadphoneOff size={16} /> : <Headphones size={16} />}
            secondaryIcon={
              <ChevronUp
                size={10}
                className={
                  audioPopoverOpen
                    ? 'transition-transform duration-150'
                    : 'rotate-180 transition-transform duration-150'
                }
              />
            }
            onPrimaryClick={handleAudioMuteToggle}
            onSecondaryClick={handleAudioOutputPopoverToggle}
          />

          <AppUpdateButton />

          <IconButton size="small" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
          </IconButton>
        </div>
      </div>

      {audioInputPopoverOpen && (
        <AudioInputPopover
          anchorRef={inputChevronRef}
          onClose={() => setAudioInputPopoverOpen(false)}
        />
      )}

      {audioPopoverOpen && (
        <AudioOutputPopover anchorRef={chevronRef} onClose={() => setAudioPopoverOpen(false)} />
      )}

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
};
