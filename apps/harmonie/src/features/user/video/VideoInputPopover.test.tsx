import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoInputPopover } from './VideoInputPopover';

const mocks = vi.hoisted(() => ({
  coarsePointer: false,
  devices: [] as Array<{ deviceId: string; label: string }>,
  needsPermission: false,
  requestPermission: vi.fn(),
  selectedDeviceId: 'default',
  selectDevice: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/shared/hooks/useCoarsePointer', () => ({
  useCoarsePointer: () => mocks.coarsePointer,
}));

vi.mock('./VideoInputContext', () => ({
  useVideoInput: () => ({
    devices: mocks.devices,
    needsPermission: mocks.needsPermission,
    requestPermission: mocks.requestPermission,
    selectedDeviceId: mocks.selectedDeviceId,
    selectDevice: mocks.selectDevice,
  }),
}));

const renderPopover = (onClose = vi.fn()) => {
  const anchor = document.createElement('button');
  anchor.getBoundingClientRect = vi.fn(
    () => ({ left: 100, right: 160, top: 200, bottom: 230, width: 60, height: 30 }) as DOMRect
  );
  document.body.append(anchor);

  render(
    <VideoInputPopover
      anchorRef={{ current: anchor } as RefObject<HTMLButtonElement>}
      onClose={onClose}
    />
  );

  return { onClose };
};

describe('VideoInputPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.coarsePointer = false;
    mocks.devices = [
      { deviceId: 'default', label: 'System camera' },
      { deviceId: 'camera-1', label: '' },
      { deviceId: 'camera-2', label: 'Desk camera' },
    ];
    mocks.needsPermission = true;
    mocks.requestPermission.mockResolvedValue(undefined);
    mocks.selectedDeviceId = 'default';
  });

  it('renders camera devices, requests permission, and selects a device', async () => {
    const { onClose } = renderPopover();

    expect(screen.getByText('video.input.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /video.input.default/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /video.input.unknown/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Desk camera/ }));
    expect(mocks.selectDevice).toHaveBeenCalledWith('camera-2');
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /video.input.grantAccess/ }));
    await waitFor(() => expect(mocks.requestPermission).toHaveBeenCalledTimes(1));
  });

  it('renders mobile empty state and closes from multiple paths', () => {
    mocks.coarsePointer = true;
    mocks.devices = [];
    mocks.needsPermission = false;
    const { onClose } = renderPopover();

    expect(screen.getByText('video.input.noDevices')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
