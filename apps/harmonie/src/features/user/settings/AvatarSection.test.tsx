import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ChangeEvent, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserProfile } from '@/types/user';
import { AvatarSection } from './AvatarSection';

const apiMocks = vi.hoisted(() => ({
  patchMe: vi.fn(),
  removeAvatarImage: vi.fn(),
  uploadAvatarImage: vi.fn(),
}));

const imageDraft = vi.hoisted(() => ({
  file: null as File | null,
  previewUrl: undefined as string | undefined,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('lucide-react', () => ({
  Upload: ({ size }: { size?: number }) => <span data-testid="upload-icon">{size}</span>,
}));

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    bg,
    color,
    icon,
    size,
  }: {
    bg?: string;
    color?: string;
    icon?: string;
    size?: number;
  }) => (
    <div data-testid="avatar" data-bg={bg} data-color={color} data-icon={icon} data-size={size} />
  ),
  Button: ({
    children,
    disabled,
    onClick,
  }: {
    children: ReactNode;
    disabled?: boolean;
    onClick?: () => void;
    variant?: string;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

vi.mock('@/api/users', () => ({
  patchMe: apiMocks.patchMe,
  removeAvatarImage: apiMocks.removeAvatarImage,
  uploadAvatarImage: apiMocks.uploadAvatarImage,
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : undefined),
}));

vi.mock('@/shared/hooks/useIconAppearancePalette', () => ({
  useIconAppearancePalette: () => ({
    defaultBgColor: '#eeeeee',
    defaultIconColor: '#111111',
  }),
}));

vi.mock('@/shared/hooks/useImageFileDraft', () => ({
  useImageFileDraft: () => ({
    inputRef: { current: null },
    file: imageDraft.file,
    previewUrl: imageDraft.previewUrl,
    onFileChange: (event: ChangeEvent<HTMLInputElement>) => {
      imageDraft.file = event.target.files?.[0] ?? null;
      imageDraft.previewUrl = imageDraft.file ? 'blob:local-preview' : undefined;
    },
    clear: () => {
      imageDraft.file = null;
      imageDraft.previewUrl = undefined;
    },
  }),
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
    onSelectBg: (value: string) => void;
    onSelectColor: (value: string) => void;
    onSelectIcon: (value: string) => void;
    selectedBg: string;
    selectedColor: string;
    selectedIcon: string;
  }) => (
    <div
      data-testid="appearance-editor"
      data-bg={selectedBg}
      data-color={selectedColor}
      data-disabled={disabled ? 'true' : 'false'}
      data-icon={selectedIcon}
    >
      <button type="button" disabled={disabled} onClick={() => onSelectIcon('Sparkles')}>
        select icon
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelectColor('#222222')}>
        select color
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelectBg('#dddddd')}>
        select bg
      </button>
    </div>
  ),
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

describe('AvatarSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageDraft.file = null;
    imageDraft.previewUrl = undefined;
  });

  it('saves icon appearance changes and can reset dirty edits', async () => {
    const updateUser = vi.fn();
    const updatedUser = {
      ...user,
      avatarFileId: undefined,
      avatar: { icon: 'PawPrint', color: '#111111', bg: '#dddddd' },
    };
    apiMocks.patchMe.mockResolvedValueOnce(updatedUser);

    const { container } = render(<AvatarSection user={user} updateUser={updateUser} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const inputClick = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    expect(screen.getByRole('button', { name: 'settings.avatar.save' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.change' }));
    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.uploadButton' }));

    fireEvent.click(screen.getByRole('button', { name: 'select icon' }));
    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-icon', 'Sparkles');
    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.cancel' }));

    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.getByRole('button', { name: 'settings.avatar.save' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'select bg' }));
    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.save' }));

    await waitFor(() =>
      expect(apiMocks.patchMe).toHaveBeenCalledWith({
        avatar: { icon: 'PawPrint', color: '#111111', bg: '#dddddd' },
      })
    );
    expect(updateUser).toHaveBeenCalledWith(updatedUser);
    expect(apiMocks.uploadAvatarImage).not.toHaveBeenCalled();
    expect(apiMocks.removeAvatarImage).not.toHaveBeenCalled();
    expect(inputClick).toHaveBeenCalledTimes(2);
  });

  it('saves icon color changes with palette defaults when no avatar is configured', async () => {
    const updateUser = vi.fn();
    const defaultUser = { ...user, avatar: undefined };
    const updatedUser = {
      ...defaultUser,
      avatar: { icon: 'PawPrint', color: '#222222', bg: '#eeeeee' },
    };
    apiMocks.patchMe.mockResolvedValueOnce(updatedUser);

    render(<AvatarSection user={defaultUser} updateUser={updateUser} />);

    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-color', '#111111');
    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-bg', '#eeeeee');

    fireEvent.click(screen.getByRole('button', { name: 'select color' }));
    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.save' }));

    await waitFor(() =>
      expect(apiMocks.patchMe).toHaveBeenCalledWith({
        avatar: { icon: 'PawPrint', color: '#222222', bg: '#eeeeee' },
      })
    );
    expect(updateUser).toHaveBeenCalledWith({ ...updatedUser, avatarFileId: undefined });
  });

  it('uploads a local image draft and updates the avatar file id', async () => {
    const updateUser = vi.fn();
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    apiMocks.uploadAvatarImage.mockResolvedValueOnce({ avatarFileId: 'avatar-new' });

    const { container } = render(<AvatarSection user={user} updateUser={updateUser} />);
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeInstanceOf(HTMLInputElement);

    fireEvent.change(input as HTMLInputElement, { target: { files: [file] } });

    expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', 'blob:local-preview');
    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-disabled', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.save' }));

    await waitFor(() => expect(apiMocks.uploadAvatarImage).toHaveBeenCalledWith(file));
    expect(updateUser).toHaveBeenCalledWith({ ...user, avatarFileId: 'avatar-new' });
    expect(apiMocks.patchMe).not.toHaveBeenCalled();
  });

  it('can discard a local image draft and upload without a loaded user', async () => {
    const updateUser = vi.fn();
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    apiMocks.uploadAvatarImage.mockResolvedValueOnce({ avatarFileId: 'avatar-new' });

    const { container } = render(<AvatarSection user={null} updateUser={updateUser} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', 'blob:local-preview');

    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.deleteImage' }));
    expect(screen.queryByAltText('Avatar preview')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.avatar.save' })).toBeDisabled();

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.save' }));

    await waitFor(() => expect(apiMocks.uploadAvatarImage).toHaveBeenCalledWith(file));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('marks an existing image for deletion and persists the removal', async () => {
    const updateUser = vi.fn();
    const imageUser = { ...user, avatarFileId: 'avatar-current' };
    apiMocks.removeAvatarImage.mockResolvedValueOnce(undefined);

    const { container } = render(<AvatarSection user={imageUser} updateUser={updateUser} />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const inputClick = vi.spyOn(fileInput, 'click').mockImplementation(() => {});

    expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', 'blob:avatar-current');
    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-disabled', 'true');

    screen
      .getAllByRole('button', { name: 'settings.avatar.change' })
      .forEach((button) => fireEvent.click(button));

    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.deleteImage' }));

    expect(screen.queryByAltText('Avatar preview')).not.toBeInTheDocument();
    expect(screen.getByTestId('appearance-editor')).toHaveAttribute('data-disabled', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'settings.avatar.save' }));

    await waitFor(() => expect(apiMocks.removeAvatarImage).toHaveBeenCalledTimes(1));
    expect(updateUser).toHaveBeenCalledWith({ ...imageUser, avatarFileId: undefined });
    expect(apiMocks.patchMe).not.toHaveBeenCalled();
    expect(inputClick).toHaveBeenCalledTimes(2);
  });
});
