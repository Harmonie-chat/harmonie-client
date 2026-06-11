import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RichTextLinkBubble } from './RichTextLinkBubble';

describe('RichTextLinkBubble', () => {
  it('renders a link and wires edit/remove actions', () => {
    const onEdit = vi.fn();
    const onRemove = vi.fn();

    render(
      <RichTextLinkBubble
        url="https://example.com"
        top={10}
        left={4}
        editLabel="Edit"
        removeLabel="Remove"
        onEdit={onEdit}
        onRemove={onRemove}
      />
    );

    expect(screen.getByRole('link', { name: 'https://example.com' })).toHaveAttribute(
      'href',
      'https://example.com'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onRemove).toHaveBeenCalledOnce();
  });

  it('keeps the bubble away from the viewport edge and prevents focus loss', () => {
    render(
      <RichTextLinkBubble
        url="https://example.com"
        top={20}
        left={120}
        editLabel="Edit"
        removeLabel="Remove"
        onEdit={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const editMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    const removeMouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });

    fireEvent(screen.getByRole('button', { name: 'Edit' }), editMouseDown);
    fireEvent(screen.getByRole('button', { name: 'Remove' }), removeMouseDown);

    expect(
      screen.getByRole('link', { name: 'https://example.com' }).parentElement?.parentElement
    ).toHaveStyle({
      left: '120px',
    });
    expect(editMouseDown.defaultPrevented).toBe(true);
    expect(removeMouseDown.defaultPrevented).toBe(true);
  });
});
