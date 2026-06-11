import { describe, expect, it, vi } from 'vitest';
import { preventAppZoom } from './preventAppZoom';

describe('preventAppZoom', () => {
  it('does not register gesture prevention on fine pointer devices', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: false,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const addEventListener = vi.spyOn(document, 'addEventListener');

    preventAppZoom();

    expect(addEventListener).not.toHaveBeenCalled();
  });

  it('registers gesture prevention on coarse pointer devices', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({
      matches: true,
      media: '',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
    const listeners: EventListener[] = [];
    const addEventListener = vi
      .spyOn(document, 'addEventListener')
      .mockImplementation((_type, listener) => {
        listeners.push(listener as EventListener);
      });

    preventAppZoom();

    expect(addEventListener).toHaveBeenCalledWith('gesturestart', expect.any(Function), {
      passive: false,
    });
    expect(addEventListener).toHaveBeenCalledWith('gesturechange', expect.any(Function), {
      passive: false,
    });
    expect(addEventListener).toHaveBeenCalledWith('gestureend', expect.any(Function), {
      passive: false,
    });

    const gestureEvent = new Event('gesturestart');
    const preventDefault = vi.spyOn(gestureEvent, 'preventDefault');
    listeners[0](gestureEvent);

    expect(preventDefault).toHaveBeenCalledOnce();
  });
});
