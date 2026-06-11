import { fireEvent, render, screen } from '@testing-library/react';
import type { MouseEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LinkPreview } from './LinkPreview';

describe('LinkPreview', () => {
  it('renders link metadata, image fallback alt text and click handling', () => {
    const onClick = vi.fn((event: MouseEvent<HTMLAnchorElement>) => event.preventDefault());

    render(
      <LinkPreview
        url="https://example.com/docs"
        label="example.com/docs"
        host="example.com"
        title="Docs"
        description="Documentation"
        imageUrl="https://example.com/image.png"
        ariaLabel="Open docs"
        className="custom"
        target="_self"
        rel="nofollow"
        onClick={onClick}
      />
    );

    const link = screen.getByRole('link', { name: 'Open docs' });
    fireEvent.click(link);

    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_self');
    expect(link).toHaveAttribute('rel', 'nofollow');
    expect(screen.getByText('Docs')).toBeInTheDocument();
    expect(screen.getByText('Documentation')).toBeInTheDocument();
    expect(screen.getByAltText('Docs')).toHaveAttribute('loading', 'lazy');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a compact preview without optional media', () => {
    render(
      <LinkPreview
        url="https://example.com"
        label="Example"
        host="example.com"
        onClick={(event) => event.preventDefault()}
      />
    );

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('uses explicit image alt text without title or description', () => {
    render(
      <LinkPreview
        url="https://example.com/image"
        label="Example image"
        host="example.com"
        imageUrl="https://example.com/image.png"
        imageAlt="Preview"
      />
    );

    expect(screen.getByAltText('Preview')).toBeInTheDocument();
    expect(screen.queryByText('Documentation')).not.toBeInTheDocument();
  });
});
