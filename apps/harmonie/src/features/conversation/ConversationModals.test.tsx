import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LeaveConversationModal } from './LeaveConversationModal';
import { RenameConversationModal } from './RenameConversationModal';
import type { Conversation } from '@/types/conversation';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const conversation = (input: Partial<Conversation> = {}): Conversation =>
  ({
    conversationId: 'conversation-1',
    name: 'Design',
    type: 'Group',
    hasUnread: false,
    participants: [],
    lastMessage: null,
    ...input,
  }) as Conversation;

describe('conversation modals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('confirms, cancels, and displays errors in the leave modal', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <LeaveConversationModal isLeaving={false} error onClose={onClose} onConfirm={onConfirm} />
    );

    expect(screen.getByRole('dialog', { name: 'conversation.leaveTitle' })).toBeInTheDocument();
    expect(screen.getByText('conversation.leaveError')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'conversation.cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'conversation.leaveConfirmButton' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('saves trimmed names and resets empty names to null in the rename modal', async () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const onSave = vi.fn();
    const { rerender } = render(
      <RenameConversationModal
        conversation={conversation()}
        isSaving={false}
        error={false}
        onChange={onChange}
        onClose={onClose}
        onSave={onSave}
      />
    );

    const nameInput = screen.getByLabelText('conversation.nameLabel');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, '  Planning  ');
    await userEvent.click(screen.getByRole('button', { name: 'conversation.save' }));

    expect(onChange).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledWith('Planning');

    rerender(
      <RenameConversationModal
        conversation={conversation({ conversationId: 'conversation-2', name: '' })}
        isSaving={false}
        error
        onChange={onChange}
        onClose={onClose}
        onSave={onSave}
      />
    );

    expect(screen.getByText('conversation.renameError')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('conversation.nameLabel'));
    await userEvent.click(screen.getByRole('button', { name: 'conversation.save' }));

    expect(onSave).toHaveBeenLastCalledWith(null);
    await userEvent.click(screen.getByRole('button', { name: 'conversation.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
