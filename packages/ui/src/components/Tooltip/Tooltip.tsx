import {
  CSSProperties,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

export type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  side?: TooltipSide;
  id?: string;
  className?: string;
  delay?: number;
}

const offset = 10;
const viewportMargin = 8;
const maxWidth = 224;

const transformClasses: Record<TooltipSide, string> = {
  top: '-translate-x-1/2 -translate-y-full',
  right: '-translate-y-1/2',
  bottom: '-translate-x-1/2',
  left: '-translate-x-full -translate-y-1/2',
};

const getPosition = (rect: DOMRect, side: TooltipSide): CSSProperties => {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  if (side === 'top' || side === 'bottom') {
    return {
      left: centerX,
      top: side === 'top' ? rect.top - offset : rect.bottom + offset,
    };
  }

  return {
    left:
      side === 'right'
        ? Math.min(rect.right + offset, window.innerWidth - viewportMargin - maxWidth)
        : Math.max(rect.left - offset, viewportMargin + maxWidth),
    top: Math.min(Math.max(centerY, viewportMargin), window.innerHeight - viewportMargin),
  };
};

export const Tooltip = ({
  content,
  children,
  side = 'top',
  id,
  className,
  delay = 450,
}: TooltipProps) => {
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const [tooltipsEnabled, setTooltipsEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const handleChange = () => setTooltipsEnabled(media.matches);

    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  const close = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setPosition(null);
  };

  const open = () => {
    if (!tooltipsEnabled) return;
    close();
    timeoutRef.current = window.setTimeout(() => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setPosition(getPosition(rect, side));
    }, delay);
  };

  useEffect(() => close, []);

  useLayoutEffect(() => {
    if (!position || (side !== 'top' && side !== 'bottom')) return;

    const tooltipRect = tooltipRef.current?.getBoundingClientRect();
    if (!tooltipRect) return;

    const halfWidth = tooltipRect.width / 2;
    const minLeft = viewportMargin + halfWidth;
    const maxLeft = Math.max(minLeft, window.innerWidth - viewportMargin - halfWidth);
    const nextLeft = Math.min(Math.max(Number(position.left), minLeft), maxLeft);

    if (nextLeft !== position.left) {
      setPosition((current) => (current ? { ...current, left: nextLeft } : current));
    }
  }, [position, side]);

  if (!content || !tooltipsEnabled) return children;

  return (
    <span
      ref={wrapperRef}
      className={['inline-flex', className ?? ''].join(' ')}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      {children}
      {position &&
        createPortal(
          <span
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={[
              'pointer-events-none fixed z-[9999] w-max max-w-56 rounded-sm border border-tooltip-border bg-tooltip-background px-2.5 py-1.5 text-xs font-medium leading-snug text-tooltip-foreground shadow-lg',
              transformClasses[side],
            ].join(' ')}
            style={position}
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
};
