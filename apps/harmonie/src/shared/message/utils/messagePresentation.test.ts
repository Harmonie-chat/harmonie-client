import { describe, expect, it } from 'vitest';
import { areMessagesGrouped, getDaySeparatorLabel } from './messagePresentation';
import type { Message } from '@/types/channel';

const message = (authorUserId: string, createdAtUtc: string) =>
  ({ authorUserId, createdAtUtc }) as Message;

describe('messagePresentation', () => {
  it('groups messages by the same author within the grouping window', () => {
    expect(
      areMessagesGrouped(
        message('user-1', '2026-01-01T10:00:00.000Z'),
        message('user-1', '2026-01-01T10:09:00.000Z')
      )
    ).toBe(true);
  });

  it('does not group missing, different-author, or far apart messages', () => {
    expect(areMessagesGrouped(undefined, message('user-1', '2026-01-01T10:00:00.000Z'))).toBe(
      false
    );
    expect(
      areMessagesGrouped(
        message('user-1', '2026-01-01T10:00:00.000Z'),
        message('user-2', '2026-01-01T10:01:00.000Z')
      )
    ).toBe(false);
    expect(
      areMessagesGrouped(
        message('user-1', '2026-01-01T10:00:00.000Z'),
        message('user-1', '2026-01-01T10:10:00.000Z')
      )
    ).toBe(false);
  });

  it('returns day separators only when the day changes', () => {
    expect(
      getDaySeparatorLabel(
        message('user-1', '2026-01-01T10:00:00.000Z'),
        message('user-1', '2026-01-01T12:00:00.000Z')
      )
    ).toBeNull();
    expect(
      getDaySeparatorLabel(
        message('user-1', '2026-01-01T10:00:00.000Z'),
        message('user-1', '2026-01-02T10:00:00.000Z')
      )
    ).toContain('2026');
  });
});
