import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useLongPress } from './useLongPress';

const LongPressTarget = ({
  onLongPress,
  onClick,
}: {
  onLongPress?: (position: { x: number; y: number }) => void;
  onClick?: () => void;
}) => {
  const { consumeTriggeredPress, eventHandlers } = useLongPress(onLongPress);

  return (
    <button
      type="button"
      {...eventHandlers}
      onClick={(event) => {
        if (consumeTriggeredPress(event)) return;
        onClick?.();
      }}
    >
      Hold
    </button>
  );
};

describe('useLongPress', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onLongPress after the delay for primary touch pointers', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();

    render(<LongPressTarget onLongPress={onLongPress} />);
    const event = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(event, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 12 },
      clientY: { value: 24 },
    });
    fireEvent(screen.getByRole('button', { name: 'Hold' }), event);
    vi.advanceTimersByTime(500);

    expect(onLongPress).toHaveBeenCalledWith({ x: 12, y: 24 });
  });

  it('cancels when the pointer moves beyond the tolerance', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { getByRole } = render(<LongPressTarget onLongPress={onLongPress} />);
    const target = getByRole('button', { name: 'Hold' });

    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(pointerDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 0 },
      clientY: { value: 0 },
    });
    const pointerMove = new Event('pointermove', { bubbles: true });
    Object.defineProperties(pointerMove, {
      clientX: { value: 20 },
      clientY: { value: 0 },
    });

    fireEvent(target, pointerDown);
    fireEvent(target, pointerMove);
    vi.advanceTimersByTime(500);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('ignores missing handlers and secondary touch pointers', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { rerender } = render(<LongPressTarget />);
    const target = screen.getByRole('button', { name: 'Hold' });

    const withoutHandler = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(withoutHandler, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 1 },
      clientY: { value: 2 },
    });
    fireEvent(target, withoutHandler);
    vi.advanceTimersByTime(500);

    rerender(<LongPressTarget onLongPress={onLongPress} />);

    const secondaryTouch = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(secondaryTouch, {
      pointerType: { value: 'touch' },
      isPrimary: { value: false },
      clientX: { value: 3 },
      clientY: { value: 4 },
    });
    fireEvent(target, secondaryTouch);
    vi.advanceTimersByTime(500);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('keeps the timer when movement stays within tolerance', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<LongPressTarget onLongPress={onLongPress} />);
    const target = screen.getByRole('button', { name: 'Hold' });

    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(pointerDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 10 },
      clientY: { value: 10 },
    });
    const pointerMove = new Event('pointermove', { bubbles: true });
    Object.defineProperties(pointerMove, {
      clientX: { value: 16 },
      clientY: { value: 18 },
    });

    fireEvent(target, pointerDown);
    fireEvent(target, pointerMove);
    vi.advanceTimersByTime(500);

    expect(onLongPress).toHaveBeenCalledWith({ x: 10, y: 10 });
  });

  it('ignores pointer moves before a press starts and cancels on pointer end events', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    render(<LongPressTarget onLongPress={onLongPress} />);
    const target = screen.getByRole('button', { name: 'Hold' });

    const pointerMove = new Event('pointermove', { bubbles: true });
    Object.defineProperties(pointerMove, {
      clientX: { value: 12 },
      clientY: { value: 24 },
    });
    fireEvent(target, pointerMove);

    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(pointerDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 4 },
      clientY: { value: 8 },
    });

    fireEvent(target, pointerDown);
    fireEvent.pointerUp(target);
    vi.advanceTimersByTime(500);

    fireEvent(target, pointerDown);
    fireEvent.pointerCancel(target);
    vi.advanceTimersByTime(500);

    fireEvent(target, pointerDown);
    fireEvent.lostPointerCapture(target);
    vi.advanceTimersByTime(500);

    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('ignores mouse pointers and consumes the click after a triggered long press', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const onLongPress = vi.fn();
    render(<LongPressTarget onClick={onClick} onLongPress={onLongPress} />);
    const target = screen.getByRole('button', { name: 'Hold' });

    const mouseDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(mouseDown, {
      pointerType: { value: 'mouse' },
      isPrimary: { value: true },
      clientX: { value: 1 },
      clientY: { value: 2 },
    });
    fireEvent(target, mouseDown);
    vi.advanceTimersByTime(500);
    fireEvent.click(target);

    const touchDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(touchDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 3 },
      clientY: { value: 4 },
    });
    fireEvent(target, touchDown);
    vi.advanceTimersByTime(500);
    fireEvent.click(target);

    expect(onLongPress).toHaveBeenCalledWith({ x: 3, y: 4 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('clears an active timer on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');
    const onLongPress = vi.fn();
    const { unmount } = render(<LongPressTarget onLongPress={onLongPress} />);
    const target = screen.getByRole('button', { name: 'Hold' });

    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(pointerDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 4 },
      clientY: { value: 8 },
    });

    fireEvent(target, pointerDown);
    unmount();
    vi.advanceTimersByTime(500);
    vi.useRealTimers();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
  });
});
