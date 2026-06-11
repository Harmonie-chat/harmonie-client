import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClickableRowCard } from './ClickableRowCard';

describe('ClickableRowCard', () => {
  it('renders as a button and calls onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<ClickableRowCard onClick={onClick}>Open conversation</ClickableRowCard>);

    await user.click(screen.getByRole('button', { name: 'Open conversation' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies custom classes', () => {
    render(
      <ClickableRowCard className="custom-row" onClick={vi.fn()}>
        Custom row
      </ClickableRowCard>
    );

    expect(screen.getByRole('button', { name: 'Custom row' })).toHaveClass('custom-row');
  });
});
