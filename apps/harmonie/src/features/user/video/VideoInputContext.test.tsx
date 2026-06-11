import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoInputProvider, useVideoInput } from './VideoInputContext';

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
    kind: input.kind ?? 'videoinput',
    label: input.label ?? '',
    toJSON: () => ({}),
  }) as MediaDeviceInfo;

const VideoConsumer = () => {
  const input = useVideoInput();

  return (
    <div>
      <span data-testid="devices">{input.devices.map((device) => device.label).join('|')}</span>
      <span data-testid="selected">{input.selectedDeviceId}</span>
      <span data-testid="permission">{String(input.needsPermission)}</span>
      <button type="button" onClick={() => input.selectDevice('camera-1')}>
        Select
      </button>
      <button type="button" onClick={() => void input.requestPermission()}>
        Permission
      </button>
    </div>
  );
};

const BrokenConsumer = () => {
  useVideoInput();
  return null;
};

describe('VideoInputProvider', () => {
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

  it('loads video devices, persists selection, and tracks permission needs', async () => {
    localStorage.setItem('harmonie:videoInputDeviceId', 'stored-camera');
    mocks.enumerateDevices.mockResolvedValue([
      mediaDevice({ deviceId: 'camera-1', label: '', kind: 'videoinput' }),
      mediaDevice({ deviceId: 'camera-1', label: '', kind: 'videoinput' }),
      mediaDevice({ deviceId: 'mic-1', label: 'Mic', kind: 'audioinput' }),
    ]);

    render(
      <VideoInputProvider>
        <VideoConsumer />
      </VideoInputProvider>
    );

    expect(screen.getByTestId('selected')).toHaveTextContent('stored-camera');
    await waitFor(() => expect(screen.getAllByTestId('devices')[0]).toBeInTheDocument());
    expect(screen.getByTestId('permission')).toHaveTextContent('true');
    expect(mocks.addEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));

    await userEvent.click(screen.getByRole('button', { name: 'Select' }));

    expect(screen.getByTestId('selected')).toHaveTextContent('camera-1');
    expect(localStorage.getItem('harmonie:videoInputDeviceId')).toBe('camera-1');
  });

  it('requests camera permission, stops tracks, and refreshes devices', async () => {
    const stop = vi.fn();
    mocks.enumerateDevices
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'default', label: 'Default camera' })]);
    mocks.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop }],
    });

    render(
      <VideoInputProvider>
        <VideoConsumer />
      </VideoInputProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Permission' }));

    await waitFor(() => expect(stop).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Default camera'));
    expect(mocks.getUserMedia).toHaveBeenCalledWith({ video: true });
  });

  it('refreshes labelled cameras after media device changes', async () => {
    mocks.enumerateDevices
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'default', label: 'Default camera' })])
      .mockResolvedValueOnce([mediaDevice({ deviceId: 'camera-2', label: 'Studio camera' })]);

    render(
      <VideoInputProvider>
        <VideoConsumer />
      </VideoInputProvider>
    );

    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Default camera'));
    expect(screen.getByTestId('permission')).toHaveTextContent('false');

    const handleDeviceChange = mocks.addEventListener.mock.calls.find(
      ([eventName]) => eventName === 'devicechange'
    )?.[1] as (() => void) | undefined;
    handleDeviceChange?.();

    await waitFor(() => expect(screen.getByTestId('devices')).toHaveTextContent('Studio camera'));
    expect(screen.getByTestId('permission')).toHaveTextContent('false');
  });

  it('handles denied permissions, failed enumeration, and cleanup', async () => {
    mocks.enumerateDevices.mockRejectedValue(new Error('missing'));
    mocks.getUserMedia.mockRejectedValue(new Error('denied'));

    const { unmount } = render(
      <VideoInputProvider>
        <VideoConsumer />
      </VideoInputProvider>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Permission' }));
    unmount();

    expect(mocks.removeEventListener).toHaveBeenCalledWith('devicechange', expect.any(Function));
  });

  it('throws when used outside its provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useVideoInput must be used inside VideoInputProvider'
    );

    consoleError.mockRestore();
  });
});
