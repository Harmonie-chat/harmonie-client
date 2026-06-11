import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuildLogoPicker } from './GuildLogoPicker';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  GuildAvatar: ({
    alt,
    bg,
    color,
    icon,
    iconUrl,
    size,
  }: {
    alt: string;
    bg: string;
    color: string;
    icon: string;
    iconUrl?: string;
    size: number;
  }) => (
    <span
      data-alt={alt}
      data-bg={bg}
      data-color={color}
      data-icon={icon}
      data-icon-url={iconUrl ?? ''}
      data-size={size}
      data-testid="guild-avatar"
    />
  ),
}));

vi.mock('@/shared/components/IconAppearanceEditor', () => ({
  IconAppearanceEditor: ({
    disabled,
    onSelectBg,
    onSelectColor,
    onSelectIcon,
    selectedBg,
    selectedColor,
    selectedIcon,
  }: {
    disabled?: boolean;
    onSelectBg: (bg: string) => void;
    onSelectColor: (color: string) => void;
    onSelectIcon: (icon: string) => void;
    selectedBg: string;
    selectedColor: string;
    selectedIcon: string;
  }) => (
    <div
      data-bg={selectedBg}
      data-color={selectedColor}
      data-disabled={String(disabled)}
      data-icon={selectedIcon}
      data-testid="icon-editor"
    >
      <button type="button" disabled={disabled} onClick={() => onSelectIcon('Rocket')}>
        Select icon
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelectColor('#222222')}>
        Select color
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelectBg('#eeeeee')}>
        Select bg
      </button>
    </div>
  ),
}));

const renderPicker = (
  props: Partial<Parameters<typeof GuildLogoPicker>[0]> = {},
  ref: RefObject<HTMLInputElement | null> = { current: null }
) => {
  const onImageChange = vi.fn();
  const onImageDelete = vi.fn();
  const onSelectBg = vi.fn();
  const onSelectColor = vi.fn();
  const onSelectIcon = vi.fn();

  render(
    <GuildLogoPicker
      fileInputRef={ref}
      logoPreview={undefined}
      effectiveRemoteLogoPreview={undefined}
      isLoading={false}
      name="Design"
      selectedIcon="Leaf"
      onSelectIcon={onSelectIcon}
      iconColor="#111111"
      onSelectColor={onSelectColor}
      iconBg="#ffffff"
      onSelectBg={onSelectBg}
      hasAnyImage={false}
      onImageChange={onImageChange}
      onImageDelete={onImageDelete}
      {...props}
    />
  );

  return { onImageChange, onImageDelete, onSelectBg, onSelectColor, onSelectIcon };
};

describe('GuildLogoPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an icon preview and forwards icon appearance selections', async () => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    const { onSelectBg, onSelectColor, onSelectIcon } = renderPicker();

    expect(screen.getByTestId('guild-avatar')).toHaveAttribute('data-alt', 'Design');
    expect(screen.getByTestId('guild-avatar')).toHaveAttribute('data-icon', 'Leaf');
    expect(screen.getByTestId('icon-editor')).toHaveAttribute('data-disabled', 'false');

    const uploadButtons = screen.getAllByRole('button', {
      name: 'guild.noGuild.logoUploadButton',
    });
    await userEvent.click(uploadButtons[0]);
    await userEvent.click(uploadButtons[1]);
    await userEvent.click(screen.getByRole('button', { name: 'Select icon' }));
    await userEvent.click(screen.getByRole('button', { name: 'Select color' }));
    await userEvent.click(screen.getByRole('button', { name: 'Select bg' }));

    expect(inputClick).toHaveBeenCalledTimes(2);
    expect(onSelectIcon).toHaveBeenCalledWith('Rocket');
    expect(onSelectColor).toHaveBeenCalledWith('#222222');
    expect(onSelectBg).toHaveBeenCalledWith('#eeeeee');
  });

  it('renders a local image preview, forwards uploads, and allows image deletion', async () => {
    const { onImageChange, onImageDelete } = renderPicker({
      effectiveRemoteLogoPreview: 'blob:remote-logo',
      hasAnyImage: true,
      logoPreview: 'blob:logo',
    });

    expect(screen.getByRole('img', { name: 'guild.noGuild.logoPreview' })).toHaveAttribute(
      'src',
      'blob:logo'
    );
    expect(screen.getByTestId('icon-editor')).toHaveAttribute('data-disabled', 'true');

    const fileInput = screen.getAllByLabelText('guild.noGuild.logoUploadButton')[1];
    const file = new File(['logo'], 'logo.png', { type: 'image/png' });
    await userEvent.upload(fileInput, file);

    expect(onImageChange).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'guild.noGuild.logoDeleteImage' }));
    expect(onImageDelete).toHaveBeenCalledTimes(1);
  });

  it('uses the placeholder as icon fallback when no name is available', () => {
    renderPicker({ name: '' });

    expect(screen.getByTestId('guild-avatar')).toHaveAttribute(
      'data-alt',
      'guild.noGuild.namePlaceholder'
    );
  });

  it('falls back to the remote preview and disables upload controls while loading', () => {
    renderPicker({
      effectiveRemoteLogoPreview: 'blob:remote-logo',
      hasAnyImage: true,
      isLoading: true,
      name: '',
    });

    expect(screen.getByRole('img', { name: 'guild.noGuild.logoPreview' })).toHaveAttribute(
      'src',
      'blob:remote-logo'
    );
    expect(screen.getAllByLabelText('guild.noGuild.logoUploadButton')[0]).toBeDisabled();
    expect(screen.getByRole('button', { name: 'guild.noGuild.logoChange' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'guild.noGuild.logoDeleteImage' })).toBeDisabled();
    expect(screen.getByTestId('icon-editor')).toHaveAttribute('data-disabled', 'true');
  });

  it('disables icon controls while loading even without an image', () => {
    renderPicker({ isLoading: true });

    expect(screen.getByTestId('icon-editor')).toHaveAttribute('data-disabled', 'true');
    const uploadButtons = screen.getAllByRole('button', {
      name: 'guild.noGuild.logoUploadButton',
    });
    expect(uploadButtons).toHaveLength(2);
    expect(uploadButtons[0]).toBeDisabled();
    expect(uploadButtons[1]).toBeDisabled();
  });
});
