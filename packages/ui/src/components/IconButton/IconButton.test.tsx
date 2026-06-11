import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from 'lucide-react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  it('uses title as an accessible label', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <IconButton title="Settings" onClick={onClick}>
        <Settings />
      </IconButton>
    );

    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses explicit aria-label when no title is provided', () => {
    render(
      <IconButton aria-label="Open settings">
        <Settings />
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'Open settings' })).toBeInTheDocument();
  });
});
