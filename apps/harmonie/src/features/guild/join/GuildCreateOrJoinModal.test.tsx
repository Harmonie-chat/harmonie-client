import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GuildCreateOrJoinModal } from './GuildCreateOrJoinModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@harmonie/ui', () => ({
  Modal: ({
    children,
    closeLabel,
    maxWidth,
    onClose,
    title,
  }: {
    children: ReactNode;
    closeLabel: string;
    maxWidth: string;
    onClose: () => void;
    title: string;
  }) => (
    <section
      role="dialog"
      aria-label={title}
      data-close-label={closeLabel}
      data-max-width={maxWidth}
    >
      <button type="button" onClick={onClose}>
        close modal
      </button>
      {children}
    </section>
  ),
}));

vi.mock('@/features/guild/form/GuildForm', () => ({
  GuildForm: ({ autoFocus, onSuccess }: { autoFocus?: boolean; onSuccess: () => void }) => (
    <button type="button" data-autofocus={String(autoFocus)} onClick={onSuccess}>
      guild form
    </button>
  ),
}));

vi.mock('@/features/guild/join/GuildJoinForm', () => ({
  GuildJoinForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button type="button" onClick={onSuccess}>
      join form
    </button>
  ),
}));

describe('GuildCreateOrJoinModal', () => {
  it('renders the create flow and closes on success', () => {
    const onClose = vi.fn();
    render(<GuildCreateOrJoinModal mode="create" onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'guild.createJoin.createTitle' })).toHaveAttribute(
      'data-close-label',
      'guild.createJoin.close'
    );
    expect(screen.getByRole('button', { name: 'guild form' })).toHaveAttribute(
      'data-autofocus',
      'true'
    );

    screen.getByRole('button', { name: 'guild form' }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the join flow and closes on success', () => {
    const onClose = vi.fn();
    render(<GuildCreateOrJoinModal mode="join" onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'guild.createJoin.joinTitle' })).toBeInTheDocument();
    screen.getByRole('button', { name: 'join form' }).click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
