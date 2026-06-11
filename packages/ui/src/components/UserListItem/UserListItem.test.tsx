import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserListItem } from './UserListItem';

describe('UserListItem', () => {
  it('selects users, renders metadata, and opens context actions', () => {
    const user = { userId: 'user-1', username: 'ada' };
    const onSelect = vi.fn();
    const onMessage = vi.fn();

    render(
      <UserListItem
        user={user}
        label="Ada Lovelace"
        subtitle="@ada"
        avatarUrl="avatar.png"
        onSelect={onSelect}
        trailing={<span>online</span>}
        contextItems={[{ label: 'Message', onClick: onMessage }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Ada Lovelace/u }));
    fireEvent.contextMenu(screen.getByRole('button', { name: /Ada Lovelace/u }), {
      clientX: 20,
      clientY: 30,
    });
    fireEvent.click(screen.getByRole('menuitem', { name: 'Message' }));

    expect(screen.getByText('@ada')).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(user, expect.objectContaining({ width: 0 }));
    expect(onMessage).toHaveBeenCalledTimes(1);
  });

  it('ignores context menu when no context items are provided', () => {
    render(<UserListItem user={{ id: 1 }} label="No menu" onSelect={vi.fn()} />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'No menu' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
