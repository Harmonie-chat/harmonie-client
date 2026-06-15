import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from './SettingsPanel';

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  ModalPanel: ({
    children,
    closeLabel,
    onClose,
    sidebar,
    title,
  }: {
    children: ReactNode;
    closeLabel: string;
    onClose: () => void;
    sidebar: ReactNode;
    title: string;
  }) => (
    <section role="dialog" aria-label={title} data-close-label={closeLabel}>
      <aside>{sidebar}</aside>
      <button type="button" onClick={onClose}>
        close settings
      </button>
      {children}
    </section>
  ),
  NavList: ({ children }: { children: ReactNode }) => <nav>{children}</nav>,
  NavListItem: ({
    active,
    label,
    onClick,
  }: {
    active?: boolean;
    icon?: ReactNode;
    label: string;
    onClick: () => void;
  }) => (
    <button type="button" data-active={String(active)} onClick={onClick}>
      {label}
    </button>
  ),
  Separator: () => <hr />,
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ logout: mocks.logout }),
}));

vi.mock('@/features/user/UserContext', () => ({
  useUser: () => ({
    user: { userId: 'user-1', username: 'alice', theme: 'default', language: 'fr' },
    updateUser: mocks.updateUser,
  }),
}));

vi.mock('./ProfileSection', () => ({
  ProfileSection: () => <div>profile section</div>,
}));

vi.mock('./LanguageSection', () => ({
  LanguageSection: () => <div>language section</div>,
}));

vi.mock('./AvatarSection', () => ({
  AvatarSection: () => <div>avatar section</div>,
}));

vi.mock('./ThemeSection', () => ({
  ThemeSection: () => <div>theme section</div>,
}));

vi.mock('./NotificationsSection', () => ({
  NotificationsSection: () => <div>notifications section</div>,
}));

describe('SettingsPanel', () => {
  it('switches sections, closes, and logs out', () => {
    const onClose = vi.fn();
    render(<SettingsPanel onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'settings.profile.title' })).toHaveAttribute(
      'data-close-label',
      'settings.close'
    );
    expect(screen.getByText('profile section')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.nav.profile' })).toHaveAttribute(
      'data-active',
      'true'
    );

    fireEvent.click(screen.getByRole('button', { name: 'settings.nav.language' }));
    expect(screen.getByRole('dialog', { name: 'settings.language.title' })).toBeInTheDocument();
    expect(screen.getByText('language section')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'settings.nav.avatar' }));
    expect(screen.getByText('avatar section')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'settings.nav.theme' }));
    expect(screen.getByText('theme section')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'settings.nav.notifications' }));
    expect(screen.getByText('notifications section')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'user.logout' }));
    fireEvent.click(screen.getByRole('button', { name: 'close settings' }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
