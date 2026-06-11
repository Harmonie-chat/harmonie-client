import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('associates the label with the input', async () => {
    const user = userEvent.setup();

    render(<Input label="Username" />);
    const input = screen.getByLabelText('Username');

    await user.type(input, 'laurine');

    expect(input).toHaveValue('laurine');
  });

  it('renders validation errors', () => {
    render(<Input label="Email" error="Email is required" />);

    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('renders a right element when provided', () => {
    render(<Input label="Search" rightElement={<span aria-label="shortcut">⌘K</span>} />);

    expect(screen.getByLabelText('shortcut')).toBeInTheDocument();
  });
});
