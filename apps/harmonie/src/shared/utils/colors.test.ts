import { describe, expect, it } from 'vitest';
import { resolveColor } from './colors';

describe('resolveColor', () => {
  it('resolves CSS variable values from the document root', () => {
    document.documentElement.style.setProperty('--color-primary', '#ff00aa');

    expect(resolveColor('var(--color-primary)')).toBe('#ff00aa');
    expect(resolveColor(' --color-primary ')).toBe('#ff00aa');
  });
});
