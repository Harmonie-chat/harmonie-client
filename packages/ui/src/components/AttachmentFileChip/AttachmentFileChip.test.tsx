import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AttachmentFileChip } from './AttachmentFileChip';

describe('AttachmentFileChip', () => {
  it('renders file metadata and optional actions', () => {
    render(
      <AttachmentFileChip
        fileName="report.pdf"
        fileSize="2 MB"
        actions={<button type="button">Remove</button>}
      />
    );

    expect(screen.getByText('report.pdf')).toBeInTheDocument();
    expect(screen.getByText('2 MB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  it('renders without actions', () => {
    render(<AttachmentFileChip fileName="archive.zip" fileSize="8 MB" />);

    expect(screen.getByText('archive.zip')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
