import { Headphones, Mic, Settings } from 'lucide-react';
import { useUser } from './UserContext';

const getInitial = (displayName: string | null, username: string): string =>
  (displayName ?? username).charAt(0).toUpperCase();

export const UserPanel = () => {
  const { user } = useUser();

  const label = user ? (user.displayName ?? user.username) : '…';

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <div className="flex-shrink-0">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={label} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-fg text-xs font-semibold">
              {user ? getInitial(user.displayName, user.username) : '?'}
            </span>
          </div>
        )}
      </div>

      <span className="flex-1 text-sm font-medium text-text-1 truncate">{label}</span>

      <div className="flex items-center gap-1">
        <button className="p-1 rounded hover:bg-surface-hover text-text-3 hover:text-text-1 transition-colors">
          <Mic size={16} />
        </button>
        <button className="p-1 rounded hover:bg-surface-hover text-text-3 hover:text-text-1 transition-colors">
          <Headphones size={16} />
        </button>
        <button className="p-1 rounded hover:bg-surface-hover text-text-3 hover:text-text-1 transition-colors">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};
