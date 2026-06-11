import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMicrophoneCaptureOptions } from './useMicrophoneCaptureOptions';

describe('useMicrophoneCaptureOptions', () => {
  it('uses the default device when no concrete device is selected', () => {
    const { result } = renderHook(() => useMicrophoneCaptureOptions('default', 'standard'));

    expect(result.current).toEqual({
      deviceId: { ideal: 'default' },
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      voiceIsolation: false,
    });
  });

  it('disables noise processing when requested', () => {
    const { result } = renderHook(() => useMicrophoneCaptureOptions('mic-1', 'off'));

    expect(result.current).toEqual({
      deviceId: { exact: 'mic-1' },
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: false,
      voiceIsolation: false,
    });
  });

  it('enables voice isolation for high noise reduction', () => {
    const { result } = renderHook(() => useMicrophoneCaptureOptions('', 'high'));

    expect(result.current.voiceIsolation).toBe(true);
    expect(result.current.deviceId).toEqual({ ideal: 'default' });
  });
});
