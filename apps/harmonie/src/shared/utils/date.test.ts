import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatContextualDateTime } from './date';
import type { TFunction } from 'i18next';

const t = ((key: string, values?: Record<string, string>) =>
  `${key}:${values?.date}:${values?.time}`) as TFunction;

describe('formatContextualDateTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
  });

  it('formats relative dates using the requested locale', () => {
    expect(formatContextualDateTime('2026-06-11T10:00:00.000Z', 'en', t)).toContain('today');
    expect(formatContextualDateTime('2026-06-11T10:00:00.000Z', 'fr', t)).toContain('aujourd’hui');
  });

  it('falls back to the translated date-at format for older dates', () => {
    expect(formatContextualDateTime('2025-01-01T10:00:00.000Z', 'en', t)).toContain(
      'dateTime.dateAt:'
    );
  });
});
