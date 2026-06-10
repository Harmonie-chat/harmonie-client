import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';

export interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel?: string;
  maxWidth?: string;
}

export const Modal = ({
  title,
  subtitle,
  onClose,
  children,
  closeLabel = 'Close',
  maxWidth = 'max-w-md',
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    dragStartYRef.current = event.clientY;
    dragOffsetRef.current = 0;
    setDragOffset(0);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture may fail in responsive browser simulators.
    }
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };

  const handleDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const finalOffset = Math.max(dragOffsetRef.current, event.clientY - dragStartYRef.current);

    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      // Some browser simulators throw when capture was already lost.
    }

    dragStartYRef.current = null;

    if (finalOffset > 72) {
      onClose();
      return;
    }

    dragOffsetRef.current = 0;
    setDragOffset(0);
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 flex h-auto max-h-none w-auto max-w-none items-end justify-center border-0 bg-black/40 p-0 text-inherit backdrop-blur-[2px] cursor-default sm:items-center sm:p-4"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        className={`relative flex max-h-dvh w-full flex-col rounded-t-md border border-border-2 bg-surface-1 transition-transform duration-200 sm:block sm:max-h-none sm:rounded-md ${maxWidth}`}
        style={{ transform: `translateY(${dragOffset}px)` }}
      >
        <div
          className="mx-auto flex h-6 w-16 touch-none items-center justify-center sm:hidden"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          onLostPointerCapture={handleDragEnd}
        >
          <div className="h-1 w-10 rounded-full bg-border-2" />
        </div>

        {/* Header */}
        <div
          className={`flex justify-between gap-4 px-5 pt-2 pb-4 border-b border-border-2 sm:px-8 sm:pt-6 ${subtitle ? 'items-start' : 'items-center'}`}
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-display italic text-2xl text-text-1">{title}</h2>
            {subtitle && <p className="font-body text-sm text-text-2">{subtitle}</p>}
          </div>
          <IconButton size="small" aria-label={closeLabel} onClick={onClose} className="shrink-0">
            <X size={16} />
          </IconButton>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {children}
        </div>
      </div>
    </dialog>
  );
};
