import { Avatar } from '@harmonie/ui';
import { useFileBlobUrl } from '@/shared/hooks/useFileBlobUrl';
import type { MessageAuthor } from '@/shared/message/messageAuthor';
import type { MessageReactionUser } from '@/types/channel';

interface MessageReactionUserRowProps {
  user: MessageReactionUser;
  mappedUser?: MessageAuthor;
}

export const MessageReactionUserRow = ({ user, mappedUser }: MessageReactionUserRowProps) => {
  const avatarUrl = useFileBlobUrl(mappedUser?.avatarFileId);
  const label = user.displayName ?? user.username;

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-md bg-surface-2 px-3 py-2">
      <Avatar
        alt={label}
        avatarUrl={avatarUrl}
        icon={mappedUser?.avatar?.icon ?? 'User'}
        color={mappedUser?.avatar?.color ?? 'var(--color-text-3)'}
        bg={mappedUser?.avatar?.bg ?? 'var(--color-surface-3)'}
        size={32}
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-text-1">{label}</p>
        {user.displayName && <p className="truncate text-xs text-text-3">@{user.username}</p>}
      </div>
    </div>
  );
};
