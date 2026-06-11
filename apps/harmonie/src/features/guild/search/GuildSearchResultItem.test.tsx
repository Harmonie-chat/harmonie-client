import { fireEvent, render, screen } from '@testing-library/react';
import type { GuildMessageSearchItem } from '@/types/guild';
import { describe, expect, it, vi } from 'vitest';
import { GuildSearchResultItem } from './GuildSearchResultItem';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  Avatar: ({
    avatarUrl,
    bg,
    color,
    icon,
  }: {
    avatarUrl: string | null;
    bg?: string | null;
    color?: string | null;
    icon?: string | null;
  }) => (
    <span
      data-avatar-url={avatarUrl ?? ''}
      data-bg={bg ?? ''}
      data-color={color ?? ''}
      data-icon={icon ?? ''}
    />
  ),
}));

vi.mock('@/shared/hooks/useFileBlobUrl', () => ({
  useFileBlobUrl: (fileId?: string | null) => (fileId ? `blob:${fileId}` : null),
}));

vi.mock('@/shared/utils/date', () => ({
  formatContextualDateTime: (date: string, language: string) => `date:${language}:${date}`,
}));

const item = (input: Partial<GuildMessageSearchItem> = {}): GuildMessageSearchItem => ({
  messageId: 'message-1',
  channelId: 'channel-1',
  channelName: 'general',
  authorUserId: 'user-1',
  authorUsername: 'alice',
  authorDisplayName: 'Alice',
  authorAvatarFileId: 'avatar-1',
  authorAvatar: { icon: 'Rocket', color: '#111111', bg: '#eeeeee' },
  content: 'hello world',
  attachments: [
    { fileId: 'file-1', fileName: 'file.pdf', contentType: 'application/pdf', sizeBytes: 12 },
  ],
  createdAtUtc: '2026-01-01T00:00:00.000Z',
  updatedAtUtc: null,
  ...input,
});

describe('GuildSearchResultItem', () => {
  it('renders result metadata and calls onClick', () => {
    const onClick = vi.fn();

    render(<GuildSearchResultItem item={item()} language="fr" onClick={onClick} />);

    expect(screen.getByRole('button')).toHaveTextContent('Alice');
    expect(screen.getByText('general')).toBeInTheDocument();
    expect(screen.getByText('hello world')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('date:fr:2026-01-01T00:00:00.000Z')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('falls back to username and hides attachment count', () => {
    render(
      <GuildSearchResultItem
        item={item({
          authorDisplayName: null,
          authorAvatarFileId: null,
          authorAvatar: { icon: null, color: null, bg: null },
          attachments: [],
        })}
        language="en"
        onClick={vi.fn()}
      />
    );

    expect(screen.getByRole('button')).toHaveTextContent('alice');
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });
});
