import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageAttachmentLightbox } from './MessageAttachmentLightbox';

const downloadState = vi.hoisted(() => ({
  download: vi.fn(),
  downloading: false,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'fr' },
    t: (key: string) => key,
  }),
}));

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    alt,
    avatarUrl,
    bg,
    color,
    icon,
  }: {
    alt: string;
    avatarUrl: string | null;
    bg: string;
    color: string;
    icon: string;
  }) => (
    <span
      data-alt={alt}
      data-avatar-url={avatarUrl ?? ''}
      data-bg={bg}
      data-color={color}
      data-icon={icon}
      data-testid="lightbox-avatar"
    />
  ),
  Lightbox: ({
    alt,
    closeLabel,
    headerActions,
    headerLeft,
    onClose,
    src,
    zoomInLabel,
    zoomOutLabel,
  }: {
    alt: string;
    closeLabel: string;
    headerActions: ReactNode;
    headerLeft: ReactNode;
    onClose: () => void;
    src: string | null;
    zoomInLabel: string;
    zoomOutLabel: string;
  }) => (
    <div
      role="dialog"
      aria-label={alt}
      data-close-label={closeLabel}
      data-src={src ?? ''}
      data-zoom-in-label={zoomInLabel}
      data-zoom-out-label={zoomOutLabel}
    >
      {headerLeft}
      {headerActions}
      <button type="button" onClick={onClose}>
        close
      </button>
    </div>
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/shared/hooks/useFileDownload', () => ({
  useFileDownload: () => downloadState,
}));

vi.mock('@/shared/utils/date', () => ({
  formatContextualDateTime: (date: string, language: string) => `${language}:${date}`,
}));

describe('MessageAttachmentLightbox', () => {
  beforeEach(() => {
    downloadState.download.mockClear();
    downloadState.downloading = false;
  });

  it('renders member metadata and downloads the file', async () => {
    const onClose = vi.fn();

    render(
      <MessageAttachmentLightbox
        fileId="file-1"
        fileName="photo.png"
        createdAtUtc="2026-01-01T00:00:00.000Z"
        member={{
          userId: 'user-1',
          username: 'alice',
          displayName: 'Alice',
          avatarFileId: 'avatar-1',
          avatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
        }}
        onClose={onClose}
      />
    );

    expect(screen.getByRole('dialog', { name: 'photo.png' })).toHaveAttribute(
      'data-src',
      'blob:file-1'
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('fr:2026-01-01T00:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute(
      'data-avatar-url',
      'blob:avatar-1'
    );
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute('data-icon', 'Rocket');

    await userEvent.click(screen.getByRole('button', { name: 'channel.messages.download' }));
    await userEvent.click(screen.getByRole('button', { name: 'close' }));

    expect(downloadState.download).toHaveBeenCalledWith('file-1', 'photo.png');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses fallback member metadata and disables download while downloading', () => {
    downloadState.downloading = true;

    render(
      <MessageAttachmentLightbox
        fileId="file-2"
        fileName="missing.png"
        createdAtUtc="2026-01-02T00:00:00.000Z"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('channel.messages.memberNotFound')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute('data-icon', 'User');
    expect(screen.getByRole('button', { name: 'channel.messages.download' })).toBeDisabled();
  });

  it('falls back to username and default member avatar appearance', () => {
    render(
      <MessageAttachmentLightbox
        fileId="file-3"
        fileName="archive.zip"
        createdAtUtc="2026-01-03T00:00:00.000Z"
        member={{
          userId: 'user-2',
          username: 'fallback-user',
          displayName: null,
          avatarFileId: null,
          avatar: null,
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('fallback-user')).toBeInTheDocument();
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute('data-avatar-url', '');
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute('data-icon', 'PawPrint');
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute(
      'data-color',
      'var(--color-cat-1-fg)'
    );
    expect(screen.getByTestId('lightbox-avatar')).toHaveAttribute('data-bg', 'var(--color-cat-1)');
  });
});
