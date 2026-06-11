import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioOutputProvider, useAudioOutput } from './AudioOutputContext';

const mocks = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  enumerateDevices: vi.fn(),
  getUserMedia: vi.fn(),
  removeEventListener: vi.fn(),
}));

const mediaDevice = (input: Partial<MediaDeviceInfo>): MediaDeviceInfo =>
  ({
    deviceId: input.deviceId ?? 'default',
    groupId: '',
    kind: input.kind ?? 'audiooutput',
    label: input.label ?? '',
    toJSON: () => ({}),
  }) as MediaDeviceInfo;

const OutputConsumer = () => {
  const output = useAudioOutput();

  return (
    <div>
      <span data-testid="devices">{output.devices.map((device) => device.label).join('|')}</span>
      <span data-testid="selected">{output.selectedDeviceId}</span>
      <span data-testid="permission">{String(output.needsPermission)}</span>
      <span data-testid="muted">{String(output.muted)}</span>
      <button type="button" onClick={() => output.selectDevice('speaker-1')}>
        Select
      </button>
      <button type="button" onClick={() => output.toggleMute()}>
        Toggle
      </button>
      <button type="button" onClick={() => void output.requestPermission()}>
        Permission
      </button>
      <button
        type="button"
        onClick={() =>
          output.applySinkId(document.querySelector<HTMLAudioElement>('[data-testid="audio"]')!)
        }
      >
        Apply
      </button>
    </div>
  );
};

const BrokenConsumer = () => {
  useAudioOutput();
  return null;
};

describe('AudioOutputProvider', () => {
  beforeEach(() => {
    mocks.addEventListener.mockReset();
    mocks.enumerateDevices.mockReset();
    mocks.getUserMedia.mockReset();
    mocks.removeEventListener.mockReset();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        addEventListener: mocks.addEventListener,
        enumerateDevices: mocks.enumerateDevices,
        getUserMedia: mocks.getUserMedia,
        removeEventListener: mocks.removeEventListener,
      },
    });
  });

  it('loads output devices, applies selected sinks, and toggles audio mute', async () => {
    const setSinkId = vi.fn().mockResolvedValue(undefined);
    localStorage.setItem('harmonie:audioOutputDeviceId', 'stored-speaker');
    mocks.enumerateDevices.mockResolvedValue([
      mediaDevice({ deviceId: 'speaker-1', label: '', kind: 'audiooutput' }),
      mediaDevice({ deviceId: 'speaker-1', label: '', kind: 'audiooutput' }),
      mediaDevice({ deviceId: 'mic-1', label: 'Mic', kind: 'audioinput' }),
    ]);

    render(
      <AudioOutputProvider>
        <audio
          data-testid="audio"
          ref={(el) => {
            if (el) Object.assign(el, { setSinkId });
          }}
        />
        <OutputConsumer />
      </AudioOutputProvider>
    );

    expect(screen.getByTestId('selected')).toHaveTextContent('stored-speaker');
    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Output 1'));
    expect(screen.getByTestId('permission')).toHaveTextContent('true');

    await userEvent.click(screen.getByRole('button', { name: 'Select' }));
    expect(screen.getByTestId('selected')).toHaveTextContent('speaker-1');
    expect(localStorage.getItem('harmonie:audioOutputDeviceId')).toBe('speaker-1');
    expect(setSinkId).toHaveBeenCalledWith('speaker-1');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('muted')).toHaveTextContent('true');
    expect(screen.getByTestId('audio')).toHaveProperty('muted', true);

    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    expect(setSinkId).toHaveBeenLastCalledWith('speaker-1');
  });

  it('requests audio permission, stops tracks, and refreshes outputs', async () => {
    const stop = vi.fn();
    mocks.enumerateDevices
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'default', label: 'Default speaker' })]);
    mocks.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop }],
    });

    render(
      <AudioOutputProvider>
        <OutputConsumer />
      </AudioOutputProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Permission' }));

    await waitFor(() => expect(stop).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Default speaker'));
    expect(mocks.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('refreshes labelled output devices after media device changes', async () => {
    mocks.enumerateDevices
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'default', label: 'Default speaker' })])
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'speaker-2', label: 'Studio speaker' })]);

    render(
      <AudioOutputProvider>
        <OutputConsumer />
      </AudioOutputProvider>
    );

    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Default speaker'));
    expect(screen.getByTestId('permission')).toHaveTextContent('false');

    const handleDeviceChange = mocks.addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'devicechange'
    )?.[1] as (() => void) | undefined;
    handleDeviceChange?.();

    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Studio speaker'));
    expect(screen.getByTestId('permission')).toHaveTextContent('false');
  });

  it('handles missing permissions, unsupported sink selection, and cleanup', async () => {
    mocks.enumerateDevices.mockRejectedValue(new Error('missing'));
    mocks.getUserMedia.mockRejectedValue(new Error('denied'));

    const { unmount } = render(
      <AudioOutputProvider>
        <audio data-testid="audio" />
        <OutputConsumer />
      </AudioOutputProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Permission' }));
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }));
    unmount();

    expect(mocks.removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
  });

  it('throws when used outside its provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useAudioOutput must be used inside AudioOutputProvider'
    );

    consoleError.mockRestore();
  });
});
