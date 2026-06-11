import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageAttachmentDeleteModal } from './MessageAttachmentDeleteModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      `${key}${params?.name ? `:${params.name}` : ''}`,
  }),
}));

describe('MessageAttachmentDeleteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the file name and exposes cancel and confirm actions', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <MessageAttachmentDeleteModal
        fileName="invoice.pdf"
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    expect(
      screen.getByRole('dialog', { name: 'channel.messages.deleteAttachment' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('channel.messages.deleteAttachmentConfirm:invoice.pdf')
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'channel.messages.deleteAttachmentCancel' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'channel.messages.deleteAttachmentConfirmButton' })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
