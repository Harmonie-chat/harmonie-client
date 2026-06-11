import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { getAccessToken, subscribeToTokenChanges } from '@/api/authStorage';
import { useAuth } from '@/features/auth/AuthContext';
import { REALTIME_SERVER_EVENTS } from './constants';

const HUB_URL = import.meta.env.VITE_WS_BASE_URL as string;

interface RealtimeContextValue {
  connection: HubConnection | null;
  isReady: boolean;
}

interface RealtimeState {
  authKey: string | null;
  connection: HubConnection | null;
  isReady: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ connection: null, isReady: false });

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [accessToken, setAccessToken] = useState(() => getAccessToken());
  const authKey = isAuthenticated ? accessToken : null;
  const [state, setState] = useState<RealtimeState>({
    authKey: null,
    connection: null,
    isReady: false,
  });
  const connection = authKey !== null && state.authKey === authKey ? state.connection : null;
  const isReady = authKey !== null && state.authKey === authKey ? state.isReady : false;

  useEffect(() => subscribeToTokenChanges(setAccessToken), []);

  useEffect(() => {
    if (authKey === null) return;

    const hub = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => getAccessToken() ?? '',
      })
      .withAutomaticReconnect([2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    let cancelled = false;
    const handleReady = () => {
      if (!cancelled) {
        setState((current) =>
          current.connection === hub ? { ...current, isReady: true } : current
        );
      }
    };

    hub.on(REALTIME_SERVER_EVENTS.ready, handleReady);

    hub
      .start()
      .then(() => {
        if (!cancelled) setState({ authKey, connection: hub, isReady: false });
      })
      .catch((err) => {
        console.error('[Realtime] hub.start() failed:', err);
      });

    return () => {
      cancelled = true;
      hub.off(REALTIME_SERVER_EVENTS.ready, handleReady);
      if (hub.state !== HubConnectionState.Disconnected) {
        hub.stop();
      }
    };
  }, [authKey]);

  return (
    <RealtimeContext.Provider value={{ connection, isReady }}>{children}</RealtimeContext.Provider>
  );
};

export const useRealtime = () => use(RealtimeContext);
