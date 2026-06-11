import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Separator } from './Separator';

describe('Separator', () => {
  it('renders a labeled separator', () => {
    render(<Separator label="Today" variant="accent" />);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('renders an unlabeled separator', () => {
    const { container } = render(<Separator />);

    expect(container.firstElementChild).toBeInTheDocument();
  });
});
