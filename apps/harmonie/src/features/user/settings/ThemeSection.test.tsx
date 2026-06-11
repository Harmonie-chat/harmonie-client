import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeSection } from './ThemeSection';

const mocks = vi.hoisted(() => ({
  patchMe: vi.fn(),
  setTheme: vi.fn(),
  theme: 'default',
  updateUser: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
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

vi.mock('../ThemeContext', () => ({
  THEMES: ['default', 'dim'],
  useTheme: () => ({ theme: mocks.theme, setTheme: mocks.setTheme }),
}));

vi.mock('../UserContext', () => ({
  useUser: () => ({ updateUser: mocks.updateUser }),
}));

describe('ThemeSection', () => {
  beforeEach(() => {
    mocks.patchMe.mockReset();
    mocks.setTheme.mockReset();
    mocks.theme = 'default';
    mocks.updateUser.mockReset();
  });

  it('renders theme choices and persists selected theme', async () => {
    const updatedUser = { userId: 'user-1', theme: 'dim' };
    mocks.patchMe.mockResolvedValueOnce(updatedUser);

    render(<ThemeSection />);

    expect(screen.getByText('settings.theme.label')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'settings.theme.default' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'settings.theme.dim' }));

    expect(mocks.setTheme).toHaveBeenCalledWith('dim');
    expect(mocks.patchMe).toHaveBeenCalledWith({ theme: 'dim' });
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith(updatedUser));
  });
});
