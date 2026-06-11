import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MessageAttachmentImage } from './MessageAttachmentImage';
import type { MessageAttachment } from '@/types/channel';

const useFileBlobUrlMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: useFileBlobUrlMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => `translated:${key}`,
  }),
}));

vi.mock('@harmonie/ui', async () => {
  const actual = await vi.importActual<typeof import('@harmonie/ui')>('@harmonie/ui');
  return {
    ...actual,
    AttachmentImage: ({
      src,
      alt,
      onOpen,
      openLabel,
      topRightAction,
      imageDataAttributes,
    }: {
      src?: string;
      alt: string;
      onOpen: () => void;
      openLabel: string;
      topRightAction?: ReactNode;
      imageDataAttributes?: Record<`data-${string}`, string>;
    }) => (
      <div>
        <img alt={alt} src={src || undefined} {...imageDataAttributes} />
        <button type="button" onClick={onOpen}>
          {openLabel}
        </button>
        {topRightAction}
      </div>
    ),
  };
});

const attachment = (input: Partial<MessageAttachment> = {}): MessageAttachment => ({
  fileId: 'file-1',
  fileName: 'image.png',
  contentType: 'image/png',
  sizeBytes: 1024,
  ...input,
});

describe('MessageAttachmentImage', () => {
  it('opens image lightbox with attachment metadata', async () => {
    useFileBlobUrlMock.mockReturnValue('blob:image');
    const onOpenLightbox = vi.fn();

    render(
      <MessageAttachmentImage
        attachment={attachment()}
        isOwn={false}
        createdAtUtc="2024-01-01T00:00:00.000Z"
        onOpenLightbox={onOpenLightbox}
      />
    );

    expect(screen.getByRole('img', { name: 'image.png' })).toHaveAttribute('src', 'blob:image');
    expect(screen.getByRole('img', { name: 'image.png' })).toHaveAttribute(
      'data-message-attachment-file-id',
      'file-1'
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'translated:channel.messages.openImage' })
    );

    expect(onOpenLightbox).toHaveBeenCalledWith({
      fileId: 'file-1',
      fileName: 'image.png',
      member: undefined,
      createdAtUtc: '2024-01-01T00:00:00.000Z',
    });
  });

  it('shows the delete action for own images', async () => {
    const onDeleteRequest = vi.fn();

    render(
      <MessageAttachmentImage
        attachment={attachment()}
        isOwn
        createdAtUtc="2024-01-01T00:00:00.000Z"
        onOpenLightbox={vi.fn()}
        onDeleteRequest={onDeleteRequest}
      />
    );

    await userEvent.click(
      screen.getByRole('button', { name: 'translated:channel.messages.deleteAttachment' })
    );

    expect(onDeleteRequest).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'file-1' }));
  });
});
