import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChannelItem } from './ChannelItem';

describe('ChannelItem', () => {
  it('renders stateful text channels and forwards click, menu and context actions', () => {
    const onClick = vi.fn();
    const onContextMenu = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const onMenuClick = vi.fn();

    render(
      <ChannelItem
        type="text"
        label="general"
        active
        unread
        onClick={onClick}
        onContextMenu={onContextMenu}
        onMenuClick={onMenuClick}
        menuLabel="Edit channel"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'general' }));
    fireEvent.contextMenu(screen.getByRole('button', { name: 'general' }));
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Edit channel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit channel' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('renders voice active state without a menu action', () => {
    render(<ChannelItem type="voice" label="Lobby" voiceActive onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Lobby' })).toHaveClass('font-medium');
    expect(screen.queryByRole('button', { name: 'Edit channel' })).not.toBeInTheDocument();
  });

  it('renders inactive unread text channels with menu styling', () => {
    render(
      <ChannelItem
        type="text"
        label="alerts"
        unread
        onClick={vi.fn()}
        onMenuClick={vi.fn()}
        menuLabel="Configure"
      />
    );

    const channel = screen.getByRole('button', { name: 'alerts' });
    const menu = screen.getByRole('button', { name: 'Configure' });

    expect(channel.parentElement).toHaveClass('font-extrabold');
    expect(menu).toHaveClass('text-text-2');
  });

  it('consumes clicks after a long press', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const onLongPress = vi.fn();

    render(<ChannelItem type="text" label="mobile" onClick={onClick} onLongPress={onLongPress} />);

    const channel = screen.getByRole('button', { name: 'mobile' });
    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(pointerDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 12 },
      clientY: { value: 24 },
    });

    fireEvent(channel, pointerDown);
    vi.advanceTimersByTime(500);
    fireEvent.click(channel);
    vi.useRealTimers();

    expect(onLongPress).toHaveBeenCalledWith({ x: 12, y: 24 });
    expect(onClick).not.toHaveBeenCalled();
  });
});
