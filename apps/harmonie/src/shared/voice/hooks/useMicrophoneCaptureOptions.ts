import { useMemo } from 'react';
import type { AudioCaptureOptions } from 'livekit-client';
import type { AudioInputNoiseReductionLevel } from '@/features/user/audio/AudioInputContext';

export const useMicrophoneCaptureOptions = (
  selectedInputDeviceId: string,
  noiseReductionLevel: AudioInputNoiseReductionLevel
) => {
  return useMemo(() => {
    const deviceId =
      selectedInputDeviceId && selectedInputDeviceId !== 'default'
        ? { exact: selectedInputDeviceId }
        : { ideal: 'default' };

    if (noiseReductionLevel === 'off') {
      return {
        deviceId,
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: false,
        voiceIsolation: false,
      } satisfies AudioCaptureOptions;
    }

    return {
      deviceId,
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      voiceIsolation: noiseReductionLevel === 'high',
    } satisfies AudioCaptureOptions;
  }, [noiseReductionLevel, selectedInputDeviceId]);
};
