import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectPage } from './ConnectPage';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  navigate: vi.fn(),
  setIsAuthenticated: vi.fn(),
  storeTokens: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'fr', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock('@/api/auth', () => ({
  login: mocks.login,
}));

vi.mock('@/api/authStorage', () => ({
  storeTokens: mocks.storeTokens,
}));

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ setIsAuthenticated: mocks.setIsAuthenticated }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ConnectPage />
    </MemoryRouter>
  );

const fillPassword = async (password = 'super-secret') => {
  const passwordInput = screen.getByLabelText('auth.password');
  await userEvent.clear(passwordInput);
  await userEvent.type(passwordInput, password);
  return passwordInput;
};

const passwordToggle = (passwordInput: HTMLElement) => {
  const button = passwordInput.parentElement?.querySelector('button');
  if (!button) throw new Error('Password toggle button not found');
  return button;
};

describe('ConnectPage', () => {
  beforeEach(() => {
    mocks.login.mockReset();
    mocks.navigate.mockReset();
    mocks.setIsAuthenticated.mockReset();
    mocks.storeTokens.mockReset();
  });

  it('validates email blur and prevents incomplete submissions', async () => {
    renderPage();

    const submit = screen.getByRole('button', { name: 'auth.signIn' });
    expect(submit).toBeDisabled();

    const emailInput = screen.getByLabelText('auth.email');
    await userEvent.type(emailInput, 'not-an-email');
    await userEvent.tab();

    expect(screen.getByText('auth.errors.emailInvalid')).toBeInTheDocument();
    expect(submit).toBeDisabled();
    expect(mocks.login).not.toHaveBeenCalled();

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'ada@example.com');
    await fillPassword();

    expect(screen.queryByText('auth.errors.emailInvalid')).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });

  it('logs in with username, stores tokens, authenticates, and navigates home', async () => {
    mocks.login.mockResolvedValueOnce({
      accessToken: 'access-token',
      expiresAt: '2100-01-01T00:00:00.000Z',
    });
    renderPage();

    await userEvent.type(screen.getByLabelText('auth.username'), ' ada ');
    await fillPassword('password-1');
    await userEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith({
        emailOrUsername: 'ada',
        password: 'password-1',
      })
    );
    expect(mocks.storeTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      expiresAt: '2100-01-01T00:00:00.000Z',
    });
    expect(mocks.setIsAuthenticated).toHaveBeenCalledWith(true);
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('logs in with email when username is empty and toggles password visibility', async () => {
    mocks.login.mockResolvedValueOnce({
      accessToken: 'access-token',
      expiresAt: '2100-01-01T00:00:00.000Z',
    });
    renderPage();

    const passwordInput = await fillPassword('password-1');
    expect(passwordInput).toHaveAttribute('type', 'password');
    await userEvent.click(passwordToggle(passwordInput));
    expect(passwordInput).toHaveAttribute('type', 'text');
    await userEvent.type(screen.getByLabelText('auth.email'), 'ada@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith({
        emailOrUsername: 'ada@example.com',
        password: 'password-1',
      })
    );
  });

  it.each([
    ['AUTH_INVALID_CREDENTIALS', 'auth.errors.invalidCredentials'],
    ['AUTH_USER_INACTIVE', 'auth.errors.userInactive'],
    ['SOMETHING_ELSE', 'auth.errors.genericError'],
  ])('shows the mapped API error for %s', async (code, errorKey) => {
    mocks.login.mockRejectedValueOnce({ code });
    renderPage();

    await userEvent.type(screen.getByLabelText('auth.username'), 'ada');
    await fillPassword();
    await userEvent.click(screen.getByRole('button', { name: 'auth.signIn' }));

    expect(await screen.findByText(errorKey)).toBeInTheDocument();
    expect(mocks.storeTokens).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
