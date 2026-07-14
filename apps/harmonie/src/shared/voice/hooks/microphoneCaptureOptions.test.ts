import { describe, expect, it } from 'vitest';
import { getMicrophoneCaptureOptions } from './microphoneCaptureOptions';

describe('getMicrophoneCaptureOptions', () => {
  it('uses the default device when no concrete device is selected', () => {
    expect(getMicrophoneCaptureOptions('default', 'standard')).toEqual({
      deviceId: { ideal: 'default' },
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      voiceIsolation: false,
    });
  });

  it('disables noise processing when requested', () => {
    expect(getMicrophoneCaptureOptions('mic-1', 'off')).toEqual({
      deviceId: { exact: 'mic-1' },
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: false,
      voiceIsolation: false,
    });
  });

  it('enables voice isolation for high noise reduction', () => {
    const options = getMicrophoneCaptureOptions('', 'high');

    expect(options.voiceIsolation).toBe(true);
    expect(options.deviceId).toEqual({ ideal: 'default' });
  });
});
