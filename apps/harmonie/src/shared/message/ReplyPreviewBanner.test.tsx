import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReplyPreviewBanner } from './ReplyPreviewBanner';
import type { ReplyPreview } from '@/types/channel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params?.name ? `translated:${key}:${params.name}` : `translated:${key}`,
  }),
}));

const reply = (input: Partial<ReplyPreview> = {}): ReplyPreview => ({
  messageId: 'message-1',
  authorUserId: 'user-1',
  authorUsername: 'ada',
  authorDisplayName: 'Ada',
  content: '<p>Hello <strong>there</strong></p>',
  hasAttachments: false,
  isDeleted: false,
  deletedAtUtc: null,
  ...input,
});

describe('ReplyPreviewBanner', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
  });

  it('shows reply author, text content, and handles cancel', async () => {
    const onCancelReply = vi.fn();

    render(<ReplyPreviewBanner replyTo={reply()} onCancelReply={onCancelReply} />);

    expect(screen.getByText('translated:channel.messages.replyingTo:Ada')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'translated:channel.messages.cancelReply' })
    );

    expect(onCancelReply).toHaveBeenCalledOnce();
  });

  it('shows deleted, attachment-only, and empty reply states', () => {
    const { rerender } = render(<ReplyPreviewBanner replyTo={reply({ isDeleted: true })} />);
    expect(screen.getByText('translated:channel.messages.replyDeleted')).toBeInTheDocument();
    expect(screen.queryByText('Hello there')).not.toBeInTheDocument();

    rerender(<ReplyPreviewBanner replyTo={reply({ content: null, hasAttachments: true })} />);
    expect(screen.getByText('translated:channel.messages.attachmentOnly')).toBeInTheDocument();

    rerender(<ReplyPreviewBanner replyTo={reply({ content: null, hasAttachments: false })} />);
    expect(screen.getByText('translated:channel.messages.replyEmpty')).toBeInTheDocument();
  });
});
