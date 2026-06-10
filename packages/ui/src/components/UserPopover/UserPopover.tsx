import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../Avatar/Avatar';
import { Badge, type BadgeVariant } from '../Badge/Badge';

const POPOVER_WIDTH = 224;
const POPOVER_OFFSET = 8;
const EMPTY_BADGES: UserPopoverBadge[] = [];
const EMPTY_ACTIONS: UserPopoverAction[] = [];
const TOUCH_POPOVER_QUERY = '(hover: none), (pointer: coarse)';

const getIsTouchPopoverSnapshot = () =>
  typeof window !== 'undefined' && window.matchMedia(TOUCH_POPOVER_QUERY).matches;

const getServerIsTouchPopoverSnapshot = () => false;

const subscribeToTouchPopover = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia(TOUCH_POPOVER_QUERY);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};

export interface UserPopoverBadge {
  label: ReactNode;
  variant?: BadgeVariant;
}

export interface UserPopoverAction {
  label: string;
  title?: string;
  icon: ReactNode;
  onClick: () => void;
}

export interface UserPopoverProps {
  anchorRect: DOMRect;
  onClose: () => void;
  label: string;
  username?: string;
  avatarUrl?: string | null;
  avatarIcon?: string;
  avatarColor?: string;
  avatarBg?: string;
  headerBackground: string;
  side?: 'left' | 'right';
  badges?: UserPopoverBadge[];
  bioLabel?: string;
  bio?: string | null;
  actions?: UserPopoverAction[];
}

export const UserPopover = ({
  anchorRect,
  onClose,
  label,
  username,
  avatarUrl,
  avatarIcon = 'PawPrint',
  avatarColor = 'var(--color-cat-1-fg)',
  avatarBg = 'var(--color-cat-1)',
  headerBackground,
  side = 'left',
  badges = EMPTY_BADGES,
  bioLabel,
  bio,
  actions = EMPTY_ACTIONS,
}: UserPopoverProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isTouchPopover = useSyncExternalStore(
    subscribeToTouchPopover,
    getIsTouchPopoverSnapshot,
    getServerIsTouchPopoverSnapshot
  );
  const [cardHeight, setCardHeight] = useState(200);
  const top = Math.min(anchorRect.top, window.innerHeight - cardHeight - POPOVER_OFFSET);
  const left =
    side === 'right'
      ? Math.min(
          anchorRect.right + POPOVER_OFFSET,
          window.innerWidth - POPOVER_WIDTH - POPOVER_OFFSET
        )
      : anchorRect.left - POPOVER_WIDTH - POPOVER_OFFSET;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useLayoutEffect(() => {
    setCardHeight(cardRef.current?.offsetHeight ?? 200);
  }, [actions.length, badges.length, bio, bioLabel]);

  return createPortal(
    <>
      <button
        type="button"
        aria-label={`Close ${label}`}
        className="fixed inset-0 z-40 cursor-default"
        onClick={onClose}
      />
      <div
        ref={cardRef}
        className={[
          'fixed z-50 border border-border-2 bg-surface-1 shadow-lg overflow-hidden',
          isTouchPopover
            ? 'inset-x-0 bottom-0 w-full rounded-t-md pb-[env(safe-area-inset-bottom)]'
            : 'w-56 rounded-md',
        ].join(' ')}
        style={isTouchPopover ? undefined : { top, left }}
      >
        <div className="relative h-9" style={{ background: headerBackground }}>
          {actions.length > 0 && (
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  aria-label={action.label}
                  title={action.title ?? action.label}
                  onClick={action.onClick}
                  className="inline-flex items-center justify-center size-[28px] rounded-full bg-transparent text-text-2 hover:text-text-1 hover:scale-[1.04] transition cursor-pointer"
                >
                  {action.icon}
                </button>
              ))}
            </div>
          )}
          <div className="absolute left-4 bottom-0 translate-y-1/2">
            <Avatar
              alt={label}
              avatarUrl={avatarUrl ?? undefined}
              icon={avatarIcon}
              color={avatarColor}
              bg={avatarBg}
              size={48}
            />
          </div>
        </div>

        <div className="px-4 pt-8 pb-4 flex flex-col gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-1 truncate">{label}</p>
            {username && <p className="text-xs text-text-3 truncate">@{username}</p>}
          </div>
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <Badge key={`${badge.variant}-${badge.label}`} variant={badge.variant}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {bio && (
            <div>
              {bioLabel && (
                <p className="text-xs font-semibold text-text-3 uppercase tracking-wide mb-1">
                  {bioLabel}
                </p>
              )}
              <p className="text-xs text-text-2 leading-relaxed whitespace-pre-wrap">{bio}</p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
};
