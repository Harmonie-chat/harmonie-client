import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { MessageAttachment } from '@/types/channel';
import { MessageAttachments } from './MessageAttachments';

vi.mock('./MessageAttachmentImage', () => ({
  MessageAttachmentImage: ({
    attachment,
    onDeleteRequest,
    onOpenLightbox,
  }: {
    attachment: MessageAttachment;
    onDeleteRequest?: (attachment: MessageAttachment) => void;
    onOpenLightbox: (state: {
      fileId: string;
      fileName: string;
      member: null;
      createdAtUtc: string;
    }) => void;
  }) => (
    <div data-testid={`image-${attachment.fileId}`}>
      <button
        type="button"
        onClick={() =>
          onOpenLightbox({
            fileId: attachment.fileId,
            fileName: attachment.fileName,
            member: null,
            createdAtUtc: '2026-01-01T00:00:00.000Z',
          })
        }
      >
        open {attachment.fileName}
      </button>
      <button type="button" onClick={() => onDeleteRequest?.(attachment)}>
        delete {attachment.fileName}
      </button>
    </div>
  ),
}));

vi.mock('./MessageAttachmentFileChip', () => ({
  MessageAttachmentFileChip: ({
    attachment,
    onDeleteRequest,
  }: {
    attachment: MessageAttachment;
    onDeleteRequest?: (attachment: MessageAttachment) => void;
  }) => (
    <button type="button" onClick={() => onDeleteRequest?.(attachment)}>
      file {attachment.fileName}
    </button>
  ),
}));

vi.mock('./MessageAttachmentLightbox', () => ({
  MessageAttachmentLightbox: ({ fileName, onClose }: { fileName: string; onClose: () => void }) => (
    <div role="dialog" aria-label={`lightbox ${fileName}`}>
      <button type="button" onClick={onClose}>
        close lightbox
      </button>
    </div>
  ),
}));

vi.mock('./MessageAttachmentDeleteModal', () => ({
  MessageAttachmentDeleteModal: ({
    fileName,
    onClose,
    onConfirm,
  }: {
    fileName: string;
    onClose: () => void;
    onConfirm: () => void;
  }) => (
    <div role="dialog" aria-label={`delete ${fileName}`}>
      <button type="button" onClick={onConfirm}>
        confirm delete
      </button>
      <button type="button" onClick={onClose}>
        cancel delete
      </button>
    </div>
  ),
}));

const imageAttachment: MessageAttachment = {
  fileId: 'img-1',
  fileName: 'photo.png',
  contentType: 'image/png',
  sizeBytes: 120,
};

const fileAttachment: MessageAttachment = {
  fileId: 'file-1',
  fileName: 'notes.pdf',
  contentType: 'application/pdf',
  sizeBytes: 240,
};

describe('MessageAttachments', () => {
  it('renders nothing without attachments', () => {
    const { container } = render(
      <MessageAttachments attachments={[]} messageCreatedAt="2026-01-01T00:00:00.000Z" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('opens and closes an image lightbox', async () => {
    render(
      <MessageAttachments
        attachments={[imageAttachment]}
        messageCreatedAt="2026-01-01T00:00:00.000Z"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'open photo.png' }));
    expect(screen.getByRole('dialog', { name: 'lightbox photo.png' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'close lightbox' }));
    expect(screen.queryByRole('dialog', { name: 'lightbox photo.png' })).not.toBeInTheDocument();
  });

  it('deletes directly when a direct delete handler is provided', async () => {
    const onDeleteDirect = vi.fn();

    render(
      <MessageAttachments
        attachments={[imageAttachment, fileAttachment]}
        messageCreatedAt="2026-01-01T00:00:00.000Z"
        onDeleteDirect={onDeleteDirect}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'delete photo.png' }));
    await userEvent.click(screen.getByRole('button', { name: 'file notes.pdf' }));

    expect(onDeleteDirect).toHaveBeenNthCalledWith(1, 'img-1');
    expect(onDeleteDirect).toHaveBeenNthCalledWith(2, 'file-1');
  });

  it('confirms and cancels deferred deletion', async () => {
    const onDelete = vi.fn();

    render(
      <MessageAttachments
        attachments={[fileAttachment]}
        messageCreatedAt="2026-01-01T00:00:00.000Z"
        onDelete={onDelete}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'file notes.pdf' }));
    expect(screen.getByRole('dialog', { name: 'delete notes.pdf' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'cancel delete' }));
    expect(screen.queryByRole('dialog', { name: 'delete notes.pdf' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'file notes.pdf' }));
    await userEvent.click(screen.getByRole('button', { name: 'confirm delete' }));

    expect(onDelete).toHaveBeenCalledWith('file-1');
    expect(screen.queryByRole('dialog', { name: 'delete notes.pdf' })).not.toBeInTheDocument();
  });
});
