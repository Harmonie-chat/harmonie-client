import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Lightbox } from './Lightbox';

describe('Lightbox', () => {
  it('renders header content, zooms, and closes from controls and keyboard', () => {
    const onClose = vi.fn();

    render(
      <Lightbox
        src="blob:image"
        alt="Preview"
        headerLeft={<span>photo.png</span>}
        headerActions={<button type="button">Download</button>}
        onClose={onClose}
      />
    );

    const image = screen.getByRole('img', { name: 'Preview' });
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1000 });
    Object.defineProperty(image, 'naturalHeight', { configurable: true, value: 500 });
    fireEvent.load(image);

    expect(screen.getByText('photo.png')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: '-' });
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('toggles zoom from image clicks and closes from the backdrop', () => {
    const onClose = vi.fn();
    render(
      <Lightbox src="blob:image" alt="Preview" onClose={onClose} closeLabel="Close preview" />
    );

    const image = screen.getByRole('img', { name: 'Preview' });
    fireEvent.click(image);
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument();

    const [, imageArea] = screen.getAllByRole('button', { name: 'Close preview' });
    fireEvent.mouseDown(imageArea, {
      clientX: 10,
      clientY: 10,
    });
    fireEvent.mouseMove(imageArea, {
      clientX: 30,
      clientY: 30,
    });
    fireEvent.mouseUp(document, { target: document.body });

    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Zoom out' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Close preview' })[0]);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('renders a placeholder when no source is available', () => {
    render(<Lightbox alt="Preview" onClose={vi.fn()} />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(2);
  });
});
