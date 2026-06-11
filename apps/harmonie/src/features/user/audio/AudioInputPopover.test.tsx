import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioInputPopover } from './AudioInputPopover';

const mocks = vi.hoisted(() => ({
  coarsePointer: false,
  devices: [] as Array<{ deviceId: string; label: string }>,
  needsPermission: false,
  noiseReductionLevel: 'off' as 'off' | 'standard' | 'high',
  requestPermission: vi.fn(),
  selectedDeviceId: 'default',
  selectDevice: vi.fn(),
  setNoiseReductionLevel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/shared/hooks/useCoarsePointer', () => ({
  useCoarsePointer: () => mocks.coarsePointer,
}));

vi.mock('./AudioInputContext', () => ({
  useAudioInput: () => ({
    devices: mocks.devices,
    needsPermission: mocks.needsPermission,
    noiseReductionLevel: mocks.noiseReductionLevel,
    requestPermission: mocks.requestPermission,
    selectedDeviceId: mocks.selectedDeviceId,
    selectDevice: mocks.selectDevice,
    setNoiseReductionLevel: mocks.setNoiseReductionLevel,
  }),
}));

const renderPopover = (onClose = vi.fn()) => {
  const anchor = document.createElement('button');
  anchor.getBoundingClientRect = vi.fn(
    () => ({ left: 100, right: 160, top: 200, bottom: 230, width: 60, height: 30 }) as DOMRect
  );
  document.body.append(anchor);

  render(
    <AudioInputPopover
      anchorRef={{ current: anchor } as RefObject<HTMLButtonElement>}
      onClose={onClose}
    />
  );

  return { anchor, onClose };
};

describe('AudioInputPopover', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.coarsePointer = false;
    mocks.devices = [
      { deviceId: 'default', label: 'System microphone' },
      { deviceId: 'mic-1', label: '' },
      { deviceId: 'mic-2', label: 'Studio mic' },
    ];
    mocks.needsPermission = true;
    mocks.noiseReductionLevel = 'standard';
    mocks.requestPermission.mockResolvedValue(undefined);
    mocks.selectedDeviceId = 'default';
  });

  it('renders devices, permission action, and noise reduction controls', async () => {
    const { onClose } = renderPopover();

    expect(screen.getByText('audio.input.title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio.input.default/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /audio.input.unknown/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Studio mic/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Studio mic/ }));
    expect(mocks.selectDevice).toHaveBeenCalledWith('mic-2');
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('radio', { name: 'audio.input.noiseReduction.levels.high' }));
    expect(mocks.setNoiseReductionLevel).toHaveBeenCalledWith('high');

    fireEvent.click(screen.getByRole('button', { name: /audio.input.grantAccess/ }));
    await waitFor(() => expect(mocks.requestPermission).toHaveBeenCalledTimes(1));
  });

  it('renders mobile empty state and closes through close, escape, and outside click', () => {
    mocks.coarsePointer = true;
    mocks.devices = [];
    mocks.needsPermission = false;
    const { onClose } = renderPopover();

    expect(screen.getByText('audio.input.noDevices')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'common.close' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
