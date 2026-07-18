import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextMenu } from './ContextMenu';

const firePointer = (
  target: Element,
  type: string,
  init: { clientY: number; pointerId: number }
) => {
  fireEvent(target, Object.assign(new Event(type, { bubbles: true, cancelable: true }), init));
};

const setTouchMenu = (matches: boolean) => {
  vi.mocked(window.matchMedia).mockReturnValue({
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
};

describe('ContextMenu', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 240 });
  });

  it('renders desktop actions and content, closes on action, escape and outside click', () => {
    const onClose = vi.fn();
    const onRename = vi.fn();

    render(
      <ContextMenu
        position={{ x: 500, y: 300 }}
        horizontalAnchor="right"
        onClose={onClose}
        items={[
          { label: 'Rename', icon: <span>icon</span>, onClick: onRename },
          { label: 'Volume', content: <input aria-label="Volume slider" /> },
        ]}
      />
    );

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Volume' })).toContainElement(
      screen.getByLabelText('Volume slider')
    );

    fireEvent.click(screen.getByRole('menuitem', { name: 'icon Rename' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.mouseDown(document.body);

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('renders touch menus, hides touch-only actions, handles backdrop and drag close', () => {
    setTouchMenu(true);
    const onClose = vi.fn();
    const { container } = render(
      <ContextMenu
        position={{ x: 10, y: 10 }}
        onClose={onClose}
        touchHeader={<p>Touch header</p>}
        items={[
          { label: 'Hidden', hideOnTouch: true, onClick: vi.fn() },
          { label: 'Visible', onClick: vi.fn() },
        ]}
      />
    );

    expect(screen.getByText('Touch header')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Hidden' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Visible' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));

    const dragHandle = container.querySelector('.touch-none') as HTMLElement;
    firePointer(dragHandle, 'pointerdown', { clientY: 10, pointerId: 1 });
    firePointer(dragHandle, 'pointermove', { clientY: 140, pointerId: 1 });
    firePointer(dragHandle, 'pointerup', { clientY: 140, pointerId: 1 });

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders only the touch header when expanded', () => {
    setTouchMenu(true);

    render(
      <ContextMenu
        position={{ x: 10, y: 10 }}
        onClose={vi.fn()}
        touchExpanded
        touchHeader={<p>Expanded header</p>}
        items={[{ label: 'Action', onClick: vi.fn() }]}
      />
    );

    expect(screen.getByText('Expanded header')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Action' })).not.toBeInTheDocument();
  });
});
