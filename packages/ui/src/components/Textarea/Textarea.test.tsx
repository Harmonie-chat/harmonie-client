import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('associates the label with the textarea and accepts input', async () => {
    const user = userEvent.setup();

    render(<Textarea label="Message" />);
    const textarea = screen.getByLabelText('Message');

    await user.type(textarea, 'Hello');

    expect(textarea).toHaveValue('Hello');
  });

  it('renders top content, bottom actions, and errors', () => {
    render(
      <Textarea
        label="Message"
        error="Required"
        topContent={<span>Replying</span>}
        bottomRightElement={<button type="button">Send</button>}
      />
    );

    expect(screen.getByText('Replying')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
