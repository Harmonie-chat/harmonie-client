import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children and an optional icon', () => {
    render(
      <Badge icon={<span aria-label="icon">#</span>} variant="owner">
        Owner
      </Badge>
    );

    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByLabelText('icon')).toBeInTheDocument();
  });

  it('calls onRemove without bubbling through the parent', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onParentClick = vi.fn();

    render(
      <div onClick={onParentClick}>
        <Badge onRemove={onRemove}>Filter</Badge>
      </div>
    );

    await user.click(screen.getByRole('button', { name: '×' }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('renders filter styling and custom classes without a remove button', () => {
    render(
      <Badge variant="filter" className="custom-badge">
        Online
      </Badge>
    );

    const badge = screen.getByText('Online').parentElement;

    expect(badge).toHaveClass('custom-badge');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
