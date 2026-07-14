import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { getFreshAccessToken } from '@/api/client';
import { useAuth } from '@/features/auth/AuthContext';
import { REALTIME_SERVER_EVENTS } from './constants';

const HUB_URL = import.meta.env.VITE_WS_BASE_URL as string;

interface RealtimeContextValue {
  connection: HubConnection | null;
  isReady: boolean;
}

interface RealtimeState {
  connection: HubConnection | null;
  isReady: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue>({ connection: null, isReady: false });

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [restartVersion, setRestartVersion] = useState(0);
  const [state, setState] = useState<RealtimeState>({ connection: null, isReady: false });
  const connection = isAuthenticated ? state.connection : null;
  const isReady = isAuthenticated ? state.isReady : false;

  useEffect(() => {
    if (!isAuthenticated) return;

    const hub = new HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: getFreshAccessToken,
      })
      .withAutomaticReconnect([2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build();

    let cancelled = false;
    let receivedReady = false;
    const handleReady = () => {
      receivedReady = true;
      if (!cancelled) {
        setState((current) =>
          current.connection === hub ? { ...current, isReady: true } : current
        );
      }
    };
    const handleReconnecting = () => {
      if (!cancelled) {
        setState((current) =>
          current.connection === hub ? { ...current, isReady: false } : current
        );
      }
    };
    const handleClose = () => {
      if (cancelled) return;

      setState((current) =>
        current.connection === hub ? { connection: null, isReady: false } : current
      );
      setRestartVersion((current) => current + 1);
    };

    hub.on(REALTIME_SERVER_EVENTS.ready, handleReady);
    hub.onreconnecting(handleReconnecting);
    hub.onclose(handleClose);

    hub
      .start()
      .then(() => {
        if (!cancelled) setState({ connection: hub, isReady: receivedReady });
      })
      .catch((err) => {
        if (!cancelled) console.error('[Realtime] hub.start() failed:', err);
      });

    return () => {
      cancelled = true;
      hub.off(REALTIME_SERVER_EVENTS.ready, handleReady);
      if (hub.state !== HubConnectionState.Disconnected) {
        hub.stop();
      }
    };
  }, [isAuthenticated, restartVersion]);

  return (
    <RealtimeContext.Provider value={{ connection, isReady }}>{children}</RealtimeContext.Provider>
  );
};

export const useRealtime = () => use(RealtimeContext);
