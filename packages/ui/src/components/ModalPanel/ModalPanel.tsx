import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from '../IconButton/IconButton';

export interface ModalPanelProps {
  title: string;
  onClose: () => void;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  closeLabel?: string;
}

export const ModalPanel = ({
  title,
  onClose,
  sidebar,
  children,
  closeLabel = 'Close',
}: ModalPanelProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-0 flex h-auto max-h-none w-auto max-w-none items-end justify-center border-0 bg-transparent p-0 text-inherit sm:items-center sm:p-4"
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={closeLabel}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative flex h-dvh min-h-0 w-full max-w-3xl flex-col overflow-hidden border border-border-2 shadow-xl sm:h-[80vh] sm:max-h-[620px] sm:flex-row sm:rounded-md">
        {/* Left sidebar */}
        <div
          className="hidden shrink-0 bg-surface-2 sm:flex sm:w-52 sm:flex-col sm:gap-1 sm:overflow-x-visible sm:border-r sm:p-3"
          style={{ borderRightColor: 'var(--color-border-2)' }}
        >
          {sidebar}
        </div>

        {/* Right content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface-1">
          {/* Right header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-2 shrink-0 sm:px-8 sm:pt-6">
            <h2 className="font-display text-lg font-semibold text-text-1">{title}</h2>
            <IconButton size="small" aria-label={closeLabel} onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>

          {/* Mobile navigation */}
          <div className="shrink-0 overflow-x-auto border-b border-border-2 bg-surface-2 px-3 py-2 sm:hidden">
            <div className="flex items-center gap-2 [&_p]:hidden [&_ul]:mt-0 [&_ul]:flex-row [&_ul]:gap-1 [&_li]:shrink-0 [&_button]:w-auto [&_button]:whitespace-nowrap [&_.h-px]:hidden [&_.mt-auto]:mt-0 [&_.mt-auto]:shrink-0 [&>div]:flex [&>div]:items-center [&>div]:gap-2">
              {sidebar}
            </div>
          </div>

          {/* Right body */}
          <div
            className="flex-1 overflow-y-auto px-5 py-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:px-8 sm:py-6"
            style={{ overflowAnchor: 'none' }}
          >
            {children}
          </div>
        </div>
      </div>
    </dialog>
  );
};
