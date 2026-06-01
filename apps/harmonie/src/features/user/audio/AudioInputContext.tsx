import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export interface AudioInputDevice {
  deviceId: string;
  label: string;
}

export type AudioInputNoiseReductionLevel = 'off' | 'standard' | 'high';

interface AudioInputContextValue {
  devices: AudioInputDevice[];
  selectedDeviceId: string;
  selectDevice: (deviceId: string) => void;
  noiseReductionLevel: AudioInputNoiseReductionLevel;
  setNoiseReductionLevel: (level: AudioInputNoiseReductionLevel) => void;
  needsPermission: boolean;
  requestPermission: () => Promise<void>;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

const AudioInputContext = createContext<AudioInputContextValue | null>(null);

const STORAGE_KEY = 'harmonie:audioInputDeviceId';
const NOISE_REDUCTION_STORAGE_KEY = 'harmonie:audioInputNoiseReductionLevel';
const DEFAULT_DEVICE_ID = 'default';
const DEFAULT_NOISE_REDUCTION_LEVEL: AudioInputNoiseReductionLevel = 'standard';

const isAudioInputNoiseReductionLevel = (
  value: string | null
): value is AudioInputNoiseReductionLevel =>
  value === 'off' || value === 'standard' || value === 'high';

export const AudioInputProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<AudioInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DEVICE_ID
  );
  const [noiseReductionLevel, setNoiseReductionLevelState] =
    useState<AudioInputNoiseReductionLevel>(() => {
      const stored = localStorage.getItem(NOISE_REDUCTION_STORAGE_KEY);
      return isAudioInputNoiseReductionLevel(stored) ? stored : DEFAULT_NOISE_REDUCTION_LEVEL;
    });
  const [needsPermission, setNeedsPermission] = useState(false);
  const [muted, setMuted] = useState(false);

  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const inputDevices = allDevices.filter((d) => d.kind === 'audioinput');
      const uniqueInputDevices = Array.from(
        new Map(inputDevices.map((device) => [device.deviceId, device])).values()
      );

      const hasLabels = uniqueInputDevices.some((d) => d.label !== '');

      const mapped: AudioInputDevice[] = uniqueInputDevices.map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || (d.deviceId === DEFAULT_DEVICE_ID ? '' : `Input ${i + 1}`),
      }));

      if (!mapped.find((d) => d.deviceId === DEFAULT_DEVICE_ID)) {
        mapped.unshift({ deviceId: DEFAULT_DEVICE_ID, label: '' });
      }

      setDevices(mapped);
      setNeedsPermission(!hasLabels);
    } catch {
      // mediaDevices not available
    }
  }, []);

  useEffect(() => {
    void enumerateDevices();
    navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
    };
  }, [enumerateDevices]);

  const selectDevice = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(STORAGE_KEY, deviceId);
  }, []);

  const setNoiseReductionLevel = useCallback((level: AudioInputNoiseReductionLevel) => {
    setNoiseReductionLevelState(level);
    localStorage.setItem(NOISE_REDUCTION_STORAGE_KEY, level);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      await enumerateDevices();
    } catch {
      // User denied
    }
  }, [enumerateDevices]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => !prev);
  }, []);

  return (
    <AudioInputContext.Provider
      value={{
        devices,
        selectedDeviceId,
        selectDevice,
        noiseReductionLevel,
        setNoiseReductionLevel,
        needsPermission,
        requestPermission,
        muted,
        setMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioInputContext.Provider>
  );
};

export const useAudioInput = (): AudioInputContextValue => {
  const ctx = useContext(AudioInputContext);
  if (!ctx) throw new Error('useAudioInput must be used inside AudioInputProvider');
  return ctx;
};
