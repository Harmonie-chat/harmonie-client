import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NavList, NavListItem } from './NavList';

describe('NavList', () => {
  it('renders nav items and forwards clicks', () => {
    const onProfile = vi.fn();

    render(
      <NavList className="custom-nav">
        <NavListItem
          icon={<span aria-hidden="true">P</span>}
          label="Profile"
          active
          onClick={onProfile}
        />
        <NavListItem icon={<span aria-hidden="true">S</span>} label="Settings" onClick={vi.fn()} />
      </NavList>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));

    expect(screen.getByRole('list')).toHaveClass('custom-nav');
    expect(screen.getByRole('button', { name: 'Profile' })).toHaveClass('bg-secondary');
    expect(screen.getByRole('button', { name: 'Settings' })).toHaveClass('text-text-2');
    expect(onProfile).toHaveBeenCalledTimes(1);
  });

  it('renders without a custom class', () => {
    render(
      <NavList>
        <NavListItem icon={<span aria-hidden="true">H</span>} label="Home" onClick={vi.fn()} />
      </NavList>
    );

    expect(screen.getByRole('list')).toHaveClass('flex');
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });
});
