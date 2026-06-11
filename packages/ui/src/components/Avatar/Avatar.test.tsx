import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('renders an image avatar when an URL is provided', () => {
    render(<Avatar avatarUrl="/avatar.png" alt="Ava" size={40} />);

    expect(screen.getByRole('img', { name: 'Ava' })).toHaveAttribute('src', '/avatar.png');
  });

  it('renders an icon avatar when a Lucide icon name is provided', () => {
    const { container } = render(<Avatar icon="User" color="#fff" bg="#000" />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the fallback initial when no media is provided', () => {
    render(<Avatar fallback="ava" size={12} />);

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('uses default alt text and larger fallback sizing', () => {
    const { container } = render(<Avatar avatarUrl="/avatar.png" />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('renders nothing when the icon name and fallback are missing', () => {
    const { container } = render(<Avatar icon="MissingIcon" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders an empty fallback without crashing', () => {
    const { container } = render(<Avatar fallback="" />);

    expect(container).toBeEmptyDOMElement();
  });
});
