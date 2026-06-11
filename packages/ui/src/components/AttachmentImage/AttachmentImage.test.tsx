import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AttachmentImage } from './AttachmentImage';

describe('AttachmentImage', () => {
  it('renders a loading placeholder without a source', () => {
    const { container } = render(<AttachmentImage alt="Preview" />);

    expect(container.firstElementChild).toHaveClass('animate-pulse');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('opens the image and renders top-right actions', () => {
    const onOpen = vi.fn();

    render(
      <AttachmentImage
        src="blob:image"
        alt="Preview"
        openLabel="Open preview"
        onOpen={onOpen}
        topRightAction={<button type="button">Delete</button>}
      />
    );

    expect(screen.getByRole('img', { name: 'Preview' })).toHaveAttribute('src', 'blob:image');
    fireEvent.click(screen.getByRole('button', { name: 'Open preview' }));

    expect(onOpen).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('passes image data attributes to the rendered image', () => {
    render(
      <AttachmentImage
        src="blob:image"
        alt="Preview"
        imageDataAttributes={{ 'data-message-attachment-file-id': 'file-1' }}
      />
    );

    expect(screen.getByRole('img', { name: 'Preview' })).toHaveAttribute(
      'data-message-attachment-file-id',
      'file-1'
    );
  });
});
