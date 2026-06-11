import { describe, expect, it } from 'vitest';
import { getUserGradient, isValidEmail, isValidPassword } from './user';

describe('user utils', () => {
  it('validates email addresses', () => {
    expect(isValidEmail('laurine@example.com')).toBe(true);
    expect(isValidEmail('laurine')).toBe(false);
    expect(isValidEmail('laurine@example')).toBe(false);
  });

  it('validates strong passwords', () => {
    expect(isValidPassword('Password1!')).toBe(true);
    expect(isValidPassword('password1!')).toBe(false);
    expect(isValidPassword('Password!')).toBe(false);
    expect(isValidPassword('Pass1!')).toBe(false);
  });

  it('creates stable light and dark gradients from user ids', () => {
    expect(getUserGradient('user-1', false)).toBe(getUserGradient('user-1', false));
    expect(getUserGradient('user-1', false)).not.toBe(getUserGradient('user-1', true));
    expect(getUserGradient('user-1', false)).toContain('linear-gradient');
  });
});
