import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

export const ContextMenu = ({ items, position, onClose }: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-44 bg-surface-1 border border-border-2 rounded-sm shadow-lg py-1 px-1"
      style={{ top: position.y, left: position.x }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          role="menuitem"
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm font-body text-text-2 hover:bg-surface-2 hover:text-text-1 cursor-pointer transition-colors text-left"
          onClick={() => {
            item.onClick();
            onClose();
          }}
        >
          {item.icon && <span className="shrink-0 text-text-3">{item.icon}</span>}
          {item.label}
        </button>
      ))}
    </div>
  );
};
