import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders a clickable button', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Send</Button>);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables clicks while loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button isLoading onClick={onClick}>
        Send
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Send' });

    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('combines variants, sizes, classes and described-by labels', () => {
    render(
      <Button
        variant="tertiary"
        size="small"
        className="custom-button"
        aria-describedby="external-help"
        title="More details"
      >
        Details
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Details' });

    expect(button).toHaveClass('custom-button');
    expect(button).toHaveAttribute('aria-describedby', expect.stringContaining('external-help'));
    expect(button.getAttribute('aria-describedby')?.split(' ')).toHaveLength(2);
  });

  it.each(['secondary', 'danger'] as const)('renders the %s variant', (variant) => {
    render(<Button variant={variant}>{variant}</Button>);

    expect(screen.getByRole('button', { name: variant })).toBeEnabled();
  });
});
