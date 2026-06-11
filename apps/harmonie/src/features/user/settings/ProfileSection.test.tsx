import { fireEvent, render, screen } from '@testing-library/react';
import type { ChangeEvent, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/types/user';
import { ProfileSection } from './ProfileSection';

const patchMe = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
  Input: ({
    disabled,
    error,
    label,
    maxLength,
    onChange,
    placeholder,
    value,
  }: {
    disabled?: boolean;
    error?: string;
    label: string;
    maxLength?: number;
    onChange: (event: ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    value: string;
  }) => (
    <input
      aria-label={label}
      data-error={error ?? ''}
      disabled={disabled}
      maxLength={maxLength}
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
  ),
  PlainEmojiTextarea: ({
    disabled,
    label,
    maxLength,
    onChange,
    placeholder,
    rows,
    value,
  }: {
    disabled?: boolean;
    label: string;
    maxLength?: number;
    onChange: (value: string) => void;
    placeholder: string;
    rows?: number;
    value: string;
  }) => (
    <textarea
      aria-label={label}
      disabled={disabled}
      maxLength={maxLength}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      value={value}
    />
  ),
}));

vi.mock('@/api/users', () => ({
  patchMe: (...args: unknown[]) => patchMe(...args),
}));

const user: UserProfile = {
  userId: 'user-1',
  username: 'alice',
  displayName: 'Alice',
  bio: 'Original bio',
  avatarFileId: null,
  avatar: { icon: 'PawPrint', color: '#111111', bg: '#eeeeee' },
  theme: 'default',
  language: 'fr',
};

describe('ProfileSection', () => {
  beforeEach(() => {
    patchMe.mockReset();
  });

  it('saves trimmed profile fields and updates the user', async () => {
    const updateUser = vi.fn();
    const updated = { ...user, displayName: 'Ada', bio: 'Build things' };
    patchMe.mockResolvedValue(updated);

    render(<ProfileSection user={user} updateUser={updateUser} />);

    expect(screen.getByRole('button', { name: 'settings.profile.save' })).toBeDisabled();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('488')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'settings.profile.displayNameLabel' }), {
      target: { value: ' Ada ' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'settings.profile.label' }), {
      target: { value: ' Build things ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'settings.profile.save' }));

    expect(patchMe).toHaveBeenCalledWith({
      displayName: 'Ada',
      bio: 'Build things',
    });
    expect(await screen.findByRole('button', { name: 'settings.profile.save' })).toBeDisabled();
    expect(updateUser).toHaveBeenCalledWith(updated);
  });

  it('saves blank fields as null, cancels dirty edits, and shows errors', async () => {
    const updateUser = vi.fn();
    patchMe.mockRejectedValueOnce(new Error('nope'));

    render(<ProfileSection user={user} updateUser={updateUser} />);

    const displayNameInput = screen.getByRole('textbox', {
      name: 'settings.profile.displayNameLabel',
    });
    const bioInput = screen.getByRole('textbox', { name: 'settings.profile.label' });

    fireEvent.change(displayNameInput, { target: { value: '   ' } });
    fireEvent.change(bioInput, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'settings.profile.save' }));

    expect(patchMe).toHaveBeenCalledWith({ displayName: null, bio: null });
    expect(
      await screen.findByRole('textbox', { name: 'settings.profile.displayNameLabel' })
    ).toHaveAttribute('data-error', 'settings.profile.error');

    fireEvent.change(displayNameInput, { target: { value: 'New name' } });
    fireEvent.click(screen.getByRole('button', { name: 'settings.profile.cancel' }));
    expect(screen.getByRole('textbox', { name: 'settings.profile.displayNameLabel' })).toHaveValue(
      'Alice'
    );
    expect(screen.getByRole('textbox', { name: 'settings.profile.label' })).toHaveValue(
      'Original bio'
    );
    expect(
      screen.getByRole('textbox', { name: 'settings.profile.displayNameLabel' })
    ).toHaveAttribute('data-error', '');
  });

  it('resynchronizes drafts when the parent user changes', () => {
    const { rerender } = render(<ProfileSection user={user} updateUser={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'settings.profile.displayNameLabel' }), {
      target: { value: 'Unsaved' },
    });

    rerender(
      <ProfileSection
        user={{ ...user, displayName: 'Server Name', bio: 'Server bio' }}
        updateUser={vi.fn()}
      />
    );

    expect(screen.getByRole('textbox', { name: 'settings.profile.displayNameLabel' })).toHaveValue(
      'Server Name'
    );
    expect(screen.getByRole('textbox', { name: 'settings.profile.label' })).toHaveValue(
      'Server bio'
    );
  });
});
