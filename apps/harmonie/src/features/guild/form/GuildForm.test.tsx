import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildForm } from './GuildForm';
import type { Guild } from '@/types/guild';

const mocks = vi.hoisted(() => ({
  handleImageChange: vi.fn(),
  handleImageDelete: vi.fn(),
  handleSubmit: vi.fn((event: FormEvent) => event.preventDefault()),
  setError: vi.fn(),
  setIconBg: vi.fn(),
  setIconColor: vi.fn(),
  setName: vi.fn(),
  setSelectedIcon: vi.fn(),
  state: {
    effectiveRemoteLogoPreview: undefined as string | undefined,
    error: false,
    hasAnyImage: false,
    hasEditChanges: false,
    iconBg: '#ffffff',
    iconColor: '#111111',
    isLoading: false,
    logoPreview: undefined as string | undefined,
    name: '',
    selectedIcon: 'Leaf',
    trimmedName: '',
  },
  useGuildForm: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', async () => {
  const actual = await vi.importActual<typeof import('@harmonie/ui')>('@harmonie/ui');
  return {
    ...actual,
    EmojiInput: ({
      autoFocus,
      disabled,
      error,
      label,
      onChange,
      placeholder,
      value,
    }: {
      autoFocus?: boolean;
      disabled?: boolean;
      error?: string;
      label: string;
      onChange: (value: string) => void;
      placeholder: string;
      value: string;
    }) => (
      <label>
        {label}
        <input
          aria-label={label}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {error && <span>{error}</span>}
      </label>
    ),
  };
});

vi.mock('@/features/guild/form/useGuildForm', () => ({
  useGuildForm: mocks.useGuildForm,
}));

vi.mock('@/features/guild/form/GuildLogoPicker', () => ({
  GuildLogoPicker: ({
    hasAnyImage,
    onImageDelete,
    onSelectBg,
    onSelectColor,
    onSelectIcon,
    selectedIcon,
  }: {
    hasAnyImage: boolean;
    onImageDelete: () => void;
    onSelectBg: (bg: string) => void;
    onSelectColor: (color: string) => void;
    onSelectIcon: (icon: string) => void;
    selectedIcon: string;
  }) => (
    <div data-testid="logo-picker" data-has-image={String(hasAnyImage)}>
      <span>{selectedIcon}</span>
      <button type="button" onClick={() => onSelectIcon('Rocket')}>
        Pick icon
      </button>
      <button type="button" onClick={() => onSelectColor('#222222')}>
        Pick color
      </button>
      <button type="button" onClick={() => onSelectBg('#eeeeee')}>
        Pick bg
      </button>
      <button type="button" onClick={onImageDelete}>
        Delete image
      </button>
    </div>
  ),
}));

const guild = (input: Partial<Guild> = {}): Guild =>
  ({
    guildId: 'guild-1',
    name: 'Design',
    iconFileId: null,
    icon: null,
    isOwner: true,
    hasUnread: false,
    ...input,
  }) as Guild;

const setMockForm = (patch: Partial<typeof mocks.state> = {}) => {
  mocks.state = {
    effectiveRemoteLogoPreview: undefined,
    error: false,
    hasAnyImage: false,
    hasEditChanges: false,
    iconBg: '#ffffff',
    iconColor: '#111111',
    isLoading: false,
    logoPreview: undefined,
    name: '',
    selectedIcon: 'Leaf',
    trimmedName: '',
    ...patch,
  };
  mocks.useGuildForm.mockReturnValue({
    ...mocks.state,
    fileInputRef: { current: null },
    handleImageChange: mocks.handleImageChange,
    handleImageDelete: mocks.handleImageDelete,
    handleSubmit: mocks.handleSubmit,
    setError: mocks.setError,
    setIconBg: mocks.setIconBg,
    setIconColor: mocks.setIconColor,
    setName: mocks.setName,
    setSelectedIcon: mocks.setSelectedIcon,
  });
};

describe('GuildForm', () => {
  beforeEach(() => {
    mocks.handleImageChange.mockReset();
    mocks.handleImageDelete.mockReset();
    mocks.handleSubmit.mockClear();
    mocks.setError.mockReset();
    mocks.setIconBg.mockReset();
    mocks.setIconColor.mockReset();
    mocks.setName.mockReset();
    mocks.setSelectedIcon.mockReset();
    mocks.useGuildForm.mockReset();
    setMockForm();
  });

  it('renders create mode and delegates input, logo, and submit actions', async () => {
    render(<GuildForm autoFocus onSuccess={vi.fn()} />);

    const nameInput = screen.getByLabelText('guild.noGuild.nameLabel');
    expect(nameInput).toHaveAttribute('placeholder', 'guild.noGuild.namePlaceholder');
    expect(screen.getByRole('button', { name: 'guild.noGuild.createButton' })).toBeDisabled();

    await userEvent.type(nameInput, 'A');
    await userEvent.click(screen.getByRole('button', { name: 'Pick icon' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pick color' }));
    await userEvent.click(screen.getByRole('button', { name: 'Pick bg' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete image' }));

    expect(mocks.setName).toHaveBeenCalledWith('A');
    expect(mocks.setError).toHaveBeenCalledWith(false);
    expect(mocks.setSelectedIcon).toHaveBeenCalledWith('Rocket');
    expect(mocks.setIconColor).toHaveBeenCalledWith('#222222');
    expect(mocks.setIconBg).toHaveBeenCalledWith('#eeeeee');
    expect(mocks.handleImageDelete).toHaveBeenCalledTimes(1);
  });

  it('renders edit mode with cancel, error text, and enabled submit when changed', async () => {
    const onCancel = vi.fn();
    const onUpdated = vi.fn();
    setMockForm({
      error: true,
      hasAnyImage: true,
      hasEditChanges: true,
      name: 'Design',
      trimmedName: 'Design',
    });

    render(<GuildForm mode="edit" guild={guild()} onCancel={onCancel} onUpdated={onUpdated} />);

    expect(mocks.useGuildForm).toHaveBeenCalledWith({
      guild: expect.objectContaining({ guildId: 'guild-1' }),
      mode: 'edit',
      onSuccess: undefined,
      onUpdated,
    });
    expect(screen.getByText('guild.edit.error')).toBeInTheDocument();
    expect(screen.getByTestId('logo-picker')).toHaveAttribute('data-has-image', 'true');
    expect(screen.getByRole('button', { name: 'guild.edit.save' })).toBeEnabled();

    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits when the form is valid and enabled', async () => {
    setMockForm({ hasEditChanges: true, trimmedName: 'Design' });
    render(<GuildForm mode="edit" guild={guild()} />);

    await userEvent.click(screen.getByRole('button', { name: 'guild.edit.save' }));

    expect(mocks.handleSubmit).toHaveBeenCalledTimes(1);
  });
});
