import { describe, expect, it } from 'vitest';
import { sortMessagesAsc } from './message';
import type { Message } from '@/types/channel';

const message = (messageId: string, createdAtUtc: string) =>
  ({ messageId, createdAtUtc }) as Message;

describe('sortMessagesAsc', () => {
  it('sorts messages by creation date without mutating the original array', () => {
    const messages = [
      message('new', '2026-01-02T00:00:00.000Z'),
      message('old', '2026-01-01T00:00:00.000Z'),
    ];

    expect(sortMessagesAsc(messages).map((item) => item.messageId)).toEqual(['old', 'new']);
    expect(messages.map((item) => item.messageId)).toEqual(['new', 'old']);
  });
});
