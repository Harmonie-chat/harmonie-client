import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  hideOnTouch?: boolean;
  content?: React.ReactNode;
  disabled?: boolean;
}

export interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  horizontalAnchor?: 'left' | 'right';
  touchHeader?: React.ReactNode;
  touchExpanded?: boolean;
  closeLabel?: string;
}

const VIEWPORT_MARGIN = 8;
const TOUCH_MENU_QUERY = '(hover: none), (pointer: coarse), (max-width: 767px)';

const isTouchMenuDevice = () =>
  typeof window !== 'undefined' && window.matchMedia(TOUCH_MENU_QUERY).matches;

export const ContextMenu = ({
  items,
  position,
  onClose,
  horizontalAnchor = 'left',
  touchHeader,
  touchExpanded = false,
  closeLabel = 'Close menu',
}: ContextMenuProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const [menuStyle, setMenuStyle] = useState({ top: position.y, left: position.x });
  const [isTouchMenu, setIsTouchMenu] = useState(isTouchMenuDevice);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const media = window.matchMedia(TOUCH_MENU_QUERY);
    const handleMediaChange = () => setIsTouchMenu(media.matches);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    media.addEventListener('change', handleMediaChange);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      media.removeEventListener('change', handleMediaChange);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (isTouchMenu) return;
    const menu = ref.current;
    if (!menu) return;

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;
    const maxLeft = window.innerWidth - menuWidth - VIEWPORT_MARGIN;
    const maxTop = window.innerHeight - menuHeight - VIEWPORT_MARGIN;

    const requestedLeft = horizontalAnchor === 'right' ? position.x - menuWidth : position.x;

    setMenuStyle({
      left: Math.max(VIEWPORT_MARGIN, Math.min(requestedLeft, maxLeft)),
      top: Math.max(VIEWPORT_MARGIN, Math.min(position.y, maxTop)),
    });
  }, [horizontalAnchor, isTouchMenu, items, position]);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchMenu) return;
    event.preventDefault();
    dragStartYRef.current = event.clientY;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(true);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may fail in responsive browser simulators.
    }
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchMenu || dragStartYRef.current === null) return;
    event.preventDefault();
    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchMenu || dragStartYRef.current === null) return;
    const finalOffset = Math.max(dragOffsetRef.current, event.clientY - dragStartYRef.current);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Some browser simulators throw when capture was already lost.
    }

    dragStartYRef.current = null;
    setIsDragging(false);

    if (finalOffset > 96) {
      onClose();
      return;
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  const menu = (
    <div
      ref={ref}
      role="menu"
      className={[
        'fixed z-50 bg-surface-1 border border-border-2 shadow-lg',
        isTouchMenu
          ? [
              'inset-x-0 bottom-0 rounded-t-lg px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3',
              isDragging ? '' : 'transition-transform duration-200',
            ].join(' ')
          : 'min-w-44 rounded-md py-1.5 px-1.5',
      ].join(' ')}
      style={isTouchMenu ? { transform: `translateY(${dragOffset}px)` } : menuStyle}
    >
      {isTouchMenu && (
        <div
          className="mx-auto mb-3 flex h-5 w-16 touch-none items-center justify-center"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onLostPointerCapture={handleDragEnd}
        >
          <div className="h-1 w-10 rounded-full bg-border-2" />
        </div>
      )}
      {isTouchMenu && touchHeader}
      {!(isTouchMenu && touchExpanded) &&
        items.map((item) =>
          isTouchMenu && item.hideOnTouch ? null : item.content ? (
            <fieldset
              key={`content-${item.label}`}
              aria-label={item.label}
              className={
                isTouchMenu ? 'm-0 min-w-0 border-0 px-4 py-4' : 'm-0 min-w-0 border-0 px-3 py-2'
              }
            >
              {item.content}
            </fieldset>
          ) : (
            <button
              type="button"
              key={`action-${item.label}`}
              role="menuitem"
              disabled={item.disabled}
              className={[
                'flex w-full items-center gap-2 rounded-sm font-body text-text-2 transition-colors text-left disabled:cursor-not-allowed disabled:opacity-45',
                item.disabled ? '' : 'hover:bg-surface-2 hover:text-text-1 cursor-pointer',
                isTouchMenu ? 'px-4 py-4 text-base' : 'px-3 py-1.5 text-sm',
              ].join(' ')}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            >
              {item.icon && (
                <span
                  className={['shrink-0 text-text-3', isTouchMenu ? '[&_svg]:size-5' : ''].join(
                    ' '
                  )}
                >
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          )
        )}
    </div>
  );

  if (!isTouchMenu) return menu;

  return (
    <>
      <button
        type="button"
        aria-label={closeLabel}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {menu}
    </>
  );
};
