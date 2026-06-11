import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentPreviewList } from './AttachmentPreviewList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const makeFile = (name: string, type: string) => new File(['content'], name, { type });

describe('AttachmentPreviewList', () => {
  it('renders nothing when there are no attachments', () => {
    const { container } = render(
      <AttachmentPreviewList attachments={[]} onRemoveAttachment={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders image and file previews and removes selected attachments', () => {
    const onRemoveAttachment = vi.fn();

    render(
      <AttachmentPreviewList
        attachments={[
          {
            localId: 'image-1',
            file: makeFile('picture.png', 'image/png'),
            previewUrl: 'blob:picture',
            status: 'done',
          },
          {
            localId: 'file-1',
            file: makeFile('contract.pdf', 'application/pdf'),
            status: 'uploading',
          },
        ]}
        onRemoveAttachment={onRemoveAttachment}
      />
    );

    expect(screen.getByRole('img', { name: 'picture.png' })).toHaveAttribute('src', 'blob:picture');
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.getAllByLabelText('channel.input.removeAttachment')).toHaveLength(2);

    fireEvent.click(screen.getAllByLabelText('channel.input.removeAttachment')[1]);

    expect(onRemoveAttachment).toHaveBeenCalledWith('file-1');
  });

  it('shows the error marker for failed uploads', () => {
    render(
      <AttachmentPreviewList
        attachments={[
          {
            localId: 'failed-1',
            file: makeFile('archive.zip', 'application/zip'),
            status: 'error',
          },
        ]}
        onRemoveAttachment={vi.fn()}
      />
    );

    expect(screen.getByText('ZIP')).toBeInTheDocument();
    expect(screen.getByText('!')).toBeInTheDocument();
  });
});
