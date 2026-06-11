import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PwaInstallPrompt } from './PwaInstallPrompt';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const setNavigatorValue = (key: 'maxTouchPoints' | 'platform' | 'userAgent', value: unknown) => {
  Object.defineProperty(navigator, key, {
    configurable: true,
    value,
  });
};

const setStandalone = (matches: boolean) => {
  vi.mocked(window.matchMedia).mockReturnValue({
    matches,
    media: '(display-mode: standalone)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
};

describe('PwaInstallPrompt', () => {
  beforeEach(() => {
    setNavigatorValue('userAgent', 'Mozilla/5.0');
    setNavigatorValue('platform', 'MacIntel');
    setNavigatorValue('maxTouchPoints', 0);
    setStandalone(false);
  });

  it('captures the browser install prompt and dismisses after an accepted install', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    const preventDefault = vi.spyOn(event, 'preventDefault');

    render(<PwaInstallPrompt />);
    fireEvent(window, event);

    expect(await screen.findByText('pwa.install.title')).toBeInTheDocument();
    expect(screen.getByText('pwa.install.description')).toBeInTheDocument();
    expect(preventDefault).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole('button', { name: 'pwa.install.action' }));

    expect(prompt).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(localStorage.getItem('harmonie-pwa-install-dismissed')).toBe('true')
    );
    expect(screen.queryByText('pwa.install.title')).not.toBeInTheDocument();
  });

  it('hides the prompt after a dismissed install choice without storing dismissal', async () => {
    const event = new Event('beforeinstallprompt') as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: 'dismissed'; platform: string }>;
    };
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });

    render(<PwaInstallPrompt />);
    fireEvent(window, event);

    await userEvent.click(await screen.findByRole('button', { name: 'pwa.install.action' }));

    await waitFor(() => expect(screen.queryByText('pwa.install.title')).not.toBeInTheDocument());
    expect(localStorage.getItem('harmonie-pwa-install-dismissed')).toBeNull();
  });

  it('shows and dismisses the iOS install hint', async () => {
    setNavigatorValue('userAgent', 'Mozilla/5.0 (iPhone)');
    setNavigatorValue('platform', 'iPhone');
    setNavigatorValue('maxTouchPoints', 5);

    render(<PwaInstallPrompt />);

    expect(screen.getByText('pwa.install.iosDescription')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'pwa.install.action' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'pwa.install.dismiss' }));

    expect(localStorage.getItem('harmonie-pwa-install-dismissed')).toBe('true');
    expect(screen.queryByText('pwa.install.title')).not.toBeInTheDocument();
  });

  it('does not render when dismissed or already running standalone', () => {
    localStorage.setItem('harmonie-pwa-install-dismissed', 'true');
    const { rerender } = render(<PwaInstallPrompt />);

    expect(screen.queryByText('pwa.install.title')).not.toBeInTheDocument();

    localStorage.removeItem('harmonie-pwa-install-dismissed');
    setStandalone(true);
    rerender(<PwaInstallPrompt />);
    fireEvent(window, new Event('beforeinstallprompt'));

    expect(screen.queryByText('pwa.install.title')).not.toBeInTheDocument();
  });
});
