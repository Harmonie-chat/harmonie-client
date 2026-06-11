import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';

const ThemeConsumer = () => {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={() => setTheme('midnight-obsidian')}>
        Set dark
      </button>
    </>
  );
};

describe('ThemeProvider', () => {
  it('exposes inert defaults when used without a provider', () => {
    render(<ThemeConsumer />);

    expect(screen.getByTestId('theme')).toHaveTextContent('default');

    act(() => {
      screen.getByRole('button', { name: 'Set dark' }).click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('default');
  });

  it('sets the default theme and updates the PWA theme color', () => {
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (name: string) => (name === '--color-background' ? '#123456' : ''),
    } as unknown as CSSStyleDeclaration);

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('default');
    expect(document.documentElement).toHaveAttribute('data-theme', 'default');
    expect(document.querySelector('meta[name="theme-color"]')).toHaveAttribute(
      'content',
      '#123456'
    );
  });

  it('changes theme state from the context setter', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration);

    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'Set dark' }).click();
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('midnight-obsidian');
    expect(document.documentElement).toHaveAttribute('data-theme', 'midnight-obsidian');
  });
});
