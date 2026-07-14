import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

const mocks = vi.hoisted(() => ({
  logoutApi: vi.fn(),
  refreshTokens: vi.fn(),
  clearTokens: vi.fn(),
  discardLegacyRefreshToken: vi.fn(),
  storeTokens: vi.fn(),
  getFreshAccessToken: vi.fn(),
  setLogoutHandler: vi.fn(),
}));

vi.mock('@/api/auth', () => ({
  logout: mocks.logoutApi,
  refreshTokens: mocks.refreshTokens,
}));

vi.mock('@/api/authStorage', () => ({
  clearTokens: mocks.clearTokens,
  discardLegacyRefreshToken: mocks.discardLegacyRefreshToken,
  storeTokens: mocks.storeTokens,
}));

vi.mock('@/api/client', () => ({
  getFreshAccessToken: mocks.getFreshAccessToken,
  setLogoutHandler: mocks.setLogoutHandler,
}));

const AuthConsumer = () => {
  const auth = useAuth();

  return (
    <>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="initializing">{String(auth.isInitializing)}</span>
      <button type="button" onClick={() => auth.setIsAuthenticated(true)}>
        Authenticate
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        Logout
      </button>
    </>
  );
};

const DefaultAuthConsumer = () => {
  const auth = useAuth();

  return (
    <>
      <span data-testid="default-authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="default-initializing">{String(auth.isInitializing)}</span>
      <button type="button" onClick={() => auth.setIsAuthenticated(true)}>
        Default authenticate
      </button>
      <button type="button" onClick={() => void auth.logout()}>
        Default logout
      </button>
    </>
  );
};

const renderAuth = () =>
  render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );

describe('AuthProvider', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => {
      if (typeof mock === 'function') mock.mockReset();
    });
  });

  it('finishes initialization without a refresh cookie', async () => {
    mocks.refreshTokens.mockRejectedValueOnce({ code: 'VALIDATION_FAILED' });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(mocks.discardLegacyRefreshToken).toHaveBeenCalledOnce();
    expect(mocks.refreshTokens).toHaveBeenCalledWith();
  });

  it('exposes inert defaults when used without a provider', async () => {
    render(<DefaultAuthConsumer />);

    expect(screen.getByTestId('default-authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('default-initializing')).toHaveTextContent('true');

    act(() => {
      screen.getByRole('button', { name: 'Default authenticate' }).click();
    });
    await act(async () => {
      screen.getByRole('button', { name: 'Default logout' }).click();
    });

    expect(screen.getByTestId('default-authenticated')).toHaveTextContent('false');
    expect(mocks.clearTokens).not.toHaveBeenCalled();
  });

  it('refreshes tokens and authenticates when a refresh cookie exists', async () => {
    mocks.refreshTokens.mockResolvedValueOnce({
      accessToken: 'access-token',
      expiresAt: '2100-01-01T00:00:00.000Z',
    });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));
    expect(mocks.refreshTokens).toHaveBeenCalledWith();
    expect(mocks.storeTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      expiresAt: '2100-01-01T00:00:00.000Z',
    });
  });

  it('clears access tokens for fatal refresh failures', async () => {
    mocks.refreshTokens.mockRejectedValueOnce({ code: 'AUTH_INVALID_REFRESH_TOKEN' });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));
    expect(mocks.clearTokens).toHaveBeenCalledOnce();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('exposes manual authentication and logout actions', async () => {
    mocks.refreshTokens.mockRejectedValueOnce({ code: 'VALIDATION_FAILED' });
    mocks.getFreshAccessToken.mockResolvedValueOnce('access-token');
    mocks.logoutApi.mockRejectedValueOnce(new Error('already gone'));

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('initializing')).toHaveTextContent('false'));

    act(() => {
      screen.getByRole('button', { name: 'Authenticate' }).click();
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    await act(async () => {
      screen.getByRole('button', { name: 'Logout' }).click();
    });

    expect(mocks.getFreshAccessToken).toHaveBeenCalledOnce();
    expect(mocks.logoutApi).toHaveBeenCalledWith();
    expect(mocks.clearTokens).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('false'));
  });

  it('registers a logout handler that clears local authentication state', async () => {
    mocks.refreshTokens.mockRejectedValueOnce({ code: 'VALIDATION_FAILED' });

    renderAuth();
    await waitFor(() => expect(mocks.setLogoutHandler).toHaveBeenCalledOnce());

    act(() => {
      screen.getByRole('button', { name: 'Authenticate' }).click();
    });
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');

    act(() => {
      mocks.setLogoutHandler.mock.calls[0][0]();
    });

    expect(mocks.clearTokens).toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });
});
