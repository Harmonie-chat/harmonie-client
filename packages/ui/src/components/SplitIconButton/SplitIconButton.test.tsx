import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SplitIconButton } from './SplitIconButton';

describe('SplitIconButton', () => {
  it('forwards primary and secondary actions with selected/open states', () => {
    const onPrimaryClick = vi.fn();
    const onSecondaryClick = vi.fn();
    const ref = createRef<HTMLButtonElement>();

    render(
      <SplitIconButton
        size="medium"
        selected
        selectedVariant="danger"
        open
        primaryLabel="Delete"
        secondaryLabel="More"
        primaryIcon={<span>D</span>}
        secondaryIcon={<span>M</span>}
        onPrimaryClick={onPrimaryClick}
        onSecondaryClick={onSecondaryClick}
        ref={ref}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'More' }));

    expect(onPrimaryClick).toHaveBeenCalledTimes(1);
    expect(onSecondaryClick).toHaveBeenCalledTimes(1);
    expect(ref.current).toBe(screen.getByRole('button', { name: 'More' }));
  });

  it('disables both controls', () => {
    render(
      <SplitIconButton
        disabled
        primaryLabel="Primary"
        secondaryLabel="Secondary"
        primaryIcon={<span>P</span>}
        secondaryIcon={<span>S</span>}
      />
    );

    expect(screen.getByRole('button', { name: 'Primary' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Secondary' })).toBeDisabled();
  });

  it('renders unselected and open secondary states with custom classes', () => {
    render(
      <SplitIconButton
        className="custom-split"
        size="normal"
        open
        primaryLabel="Mute"
        secondaryLabel="Mute options"
        primaryIcon={<span>M</span>}
        secondaryIcon={<span>O</span>}
      />
    );

    expect(screen.getByRole('button', { name: 'Mute' })).toHaveClass('bg-transparent');
    expect(screen.getByRole('button', { name: 'Mute options' })).toHaveClass('bg-surface-3');
    expect(screen.getByRole('button', { name: 'Mute' }).parentElement).toHaveClass('custom-split');
  });

  it('renders selected primary and unselected closed states', () => {
    const { rerender } = render(
      <SplitIconButton
        selected
        selectedVariant="primary"
        primaryLabel="Video"
        secondaryLabel="Video options"
        primaryIcon={<span>V</span>}
        secondaryIcon={<span>O</span>}
      />
    );

    expect(screen.getByRole('button', { name: 'Video' })).toHaveClass('bg-primary');
    expect(screen.getByRole('button', { name: 'Video options' })).toHaveClass('bg-primary');

    rerender(
      <SplitIconButton
        size="small"
        primaryLabel="Video"
        secondaryLabel="Video options"
        primaryIcon={<span>V</span>}
        secondaryIcon={<span>O</span>}
      />
    );

    expect(screen.getByRole('button', { name: 'Video' })).toHaveClass('bg-transparent');
    expect(screen.getByRole('button', { name: 'Video options' })).toHaveClass('bg-transparent');
  });
});
