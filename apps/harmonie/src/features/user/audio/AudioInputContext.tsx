import { createContext, use, useEffect, useReducer, useRef, type ReactNode } from 'react';

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

interface AudioInputState {
  devices: AudioInputDevice[];
  selectedDeviceId: string;
  noiseReductionLevel: AudioInputNoiseReductionLevel;
  needsPermission: boolean;
  muted: boolean;
}

type AudioInputAction =
  | { type: 'devicesSynced'; devices: AudioInputDevice[]; needsPermission: boolean }
  | { type: 'deviceSelected'; deviceId: string }
  | { type: 'noiseReductionChanged'; level: AudioInputNoiseReductionLevel }
  | { type: 'muteChanged'; muted: boolean }
  | { type: 'muteToggled' };

const createAudioInputInitialState = (): AudioInputState => {
  const storedNoiseReductionLevel = localStorage.getItem(NOISE_REDUCTION_STORAGE_KEY);

  return {
    devices: [],
    selectedDeviceId: localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DEVICE_ID,
    noiseReductionLevel: isAudioInputNoiseReductionLevel(storedNoiseReductionLevel)
      ? storedNoiseReductionLevel
      : DEFAULT_NOISE_REDUCTION_LEVEL,
    needsPermission: false,
    muted: false,
  };
};

const audioInputReducer = (state: AudioInputState, action: AudioInputAction): AudioInputState => {
  switch (action.type) {
    case 'devicesSynced':
      return { ...state, devices: action.devices, needsPermission: action.needsPermission };
    case 'deviceSelected':
      return { ...state, selectedDeviceId: action.deviceId };
    case 'noiseReductionChanged':
      return { ...state, noiseReductionLevel: action.level };
    case 'muteChanged':
      return { ...state, muted: action.muted };
    case 'muteToggled':
      return { ...state, muted: !state.muted };
  }
};

const readAudioInputDevices = async () => {
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

    return { devices: mapped, needsPermission: !hasLabels };
  } catch {
    return null;
  }
};

export const AudioInputProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(audioInputReducer, undefined, createAudioInputInitialState);
  const { devices, selectedDeviceId, noiseReductionLevel, needsPermission, muted } = state;

  const syncDevices = () => {
    void readAudioInputDevices().then((nextDevices) => {
      if (!nextDevices) return;
      dispatch({
        type: 'devicesSynced',
        devices: nextDevices.devices,
        needsPermission: nextDevices.needsPermission,
      });
    });
  };
  const syncDevicesRef = useRef(syncDevices);

  useEffect(() => {
    syncDevicesRef.current = syncDevices;
  });

  useEffect(() => {
    syncDevicesRef.current();
    const handleDeviceChange = () => syncDevicesRef.current();
    navigator.mediaDevices?.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  const selectDevice = (deviceId: string) => {
    dispatch({ type: 'deviceSelected', deviceId });
    localStorage.setItem(STORAGE_KEY, deviceId);
  };

  const setNoiseReductionLevel = (level: AudioInputNoiseReductionLevel) => {
    dispatch({ type: 'noiseReductionChanged', level });
    localStorage.setItem(NOISE_REDUCTION_STORAGE_KEY, level);
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      syncDevices();
    } catch {
      // User denied
    }
  };

  const toggleMute = () => {
    dispatch({ type: 'muteToggled' });
  };

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
        setMuted: (nextMuted) => dispatch({ type: 'muteChanged', muted: nextMuted }),
        toggleMute,
      }}
    >
      {children}
    </AudioInputContext.Provider>
  );
};

export const useAudioInput = (): AudioInputContextValue => {
  const ctx = use(AudioInputContext);
  if (!ctx) throw new Error('useAudioInput must be used inside AudioInputProvider');
  return ctx;
};
