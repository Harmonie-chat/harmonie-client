import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConversationItem } from './ConversationItem';

describe('ConversationItem', () => {
  it('renders active call state and forwards click, context and delete actions', () => {
    const onClick = vi.fn();
    const onContextMenu = vi.fn((event: React.MouseEvent) => event.preventDefault());
    const onDeleteClick = vi.fn();

    render(
      <ConversationItem
        avatar={<span aria-hidden="true">A</span>}
        label="Ada"
        active
        callActive
        callLabel="In call"
        onClick={onClick}
        onContextMenu={onContextMenu}
        onDeleteClick={onDeleteClick}
        deleteLabel="Delete conversation"
      />
    );

    expect(screen.getByText('In call')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ada' }));
    fireEvent.contextMenu(screen.getByRole('button', { name: 'Ada' }).parentElement as HTMLElement);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Delete conversation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete conversation' }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onContextMenu).toHaveBeenCalledTimes(1);
    expect(onDeleteClick).toHaveBeenCalledTimes(1);
  });

  it('renders unread conversations without optional actions', () => {
    render(
      <ConversationItem
        avatar={<span aria-hidden="true">G</span>}
        label="Grace"
        unread
        onClick={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Grace' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete conversation' })).not.toBeInTheDocument();
  });

  it('renders default inactive conversations and inactive call state', () => {
    render(
      <ConversationItem
        avatar={<span aria-hidden="true">M</span>}
        label="Marie"
        callActive
        callLabel="Voice call"
        onClick={vi.fn()}
      />
    );

    const conversation = screen.getByRole('button', { name: 'Marie' });

    expect(conversation.parentElement).toHaveClass('text-text-2');
    expect(screen.getByText('Voice call').parentElement).toHaveClass('text-primary');
  });

  it('consumes clicks after a long press', () => {
    vi.useFakeTimers();
    const onClick = vi.fn();
    const onLongPress = vi.fn();

    render(
      <ConversationItem
        avatar={<span aria-hidden="true">M</span>}
        label="Mobile"
        onClick={onClick}
        onLongPress={onLongPress}
      />
    );

    const conversation = screen.getByRole('button', { name: 'Mobile' });
    const pointerDown = new Event('pointerdown', { bubbles: true });
    Object.defineProperties(pointerDown, {
      pointerType: { value: 'touch' },
      isPrimary: { value: true },
      clientX: { value: 20 },
      clientY: { value: 32 },
    });

    fireEvent(conversation.parentElement as HTMLElement, pointerDown);
    vi.advanceTimersByTime(500);
    fireEvent.click(conversation);
    vi.useRealTimers();

    expect(onLongPress).toHaveBeenCalledWith({ x: 20, y: 32 });
    expect(onClick).not.toHaveBeenCalled();
  });
});
