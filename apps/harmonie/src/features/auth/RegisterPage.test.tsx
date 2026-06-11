import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterPage } from './RegisterPage';

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  register: vi.fn(),
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
  register: mocks.register,
}));

vi.mock('@/api/authStorage', () => ({
  storeTokens: mocks.storeTokens,
}));

vi.mock('@/shared/utils/colors', async () => {
  const actual =
    await vi.importActual<typeof import('@/shared/utils/colors')>('@/shared/utils/colors');
  return {
    ...actual,
    resolveColor: (value: string) => `resolved:${value}`,
  };
});

vi.mock('./AuthContext', () => ({
  useAuth: () => ({ setIsAuthenticated: mocks.setIsAuthenticated }),
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );

const fillValidForm = async () => {
  await userEvent.type(screen.getByLabelText('auth.username'), 'ada');
  await userEvent.type(screen.getByLabelText('auth.email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText('auth.password'), 'Password1!');
};

const passwordToggle = (passwordInput: HTMLElement) => {
  const button = passwordInput.parentElement?.querySelector('button');
  if (!button) throw new Error('Password toggle button not found');
  return button;
};

describe('RegisterPage', () => {
  beforeEach(() => {
    mocks.navigate.mockReset();
    mocks.register.mockReset();
    mocks.setIsAuthenticated.mockReset();
    mocks.storeTokens.mockReset();
  });

  it('validates email and password fields before enabling submission', async () => {
    renderPage();

    const submit = screen.getByRole('button', { name: 'auth.joinButton' });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByLabelText('auth.email'), 'bad-email');
    await userEvent.tab();
    expect(screen.getByText('auth.errors.emailInvalid')).toBeInTheDocument();

    const passwordInput = screen.getByLabelText('auth.password');
    await userEvent.type(passwordInput, 'short');
    await userEvent.tab();
    expect(screen.getByText('auth.errors.passwordInvalid')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('auth.username'), 'ada');
    await userEvent.clear(screen.getByLabelText('auth.email'));
    await userEvent.type(screen.getByLabelText('auth.email'), 'ada@example.com');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'Password1!');
    await userEvent.tab();

    expect(screen.queryByText('auth.errors.emailInvalid')).not.toBeInTheDocument();
    expect(screen.queryByText('auth.errors.passwordInvalid')).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });

  it('registers, stores tokens, authenticates, and navigates home', async () => {
    mocks.register.mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    renderPage();

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'auth.joinButton' }));

    await waitFor(() =>
      expect(mocks.register).toHaveBeenCalledWith({
        email: 'ada@example.com',
        username: 'ada',
        password: 'Password1!',
        avatar: {
          icon: 'PawPrint',
          color: expect.stringMatching(/^resolved:/),
          bg: expect.stringMatching(/^resolved:/),
        },
        theme: 'default',
      })
    );
    expect(mocks.storeTokens).toHaveBeenCalledWith({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(mocks.setIsAuthenticated).toHaveBeenCalledWith(true);
    expect(mocks.navigate).toHaveBeenCalledWith('/');
  });

  it('toggles password visibility', async () => {
    renderPage();

    const passwordInput = screen.getByLabelText('auth.password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await userEvent.click(passwordToggle(passwordInput));

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it.each([
    ['AUTH_DUPLICATE_EMAIL', 'auth.errors.duplicateEmail'],
    ['AUTH_DUPLICATE_USERNAME', 'auth.errors.duplicateUsername'],
    ['SOMETHING_ELSE', 'auth.errors.genericError'],
  ])('shows the mapped API error for %s', async (code, errorKey) => {
    mocks.register.mockRejectedValueOnce({ code });
    renderPage();

    await fillValidForm();
    await userEvent.click(screen.getByRole('button', { name: 'auth.joinButton' }));

    expect(await screen.findByText(errorKey)).toBeInTheDocument();
    expect(mocks.storeTokens).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
