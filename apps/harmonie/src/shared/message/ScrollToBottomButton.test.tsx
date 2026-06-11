import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ScrollToBottomButton } from './ScrollToBottomButton';

describe('ScrollToBottomButton', () => {
  it('renders an accessible button and handles clicks', async () => {
    const onClick = vi.fn();

    render(<ScrollToBottomButton label="Scroll down" onClick={onClick} />);

    const button = screen.getByRole('button', { name: 'Scroll down' });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });
});
