import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 600 });
  });

  it('opens on hover, repositions, and closes on leave', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(hover: hover) and (pointer: fine)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <Tooltip content="Helpful" side="right" delay={10}>
        <button type="button">Hover me</button>
      </Tooltip>
    );

    const trigger = screen.getByRole('button', { name: 'Hover me' });
    trigger.getBoundingClientRect = () =>
      ({ left: 560, right: 590, top: 220, bottom: 250, width: 30, height: 30 }) as DOMRect;

    fireEvent.mouseEnter(trigger);
    act(() => vi.advanceTimersByTime(10));

    expect(screen.getByRole('tooltip')).toHaveTextContent('Helpful');

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('returns the child directly when disabled or empty', () => {
    vi.mocked(window.matchMedia).mockImplementation(() => ({
      matches: false,
      media: '(hover: hover) and (pointer: fine)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <Tooltip content="">
        <button type="button">No tooltip</button>
      </Tooltip>
    );

    expect(screen.getByRole('button', { name: 'No tooltip' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
