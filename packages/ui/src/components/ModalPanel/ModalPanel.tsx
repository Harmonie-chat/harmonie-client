import { useEffect } from 'react';
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Dialog */}
      <div className="relative flex w-full max-w-3xl h-[80vh] max-h-[620px] rounded-md overflow-hidden shadow-xl border border-border-2">
        {/* Left sidebar */}
        <div className="w-52 bg-surface-2 border-r border-border-2 flex flex-col shrink-0 p-3 gap-1">
          {sidebar}
        </div>

        {/* Right content */}
        <div className="flex-1 bg-surface-1 flex flex-col overflow-hidden">
          {/* Right header */}
          <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-border-2 shrink-0">
            <h2 className="font-display text-lg font-semibold text-text-1">{title}</h2>
            <IconButton size="small" aria-label={closeLabel} onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>

          {/* Right body */}
          <div className="flex-1 overflow-y-auto px-8 py-6">{children}</div>
        </div>
      </div>
    </div>
  );
};
