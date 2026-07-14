import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeProvider, useRealtime } from './RealtimeContext';
import { REALTIME_SERVER_EVENTS } from './constants';

type Handler = () => void;

const mocks = vi.hoisted(() => {
  const hub = {
    on: vi.fn(),
    off: vi.fn(),
    onclose: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    state: 'Connected',
  };
  const builder = {
    withUrl: vi.fn(),
    withAutomaticReconnect: vi.fn(),
    configureLogging: vi.fn(),
    build: vi.fn(),
  };

  builder.withUrl.mockReturnValue(builder);
  builder.withAutomaticReconnect.mockReturnValue(builder);
  builder.configureLogging.mockReturnValue(builder);
  builder.build.mockReturnValue(hub);

  return {
    builder,
    closeHandler: null as Handler | null,
    getFreshAccessToken: vi.fn(),
    hub,
    handlers: new Map<string, Handler>(),
    isAuthenticated: false,
  };
});

vi.mock('@microsoft/signalr', () => ({
  HubConnectionBuilder: vi.fn(() => mocks.builder),
  HubConnectionState: {
    Disconnected: 'Disconnected',
  },
  LogLevel: {
    Warning: 'Warning',
  },
}));

vi.mock('@/api/client', () => ({
  getFreshAccessToken: mocks.getFreshAccessToken,
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));

const RealtimeConsumer = () => {
  const { connection, isReady } = useRealtime();

  return (
    <>
      <span data-testid="connection">{connection ? 'connected' : 'none'}</span>
      <span data-testid="ready">{String(isReady)}</span>
    </>
  );
};

describe('RealtimeProvider', () => {
  beforeEach(() => {
    mocks.isAuthenticated = false;
    mocks.getFreshAccessToken.mockReset();
    mocks.hub.on.mockReset();
    mocks.hub.off.mockReset();
    mocks.hub.onclose.mockReset();
    mocks.hub.start.mockReset();
    mocks.hub.stop.mockReset();
    mocks.hub.state = 'Connected';
    mocks.handlers.clear();
    mocks.closeHandler = null;
    mocks.builder.withUrl.mockClear();
    mocks.builder.withAutomaticReconnect.mockClear();
    mocks.builder.configureLogging.mockClear();
    mocks.builder.build.mockClear();
    mocks.hub.on.mockImplementation((eventName: string, handler: Handler) => {
      mocks.handlers.set(eventName, handler);
    });
    mocks.hub.off.mockImplementation((eventName: string, handler: Handler) => {
      if (mocks.handlers.get(eventName) === handler) mocks.handlers.delete(eventName);
    });
    mocks.hub.onclose.mockImplementation((handler: Handler) => {
      mocks.closeHandler = handler;
    });
    mocks.builder.withUrl.mockReturnValue(mocks.builder);
    mocks.builder.withAutomaticReconnect.mockReturnValue(mocks.builder);
    mocks.builder.configureLogging.mockReturnValue(mocks.builder);
    mocks.builder.build.mockReturnValue(mocks.hub);
  });

  it('keeps the default disconnected state while unauthenticated', () => {
    render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    expect(screen.getByTestId('connection')).toHaveTextContent('none');
    expect(screen.getByTestId('ready')).toHaveTextContent('false');
    expect(mocks.builder.build).not.toHaveBeenCalled();
  });

  it('starts SignalR with the shared fresh-token factory and handles ready events', async () => {
    mocks.isAuthenticated = true;
    mocks.getFreshAccessToken.mockResolvedValue('access-token');
    mocks.hub.start.mockResolvedValueOnce(undefined);

    render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('connection')).toHaveTextContent('connected'));
    expect(mocks.builder.withUrl).toHaveBeenCalledWith(expect.any(String), {
      accessTokenFactory: mocks.getFreshAccessToken,
    });
    expect(mocks.builder.withAutomaticReconnect).toHaveBeenCalledWith([2000, 5000, 10000, 30000]);

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.ready)?.();
    });

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
  });

  it('hides a terminally closed connection without starting a competing reconnect loop', async () => {
    mocks.isAuthenticated = true;
    mocks.hub.start.mockResolvedValue(undefined);

    render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('connection')).toHaveTextContent('connected'));

    act(() => mocks.closeHandler?.());

    expect(screen.getByTestId('connection')).toHaveTextContent('none');
    expect(screen.getByTestId('ready')).toHaveTextContent('false');
    expect(mocks.hub.start).toHaveBeenCalledOnce();
    expect(mocks.builder.build).toHaveBeenCalledOnce();
  });

  it('removes handlers and stops an active hub on unmount', async () => {
    mocks.isAuthenticated = true;
    mocks.hub.start.mockResolvedValueOnce(undefined);

    const { unmount } = render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('connection')).toHaveTextContent('connected'));
    unmount();

    expect(mocks.hub.off).toHaveBeenCalledWith(REALTIME_SERVER_EVENTS.ready, expect.any(Function));
    expect(mocks.hub.stop).toHaveBeenCalledTimes(1);
  });

  it('does not stop a hub that is already disconnected', async () => {
    mocks.isAuthenticated = true;
    mocks.hub.state = 'Disconnected';
    mocks.hub.start.mockResolvedValueOnce(undefined);

    const { unmount } = render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('connection')).toHaveTextContent('connected'));
    unmount();

    expect(mocks.hub.stop).not.toHaveBeenCalled();
  });

  it('logs startup failures without exposing a stale connection', async () => {
    const error = new Error('boom');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.isAuthenticated = true;
    mocks.hub.start.mockRejectedValueOnce(error);

    render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('[Realtime] hub.start() failed:', error)
    );
    expect(screen.getByTestId('connection')).toHaveTextContent('none');
  });
});
