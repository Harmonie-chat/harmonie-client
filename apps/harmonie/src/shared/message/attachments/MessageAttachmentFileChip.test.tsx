import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageAttachmentFileChip } from './MessageAttachmentFileChip';
import type { MessageAttachment } from '@/types/channel';

const useFileDownloadMock = vi.hoisted(() => vi.fn());

vi.mock('@/shared/hooks/useFileDownload', () => ({
  useFileDownload: useFileDownloadMock,
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
    AttachmentFileChip: ({
      fileName,
      fileSize,
      actions,
    }: {
      fileName: string;
      fileSize: string;
      actions: ReactNode;
    }) => (
      <div>
        <span>{fileName}</span>
        <span>{fileSize}</span>
        {actions}
      </div>
    ),
  };
});

const attachment = (input: Partial<MessageAttachment> = {}): MessageAttachment => ({
  fileId: 'file-1',
  fileName: 'report.pdf',
  contentType: 'application/pdf',
  sizeBytes: 2048,
  ...input,
});

describe('MessageAttachmentFileChip', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('downloads and deletes own attachments', async () => {
    const download = vi.fn();
    const onDeleteRequest = vi.fn();
    useFileDownloadMock.mockReturnValue({ download, downloading: false });

    render(
      <MessageAttachmentFileChip
        attachment={attachment()}
        isOwn
        onDeleteRequest={onDeleteRequest}
      />
    );

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'translated:channel.messages.download' })
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'translated:channel.messages.deleteAttachment' })
    );

    expect(download).toHaveBeenCalledWith('file-1', 'report.pdf');
    expect(onDeleteRequest).toHaveBeenCalledWith(expect.objectContaining({ fileId: 'file-1' }));
  });

  it('hides delete and disables download when needed', () => {
    useFileDownloadMock.mockReturnValue({ download: vi.fn(), downloading: true });

    render(<MessageAttachmentFileChip attachment={attachment()} isOwn={false} />);

    expect(
      screen.getByRole('button', { name: 'translated:channel.messages.download' })
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'translated:channel.messages.deleteAttachment' })
    ).not.toBeInTheDocument();
  });
});
