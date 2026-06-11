import { describe, expect, it, vi } from 'vitest';
import { syncKeyboardInset } from './keyboardInset';

describe('syncKeyboardInset', () => {
  it('does nothing when visualViewport is unavailable', () => {
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    });

    syncKeyboardInset();

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('');
  });

  it('sets the keyboard inset and registers viewport listeners', () => {
    const addViewportListener = vi.fn();
    const addWindowListener = vi.spyOn(window, 'addEventListener');
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 900 });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 700,
        offsetTop: 50,
        addEventListener: addViewportListener,
      },
    });

    syncKeyboardInset();

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('150px');
    expect(addViewportListener).toHaveBeenCalledWith('resize', expect.any(Function), {
      passive: true,
    });
    expect(addViewportListener).toHaveBeenCalledWith('scroll', expect.any(Function), {
      passive: true,
    });
    expect(addWindowListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });

  it('clamps negative inset values and ignores callbacks after viewport disappears', () => {
    let resizeHandler: () => void = () => {
      throw new Error('Expected resize handler');
    };
    const addViewportListener = vi.fn((eventName: string, handler: () => void) => {
      if (eventName === 'resize') resizeHandler = handler;
    });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: {
        height: 900,
        offsetTop: 50,
        addEventListener: addViewportListener,
      },
    });

    syncKeyboardInset();

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('0px');

    Object.defineProperty(window, 'visualViewport', {
      configurable: true,
      value: undefined,
    });
    resizeHandler();

    expect(document.documentElement.style.getPropertyValue('--keyboard-inset')).toBe('0px');
  });
});
