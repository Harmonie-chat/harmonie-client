import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModalPanel } from './ModalPanel';

describe('ModalPanel', () => {
  it('renders sidebar and content, then closes from backdrop, button and cancel', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <ModalPanel
        title="Settings"
        sidebar={<button type="button">Profile</button>}
        onClose={onClose}
      >
        <p>Panel body</p>
      </ModalPanel>
    );

    const dialog = screen.getByRole('dialog', { name: 'Settings' }) as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(screen.getAllByRole('button', { name: 'Profile' })).toHaveLength(2);
    expect(screen.getByText('Panel body')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' })[1]);
    fireEvent(dialog, new Event('cancel', { cancelable: true }));

    expect(onClose).toHaveBeenCalledTimes(3);

    unmount();
    expect(dialog.open).toBe(false);
  });

  it('supports a custom close label', () => {
    const onClose = vi.fn();

    render(
      <ModalPanel
        title="Profile"
        closeLabel="Dismiss"
        sidebar={<button type="button">Account</button>}
        onClose={onClose}
      >
        <p>Profile body</p>
      </ModalPanel>
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Dismiss' })[0]);

    expect(onClose).toHaveBeenCalledOnce();
  });
});
