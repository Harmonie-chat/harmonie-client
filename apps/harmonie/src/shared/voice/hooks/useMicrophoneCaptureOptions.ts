import { useMemo } from 'react';
import type { AudioCaptureOptions } from 'livekit-client';
import type { AudioInputNoiseReductionLevel } from '@/features/user/audio/AudioInputContext';

export const useMicrophoneCaptureOptions = (
  selectedInputDeviceId: string,
  noiseReductionLevel: AudioInputNoiseReductionLevel
) =>
  useMemo<AudioCaptureOptions>(() => {
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
      };
    }

    return {
      deviceId,
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
      voiceIsolation: noiseReductionLevel === 'high',
    };
  }, [noiseReductionLevel, selectedInputDeviceId]);
