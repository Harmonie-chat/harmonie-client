import type { ReactNode } from 'react';

export interface ClickableRowCardProps {
  children: ReactNode;
  className?: string;
  onClick: () => void;
}

export const ClickableRowCard = ({ children, className = '', onClick }: ClickableRowCardProps) => {
  return (
    <button
      type="button"
      className={`w-full cursor-pointer rounded-md border border-border-2 bg-surface-2 px-3 py-3 text-left transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_70%,transparent)] ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
