import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

const ZOOM_LEVEL = 2;

interface DragState {
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
  moved: boolean;
}

export interface LightboxProps {
  src?: string;
  alt: string;
  headerLeft?: ReactNode;
  headerActions?: ReactNode;
  onClose: () => void;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  closeLabel?: string;
}

export const Lightbox = ({
  src,
  alt,
  headerLeft,
  headerActions,
  onClose,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  closeLabel = 'Close',
}: LightboxProps) => {
  const [zoomState, setZoomState] = useState({ src, zoomed: false });
  const [baseSizeState, setBaseSizeState] = useState<{
    src?: string;
    size: { w: number; h: number } | null;
  }>({ src, size: null });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const wasDragRef = useRef(false);
  const onCloseRef = useRef(onClose);
  const zoomed = zoomState.src === src ? zoomState.zoomed : false;
  const baseSize = baseSizeState.src === src ? baseSizeState.size : null;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === '+' || e.key === '=') setZoomState({ src, zoomed: true });
      if (e.key === '-') setZoomState({ src, zoomed: false });
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [src]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const maxW = window.innerWidth * 0.9;
    const maxH = window.innerHeight - 96;
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
    setBaseSizeState({ src, size: { w: img.naturalWidth * scale, h: img.naturalHeight * scale } });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!zoomed || !containerRef.current) return;
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
      moved: false,
    };
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!dragRef.current || !containerRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragRef.current.moved = true;
    containerRef.current.scrollLeft = dragRef.current.scrollLeft - dx;
    containerRef.current.scrollTop = dragRef.current.scrollTop - dy;
  };

  useEffect(() => {
    const handleDocMouseUp = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const moved = dragRef.current.moved;
      wasDragRef.current = moved;
      dragRef.current = null;
      setIsDragging(false);
      if (!moved && (e.target as HTMLElement).tagName !== 'IMG') {
        onCloseRef.current();
      }
    };
    document.addEventListener('mouseup', handleDocMouseUp);
    return () => document.removeEventListener('mouseup', handleDocMouseUp);
  }, []);

  const zoom = zoomed ? ZOOM_LEVEL : 1;
  const imageStyle = baseSize
    ? { width: baseSize.w * zoom, height: baseSize.h * zoom }
    : { maxWidth: '90vw', maxHeight: 'calc(100dvh - 96px)' };

  const actionButtonClass =
    'p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent z-10">
        <div>{headerLeft}</div>
        <div className="flex items-center gap-1">
          {headerActions}
          <button
            type="button"
            onClick={() => setZoomState({ src, zoomed: !zoomed })}
            className={actionButtonClass}
            aria-label={zoomed ? zoomOutLabel : zoomInLabel}
            title={zoomed ? zoomOutLabel : zoomInLabel}
          >
            {zoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className={actionButtonClass}
            aria-label={closeLabel}
            title={closeLabel}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Scrollable image area */}
      <button
        type="button"
        ref={containerRef}
        aria-label={closeLabel}
        className="flex flex-1 overflow-auto border-0 bg-transparent p-0 text-left"
        style={{ cursor: isDragging ? 'grabbing' : zoomed ? 'grab' : 'default' }}
        onClick={(event) => {
          if ((event.target as HTMLElement).tagName === 'IMG') {
            if (wasDragRef.current) {
              wasDragRef.current = false;
              return;
            }
            setZoomState({ src, zoomed: !zoomed });
            return;
          }
          if (!zoomed) onClose();
        }}
        onKeyDown={(event) => {
          if (!zoomed && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onClose();
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        <div style={{ margin: 'auto', padding: '16px', flexShrink: 0 }}>
          {src ? (
            <img
              src={src}
              alt={alt}
              onLoad={handleImageLoad}
              draggable={false}
              className="object-contain block rounded-sm select-none"
              style={{
                ...imageStyle,
                cursor: isDragging ? 'grabbing' : zoomed ? 'zoom-out' : 'zoom-in',
              }}
            />
          ) : (
            <div className="size-64 rounded-md bg-white/10 animate-pulse" />
          )}
        </div>
      </button>
    </div>,
    document.body
  );
};
