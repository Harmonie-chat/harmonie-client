import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

export interface AudioOutputDevice {
  deviceId: string;
  label: string;
}

interface AudioOutputContextValue {
  devices: AudioOutputDevice[];
  selectedDeviceId: string;
  selectDevice: (deviceId: string) => void;
  applySinkId: (el: HTMLAudioElement) => void;
  needsPermission: boolean;
  requestPermission: () => Promise<void>;
  muted: boolean;
  toggleMute: () => void;
}

const AudioOutputContext = createContext<AudioOutputContextValue | null>(null);

const STORAGE_KEY = 'harmonie:audioOutputDeviceId';
const DEFAULT_DEVICE_ID = 'default';

const applyToAllAudioElements = (deviceId: string) => {
  document.querySelectorAll<HTMLAudioElement>('audio').forEach((el) => {
    if ('setSinkId' in el) {
      void (el as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(
        deviceId
      );
    }
  });
};

const readAudioOutputDevices = async () => {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const outputDevices = allDevices.filter((d) => d.kind === 'audiooutput');
    const uniqueOutputDevices = Array.from(
      new Map(outputDevices.map((device) => [device.deviceId, device])).values()
    );

    const hasLabels = uniqueOutputDevices.some((d) => d.label !== '');

    const mapped: AudioOutputDevice[] = uniqueOutputDevices.map((d, i) => ({
      deviceId: d.deviceId,
      label: d.label || (d.deviceId === DEFAULT_DEVICE_ID ? '' : `Output ${i + 1}`),
    }));

    if (!mapped.find((d) => d.deviceId === DEFAULT_DEVICE_ID)) {
      mapped.unshift({ deviceId: DEFAULT_DEVICE_ID, label: '' });
    }

    return { devices: mapped, needsPermission: !hasLabels };
  } catch {
    return null;
  }
};

export const AudioOutputProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<AudioOutputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? DEFAULT_DEVICE_ID
  );
  const [needsPermission, setNeedsPermission] = useState(false);
  const [muted, setMuted] = useState(false);
  const selectedDeviceIdRef = useRef(selectedDeviceId);

  const syncDevices = () => {
    void readAudioOutputDevices().then((nextDevices) => {
      if (!nextDevices) return;
      setDevices(nextDevices.devices);
      setNeedsPermission(nextDevices.needsPermission);
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

  useEffect(() => {
    selectedDeviceIdRef.current = selectedDeviceId;
  }, [selectedDeviceId]);

  const selectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(STORAGE_KEY, deviceId);
    applyToAllAudioElements(deviceId);
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      syncDevices();
    } catch {
      // User denied — leave needsPermission as true
    }
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      document.querySelectorAll<HTMLAudioElement>('audio').forEach((el) => {
        el.muted = next;
      });
      return next;
    });
  };

  const applySinkId = (el: HTMLAudioElement) => {
    const deviceId = selectedDeviceIdRef.current;
    if ('setSinkId' in el && deviceId !== DEFAULT_DEVICE_ID) {
      void (el as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(
        deviceId
      );
    }
  };

  return (
    <AudioOutputContext.Provider
      value={{
        devices,
        selectedDeviceId,
        selectDevice,
        applySinkId,
        needsPermission,
        requestPermission,
        muted,
        toggleMute,
      }}
    >
      {children}
    </AudioOutputContext.Provider>
  );
};

export const useAudioOutput = (): AudioOutputContextValue => {
  const ctx = use(AudioOutputContext);
  if (!ctx) throw new Error('useAudioOutput must be used inside AudioOutputProvider');
  return ctx;
};
