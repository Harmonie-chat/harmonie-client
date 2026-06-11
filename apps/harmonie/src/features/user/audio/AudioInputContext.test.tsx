import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioInputProvider, useAudioInput } from './AudioInputContext';

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
    kind: input.kind ?? 'audioinput',
    label: input.label ?? '',
    toJSON: () => ({}),
  }) as MediaDeviceInfo;

const InputConsumer = () => {
  const input = useAudioInput();

  return (
    <div>
      <span data-testid="devices">{input.devices.map((device) => device.label).join('|')}</span>
      <span data-testid="selected">{input.selectedDeviceId}</span>
      <span data-testid="noise">{input.noiseReductionLevel}</span>
      <span data-testid="permission">{String(input.needsPermission)}</span>
      <span data-testid="muted">{String(input.muted)}</span>
      <button type="button" onClick={() => input.selectDevice('mic-1')}>
        Select
      </button>
      <button type="button" onClick={() => input.setNoiseReductionLevel('high')}>
        Noise
      </button>
      <button type="button" onClick={() => input.setMuted(true)}>
        Set muted
      </button>
      <button type="button" onClick={() => input.toggleMute()}>
        Toggle
      </button>
      <button type="button" onClick={() => void input.requestPermission()}>
        Permission
      </button>
    </div>
  );
};

const BrokenConsumer = () => {
  useAudioInput();
  return null;
};

describe('AudioInputProvider', () => {
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

  it('loads audio input devices, persists choices, and updates mute preferences', async () => {
    localStorage.setItem('harmonie:audioInputDeviceId', 'stored-mic');
    localStorage.setItem('harmonie:audioInputNoiseReductionLevel', 'invalid');
    mocks.enumerateDevices.mockResolvedValue([
      mediaDevice({ deviceId: 'mic-1', label: '', kind: 'audioinput' }),
      mediaDevice({ deviceId: 'mic-1', label: '', kind: 'audioinput' }),
      mediaDevice({ deviceId: 'speaker-1', label: 'Speaker', kind: 'audiooutput' }),
    ]);

    render(
      <AudioInputProvider>
        <InputConsumer />
      </AudioInputProvider>
    );

    expect(screen.getByTestId('selected')).toHaveTextContent('stored-mic');
    expect(screen.getByTestId('noise')).toHaveTextContent('standard');
    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Input 1'));
    expect(screen.getByTestId('permission')).toHaveTextContent('true');
    expect(mocks.addEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));

    await userEvent.click(screen.getByRole('button', { name: 'Select' }));
    await userEvent.click(screen.getByRole('button', { name: 'Noise' }));
    await userEvent.click(screen.getByRole('button', { name: 'Set muted' }));

    expect(screen.getByTestId('selected')).toHaveTextContent('mic-1');
    expect(localStorage.getItem('harmonie:audioInputDeviceId')).toBe('mic-1');
    expect(screen.getByTestId('noise')).toHaveTextContent('high');
    expect(localStorage.getItem('harmonie:audioInputNoiseReductionLevel')).toBe('high');
    expect(screen.getByTestId('muted')).toHaveTextContent('true');

    await userEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByTestId('muted')).toHaveTextContent('false');
  });

  it('requests microphone permission, stops tracks, and refreshes devices', async () => {
    const stop = vi.fn();
    mocks.enumerateDevices
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'default', label: 'Default mic' })]);
    mocks.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop }],
    });

    render(
      <AudioInputProvider>
        <InputConsumer />
      </AudioInputProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Permission' }));

    await waitFor(() => expect(stop).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Default mic'));
    expect(mocks.getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('refreshes labelled devices after media device changes', async () => {
    mocks.enumerateDevices
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'default', label: 'Default mic' })])
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'mic-2', label: 'Studio mic' })]);

    render(
      <AudioInputProvider>
        <InputConsumer />
      </AudioInputProvider>
    );

    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Default mic'));
    expect(screen.getByTestId('permission')).toHaveTextContent('false');

    const handleDeviceChange = mocks.addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'devicechange'
    )?.[1] as (() => void) | undefined;
    handleDeviceChange?.();

    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Studio mic'));
    expect(screen.getByTestId('permission')).toHaveTextContent('false');
  });

  it('uses a valid stored noise reduction level', () => {
    localStorage.setItem('harmonie:audioInputNoiseReductionLevel', 'off');
    mocks.enumerateDevices.mockResolvedValue([]);

    render(
      <AudioInputProvider>
        <InputConsumer />
      </AudioInputProvider>
    );

    expect(screen.getByTestId('noise')).toHaveTextContent('off');
  });

  it('ignores denied permission and device enumeration failures', async () => {
    mocks.enumerateDevices.mockRejectedValue(new Error('missing'));
    mocks.getUserMedia.mockRejectedValue(new Error('denied'));

    render(
      <AudioInputProvider>
        <InputConsumer />
      </AudioInputProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Permission' }));

    expect(screen.getByTestId('devices')).toHaveTextContent('');
  });

  it('removes the devicechange listener on unmount', () => {
    mocks.enumerateDevices.mockResolvedValue([]);

    const { unmount } = render(
      <AudioInputProvider>
        <InputConsumer />
      </AudioInputProvider>
    );

    unmount();

    expect(mocks.removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
  });

  it('throws when used outside its provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useAudioInput must be used inside AudioInputProvider'
    );

    consoleError.mockRestore();
  });
});
