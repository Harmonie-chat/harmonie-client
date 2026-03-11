import type { ReactNode } from 'react';

export interface NavListItemProps {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const NavListItem = ({ icon, label, active = false, onClick }: NavListItemProps) => (
  <li>
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm font-body transition-colors text-left cursor-pointer',
        active
          ? 'bg-secondary text-secondary-fg font-medium'
          : 'text-text-2 hover:bg-surface-3 hover:text-text-1',
      ].join(' ')}
    >
      {icon}
      {label}
    </button>
  </li>
);

export interface NavListProps {
  children: ReactNode;
  className?: string;
}

const NavListRoot = ({ children, className }: NavListProps) => (
  <ul className={['flex flex-col gap-0.5', className].filter(Boolean).join(' ')}>{children}</ul>
);

export const NavList = Object.assign(NavListRoot, { Item: NavListItem });
