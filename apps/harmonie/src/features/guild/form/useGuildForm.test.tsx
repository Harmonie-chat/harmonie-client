import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChangeEvent, FormEvent, RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGuildForm } from './useGuildForm';
import type { Guild } from '@/types/guild';

const mocks = vi.hoisted(() => ({
  createGuild: vi.fn(),
  currentFile: null as File | null,
  fetchGuilds: vi.fn(),
  navigate: vi.fn(),
  updateGuild: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock('@/api/guilds', () => ({
  createGuild: mocks.createGuild,
  updateGuild: mocks.updateGuild,
}));

vi.mock('@/api/files', () => ({
  uploadFile: mocks.uploadFile,
}));

vi.mock('@/features/guild/GuildContext', () => ({
  useGuilds: () => ({ fetchGuilds: mocks.fetchGuilds }),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId: string | null | undefined) => (fileId ? `blob:${fileId}` : undefined),
}));

vi.mock('@/shared/hooks/useIconAppearancePalette', () => ({
  useIconAppearancePalette: () => ({
    defaultBgColor: '#ffffff',
    defaultIconColor: '#111111',
  }),
}));

vi.mock('@/shared/hooks/useImageFileDraft', () => ({
  useImageFileDraft: () => ({
    clear: vi.fn(() => {
      mocks.currentFile = null;
    }),
    file: mocks.currentFile,
    inputRef: { current: null } as RefObject<HTMLInputElement | null>,
    onFileChange: vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      mocks.currentFile = event.target.files?.[0] ?? null;
    }),
    previewUrl: mocks.currentFile ? 'blob:draft-logo' : undefined,
  }),
}));

const guild = (input: Partial<Guild> = {}): Guild =>
  ({
    guildId: 'guild-1',
    name: 'Design',
    iconFileId: null,
    icon: { name: 'Leaf', color: '#111111', bg: '#ffffff' },
    isOwner: true,
    hasUnread: false,
    ...input,
  }) as Guild;

const HookConsumer = ({
  guild: currentGuild,
  mode,
  onSuccess = vi.fn(),
  onUpdated = vi.fn(),
}: {
  guild?: Guild;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onUpdated?: (guild: Guild) => void;
}) => {
  const form = useGuildForm({ mode, guild: currentGuild, onSuccess, onUpdated });
  const submit = (event: FormEvent) => {
    void form.handleSubmit(event);
  };

  return (
    <form onSubmit={submit}>
      <span data-testid="name">{form.name}</span>
      <span data-testid="trimmed">{form.trimmedName}</span>
      <span data-testid="error">{String(form.error)}</span>
      <span data-testid="loading">{String(form.isLoading)}</span>
      <span data-testid="remote">{form.effectiveRemoteLogoPreview ?? 'none'}</span>
      <span data-testid="has-image">{String(form.hasAnyImage)}</span>
      <span data-testid="changed">{String(form.hasEditChanges)}</span>
      <button type="button" onClick={() => form.setName('  New Guild  ')}>
        Name
      </button>
      <button type="button" onClick={() => form.setName('Design')}>
        Same name
      </button>
      <button type="button" onClick={() => form.setName('No')}>
        Short name
      </button>
      <button type="button" onClick={() => form.setSelectedIcon('Rocket')}>
        Icon
      </button>
      <button type="button" onClick={() => form.setIconColor('#222222')}>
        Color
      </button>
      <button type="button" onClick={() => form.setIconBg('#eeeeee')}>
        Background
      </button>
      <button type="button" onClick={form.handleImageDelete}>
        Delete image
      </button>
      <label>
        Logo
        <input aria-label="Logo" type="file" onChange={form.handleImageChange} />
      </label>
      <button type="button" onClick={() => form.setError(false)}>
        Clear error
      </button>
      <button type="submit">Submit</button>
    </form>
  );
};

