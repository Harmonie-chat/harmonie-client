import { Headphones, Mic, Settings } from 'lucide-react';
import { useUser } from './UserContext';
import { Avatar, IconButton } from '@harmonie/ui';

export const UserPanel = () => {
  const { user } = useUser();

  const label = user ? (user.displayName ?? user.username) : '';

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Avatar
        alt={label}
        avatarUrl={user?.avatarUrl}
        icon={user?.avatar?.icon ?? 'PawPrint'}
        color={user?.avatar?.color ?? 'var(--color-cat-1-fg)'}
        bg={user?.avatar?.bg ?? 'var(--color-cat-1)'}
      />

      <span className="flex-1 text-sm font-medium text-text-1 truncate">{label}</span>

      <div className="flex items-center gap-2">
        <IconButton size="small">
          <Mic size={16} />
        </IconButton>
        <IconButton size="small">
          <Headphones size={16} />
        </IconButton>
        <IconButton size="small">
          <Settings size={16} />
        </IconButton>
      </div>
    </div>
  );
};
