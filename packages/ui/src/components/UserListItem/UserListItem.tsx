import { useState, type MouseEvent, type ReactNode } from 'react';
import { Avatar } from '../Avatar/Avatar';
import { ContextMenu, type ContextMenuItem } from '../ContextMenu/ContextMenu';

export interface UserListItemProps<TUser> {
  user: TUser;
  label: string;
  subtitle?: string;
  avatarUrl?: string | null;
  avatarIcon?: string;
  avatarColor?: string;
  avatarBg?: string;
  onSelect: (user: TUser, rect: DOMRect) => void;
  contextItems?: ContextMenuItem[];
  trailing?: ReactNode;
}

export const UserListItem = <TUser,>({
  user,
  label,
  subtitle,
  avatarUrl,
  avatarIcon = 'PawPrint',
  avatarColor = 'var(--color-cat-1-fg)',
  avatarBg = 'var(--color-cat-1)',
  onSelect,
  contextItems,
  trailing,
}: UserListItemProps<TUser>) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const hasContextMenu = Boolean(contextItems?.length);

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onSelect(user, event.currentTarget.getBoundingClientRect());
  };

  const handleContextMenu = (event: MouseEvent<HTMLButtonElement>) => {
    if (!hasContextMenu) return;
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY });
  };

  return (
    <>
      <button
        type="button"
        className="flex w-[calc(100%-0.5rem)] items-center gap-3 px-2 py-1.5 mx-1 rounded-sm text-left hover:bg-surface-3 cursor-pointer"
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <Avatar
          alt={label}
          avatarUrl={avatarUrl ?? undefined}
          icon={avatarIcon}
          color={avatarColor}
          bg={avatarBg}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-1 truncate">{label}</p>
          {subtitle && <p className="text-xs text-text-3 truncate">{subtitle}</p>}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </button>

      {contextMenu && contextItems && (
        <ContextMenu
          position={contextMenu}
          horizontalAnchor="right"
          onClose={() => setContextMenu(null)}
          items={contextItems}
        />
      )}
    </>
  );
};
