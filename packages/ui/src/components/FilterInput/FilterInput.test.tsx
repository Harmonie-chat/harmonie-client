import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterInput } from './FilterInput';

describe('FilterInput', () => {
  it('renders children and a passive right element', () => {
    render(
      <FilterInput className="custom-filter" rightElement={<span aria-label="shortcut">⌘K</span>}>
        <input aria-label="Search" />
      </FilterInput>
    );

    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('shortcut')).toBeInTheDocument();
    expect(screen.getByLabelText('Search').closest('div')?.parentElement).toHaveClass(
      'custom-filter'
    );
  });

  it('renders without a right element', () => {
    render(
      <FilterInput>
        <input aria-label="Plain search" />
      </FilterInput>
    );

    expect(screen.getByLabelText('Plain search')).toBeInTheDocument();
    expect(screen.queryByLabelText('shortcut')).not.toBeInTheDocument();
  });
});
