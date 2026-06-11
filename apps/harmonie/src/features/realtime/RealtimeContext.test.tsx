import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RealtimeProvider, useRealtime } from './RealtimeContext';
import { REALTIME_SERVER_EVENTS } from './constants';

type Handler = () => void;

const mocks = vi.hoisted(() => {
  const hub = {
    on: vi.fn(),
    off: vi.fn(),
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
    getAccessToken: vi.fn(),
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

vi.mock('@/api/authStorage', () => ({
  getAccessToken: mocks.getAccessToken,
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
    mocks.getAccessToken.mockReset();
    mocks.hub.on.mockReset();
    mocks.hub.off.mockReset();
    mocks.hub.start.mockReset();
    mocks.hub.stop.mockReset();
    mocks.hub.state = 'Connected';
    mocks.handlers.clear();
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

  it('starts a SignalR hub for authenticated users and marks it ready on the ready event', async () => {
    mocks.isAuthenticated = true;
    mocks.getAccessToken.mockReturnValue('access-token');
    mocks.hub.start.mockResolvedValueOnce(undefined);

    render(
      <RealtimeProvider>
        <RealtimeConsumer />
      </RealtimeProvider>
    );

    await waitFor(() => expect(screen.getByTestId('connection')).toHaveTextContent('connected'));
    expect(screen.getByTestId('ready')).toHaveTextContent('false');
    expect(mocks.builder.withUrl).toHaveBeenCalledWith(expect.any(String), {
      accessTokenFactory: expect.any(Function),
    });
    expect(mocks.builder.withAutomaticReconnect).toHaveBeenCalledWith([2000, 5000, 10000, 30000]);
    expect(mocks.builder.configureLogging).toHaveBeenCalledWith('Warning');
    expect(mocks.builder.withUrl.mock.calls[0][1].accessTokenFactory()).toBe('access-token');

    act(() => {
      mocks.handlers.get(REALTIME_SERVER_EVENTS.ready)?.();
    });

    expect(screen.getByTestId('ready')).toHaveTextContent('true');
  });

  it('removes handlers and stops an active hub on unmount', async () => {
    mocks.isAuthenticated = true;
    mocks.getAccessToken.mockReturnValue('access-token');
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
    mocks.getAccessToken.mockReturnValue('access-token');
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
    mocks.getAccessToken.mockReturnValue('access-token');
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
