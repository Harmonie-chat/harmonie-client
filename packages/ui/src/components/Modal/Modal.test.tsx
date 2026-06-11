import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

const firePointer = (
  target: Element,
  type: string,
  init: { clientY: number; pointerId: number }
) => {
  fireEvent(target, Object.assign(new Event(type, { bubbles: true, cancelable: true }), init));
};

describe('Modal', () => {
  it('renders content and closes from backdrop, close button, cancel event, and drag gesture', () => {
    const onClose = vi.fn();
    const { container, unmount } = render(
      <Modal title="Settings" subtitle="Profile" onClose={onClose} closeLabel="Close settings">
        <p>Modal body</p>
      </Modal>
    );

    const dialog = screen.getByRole('dialog', { name: 'Settings' }) as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Modal body')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Close settings' })[0]);
    fireEvent(dialog, new Event('cancel', { cancelable: true }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Close settings' })[1]);

    const dragHandle = container.querySelector('.touch-none') as HTMLElement;
    firePointer(dragHandle, 'pointerdown', { clientY: 20, pointerId: 1 });
    firePointer(dragHandle, 'pointermove', { clientY: 120, pointerId: 1 });
    firePointer(dragHandle, 'pointerup', { clientY: 120, pointerId: 1 });

    expect(onClose).toHaveBeenCalledTimes(4);

    unmount();
    expect(dialog.open).toBe(false);
  });

  it('resets a short drag instead of closing', () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal title="Short drag" onClose={onClose}>
        Content
      </Modal>
    );

    const panel = container.querySelector('[style]') as HTMLElement;
    const dragHandle = container.querySelector('.touch-none') as HTMLElement;

    firePointer(dragHandle, 'pointerdown', { clientY: 20, pointerId: 1 });
    firePointer(dragHandle, 'pointermove', { clientY: 40, pointerId: 1 });
    expect(panel.style.transform).toBe('translateY(20px)');
    firePointer(dragHandle, 'pointerup', { clientY: 40, pointerId: 1 });

    expect(onClose).not.toHaveBeenCalled();
    expect(panel.style.transform).toBe('translateY(0px)');
  });
});
