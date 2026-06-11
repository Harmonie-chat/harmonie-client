import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from './Select';

const options = [
  { value: 'fr', label: 'French' },
  { value: 'en', label: 'English' },
];

describe('Select', () => {
  it('opens the option menu and selects an option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<Select aria-label="Language" options={options} value="fr" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Language' }));
    await user.click(screen.getByRole('button', { name: 'English' }));

    expect(onChange).toHaveBeenCalledWith('en');
    expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument();
  });

  it('does not open while disabled', async () => {
    const user = userEvent.setup();

    render(<Select aria-label="Language" disabled options={options} value="fr" />);
    await user.click(screen.getByRole('button', { name: 'Language' }));

    expect(screen.queryByRole('button', { name: 'English' })).not.toBeInTheDocument();
  });
});
