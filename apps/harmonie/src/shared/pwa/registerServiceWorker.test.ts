import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('registerServiceWorker', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('does nothing outside production', async () => {
    vi.stubEnv('PROD', false);
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const { registerServiceWorker } = await import('./registerServiceWorker');

    registerServiceWorker();

    expect(addEventListener).not.toHaveBeenCalledWith('load', expect.any(Function));
  });

  it('registers the app service worker on load in production', async () => {
    vi.stubEnv('PROD', true);
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    let loadHandler: (() => void) | undefined;
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName, handler) => {
      if (eventName === 'load') loadHandler = handler as () => void;
    });
    const { registerServiceWorker } = await import('./registerServiceWorker');

    registerServiceWorker();
    loadHandler?.();

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('swallows service worker registration failures', async () => {
    vi.stubEnv('PROD', true);
    const register = vi.fn().mockRejectedValue(new Error('registration failed'));
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    let loadHandler: (() => void) | undefined;
    vi.spyOn(window, 'addEventListener').mockImplementation((eventName, handler) => {
      if (eventName === 'load') loadHandler = handler as () => void;
    });
    const { registerServiceWorker } = await import('./registerServiceWorker');

    registerServiceWorker();
    loadHandler?.();
    await expect(register.mock.results[0].value).rejects.toThrow('registration failed');

    expect(register).toHaveBeenCalledTimes(1);
  });
});
