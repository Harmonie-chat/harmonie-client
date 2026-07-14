import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import {
  disableWebPushNotificationsLocally,
  enableWebPushNotifications,
  getInitialPushNotificationStatus,
  getPushNotificationsPromptDismissed,
  resyncWebPushNotifications,
  setPushNotificationsPromptDismissed,
  type PushNotificationStatus,
} from './webPush';
import { PushNotificationPrompt } from './PushNotificationPrompt';

interface PushNotificationContextValue {
  status: PushNotificationStatus;
  promptDismissed: boolean;
  showPrompt: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  dismissPrompt: () => void;
}

const PushNotificationContext = createContext<PushNotificationContextValue>({
  status: 'unsupported',
  promptDismissed: true,
  showPrompt: false,
  enable: async () => {},
  disable: async () => {},
  dismissPrompt: () => {},
});

export const PushNotificationProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<PushNotificationStatus>(() =>
    getInitialPushNotificationStatus()
  );
  const [promptDismissed, setPromptDismissed] = useState(() =>
    getPushNotificationsPromptDismissed()
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const sync = async () => {
      const nextStatus = await resyncWebPushNotifications().catch(() => 'error' as const);
      if (!cancelled) setStatus(nextStatus);
    };

    void sync();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const enable = async () => {
    setStatus('syncing');
    const nextStatus = await enableWebPushNotifications().catch(() => 'error' as const);
    setStatus(nextStatus);
    if (nextStatus === 'enabled') {
      setPromptDismissed(false);
      return;
    }

    throw new Error(nextStatus);
  };

  const disable = async () => {
    setStatus('syncing');
    const nextStatus = await disableWebPushNotificationsLocally().catch(() => 'error' as const);
    setStatus(nextStatus);
  };

  const dismissPrompt = () => {
    setPushNotificationsPromptDismissed(true);
    setPromptDismissed(true);
  };

  const showPrompt =
    isAuthenticated &&
    (status === 'prompt' || status === 'syncing' || status === 'error') &&
    !promptDismissed &&
    typeof window !== 'undefined';

  const value = {
    status,
    promptDismissed,
    showPrompt,
    enable,
    disable,
    dismissPrompt,
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
      {showPrompt && (
        <PushNotificationPrompt
          isLoading={status === 'syncing'}
          onDismiss={dismissPrompt}
          onEnable={enable}
        />
      )}
    </PushNotificationContext.Provider>
  );
};

export const usePushNotifications = () => use(PushNotificationContext);
