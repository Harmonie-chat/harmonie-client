import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioOutputPopover } from './AudioOutputPopover';

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

vi.mock('./AudioOutputContext', () => ({
  useAudioOutput: () => ({
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
    <AudioOutputPopover
      anchorRef={{ current: anchor } as RefObject<HTMLButtonElement>}
      onClose={onClose}
    />
  );

  return { onClose };
};

describe('AudioOutputPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.coarsePointer = false;
    mocks.devices = [
      { deviceId: 'default', label: 'System output' },
      { deviceId: 'speaker-1', label: '' },
      { deviceId: 'speaker-2', label: 'Desk speakers' },
    ];
    mocks.needsPermission = true;
    mocks.requestPermission.mockResolvedValue(undefined);
    mocks.selectedDeviceId = 'default';
  });

  it('renders output devices, requests permission, and selects a device', async () => {
    const { onClose } = renderPopover();

    expect(screen.getByText('audio.output.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio.output.default/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio.output.unknown/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Desk speakers/ }));
    expect(mocks.selectDevice).toHaveBeenCalledWith('speaker-2');
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /audio.output.grantAccess/ }));
    await waitFor(() => expect(mocks.requestPermission).toHaveBeenCalledTimes(1));
  });

  it('renders mobile empty state and closes from multiple paths', () => {
    mocks.coarsePointer = true;
    mocks.devices = [];
    mocks.needsPermission = false;
    const { onClose } = renderPopover();

    expect(screen.getByText('audio.output.noDevices')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