describe('useGuildForm', () => {
  beforeEach(() => {
    mocks.createGuild.mockReset();
    mocks.currentFile = null;
    mocks.fetchGuilds.mockReset();
    mocks.navigate.mockReset();
    mocks.updateGuild.mockReset();
    mocks.uploadFile.mockReset();
  });

  it('creates a guild with the selected icon and navigates to it', async () => {
    const onSuccess = vi.fn();
    mocks.createGuild.mockResolvedValueOnce(guild({ guildId: 'guild-2', name: 'New Guild' }));

    render(<HookConsumer mode="create" onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getByTestId('trimmed')).toHaveTextContent('New Guild');
    await userEvent.click(screen.getByRole('button', { name: 'Icon' }));
    await userEvent.click(screen.getByRole('button', { name: 'Color' }));
    await userEvent.click(screen.getByRole('button', { name: 'Background' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(mocks.createGuild).toHaveBeenCalledWith({
        name: 'New Guild',
        iconFileId: null,
        icon: { name: 'Rocket', color: '#222222', bg: '#eeeeee' },
      })
    );
    expect(mocks.fetchGuilds).toHaveBeenCalledTimes(1);
    expect(mocks.navigate).toHaveBeenCalledWith('/guilds/guild-2');
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('uploads a draft logo when creating a guild', async () => {
    mocks.currentFile = new File(['logo'], 'logo.png', { type: 'image/png' });
    mocks.uploadFile.mockResolvedValueOnce({ fileId: 'file-1' });
    mocks.createGuild.mockResolvedValueOnce(guild({ guildId: 'guild-2' }));

    render(<HookConsumer mode="create" />);

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    expect(screen.getByTestId('has-image')).toHaveTextContent('true');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalledWith(mocks.currentFile));
    expect(mocks.createGuild).toHaveBeenCalledWith(
      expect.objectContaining({
        iconFileId: 'file-1',
        icon: { name: null, color: null, bg: null },
      })
    );
  });

  it('does not submit short names and reports create failures', async () => {
    mocks.createGuild.mockRejectedValueOnce(new Error('network'));

    render(<HookConsumer mode="create" />);

    await userEvent.click(screen.getByRole('button', { name: 'Short name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(mocks.createGuild).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByTestId('error')).toHaveTextContent('true');
    await userEvent.click(screen.getByRole('button', { name: 'Clear error' }));
    expect(screen.getByTestId('error')).toHaveTextContent('false');
  });

  it('updates changed guild names and icon appearance', async () => {
    const onUpdated = vi.fn();
    const updatedGuild = guild({ name: 'New Guild' });
    mocks.updateGuild.mockResolvedValueOnce(updatedGuild);

    render(<HookConsumer mode="edit" guild={guild()} onUpdated={onUpdated} />);

    expect(screen.getByTestId('changed')).toHaveTextContent('false');
    await userEvent.click(screen.getByRole('button', { name: 'Name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Icon' }));
    expect(screen.getByTestId('changed')).toHaveTextContent('true');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(mocks.updateGuild).toHaveBeenCalledWith('guild-1', {
        name: 'New Guild',
        icon: { name: 'Rocket', color: '#111111', bg: '#ffffff' },
      })
    );
    expect(onUpdated).toHaveBeenCalledWith(updatedGuild);
  });

  it('uploads a draft logo when editing a guild', async () => {
    const onUpdated = vi.fn();
    const logo = new File(['logo'], 'logo.png', { type: 'image/png' });
    const updatedGuild = guild({ iconFileId: 'file-2' });
    mocks.currentFile = logo;
    mocks.uploadFile.mockResolvedValueOnce({ fileId: 'file-2' });
    mocks.updateGuild.mockResolvedValueOnce(updatedGuild);

    render(<HookConsumer mode="edit" guild={guild()} onUpdated={onUpdated} />);

    expect(screen.getByTestId('has-image')).toHaveTextContent('true');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalledWith(logo));
    expect(mocks.updateGuild).toHaveBeenCalledWith('guild-1', { iconFileId: 'file-2' });
    expect(onUpdated).toHaveBeenCalledWith(updatedGuild);
  });

  it('clears a pending logo deletion when a new image is selected', async () => {
    render(<HookConsumer mode="edit" guild={guild({ iconFileId: 'file-1' })} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete image' }));
    expect(screen.getByTestId('remote')).toHaveTextContent('none');

    await userEvent.upload(
      screen.getByLabelText('Logo'),
      new File(['new logo'], 'new-logo.png', { type: 'image/png' })
    );

    expect(screen.getByTestId('remote')).toHaveTextContent('blob:file-1');
  });

  it('skips edit submissions when nothing changed', async () => {
    render(<HookConsumer mode="edit" guild={guild()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Same name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mocks.updateGuild).not.toHaveBeenCalled();
  });

  it('removes remote logos and reports edit failures', async () => {
    mocks.updateGuild.mockRejectedValueOnce(new Error('network'));
    render(<HookConsumer mode="edit" guild={guild({ iconFileId: 'file-1' })} />);

    expect(screen.getByTestId('remote')).toHaveTextContent('blob:file-1');
    await userEvent.click(screen.getByRole('button', { name: 'Delete image' }));
    expect(screen.getByTestId('remote')).toHaveTextContent('none');
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() =>
      expect(mocks.updateGuild).toHaveBeenCalledWith('guild-1', { iconFileId: null })
    );
    expect(await screen.findByTestId('error')).toHaveTextContent('true');
  });
});
