import { describe, expect, it, vi } from 'vitest';
import { scheduleCenterMessageIfOutsideView } from './scrollMessageIntoView';

describe('scheduleCenterMessageIfOutsideView', () => {
  it('centers messages outside the comfortable viewport', () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    const scrollElement = {
      clientHeight: 500,
      scrollTop: 100,
      scrollTo,
      getBoundingClientRect: () => ({ top: 0, bottom: 500 }),
    } as unknown as HTMLElement;
    const messageElement = {
      offsetHeight: 50,
      getBoundingClientRect: () => ({ top: 10, bottom: 60 }),
    } as unknown as HTMLElement;

    const cleanup = scheduleCenterMessageIfOutsideView(scrollElement, messageElement, 'smooth');
    vi.runOnlyPendingTimers();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    cleanup();
    vi.useRealTimers();
  });

  it('does not scroll comfortably visible messages', () => {
    vi.useFakeTimers();
    const scrollTo = vi.fn();
    const scrollElement = {
      clientHeight: 500,
      scrollTop: 100,
      scrollTo,
      getBoundingClientRect: () => ({ top: 0, bottom: 500 }),
    } as unknown as HTMLElement;
    const messageElement = {
      offsetHeight: 50,
      getBoundingClientRect: () => ({ top: 150, bottom: 200 }),
    } as unknown as HTMLElement;

    const cleanup = scheduleCenterMessageIfOutsideView(scrollElement, messageElement);
    vi.runOnlyPendingTimers();

    expect(scrollTo).not.toHaveBeenCalled();
    cleanup();
    vi.useRealTimers();
  });
});
