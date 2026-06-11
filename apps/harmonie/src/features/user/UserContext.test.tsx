import { act, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserProvider, useUser } from './UserContext';
import type { UserProfile } from '@/types/user';

const mocks = vi.hoisted(() => ({
  getMe: vi.fn(),
  getAccessToken: vi.fn(),
  isAuthenticated: false,
  setTheme: vi.fn(),
  changeLanguage: vi.fn(),
}));

vi.mock('@/api/users', () => ({
  getMe: mocks.getMe,
}));

vi.mock('@/api/authStorage', () => ({
  getAccessToken: mocks.getAccessToken,
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mocks.isAuthenticated }),
}));

vi.mock('@/i18n', () => ({
  default: {
    changeLanguage: mocks.changeLanguage,
  },
}));

vi.mock('./ThemeContext', () => ({
  THEMES: ['default', 'dim'],
  useTheme: () => ({ setTheme: mocks.setTheme }),
}));

const profile = (input: Partial<UserProfile> = {}): UserProfile => ({
  userId: 'user-1',
  username: 'ada',
  displayName: 'Ada',
  avatarFileId: null,
  avatar: { icon: 'User', color: '#111111', bg: '#ffffff' },
  theme: 'dim',
  language: 'fr',
  ...input,
});

const UserConsumer = () => {
  const { user, isLoading, updateUser } = useUser();

  return (
    <>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="user">{user?.username ?? 'none'}</span>
      <button type="button" onClick={() => updateUser(profile({ username: 'grace' }))}>
        Update user
      </button>
    </>
  );
};

const renderUser = (children: ReactNode = <UserConsumer />) =>
  render(<UserProvider>{children}</UserProvider>);

describe('UserProvider', () => {
  beforeEach(() => {
    mocks.getMe.mockReset();
    mocks.getAccessToken.mockReset();
    mocks.setTheme.mockReset();
    mocks.changeLanguage.mockReset();
    mocks.isAuthenticated = false;
  });

  it('does not load a profile when unauthenticated', () => {
    mocks.isAuthenticated = false;
    mocks.getAccessToken.mockReturnValue(null);

    renderUser();

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(mocks.getMe).not.toHaveBeenCalled();
  });

  it('exposes inert defaults when used without a provider', () => {
    render(<UserConsumer />);

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('user')).toHaveTextContent('none');

    act(() => {
      screen.getByRole('button', { name: 'Update user' }).click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });

  it('loads the authenticated profile and applies language and theme preferences', async () => {
    mocks.isAuthenticated = true;
    mocks.getAccessToken.mockReturnValue('access-token');
    mocks.getMe.mockResolvedValueOnce(profile());

    renderUser();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'));

    expect(mocks.changeLanguage).toHaveBeenCalledWith('fr');
    expect(mocks.setTheme).toHaveBeenCalledWith('dim');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('ignores unsupported theme values and allows updating the profile state', async () => {
    mocks.isAuthenticated = true;
    mocks.getAccessToken.mockReturnValue('access-token');
    mocks.getMe.mockResolvedValueOnce(profile({ theme: 'unknown', language: null }));

    renderUser();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('ada'));
    expect(mocks.changeLanguage).not.toHaveBeenCalled();
    expect(mocks.setTheme).not.toHaveBeenCalled();

    act(() => {
      screen.getByRole('button', { name: 'Update user' }).click();
    });

    expect(screen.getByTestId('user')).toHaveTextContent('grace');
  });

  it('stores null when profile loading fails', async () => {
    mocks.isAuthenticated = true;
    mocks.getAccessToken.mockReturnValue('access-token');
    mocks.getMe.mockRejectedValueOnce(new Error('network'));

    renderUser();

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('user')).toHaveTextContent('none');
  });
});
