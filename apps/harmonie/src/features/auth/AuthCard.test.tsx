import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthCard } from './AuthCard';

const changeLanguageMock = vi.hoisted(() => vi.fn());

vi.mock('@harmonie/ui', async () => {
  const actual = await vi.importActual<typeof import('@harmonie/ui')>('@harmonie/ui');
  return {
    ...actual,
    LanguageSelector: ({ currentLang }: { currentLang: string }) => (
      <button type="button">Language {currentLang}</button>
    ),
  };
});

vi.mock('react-i18next', () => ({
  Trans: ({ i18nKey }: { i18nKey: string }) => <span>{`translated:${i18nKey}`}</span>,
  useTranslation: () => ({
    t: (key: string) => `translated:${key}`,
    i18n: {
      language: 'fr',
      changeLanguage: changeLanguageMock,
    },
  }),
}));

describe('AuthCard', () => {
  it('renders branding, language selector, title, and children', () => {
    render(
      <AuthCard title="Sign in">
        <form aria-label="Auth form">Form content</form>
      </AuthCard>
    );

    expect(screen.getByText('translated:app.name')).toBeInTheDocument();
    expect(screen.getByText('translated:auth.tagline')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language fr' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Auth form' })).toBeInTheDocument();
  });
});
