import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('marks the current option and emits changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <SegmentedControl
        value="light"
        onChange={onChange}
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
      />
    );

    const active = screen.getByRole('radio', { name: 'Light' });
    const inactive = screen.getByRole('radio', { name: 'Dark' });

    expect(active).toHaveAttribute('aria-checked', 'true');
    expect(active).toHaveClass('bg-surface-1');
    expect(inactive).toHaveAttribute('aria-checked', 'false');
    expect(inactive).toHaveClass('text-text-3');

    await user.click(inactive);
    expect(onChange).toHaveBeenCalledWith('dark');
  });
});
