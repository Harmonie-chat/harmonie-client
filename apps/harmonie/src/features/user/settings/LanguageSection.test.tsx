import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageSection } from './LanguageSection';

const mocks = vi.hoisted(() => ({
  changeLanguage: vi.fn(),
  language: 'fr',
  patchMe: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/i18n', () => ({
  default: {
    get language() {
      return mocks.language;
    },
    changeLanguage: mocks.changeLanguage,
  },
}));

vi.mock('@harmonie/ui', async () => {
  const actual = await vi.importActual<typeof import('@harmonie/ui')>('@harmonie/ui');
  return {
    ...actual,
    RadioCard: ({
      checked,
      children,
      disabled,
      name,
      onChange,
      value,
    }: {
      checked: boolean;
      children: ReactNode;
      disabled?: boolean;
      name: string;
      onChange?: (value: string) => void;
      value: string;
    }) => (
      <label>
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onChange?.(value)}
        />
        {children}
      </label>
    ),
  };
});

vi.mock('@/api/users', () => ({
  patchMe: mocks.patchMe,
}));

describe('LanguageSection', () => {
  beforeEach(() => {
    mocks.changeLanguage.mockReset();
    mocks.changeLanguage.mockImplementation(async (language: string) => {
      mocks.language = language;
    });
    mocks.language = 'fr';
    mocks.patchMe.mockReset();
  });

  it('renders languages and persists the selected language', async () => {
    const updateUser = vi.fn();
    const updatedUser = { userId: 'user-1', language: 'en' };
    mocks.patchMe.mockResolvedValueOnce(updatedUser);

    render(<LanguageSection updateUser={updateUser} />);

    expect(screen.getByText('settings.language.label')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Français' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    expect(mocks.changeLanguage).toHaveBeenCalledWith('en');
    expect(mocks.patchMe).toHaveBeenCalledWith({ language: 'en' });
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(updatedUser));
  });

  it('rolls back the i18n language when the profile update fails', async () => {
    const updateUser = vi.fn();
    mocks.language = 'fr-FR';
    mocks.patchMe.mockRejectedValueOnce(new Error('network'));

    render(<LanguageSection updateUser={updateUser} />);

    await userEvent.click(screen.getByRole('radio', { name: 'English' }));

    await waitFor(() => expect(mocks.changeLanguage).toHaveBeenLastCalledWith('fr-FR'));
    expect(updateUser).not.toHaveBeenCalled();
  });
});
