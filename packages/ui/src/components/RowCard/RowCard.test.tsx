import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RowCard } from './RowCard';

describe('RowCard', () => {
  it('renders with default classes', () => {
    render(<RowCard>Default row</RowCard>);

    expect(screen.getByRole('listitem')).toHaveTextContent('Default row');
  });

  it('renders list item content and passes through attributes', () => {
    render(
      <RowCard aria-label="Member row" className="custom-row">
        Ava
      </RowCard>
    );

    const row = screen.getByRole('listitem', { name: 'Member row' });

    expect(row).toHaveTextContent('Ava');
    expect(row).toHaveClass('custom-row');
  });
});
