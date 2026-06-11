import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GuildAvatar } from './GuildAvatar';

describe('GuildAvatar', () => {
  it('renders an image when iconUrl is provided', () => {
    const { container, rerender } = render(<GuildAvatar iconUrl="/guild.png" alt="Guild" />);

    expect(screen.getByRole('img', { name: 'Guild' })).toHaveAttribute('src', '/guild.png');

    rerender(<GuildAvatar iconUrl="/guild.png" />);
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('renders a Lucide icon fallback', () => {
    const { container } = render(<GuildAvatar icon="Music" color="#fff" bg="#000" size={48} />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nothing without a valid icon source', () => {
    const { container } = render(<GuildAvatar icon="MissingIcon" />);

    expect(container).toBeEmptyDOMElement();
  });
});
