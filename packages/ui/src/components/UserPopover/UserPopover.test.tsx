import { fireEvent, render, screen } from '@testing-library/react';
import { MessageCircle } from 'lucide-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserPopover } from './UserPopover';

const anchorRect = {
  bottom: 120,
  height: 40,
  left: 260,
  right: 300,
  top: 80,
  width: 40,
  x: 260,
  y: 80,
  toJSON: () => ({}),
} as DOMRect;

describe('UserPopover', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 700 });
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 900 });
  });

  it('renders profile details, badges, actions, and closes from overlay and escape', () => {
    const onClose = vi.fn();
    const onMessage = vi.fn();

    render(
      <UserPopover
        anchorRect={anchorRect}
        label="Ada Lovelace"
        username="ada"
        avatarUrl="blob:avatar"
        headerBackground="linear-gradient(red, blue)"
        bioLabel="Bio"
        bio="Writes careful programs."
        badges={[{ label: 'Admin', variant: 'owner' }]}
        actions={[
          {
            icon: <MessageCircle size={16} />,
            label: 'Message',
            onClick: onMessage,
            title: 'Open conversation',
          },
        ]}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Bio')).toBeInTheDocument();
    expect(screen.getByText('Writes careful programs.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Message' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close Ada Lovelace' }));

    expect(onMessage).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('uses the touch layout when coarse pointer media matches', () => {
    vi.mocked(window.matchMedia).mockImplementation(() => ({
      matches: true,
      media: '(hover: none), (pointer: coarse)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <UserPopover
        anchorRect={anchorRect}
        label="Grace Hopper"
        headerBackground="#123456"
        side="right"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Grace Hopper').closest('.fixed')).toHaveClass('bottom-0');
  });
});
