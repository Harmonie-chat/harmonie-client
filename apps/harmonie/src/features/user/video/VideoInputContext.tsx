import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';

export interface VideoInputDevice {
  deviceId: string;
  label: string;
}

interface VideoInputContextValue {
  devices: VideoInputDevice[];
  selectedDeviceId: string;
  selectDevice: (deviceId: string) => void;
  needsPermission: boolean;
  requestPermission: () => Promise<void>;
}

const VideoInputContext = createContext<VideoInputContextValue | null>(null);

const STORAGE_KEY = 'harmonie:videoInputDeviceId';
export const VIDEO_DEFAULT_DEVICE_ID = 'default';

const readVideoInputDevices = async () => {
  try {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const inputDevices = allDevices.filter((d) => d.kind === 'videoinput');
    const uniqueInputDevices = Array.from(
      new Map(inputDevices.map((device) => [device.deviceId, device])).values()
    );

    const hasLabels = uniqueInputDevices.some((d) => d.label !== '');

    const mapped: VideoInputDevice[] = uniqueInputDevices.map((d) => ({
      deviceId: d.deviceId,
      label: d.label,
    }));

    if (!mapped.find((d) => d.deviceId === VIDEO_DEFAULT_DEVICE_ID)) {
      mapped.unshift({ deviceId: VIDEO_DEFAULT_DEVICE_ID, label: '' });
    }

    return { devices: mapped, needsPermission: !hasLabels };
  } catch {
    return null;
  }
};

export const VideoInputProvider = ({ children }: { children: ReactNode }) => {
  const [devices, setDevices] = useState<VideoInputDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? VIDEO_DEFAULT_DEVICE_ID
  );
  const [needsPermission, setNeedsPermission] = useState(false);

  const syncDevices = () => {
    void readVideoInputDevices().then((nextDevices) => {
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

  const selectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    localStorage.setItem(STORAGE_KEY, deviceId);
  };

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      syncDevices();
    } catch {
      // User denied
    }
  };

  return (
    <VideoInputContext.Provider
      value={{
        devices,
        selectedDeviceId,
        selectDevice,
        needsPermission,
        requestPermission,
      }}
    >
      {children}
    </VideoInputContext.Provider>
  );
};

export const useVideoInput = (): VideoInputContextValue => {
  const ctx = use(VideoInputContext);
  if (!ctx) throw new Error('useVideoInput must be used inside VideoInputProvider');
  return ctx;
};
