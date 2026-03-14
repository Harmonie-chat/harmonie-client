import { useEffect } from 'react';
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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} rounded-md border border-border-2 bg-surface-1`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex justify-between gap-4 px-8 pt-6 pb-4 border-b border-border-2 ${subtitle ? 'items-start' : 'items-center'}`}
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
        <div className="px-8 py-6 flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
};
