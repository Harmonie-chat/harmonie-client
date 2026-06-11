import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioCard } from './RadioCard';

describe('RadioCard', () => {
  it('renders a controlled radio and emits its value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <RadioCard name="theme" value="dark" checked={false} onChange={onChange}>
        Dark theme
      </RadioCard>
    );

    await user.click(screen.getByRole('radio', { name: 'Dark theme' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('supports checked and disabled states', () => {
    render(
      <RadioCard name="theme" value="dark" checked disabled>
        Dark theme
      </RadioCard>
    );

    const radio = screen.getByRole('radio', { name: 'Dark theme' });
    expect(radio).toBeChecked();
    expect(radio).toBeDisabled();
  });

  it('does not require an onChange handler', async () => {
    const user = userEvent.setup();

    render(
      <RadioCard name="theme" value="system" checked={false}>
        System theme
      </RadioCard>
    );

    const radio = screen.getByRole('radio', { name: 'System theme' });
    await user.click(radio);

    expect(radio).not.toBeChecked();
  });
});
