import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AvatarGroup } from './AvatarGroup';

describe('AvatarGroup', () => {
  it('renders a single child directly', () => {
    render(
      <AvatarGroup>
        <span>One</span>
      </AvatarGroup>
    );

    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('overlaps the first two children when several are provided', () => {
    render(
      <AvatarGroup>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </AvatarGroup>
    );

    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.queryByText('Three')).not.toBeInTheDocument();
  });

  it('accepts children arrays and custom sizes', () => {
    render(
      <AvatarGroup size={40}>
        {[<span key="one">Array one</span>, <span key="two">Array two</span>]}
      </AvatarGroup>
    );

    expect(screen.getByText('Array one').parentElement?.parentElement).toHaveStyle({
      width: '40px',
      height: '40px',
    });
  });
});
